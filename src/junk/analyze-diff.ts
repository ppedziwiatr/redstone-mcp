export interface TradeData {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  t: number; // Trade ID
  p: string; // Price
  q: string; // Quantity
  T: number; // Trade time
  m: boolean; // Is the buyer the market maker?
  M: boolean; // Ignore
  receivedAt: number; // received timestamp
}

interface TradeMessage {
  symbol: string;
  tradeId: string;
  price: string;
  quantity: string;
  time: string;
  isBuyerMaker: boolean;
  receivedAt: number; // received timestamp
}

interface MatchedTrade {
  tradeId: string;
  symbol: string;
  db1ReceivedAt: number;
  db2ReceivedAt: number;
  timeDifference: number; // db2 - db1 (positive means db2 received later)
}

interface DifferenceStats {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  percentiles: {
    p25: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

async function loadTradesFromDb1(kv: Deno.Kv): Promise<Map<string, TradeData>> {
  const trades = new Map<string, TradeData>();

  // Iterate through all entries in the first database
  // Assuming trades are stored with keys like ["trades", tradeId] or similar
  const iter = kv.list({ prefix: ["trades"] });

  for await (const entry of iter) {
    const trade = entry.value as TradeData;
    trades.set(trade.t.toString(), trade);
  }

  return trades;
}

async function loadTradesFromDb2(kv: Deno.Kv): Promise<Map<string, TradeMessage>> {
  const trades = new Map<string, TradeMessage>();

  // Iterate through all entries in the second database
  const iter = kv.list({ prefix: ["trades"] });

  for await (const entry of iter) {
    const trade = entry.value as TradeMessage;
    trades.set(trade.tradeId, trade);
  }

  return trades;
}

function matchTrades(
  db1Trades: Map<string, TradeData>,
  db2Trades: Map<string, TradeMessage>,
): MatchedTrade[] {
  const matches: MatchedTrade[] = [];

  for (const [tradeId, trade1] of db1Trades) {
    const trade2 = db2Trades.get(tradeId);

    if (trade2) {
      matches.push({
        tradeId,
        symbol: trade1.s,
        db1ReceivedAt: trade1.receivedAt,
        db2ReceivedAt: trade2.receivedAt,
        timeDifference: trade2.receivedAt - trade1.receivedAt,
      });
    }
  }

  return matches;
}

function calculateStats(differences: number[]): DifferenceStats {
  if (differences.length === 0) {
    throw new Error("No data to calculate statistics");
  }

  const sorted = [...differences].sort((a, b) => a - b);
  const count = sorted.length;

  // Mean
  const mean = differences.reduce((sum, val) => sum + val, 0) / count;

  // Median
  const median = count % 2 === 0 ?
    (sorted[count / 2 - 1]! + sorted[count / 2]!) / 2 :
    sorted[Math.floor(count / 2)]!;

  // Min/Max
  const min = sorted[0]!;
  const max = sorted[count - 1]!;

  // Standard deviation
  const variance = differences.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  // Percentiles
  const getPercentile = (p: number) => {
    const index = Math.ceil((p / 100) * count) - 1;
    return sorted[Math.max(0, Math.min(index, count - 1))];
  };

  return {
    count,
    mean,
    median,
    min,
    max,
    stdDev,
    percentiles: {
      p25: getPercentile(25)!,
      p75: getPercentile(75)!,
      p90: getPercentile(90)!,
      p95: getPercentile(95)!,
      p99: getPercentile(99)!,
    },
  };
}

function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  if (abs < 1000) { return `${ms}ms`; }
  if (abs < 60000) { return `${(ms / 1000).toFixed(2)}s`; }
  return `${(ms / 60000).toFixed(2)}min`;
}

function printResults(matches: MatchedTrade[], stats: DifferenceStats) {
  console.log("\n=== TRADE MATCHING RESULTS ===");
  console.log(`Total matched trades: ${matches.length}`);

  console.log("\n=== RECEIVED TIME DIFFERENCE STATISTICS ===");
  console.log(`Count: ${stats.count}`);
  console.log(`Mean: ${formatDuration(stats.mean)}`);
  console.log(`Median: ${formatDuration(stats.median)}`);
  console.log(`Min: ${formatDuration(stats.min)}`);
  console.log(`Max: ${formatDuration(stats.max)}`);
  console.log(`Std Dev: ${formatDuration(stats.stdDev)}`);

  console.log("\n=== PERCENTILES ===");
  console.log(`25th percentile: ${formatDuration(stats.percentiles.p25)}`);
  console.log(`75th percentile: ${formatDuration(stats.percentiles.p75)}`);
  console.log(`90th percentile: ${formatDuration(stats.percentiles.p90)}`);
  console.log(`95th percentile: ${formatDuration(stats.percentiles.p95)}`);
  console.log(`99th percentile: ${formatDuration(stats.percentiles.p99)}`);

  // Show distribution of differences
  console.log("\n=== DIFFERENCE DISTRIBUTION ===");
  const negative = matches.filter((m) => m.timeDifference < 0).length;
  const zero = matches.filter((m) => m.timeDifference === 0).length;
  const positive = matches.filter((m) => m.timeDifference > 0).length;

  console.log(
    `WEBSOCKET received earlier: ${negative} (${(negative / matches.length * 100).toFixed(1)}%)`,
  );
  console.log(`Same time: ${zero} (${(zero / matches.length * 100).toFixed(1)}%)`);
  console.log(
    `FIX received earlier: ${positive} (${(positive / matches.length * 100).toFixed(1)}%)`,
  );
}

async function main() {
  try {
    // Open both KV databases
    console.log("Opening databases...");
    const kv1 = await Deno.openKv("./trades.db"); // Adjust path as needed
    const kv2 = await Deno.openKv("./trades-fix.db"); // Adjust path as needed

    const db1Trades = await loadTradesFromDb1(kv1);
    console.log(`Loaded ${db1Trades.size} trades from websocket database`);

    const db2Trades = await loadTradesFromDb2(kv2);
    console.log(`Loaded ${db2Trades.size} trades from FIX database`);

    console.log("Matching trades by trade ID...");
    const matches = matchTrades(db1Trades, db2Trades);
    console.log(`Found ${matches.length} matching trades`);

    if (matches.length === 0) {
      console.log("No matching trades found. Check trade ID formats and data.");
      return;
    }

    // Calculate statistics
    const differences = matches.map((m) => Math.abs(m.timeDifference));
    const stats = calculateStats(differences);

    // Print results
    printResults(matches, stats);

    // Optionally, save detailed results to a file
    const detailedResults = {
      summary: stats,
      matches: matches.slice(0, 100), // First 100 matches as example
    };

    await Deno.writeTextFile(
      "trade-matching-results.json",
      JSON.stringify(detailedResults, null, 2),
    );
    console.log("\nDetailed results saved to trade-matching-results.json");

    // Close databases
    kv1.close();
    kv2.close();
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the script
if (import.meta.main) {
  await main();
}
