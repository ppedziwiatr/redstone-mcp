/**
 * @author ppe
 * @description Integration with RedStone data feeds
 * @license MIT
 * @module
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { APP_NAME, APP_VERSION } from "./constants.ts";
import { type QueryOptions } from "./storage/kv-storage.ts";
import {SandboxService} from "./sandbox-service.ts";

const server = new Server({
  name: APP_NAME,
  version: APP_VERSION,
}, {
  capabilities: {
    tools: {},
    logging: {},
  },
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "execute_js_on_redstone_data",
        description:
          `Execute generated JavaScript code on RedStone prices data in a safe, sandbox environment (Deno Worker). 
          Do not use any external libraries in the code, only built-ins. Do not use template literals.
          Use async function fetchRedStone available in sandbox globals to load the data from RedStone Oracle. This function
          fetchRedStone returns an array of TokenPriceData objects with the following structure:
          
          export interface TokenPriceData {
            dataFeedId: string;
            finalPrice: number;
            timestamp: number;
            nodeLabel: string;
            signerAddress: string;
            sources: SourcePriceInfo[];
          }
          
          // Mapped source price information
          export interface SourcePriceInfo {
            sourceName: string;
            price: number;
            slippage?: SlippageInfo[];
            tradeInfo?: TradeInfo;
          }
          
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
          
          The whole data returned from the sandbox is in format {result: <result_of_your_analysis>, logs: <string_array>}
          `,



        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "JavaScript code to run in sandbox",
            },
            "startTime": {
              type: "integer",
              description: "Start timestamp in milliseconds for filtering data",
              minimum: 0,
            },
            "endTime": {
              type: "integer",
              description: "End timestamp in milliseconds for filtering data",
              minimum: 0,
            },
            "dataFeedIds": {
              type: "array",
              description: "Array of token/data feed identifiers to filter by",
              items: {
                type: "string",
                pattern: "^[A-Z_]+$",
              },
              uniqueItems: true,
            },
          },
          additionalProperties: false,
        },
      },
    ],
  };
});

function mapArgs(args: Record<string, unknown>): ToolOptions {
  console.error("args:", args);
  const queryOptions: QueryOptions = {
    timeRange: undefined,
    dataFeedIds: undefined,
    limit: undefined,
    offset: undefined,
  }
  if (args["startTime"] || args["endTime"]) {
    queryOptions.timeRange = {
      start: args["startTime"] as number ?? 0,
      end: args["endTime"] as number ?? Date.now(),
    };
  }
  if (args["dataFeedIds"]) {
    queryOptions.dataFeedIds = args["dataFeedIds"] as string[];
  }
  const result: ToolOptions = {
    code: args["code"] as string,
    queryOptions
  };
  console.error("Mapped args", result);

  return result;
}

export interface ToolOptions {
  code: string,
  queryOptions: QueryOptions,
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error(`No arguments provided for tool: ${name}`);
  }

  switch (name) {
    case "execute_js_on_redstone_data": {
      const sandbox = new SandboxService();
      const result = await sandbox.runCode(mapArgs(args));
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result),
        }],
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

export { server };
