// Trade information for exchange data
export interface TradeInfo {
  bidPrice?: number;
  askPrice?: number;
  volumeInUsd: number;
}

// Slippage information for DEX data
export interface SlippageInfo {
  isSuccess: boolean;
  slippageAsPercent: string;
  direction: string;
  simulationValueInUsd: string;
}

// Source metadata for different exchanges/sources
interface SourceMetadata {
  [key: string]: {
    tradeInfo?: TradeInfo;
    value: string;
    slippage?: SlippageInfo[];
  };
}

// Metadata for each data point
interface DataPointMetadata {
  value: string;
  sourceMetadata: SourceMetadata;
  nodeLabel: string;
}

// Individual data point within a data package
interface DataPoint {
  dataFeedId: string;
  value: number;
  metadata: DataPointMetadata;
}

// Individual data package with signature and data
interface DataPackage {
  timestampMilliseconds: number;
  signature: string;
  isSignatureValid: boolean;
  dataPoints: DataPoint[];
  dataServiceId: string;
  dataPackageId: string;
  signerAddress: string;
  dataFeedId: string;
}

// Root structure containing all data feeds
export interface RedStoneOracleData {
  [dataFeedId: string]: DataPackage[];
}
