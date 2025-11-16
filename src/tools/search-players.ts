/**
 * Search players tool
 * 
 * This tool allows searching for players by name to find their IDs,
 * eliminating the need for trial and error when looking up player information.
 */

import { bootstrapCache } from '../utils/bootstrap-cache.js';
import { SearchPlayersInputSchema, SearchPlayersInput } from '../types/tool-schemas.js';
import { safeExecute } from '../utils/error-handler.js';
import { ErrorHandler } from '../utils/error-handler.js';

/**
 * Search players tool handler
 */
export async function searchPlayersTool(args: SearchPlayersInput): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Validate input
  const validationResult = SearchPlayersInputSchema.safeParse(args);
  if (!validationResult.success) {
    const errorResponse = ErrorHandler.handleValidationError(
      'Invalid search query provided',
      validationResult.error.issues
    );
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(errorResponse),
        },
      ],
    };
  }

  const { query } = validationResult.data;

  const result = await safeExecute(async () => {
    const players = await bootstrapCache.searchPlayers(query);
    
    if (players.length === 0) {
      return {
        message: `No players found matching "${query}". Try a different search term.`,
        results: []
      };
    }
    
    return {
      message: `Found ${players.length} player(s) matching "${query}"`,
      results: players
    };
  }, 'searchPlayersTool');

  // Handle the result
  if ('error' in result) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: result
        }),
      },
    ],
  };
}
