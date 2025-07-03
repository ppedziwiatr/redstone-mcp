import { stream } from "tardis";
import { type TradeData } from "./ws-binance.ts";

export function nowMicros(): number {
  return Math.floor(Number(Temporal.Now.instant().epochNanoseconds / 1000n));
}

class TardisClient {
  private messages:
    | AsyncIterableIterator<{ localTimestamp: Date; message: { stream: string; data: TradeData } }>
    | null = null;
  private kv: Deno.Kv | null = null;

  private readonly dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  public async connect(): Promise<void> {
    try {
      this.kv = await Deno.openKv(this.dbPath);
      console.log("✅ Deno KV database connected");
    } catch (error) {
      console.error("❌ Failed to connect to Deno KV:", error);
      throw error;
    }

    this.messages = stream({
      // https://github.com/tardis-dev/tardis-node/blob/master/src/consts.ts#L1
      exchange: "binance",
      filters: [
        { channel: "trade", symbols: ["btcusdt"] },
      ],
    });
  }

  private async processTradeData(trade: TradeData, receivedAt: number): Promise<void> {
    // console.log(trade);
    const timestamp = new Date(trade.E).toISOString();
    const price = parseFloat(trade.p);
    const quantity = parseFloat(trade.q);
    const volume = price * quantity;

    this.saveTradeToKV(trade, receivedAt).catch(console.error);

    console.log(`
🔄 Trade Event for ${trade.s}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Time: ${timestamp}
🆔 Trade ID: ${trade.t}
💰 Price: $${price.toFixed(8)}
📊 Quantity: ${quantity.toFixed(8)}
💵 Volume: $${volume.toFixed(2)}
⏰ Received delay: ${receivedAt - trade.T}ms
${trade.m ? "🔴 Market Sell" : "🟢 Market Buy"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }

  private async saveTradeToKV(trade: TradeData, receivedAt: number): Promise<void> {
    if (!this.kv) {
      console.error("❌ KV database not initialized");
      return;
    }

    try {
      const key = ["trades", trade.t];

      const tradeRecord = {
        ...trade,
        receivedAt: receivedAt,
        priceFloat: parseFloat(trade.p),
        quantityFloat: parseFloat(trade.q),
        volumeUSD: parseFloat(trade.p) * parseFloat(trade.q),
      };

      await this.kv.set(key, tradeRecord);

      console.log(`💾 Trade ${trade.t} saved to KV database`);
    } catch (error) {
      console.error("❌ Error saving trade to KV:", error);
    }
  }

  async handleMessages() {
    for await (const message of this.messages!) {
      this.processTradeData(message.message.data, nowMicros()).catch(console.error);
    }
  }
}

async function main(dbPath: string) {
  const client = new TardisClient(dbPath);

  // Handle graceful shutdown
  const handleShutdown = () => {
    console.log("\n🛑 Shutting down gracefully...");
    Deno.exit(0);
  };

  // Listen for interrupt signals
  Deno.addSignalListener("SIGINT", handleShutdown);
  Deno.addSignalListener("SIGTERM", handleShutdown);

  // console.log(await getExchangeDetails("binance"));

  await client.connect();

  await client.handleMessages();

  console.log("🚀 Binance WebSocket client started. Press Ctrl+C to stop.");

  // Keep the process alive
  /*  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }*/
}

// Run the main function
if (import.meta.main) {
  main("./trades-1.db").catch(console.error);
  //mainWs("./trades-2.db").catch(console.error);
}
