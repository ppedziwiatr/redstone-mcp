// ===== TIME HELPER FUNCTIONS =====

import type { MappedRedStoneData, TokenPriceData } from "../redstone-mapper.ts";

/*class TimeHelper {
  static now(): number {
    return Date.now();
  }

  static daysAgo(days: number): number {
    return Date.now() - (days * 24 * 60 * 60 * 1000);
  }

  static hoursAgo(hours: number): number {
    return Date.now() - (hours * 60 * 60 * 1000);
  }

  static minutesAgo(minutes: number): number {
    return Date.now() - (minutes * 60 * 1000);
  }

  static monthsAgo(months: number): number {
    const now = new Date();
    now.setMonth(now.getMonth() - months);
    return now.getTime();
  }

  static formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toISOString();
  }
}*/

// ===== DATABASE INTERFACE =====

interface DatabaseInfo {
  totalTokens: number;
  totalSources: number;
  totalRecords: number;
  dataRange: {
    earliest: number;
    latest: number;
  };
  tokensInfo: Array<{
    dataFeedId: string;
    recordCount: number;
    sourceCount: number;
    priceRange: {
      earliest: number;
      latest: number;
    };
  }>;
}

interface PriceDeviation {
  dataFeedId: string;
  timestamp: number;
  finalPrice: number;
  sourceDeviations: Array<{
    sourceName: string;
    price: number;
    deviationFromFinal: number;
    deviationPercent: number;
  }>;
  maxDeviation: number;
  maxDeviationPercent: number;
  standardDeviation: number;
}

interface PriceTrend {
  dataFeedId: string;
  timeRange: {
    start: number;
    end: number;
  };
  pricePoints: Array<{
    timestamp: number;
    price: number;
  }>;
  trend: {
    direction: "up" | "down" | "stable";
    changePercent: number;
    volatility: number;
  };
  movingAverages?: {
    ma7?: number;
    ma30?: number;
  };
}

interface SourceQuality {
  sourceName: string;
  dataFeedId?: string;
  qualityMetrics: {
    averageDeviation: number;
    maxDeviation: number;
    reliability: number; // 0-1 score
    uptime: number; // percentage of records where this source was present
    volumeWeightedScore?: number;
  };
  timeRange: {
    start: number;
    end: number;
  };
}

export interface QueryOptions {
  timeRange?: {
    start: number;
    end: number;
  };
  dataFeedIds?: string[];
  limit?: number;
  offset?: number;
}

interface PruneResult {
  recordsDeleted: number;
  tokensAffected: string[];
  oldestRemainingTimestamp: number;
}

interface IPriceDatabase {
  // Basic operations
  storePriceData(data: MappedRedStoneData): Promise<void>;

  // Info and stats
  getDatabaseInfo(): Promise<DatabaseInfo>;

  // Data retrieval
  getPriceData(options?: QueryOptions): Promise<TokenPriceData[]>;
  getLatestPrices(dataFeedIds?: string[]): Promise<TokenPriceData[]>;

  // Analysis methods
  analyzePriceDeviations(options?: QueryOptions): Promise<PriceDeviation[]>;
  analyzePriceTrends(options?: QueryOptions): Promise<PriceTrend[]>;
  analyzeSourceQuality(options?: QueryOptions): Promise<SourceQuality[]>;

  // Maintenance
  pruneOldData(olderThanMs?: number): Promise<PruneResult>;

  // Utility
  close(): Promise<void>;
}

// ===== DENO KV IMPLEMENTATION =====

export class DenoKVPriceDatabase implements IPriceDatabase {
  private kv: Deno.Kv;
  private readonly defaultRetentionMs: number;

  constructor(kv: Deno.Kv, retentionDays: number = 30) {
    this.kv = kv;
    this.defaultRetentionMs = retentionDays * 24 * 60 * 60 * 1000;
  }

