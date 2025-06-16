import "https://deno.land/std/dotenv/load.ts";
import {DenoKVPriceDatabase} from "./src/storage/kv-storage.ts";
import {fetchPriceFeeds} from "./src/storage/redstone.ts";

if (import.meta.main) {
    globalThis.addEventListener("beforeunload", async (): Promise<void> => {
        await db.close();
    });

    Deno.addSignalListener("SIGINT", async (): Promise<void> => {
        await db.close();
        Deno.exit(0);
    });

    const db = await DenoKVPriceDatabase.create(30);
    let lastTimestamp = 0;

    setInterval(async () => {
        await loadPrices();
    }, 10100);
    await loadPrices();

    async function loadPrices() {
        try {
            console.log("Load feeds");
            const mappedData = await fetchPriceFeeds();
            const newTimestamp = mappedData["ETH"]!.timestamp;
            console.log(`Timestamps: current ${newTimestamp}, last ${lastTimestamp}`)
            if (newTimestamp !== lastTimestamp) {
                console.log("Storing data");
            } else {
                console.log(`Timestamps the same (current ${newTimestamp}, last ${lastTimestamp})`);
            }
            await db.storePriceData(mappedData);
            lastTimestamp = newTimestamp;
        } catch (e) {
            console.error(e);
        }
    }
}
