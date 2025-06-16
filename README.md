# RedStone MCP Demo

### Hot to run

#### Claude Desktop
Install Claude Desktop - https://claude.ai/download

#### Indexer
1. in the `redstone-mcp` dir create .env file with `REDSTONE_MCP_DB_PATH` absolute path to the database file (e.g. `/Users/ppe/projects/redstone-mcp/redstone_data.db`)
2. `deno task compile:indexer`
3. `./redstone-indexer` - keep it running in background

#### MCP Server
1. `deno task compile` - a file named `redstone-mcp` should be created
2. Open Claude Desktop -> Settings -> Developer -> Edit Config
3. A system file browser should open with `claude_desktop_config.json` selected
4. Open `claude_desktop_config.json` file and paste:
```json
{
  "mcpServers": {
      "redstone-mcp": {
          "command": "/Users/ppe/projects/redstone-mcp/redstone-mcp",
          "env": {
            "REDSTONE_MCP_DB_PATH": "/Users/ppe/projects/redstone-mcp/redstone_data.db"
          }
      }
  }
}
```
Remember to change `command` and `env.REDSTONE_MCP_DB_PATH` to proper paths!  

5. Close Claude Desktop
6. Open Claude Desktop - it should start without any errors
7. Verify the configuration in Settings -> Developer (the `redstone-mcp` should be
now on the list of the MCP servers)
8. Check some example promprt (e.g. `Analyze price difference between sources for AAVE`)