  static async create(retentionDays: number = 30): Promise<DenoKVPriceDatabase> {
    // "/Users/ppe/projects/redstone-mcp/redstone_data.db"
    const databasePath = Deno.env.get("REDSTONE_MCP_DB_PATH");
    if (!databasePath) {
      throw new Error("REDSTONE_MCP_DB_PATH env not set");
    }
    const kv = await Deno.openKv(databasePath);
    return new DenoKVPriceDatabase(kv, retentionDays);
  }

  async storePriceData(data: MappedRedStoneData): Promise<void> {
    for (const [dataFeedId, tokenData] of Object.entries(data)) {
      // Primary key: ["prices", dataFeedId, timestamp]
      await this.kv.set(["prices", dataFeedId, tokenData.timestamp], tokenData);

      // Index for latest prices: ["latest", dataFeedId]
      await this.kv.set(["latest", dataFeedId], tokenData);

      // Store metadata for each source
      for (const source of tokenData.sources) {
        await this.kv.set(
          ["sources", source.sourceName, dataFeedId, tokenData.timestamp],
          {
            price: source.price,
            tradeInfo: source.tradeInfo,
            slippage: source.slippage,
            finalPrice: tokenData.finalPrice,
            timestamp: tokenData.timestamp,
          },
        );
      }

      // Update token metadata
      await this.kv.set(["tokens", dataFeedId], {
        dataFeedId,
        lastUpdated: tokenData.timestamp,
        sourceCount: tokenData.sources.length,
      });
    }
  }

  async getDatabaseInfo(): Promise<DatabaseInfo> {
    const tokens = new Set<string>();
    const sources = new Set<string>();
    let totalRecords = 0;
    let earliest = Number.MAX_SAFE_INTEGER;
    let latest = 0;
    const tokensInfo: DatabaseInfo["tokensInfo"] = [];

    // Iterate through all price entries
    const priceEntries = this.kv.list({ prefix: ["prices"] });
    const tokenRecords = new Map<
      string,
      { count: number; sources: Set<string>; earliest: number; latest: number }
    >();

    for await (const entry of priceEntries) {
      const [, dataFeedId, timestamp] = entry.key as [string, string, number];
      const tokenData = entry.value as TokenPriceData;

      tokens.add(dataFeedId);
      totalRecords++;
      earliest = Math.min(earliest, timestamp);
      latest = Math.max(latest, timestamp);

      // Track token-specific info
      if (!tokenRecords.has(dataFeedId)) {
        tokenRecords.set(dataFeedId, {
          count: 0,
          sources: new Set(),
          earliest: Number.MAX_SAFE_INTEGER,
          latest: 0,
        });
      }

      const tokenRecord = tokenRecords.get(dataFeedId)!;
      tokenRecord.count++;
      tokenRecord.earliest = Math.min(tokenRecord.earliest, timestamp);
      tokenRecord.latest = Math.max(tokenRecord.latest, timestamp);

      // Count unique sources
      tokenData.sources.forEach((source) => {
        sources.add(source.sourceName);
        tokenRecord.sources.add(source.sourceName);
      });
    }

    // Build tokens info
    for (const [dataFeedId, record] of tokenRecords) {
      tokensInfo.push({
        dataFeedId,
        recordCount: record.count,
        sourceCount: record.sources.size,
        priceRange: {
          earliest: record.earliest === Number.MAX_SAFE_INTEGER ? 0 : record.earliest,
          latest: record.latest,
        },
      });
    }

    return {
      totalTokens: tokens.size,
      totalSources: sources.size,
      totalRecords,
      dataRange: {
        earliest: earliest === Number.MAX_SAFE_INTEGER ? 0 : earliest,
        latest,
      },
      tokensInfo,
    };
  }

