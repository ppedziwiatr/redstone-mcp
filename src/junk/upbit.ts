// htx_simple_test.ts
import { gunzip } from "https://deno.land/x/compress@v0.4.5/gzip/mod.ts";

const ws = new WebSocket("wss://th-api.upbit.com/websocket/v1");
ws.binaryType = "arraybuffer";

ws.onopen = () => {
  console.log("Connected! Subscribing...");
  ws.send(JSON.stringify([
    { "ticket": "test" },
    { "format": "SIMPLE" },
    { "type": "ticker", "codes": ["USDT-BTC"] },
  ]));
};

ws.onmessage = async (event) => {
  console.log(new TextDecoder().decode(event.data));
};

ws.onerror = async (event) => {
  console.error(event)
  /*const compressed = new Uint8Array(event.data as ArrayBuffer);
    const decompressed = await gunzip(compressed);
    const message = JSON.parse(new TextDecoder().decode(decompressed));
  */
  /* if (message.ping) {
        ws.send(JSON.stringify({ pong: message.ping }));
    } else {
        console.log(JSON.stringify(message, null, 2));
    }*/
};

// Keep the script running
await new Promise(() => {});
