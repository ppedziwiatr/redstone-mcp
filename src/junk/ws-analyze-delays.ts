import { type ExtendedTradeData } from "./ws-binance-query.ts";

async function analyzeAllSaveDelays(db: string) {
  const kv = await Deno.openKv(db);

  try {
    console.log(`📊 Analyzing all received delays...\n`);

    const delays: number[] = [];
    const iter = kv.list({ prefix: ["trades"] });

    for await (const entry of iter) {
      const trade = entry.value as ExtendedTradeData;

      if (trade.receivedAt) {
        let tradeTime = trade.T;
        console.log({
          receivedAt: trade.receivedAt,
          tradeTime: tradeTime,
        });
        if (String(tradeTime).length === 16) {
          tradeTime = Math.floor(tradeTime / 1000);
        }
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
  const db = Deno.args[0] || "./trades-1.db";

  await analyzeAllSaveDelays(db);
}

if (import.meta.main) {
  main().catch(console.error);
}
