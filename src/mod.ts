/**
 * @author ppe
 * @description Integration with RedStone data feeds
 * @license MIT
 * @module
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { APP_NAME, APP_VERSION } from "./constants.ts";
import { DenoKVPriceDatabase, type QueryOptions } from "./storage/kv-storage.ts";

const server = new Server({
  name: APP_NAME,
  version: APP_VERSION,
}, {
  capabilities: {
    tools: {},
    logging: {},
  },
});

const db = await DenoKVPriceDatabase.create(
  "/Users/ppe/projects/redstone-mcp/redstone_data.db",
  30,
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      /*{
        name: "fetch_price_feeds",
        description: "Read current price feeds from RedStone Oracle",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },*/
      {
        name: "price_data_summary",
        description: "Shows the summary of the data indexed from RedStone Oracle",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "price_data",
        description:
          "Load current and historical price data with optional filtering by time range, tokens, and pagination support",
        inputSchema: {
          type: "object",
          properties: {
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
            "limit": {
              type: "integer",
              description: "Maximum number of records to return",
              minimum: 1,
              maximum: 10000,
              default: 10000,
            },
            "offset": {
              type: "integer",
              description: "Number of records to skip for pagination",
              minimum: 0,
              default: 0,
            },
          },
          additionalProperties: false,
        },
      },
    ],
  };
});

function mapPriceDataArgs(args: Record<string, unknown>): QueryOptions {
  console.error("args:", args);
  const result: QueryOptions = {
    timeRange: undefined,
    dataFeedIds: undefined,
    limit: undefined,
    offset: undefined,
  };
  if (args["startTime"] || args["endTime"]) {
    result.timeRange = {
      start: args["startTime"] as number ?? 0,
      end: args["endTime"] as number ?? Date.now(),
    };
  }
  if (args["dataFeedIds"]) {
    result.dataFeedIds = args["dataFeedIds"] as string[];
  }
  console.error("Mapped args", result);

  return result;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error(`No arguments provided for tool: ${name}`);
  }

  switch (name) {
   /* case "fetch_price_feeds":
      return {
        content: [{
          type: "text",
          text: JSON.stringify(await fetchPriceFeeds()),
        }],
      };*/
    case "price_data_summary":
      return {
        content: [{
          type: "text",
          text: JSON.stringify(await db.getDatabaseInfo()),
        }],
      };
    case "price_data":
      return {
        content: [{
          type: "text",
          text: JSON.stringify(await db.getPriceData(mapPriceDataArgs(args))),
        }],
      };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

export { server };
