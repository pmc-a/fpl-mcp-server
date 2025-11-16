#!/usr/bin/env node

/**
 * FPL MCP Server
 * 
 * This is the main entry point for the Fantasy Premier League MCP server.
 * It initializes the MCP server with SDK configuration and registers all available tools.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Tool handlers
import { getCurrentGameweekTool } from './tools/gameweek.js';
import { getPlayerStatsTool } from './tools/player-stats.js';
import { getGameweekFixturesTool } from './tools/fixtures.js';
import { comparePlayersTool } from './tools/compare-players.js';
import { getTeamInfoTool } from './tools/team-info.js';
import { searchPlayersTool } from './tools/search-players.js';
import { searchTeamsTool } from './tools/search-teams.js';

// Types and schemas
import {
  PlayerStatsInputSchema,
  GameweekFixturesInputSchema,
  ComparePlayersInputSchema,
  TeamInfoInputSchema,
  CurrentGameweekInputSchema,
  SearchPlayersInputSchema,
  SearchTeamsInputSchema,
} from './types/tool-schemas.js';

// Error handling utilities
import { ErrorHandler } from './utils/error-handler.js';
import { logger } from './utils/logger.js';

/**
 * FPL MCP Server class
 */
class FPLMCPServer {
  private server: McpServer;
  private isShuttingDown = false;

  constructor() {
    this.server = new McpServer(
      {
        name: 'fpl-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
    this.logServerInfo();
  }

  /**
   * Log server information on startup
   */
  private logServerInfo(): void {
    const nodeEnv = process.env.NODE_ENV || 'development';
    logger.info(`FPL MCP Server v1.0.0 initializing in ${nodeEnv} mode`);
    logger.info('Registering 7 FPL tools: gameweek, player-stats, fixtures, compare-players, team-info, search-players, search-teams');
  }

  /**
   * Set up tool registration system for all tools
   */
  private setupToolHandlers(): void {
    // Register search_players tool
    this.server.tool(
      'search_players',
      'Search for players by name to find their IDs. Use this FIRST before calling get_player_stats or compare_players.',
      SearchPlayersInputSchema.shape,
      async (args, _extra) => {
        return await this.executeToolWithErrorHandling('search_players', args, searchPlayersTool);
      }
    );

    // Register search_teams tool
    this.server.tool(
      'search_teams',
      'Search for teams by name to find their IDs. Use this FIRST before calling get_team_info.',
      SearchTeamsInputSchema.shape,
      async (args, _extra) => {
        return await this.executeToolWithErrorHandling('search_teams', args, searchTeamsTool);
      }
    );

    // Register get_current_gameweek tool
    this.server.tool(
      'get_current_gameweek',
      'Get the current gameweek status including number, deadline, and completion status',
      CurrentGameweekInputSchema.shape,
      async (args, _extra) => {
        return await this.executeToolWithErrorHandling('get_current_gameweek', args, getCurrentGameweekTool);
      }
    );

    // Register get_player_stats tool
    this.server.tool(
      'get_player_stats',
      'Get comprehensive statistics for a specific player by ID. Use search_players first to find the player ID.',
      PlayerStatsInputSchema.shape,
      async (args, _extra) => {
        return await this.executeToolWithErrorHandling('get_player_stats', args, getPlayerStatsTool);
      }
    );

    // Register get_gameweek_fixtures tool
    this.server.tool(
      'get_gameweek_fixtures',
      'Get all fixtures for a specific gameweek',
      GameweekFixturesInputSchema.shape,
      async (args, _extra) => {
        return await this.executeToolWithErrorHandling('get_gameweek_fixtures', args, getGameweekFixturesTool);
      }
    );

    // Register compare_players tool
    this.server.tool(
      'compare_players',
      'Compare statistics between multiple players. Use search_players first to find player IDs.',
      ComparePlayersInputSchema.shape,
      async (args, _extra) => {
        return await this.executeToolWithErrorHandling('compare_players', args, comparePlayersTool);
      }
    );

    // Register get_team_info tool
    this.server.tool(
      'get_team_info',
      'Get team information including current squad. Use search_teams first to find the team ID.',
      TeamInfoInputSchema.shape,
      async (args, _extra) => {
        return await this.executeToolWithErrorHandling('get_team_info', args, getTeamInfoTool);
      }
    );

    logger.info('All 7 FPL tools registered successfully');
  }

  /**
   * Execute tool with comprehensive error handling and logging
   */
  private async executeToolWithErrorHandling<T>(
    toolName: string,
    args: any,
    toolHandler: (args: T) => Promise<{ content: Array<{ type: 'text'; text: string }> }>
  ): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    const startTime = Date.now();
    
    try {
      logger.debug(`Executing tool: ${toolName}`, { args });
      
      const result = await toolHandler(args);
      const duration = Date.now() - startTime;
      
      logger.info(`Tool ${toolName} completed successfully`, { duration });
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Tool ${toolName} failed`, { duration, error });
      
      // Create standardized error response
      const errorResponse = ErrorHandler.handleUnexpectedError(error);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorResponse),
          },
        ],
      };
    }
  }

  /**
   * Set up comprehensive error handling for the server
   */
  private setupErrorHandling(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error, stack: error.stack });
      this.shutdown(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
      if (reason instanceof Error) {
        logger.error('Stack trace', { stack: reason.stack });
      }
      this.shutdown(1);
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      logger.info('Received SIGINT. Shutting down gracefully...');
      this.shutdown(0);
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM. Shutting down gracefully...');
      this.shutdown(0);
    });

    // Handle warning events
    process.on('warning', (warning) => {
      logger.warn('Process warning', { name: warning.name, message: warning.message, stack: warning.stack });
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      logger.info('FPL MCP Server started successfully and listening for requests');
      logger.info('Server ready to handle MCP tool calls');
    } catch (error) {
      logger.error('Failed to start MCP server transport', { error });
      throw error;
    }
  }

  /**
   * Shutdown the server gracefully
   */
  private shutdown(exitCode: number): void {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress...');
      return;
    }
    
    this.isShuttingDown = true;
    logger.info('FPL MCP Server shutting down...');
    
    // Give a moment for any pending operations to complete
    setTimeout(() => {
      logger.info('Shutdown complete');
      process.exit(exitCode);
    }, 100);
  }
}

/**
 * Main function to start the server
 */
async function main(): Promise<void> {
  try {
    logger.info('Starting FPL MCP Server...');
    const server = new FPLMCPServer();
    await server.start();
  } catch (error) {
    logger.error('Failed to start FPL MCP Server', { error });
    if (error instanceof Error) {
      logger.error('Error details', { message: error.message, stack: error.stack });
    }
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Fatal error during server startup', { error });
    process.exit(1);
  });
}

export { FPLMCPServer };