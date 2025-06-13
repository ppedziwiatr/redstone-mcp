/**
 * @author ppe
 * @description Integration with RedStone data feeds
 * @license MIT
 * @module
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { APP_NAME, APP_VERSION } from "./constants.ts";
import { fetchPriceFeeds } from "./storage/redstone.ts";

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
        name: "fetch_price_feeds",
        description: "Read current price feeds from RedStone Oracle",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error(`No arguments provided for tool: ${name}`);
  }

  switch (name) {
    case "fetch_price_feeds":
      return {
        content: [{
          type: "text",
          text: JSON.stringify(await fetchPriceFeeds(), null, 2),
        }],
      };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

export { server };
