// htx_simple_test.ts
import { gunzip } from "https://deno.land/x/compress@v0.4.5/gzip/mod.ts";

const ws = new WebSocket("wss://api.huobi.pro/ws");
ws.binaryType = "arraybuffer";

ws.onopen = () => {
  console.log("Connected! Subscribing to BTC ticker...");
  ws.send(JSON.stringify({
    subb: ["market.btcusdt.ticker"],
    id: "1",
  }));
};

ws.onmessage = async (event) => {
  const compressed = new Uint8Array(event.data as ArrayBuffer);
  const decompressed = await gunzip(compressed);
  const message = JSON.parse(new TextDecoder().decode(decompressed));

  if (message.ping) {
    ws.send(JSON.stringify({ pong: message.ping }));
  } else {
    console.log(JSON.stringify(message, null, 2));
  }
};

// Keep the script running
await new Promise(() => {});
