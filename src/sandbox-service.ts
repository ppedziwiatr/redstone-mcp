import {type ToolOptions} from "./mod.ts";

export class SandboxService {
  async runCode(args: ToolOptions, timeout = 10000): Promise<unknown> {
    const worker = new Worker(
      new URL("./sandbox-worker.ts", import.meta.url).href,
      {
        type: "module",
        deno: {
          permissions: {
            net: true,
            read: true,
            write: true,
            env: true,
            sys: false,
            run: false,
            ffi: false,
          },
        },
      },
    );

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        worker.terminate();
        reject(new Error("Code execution timeout"));
      }, timeout);
      const logs: string[] = [];

      worker.onmessage = (e) => {
        if (e.data.error) {
          console.error(e.data.error);
          clearTimeout(timer);
          worker.terminate();
          reject(new Error(e.data.error));
        } else {
          if (e.data.type === "log") {
            const log = `[Sandbox] ${e.data.data}`;
            console.error(log);
            logs.push(log);
          } else {
            clearTimeout(timer);
            worker.terminate();
            resolve({result: e.data.result, logs});
          }
        }
      };

      worker.onerror = (error) => {
        clearTimeout(timer);
        worker.terminate();
        reject(error);
      };

      worker.postMessage(args);
    });
  }
}