  async getPriceData(options: QueryOptions = {}): Promise<TokenPriceData[]> {
    const results: TokenPriceData[] = [];
    const { timeRange, dataFeedIds, limit, offset = 0 } = options;

    let count = 0;
    let skipped = 0;

    for (const dataFeedId of dataFeedIds || await this.getAllTokenIds()) {
      const entries = this.kv.list({ prefix: ["prices", dataFeedId] });

      for await (const entry of entries) {
        const [, , timestamp] = entry.key as [string, string, number];
        const tokenData = entry.value as TokenPriceData;

        // Apply time range filter
        if (timeRange) {
          if (timestamp < timeRange.start || timestamp > timeRange.end) {
            continue;
          }
        }

        // Apply offset
        if (skipped < offset) {
          skipped++;
          continue;
        }

        results.push(tokenData);
        count++;

        // Apply limit
        if (limit && count >= limit) {
          return results;
        }
      }
    }

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  async getLatestPrices(dataFeedIds?: string[]): Promise<TokenPriceData[]> {
    const results: TokenPriceData[] = [];
    const tokenIds = dataFeedIds || await this.getAllTokenIds();

    for (const dataFeedId of tokenIds) {
      const entry = await this.kv.get(["latest", dataFeedId]);
      if (entry.value) {
        results.push(entry.value as TokenPriceData);
      }
    }

    return results;
  }

  async analyzePriceDeviations(options: QueryOptions = {}): Promise<PriceDeviation[]> {
    const priceData = await this.getPriceData(options);
    const deviations: PriceDeviation[] = [];

    for (const tokenData of priceData) {
      const sourceDeviations = tokenData.sources.map((source) => {
        const deviation = source.price - tokenData.finalPrice;
        const deviationPercent = (deviation / tokenData.finalPrice) * 100;

        return {
          sourceName: source.sourceName,
          price: source.price,
          deviationFromFinal: deviation,
          deviationPercent,
        };
      });

      const deviationValues = sourceDeviations.map((s) => Math.abs(s.deviationFromFinal));
      const maxDeviation = Math.max(...deviationValues);
      const maxDeviationPercent = Math.max(
        ...sourceDeviations.map((s) => Math.abs(s.deviationPercent)),
      );

      // Calculate standard deviation
      const mean = sourceDeviations.reduce((sum, s) => sum + s.deviationFromFinal, 0) /
        sourceDeviations.length;
      const variance = sourceDeviations.reduce((sum, s) =>
        sum + Math.pow(s.deviationFromFinal - mean, 2), 0) / sourceDeviations.length;
      const standardDeviation = Math.sqrt(variance);

      deviations.push({
        dataFeedId: tokenData.dataFeedId,
        timestamp: tokenData.timestamp,
        finalPrice: tokenData.finalPrice,
        sourceDeviations,
        maxDeviation,
        maxDeviationPercent,
        standardDeviation,
      });
    }

    return deviations;
  }

  async analyzePriceTrends(options: QueryOptions = {}): Promise<PriceTrend[]> {
    const priceData = await this.getPriceData(options);
    const tokenGroups = new Map<string, TokenPriceData[]>();

    // Group by token
    for (const data of priceData) {
      if (!tokenGroups.has(data.dataFeedId)) {
        tokenGroups.set(data.dataFeedId, []);
      }
      tokenGroups.get(data.dataFeedId)!.push(data);
    }

    const trends: PriceTrend[] = [];

    for (const [dataFeedId, tokenData] of tokenGroups) {
      if (tokenData.length < 2) { continue; }

      // Sort by timestamp
      tokenData.sort((a, b) => a.timestamp - b.timestamp);

      const pricePoints = tokenData.map((d) => ({
        timestamp: d.timestamp,
        price: d.finalPrice,
      }));

      // TODO: safe indexes
      const firstPrice = pricePoints[0]!.price;
      const lastPrice = pricePoints[pricePoints.length - 1]!.price;
      const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;

      // Calculate volatility (coefficient of variation)
      const prices = pricePoints.map((p) => p.price);
      const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
      const volatility = Math.sqrt(variance) / mean;

      // Determine trend direction
      let direction: "up" | "down" | "stable" = "stable";
      if (Math.abs(changePercent) > 1) { // 1% threshold
        direction = changePercent > 0 ? "up" : "down";
      }

      trends.push({
        dataFeedId,
        timeRange: {
          start: pricePoints[0]!.timestamp,
          end: pricePoints[pricePoints.length - 1]!.timestamp,
        },
        pricePoints,
        trend: {
          direction,
          changePercent,
          volatility,
        },
      });
    }

    return trends;
  }

  async analyzeSourceQuality(options: QueryOptions = {}): Promise<SourceQuality[]> {
    const deviations = await this.analyzePriceDeviations(options);
    const sourceMetrics = new Map<string, {
      deviations: number[];
      totalRecords: number;
      presentRecords: number;
      volumes: number[];
    }>();

    // Collect metrics for each source
    for (const deviation of deviations) {
      for (const sourceDev of deviation.sourceDeviations) {
        if (!sourceMetrics.has(sourceDev.sourceName)) {
          sourceMetrics.set(sourceDev.sourceName, {
            deviations: [],
            totalRecords: 0,
            presentRecords: 0,
            volumes: [],
          });
        }

        const metrics = sourceMetrics.get(sourceDev.sourceName)!;
        metrics.deviations.push(Math.abs(sourceDev.deviationPercent));
        metrics.presentRecords++;
      }
    }

    // Calculate total records for uptime calculation
    const totalRecords = deviations.length;
    for (const metrics of sourceMetrics.values()) {
      metrics.totalRecords = totalRecords;
    }

    const qualities: SourceQuality[] = [];

    for (const [sourceName, metrics] of sourceMetrics) {
      const averageDeviation = metrics.deviations.reduce((sum, d) => sum + d, 0) /
        metrics.deviations.length;
      const maxDeviation = Math.max(...metrics.deviations);
      const uptime = (metrics.presentRecords / metrics.totalRecords) * 100;

      // Reliability score (lower deviation and higher uptime = better)
      const reliability = Math.max(0, 1 - (averageDeviation / 100) - ((100 - uptime) / 100));

      const timeRange = options.timeRange || {
        start: deviations[deviations.length - 1]?.timestamp || 0,
        end: deviations[0]?.timestamp || Date.now(),
      };

      qualities.push({
        sourceName,
        qualityMetrics: {
          averageDeviation,
          maxDeviation,
          reliability,
          uptime,
        },
        timeRange,
      });
    }

    return qualities.sort((a, b) => b.qualityMetrics.reliability - a.qualityMetrics.reliability);
  }

  async pruneOldData(olderThanMs?: number): Promise<PruneResult> {
    const cutoffTime = Date.now() - (olderThanMs || this.defaultRetentionMs);
    let recordsDeleted = 0;
    const tokensAffected = new Set<string>();
    let oldestRemainingTimestamp = Date.now();

    // Delete old price records
    const entries = this.kv.list({ prefix: ["prices"] });
    for await (const entry of entries) {
      const [, dataFeedId, timestamp] = entry.key as [string, string, number];

      if (timestamp < cutoffTime) {
        await this.kv.delete(entry.key);
        tokensAffected.add(dataFeedId);
        recordsDeleted++;
      } else {
        oldestRemainingTimestamp = Math.min(oldestRemainingTimestamp, timestamp);
      }
    }

    // Delete old source records
    const sourceEntries = this.kv.list({ prefix: ["sources"] });
    for await (const entry of sourceEntries) {
      const [, , , timestamp] = entry.key as [string, string, string, number];

      if (timestamp < cutoffTime) {
        await this.kv.delete(entry.key);
      }
    }

    return {
      recordsDeleted,
      tokensAffected: Array.from(tokensAffected),
      oldestRemainingTimestamp,
    };
  }

  async close(): Promise<void> {
    this.kv.close();
  }

  private async getAllTokenIds(): Promise<string[]> {
    const tokenIds: string[] = [];
    const entries = this.kv.list({ prefix: ["tokens"] });

    for await (const entry of entries) {
      const [, dataFeedId] = entry.key as [string, string];
      tokenIds.push(dataFeedId);
    }

    return tokenIds;
  }
}

// ===== USAGE EXAMPLE =====
if (import.meta.main) {
  // Initialize database
  const db = await DenoKVPriceDatabase.create(30);
  // Analyze price trends for last 5 days
  const trends = await db.analyzePriceTrends();
  console.log("Price trends:", trends);

  await db.close();
}
