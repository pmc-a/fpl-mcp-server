/**
 * Search teams tool
 * 
 * This tool allows searching for teams by name to find their IDs,
 * eliminating the need for trial and error when looking up team information.
 */

import { bootstrapCache } from '../utils/bootstrap-cache.js';
import { SearchTeamsInputSchema, SearchTeamsInput } from '../types/tool-schemas.js';
import { safeExecute } from '../utils/error-handler.js';
import { ErrorHandler } from '../utils/error-handler.js';

/**
 * Search teams tool handler
 */
export async function searchTeamsTool(args: SearchTeamsInput): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Validate input
  const validationResult = SearchTeamsInputSchema.safeParse(args);
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
    const teams = await bootstrapCache.searchTeams(query);
    
    if (teams.length === 0) {
      return {
        message: `No teams found matching "${query}". Try a different search term.`,
        results: []
      };
    }
    
    return {
      message: `Found ${teams.length} team(s) matching "${query}"`,
      results: teams
    };
  }, 'searchTeamsTool');

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
