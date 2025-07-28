import "@std/dotenv/load";
import {DenoKVPriceDatabase} from "./storage/kv-storage.ts";
import {type ToolOptions} from "./mod.ts";

const worker = self as unknown as Worker;
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

worker.onmessage = async (e: MessageEvent) => {
    const args = e.data as ToolOptions;
    const db = await DenoKVPriceDatabase.create(200);

    try {
        const sandboxGlobals = {
            JSON,
            Math,
            Date,
            Array,
            Object,
            String,
            Number,
            Boolean,
            Promise,

            fetchRedStone: async () => {
                return await db.getPriceData(args.queryOptions);
            },

            console: {
                log: (...args: any[]) => {
                    worker.postMessage({ type: "log", data: args });
                },
            },
        };

        const func = new AsyncFunction(...Object.keys(sandboxGlobals), args.code);
        const result = await func(...Object.values(sandboxGlobals));

        worker.postMessage({ result });
    } catch (error) {
        worker.postMessage({
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};