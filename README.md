# FPL MCP Server

A Model Context Protocol (MCP) server that provides access to Fantasy Premier League data through seven comprehensive tools.

## Features

- **Search Players**: Find player IDs by searching player names (fuzzy matching)
- **Search Teams**: Find team IDs by searching team names (fuzzy matching)
- **Current Gameweek Status**: Get current gameweek number, deadline, and completion status
- **Player Statistics**: Retrieve comprehensive stats for any FPL player
- **Gameweek Fixtures**: Get all fixtures for a specific gameweek
- **Player Comparison**: Compare statistics between multiple players
- **Team Information**: Get team details and current squad information
- **Manager Team**: View a manager's team selection for any gameweek, including starting XI, bench, captain, and formation

## Installation

1. Install dependencies:

```bash
npm install
```

2. Build the project:

```bash
npm run build
```

## Usage

### As MCP Server

The server is designed to be used with MCP clients. Configure your MCP client to use this server:

```json
{
  "mcpServers": {
    "fpl-mcp-server": {
      "command": "node",
      "args": ["path/to/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Development

Run in development mode:

```bash
npm run dev
```

### Testing with MCP Inspector

The MCP Inspector provides an interactive interface for testing and debugging your server during development.

1. Create an `mcp.config.json` file in the project root:

```json
{
  "mcpServers": {
    "fpl-mcp-server": {
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

2. Build your server:

```bash
npm run build
```

3. Run the inspector:

```bash
npx @modelcontextprotocol/inspector --config ./mcp.config.json --server fpl-mcp-server
```

4. Open the provided URL in your browser to test all available tools interactively

### Logging

The server uses Winston for structured logging to stderr (to avoid interfering with MCP's stdio transport). Configure logging with environment variables:

```bash
# Set log level (debug, info, warn, error)
LOG_LEVEL=debug npm start

# Set environment mode (affects log formatting)
NODE_ENV=development npm start
```

In development mode, logs are colorized for better readability. All logs are written to stderr, ensuring the MCP protocol communication on stdout remains unaffected.

### Available Tools

1. **search_players**: Search for players by name. Requires `query` (string)
   - Returns up to 10 matching players with their IDs, teams, positions, and costs
   - Use this FIRST before calling get_player_stats or compare_players

2. **search_teams**: Search for teams by name. Requires `query` (string)
   - Returns matching teams with their IDs and short names
   - Use this FIRST before calling get_team_info

3. **get_current_gameweek**: No parameters required

4. **get_player_stats**: Requires `playerId` (1-1000)
   - Use search_players first to find the player ID

5. **get_gameweek_fixtures**: Requires `gameweek` (1-38)

6. **compare_players**: Requires `playerIds` array (2-10 players)
   - Use search_players first to find player IDs

7. **get_team_info**: Requires `teamId` (1-20)
   - Use search_teams first to find the team ID

8. **get_manager_team**: Requires `managerId` (1-10000000), optional `gameweek` (1-38)
   - Returns manager's team selection including starting XI, bench, captain, formation, and points
   - If gameweek is not specified, returns the current gameweek team

## Error Handling

The server includes comprehensive error handling for:

- Input validation errors
- FPL API failures
- Network connectivity issues
- Invalid player/team/gameweek IDs

All errors are returned in a consistent format with error codes and detailed messages.

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting PRs.

This project uses automated releases via [Release Please](https://github.com/googleapis/release-please). When you merge commits to main following [Conventional Commits](https://www.conventionalcommits.org/), a release PR is automatically created or updated. Merging that PR triggers a new GitHub release with automatically generated release notes.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## License

MIT - see [LICENSE](LICENSE) file for details.
