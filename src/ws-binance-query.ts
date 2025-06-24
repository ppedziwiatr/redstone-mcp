import { type TradeData } from "./ws-binance.ts";

interface ExtendedTradeData extends TradeData {
  receivedAt?: number;
  priceFloat?: number;
  quantityFloat?: number;
  volumeUSD?: number;
}

async function queryTrades() {
  const kv = await Deno.openKv("./trades.db");

  try {
    const tradeId = parseInt(Deno.args[0]!);

    const result = await kv.get(["trades", tradeId]);
    if (result.value) {
      const trade = result.value as ExtendedTradeData;
      console.log(`🔍 Trade ${tradeId} details:`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Symbol: ${trade.s}`);
      console.log(`Time: ${trade.T}`);
      console.log(`Price: $${trade.p}`);
      console.log(`Quantity: ${trade.q}`);
      console.log(`Volume: $${(parseFloat(trade.p) * parseFloat(trade.q)).toFixed(2)}`);
      console.log(`Type: ${trade.m ? "Market Sell" : "Market Buy"}`);
      if (trade.receivedAt) {
        console.log(`Received at: ${trade.receivedAt}`);
        console.log(`Received - time diff: ${trade.receivedAt - trade.T}`);
      }
    } else {
      console.log(`❌ Trade ${tradeId} not found`);
    }
  } finally {
    kv.close();
  }
}

if (import.meta.main) {
  queryTrades().catch(console.error);
}
