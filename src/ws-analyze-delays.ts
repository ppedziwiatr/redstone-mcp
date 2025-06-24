import { type ExtendedTradeData } from "./ws-binance-query.ts";

async function findTradesWithSaveDelay(minDelayMs: number) {
  const kv = await Deno.openKv("./trades.db");

  try {
    console.log(`🔍 Finding trades with received delay > ${minDelayMs}ms...\n`);

    const delayedTrades: Array<ExtendedTradeData & { saveDelayMs: number }> = [];
    const iter = kv.list({ prefix: ["trades"] });

    let totalTrades = 0;
    let tradesWithReceivedAt = 0;

    for await (const entry of iter) {
      const trade = entry.value as ExtendedTradeData;
      totalTrades++;

      if (trade.receivedAt) {
        tradesWithReceivedAt++;
        const tradeTime = trade.T;
        const saveDelayMs = trade.receivedAt - tradeTime;

        if (saveDelayMs > minDelayMs) {
          delayedTrades.push({
            ...trade,
            saveDelayMs,
          });
        }
      }
    }

    // Sort by delay (highest first)
    delayedTrades.sort((a, b) => b.saveDelayMs - a.saveDelayMs);

    console.log(`📊 Results:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total trades: ${totalTrades}`);
    console.log(`Trades with receivedAt: ${tradesWithReceivedAt}`);
    console.log(`Trades with delay > ${minDelayMs}ms: ${delayedTrades.length}`);

    if (delayedTrades.length > 0) {
      console.log(`\n🐌 Delayed trades (showing first 20):`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      delayedTrades.slice(0, 20).forEach((trade, index) => {
        const tradeTime = new Date(trade.T).toISOString();
        const savedTime = new Date(trade.receivedAt!).toISOString();

        console.log(`${index + 1}. Trade ${trade.t}`);
        console.log(`   Trade time: ${tradeTime}`);
        console.log(`   Saved time: ${savedTime}`);
        console.log(`   Delay: ${trade.saveDelayMs}ms`);
        console.log(`   Price: $${trade.p}, Quantity: ${trade.q}`);
        console.log("");
      });

      // Statistics
      const delays = delayedTrades.map((t) => t.saveDelayMs);
      const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
      const maxDelay = Math.max(...delays);
      const minDelay = Math.min(...delays);

      console.log(`📈 Delay Statistics:`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Average delay: ${avgDelay.toFixed(2)}ms (${(avgDelay / 1000).toFixed(3)}s)`);
      console.log(`Maximum delay: ${maxDelay}ms (${(maxDelay / 1000).toFixed(3)}s)`);
      console.log(`Minimum delay: ${minDelay}ms (${(minDelay / 1000).toFixed(3)}s)`);
    }
  } finally {
    kv.close();
  }
}

// General delay analysis function
async function analyzeAllSaveDelays() {
  const kv = await Deno.openKv("./trades.db");

  try {
    console.log(`📊 Analyzing all received delays...\n`);

    const delays: number[] = [];
    const iter = kv.list({ prefix: ["trades"] });

    for await (const entry of iter) {
      const trade = entry.value as ExtendedTradeData;

      if (trade.receivedAt) {
        const tradeTime = trade.T;
        const delayMs = trade.receivedAt - tradeTime;
        delays.push(delayMs);
      }
    }

    if (delays.length === 0) {
      console.log("❌ No trades with savedAt timestamp found");
      return;
    }

    delays.sort((a, b) => a - b);

    const total = delays.length;
    const sum = delays.reduce((a, b) => a + b, 0);
    const avg = sum / total;
    const median = delays[Math.floor(total / 2)];
    const min = delays[0];
    const max = delays[total - 1];

    // Percentiles
    const p95 = delays[Math.floor(total * 0.95)];
    const p99 = delays[Math.floor(total * 0.99)];

    console.log(`📈 Received Delay Analysis:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total trades analyzed: ${total}`);
    console.log(`Average delay: ${avg.toFixed(2)}ms`);
    console.log(`Median delay: ${median}ms`);
    console.log(`Min delay: ${min}ms`);
    console.log(`Max delay: ${max}ms`);
    console.log(`95th percentile: ${p95}ms`);
    console.log(`99th percentile: ${p99}ms`);

    // Distribution
    const ranges = [
      { min: 0, max: 100, label: "0-100ms" },
      { min: 100, max: 150, label: "100-150ms" },
      { min: 150, max: 200, label: "150-200ms" },
      { min: 200, max: 250, label: "200-250ms" },
      { min: 250, max: 300, label: "250-300ms" },
      { min: 300, max: 350, label: "300-350ms" },
      { min: 350, max: 400, label: "350-400ms" },
      { min: 400, max: 500, label: "400-500ms" },
      { min: 500, max: 1000, label: "500ms-1s" },
      { min: 1000, max: Infinity, label: ">1s" },
    ];

    console.log(`\n📊 Distribution:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    ranges.forEach((range) => {
      const count = delays.filter((d) => d >= range.min && d < range.max).length;
      const percentage = ((count / total) * 100).toFixed(1);
      console.log(`${range.label.padEnd(12)}: ${count.toString().padStart(6)} (${percentage}%)`);
    });
  } finally {
    kv.close();
  }
}

// Main function
async function main() {
  const command = Deno.args[0] || "analyze";

  if (command === "find") {
    const minDelayMs = parseInt(Deno.args[1]!) || 1000; // Default 1 second
    await findTradesWithSaveDelay(minDelayMs);
  } else if (command === "analyze") {
    await analyzeAllSaveDelays();
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
