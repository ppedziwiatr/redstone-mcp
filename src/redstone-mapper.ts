// Trade information for exchange data
import { type RedStoneOracleData, type SlippageInfo, type TradeInfo } from "./redstone-types.ts";

// Mapped source price information
export interface SourcePriceInfo {
  sourceName: string;
  price: number;
  tradeInfo?: TradeInfo;
  slippage?: SlippageInfo[];
}

// Final mapped result for a token
export interface TokenPriceData {
  dataFeedId: string;
  finalPrice: number;
  timestamp: number;
  nodeLabel: string;
  signerAddress: string;
  sources: SourcePriceInfo[];
}

// Result type for the mapping function
export interface MappedRedStoneData {
  [dataFeedId: string]: TokenPriceData;
}

/**
 * Maps RedStone oracle data for a specific node
 * @param rawData - The raw RedStone oracle data
 * @param nodeLabel - The node to extract data from (default: "morpheus-main")
 * @returns Mapped data with final prices and source breakdown
 */
export function mapRedStoneData(
  rawData: RedStoneOracleData,
): MappedRedStoneData {
  const result: MappedRedStoneData = {};

  // Iterate through each data feed (e.g., "AAVE", "ACRED_FUNDAMENTAL")
  for (const [dataFeedId, dataPackages] of Object.entries(rawData)) {
    // Find the data package for the specified node
    const nodePackage = dataPackages[0]!;

    const dataPoint = nodePackage.dataPoints[0]!;
    const metadata = dataPoint.metadata;

    // Extract source price information
    const sources: SourcePriceInfo[] = [];

    for (const [sourceName, sourceData] of Object.entries(metadata.sourceMetadata)) {
      const sourceInfo: SourcePriceInfo = {
        sourceName,
        price: parseFloat(sourceData.value),
      };

      // Add trade info if available
      if (sourceData.tradeInfo) {
        sourceInfo.tradeInfo = sourceData.tradeInfo;
      }

      // Add slippage info if available (for DEX sources)
      if (sourceData.slippage) {
        sourceInfo.slippage = sourceData.slippage;
      }

      sources.push(sourceInfo);
    }

    // Sort sources by price for easier analysis
    sources.sort((a, b) => b.price - a.price);

    // Create the mapped token data
    result[dataFeedId] = {
      dataFeedId,
      finalPrice: dataPoint.value,
      timestamp: nodePackage.timestampMilliseconds,
      nodeLabel: metadata.nodeLabel,
      signerAddress: nodePackage.signerAddress,
      sources,
    };
  }

  return result;
}
