/**
 * Player statistics tool
 * 
 * This tool retrieves comprehensive statistics for a specific player
 * including points, goals, assists, cost, and ownership data.
 */

import FPL from 'fpl-fetch';
import { PlayerStats } from '../types/fpl-types.js';
import { PlayerStatsInputSchema, PlayerStatsInput } from '../types/tool-schemas.js';
import { safeExecute } from '../utils/error-handler.js';
import { ErrorHandler, ErrorCode, FPLError } from '../utils/error-handler.js';

/**
 * Get player statistics tool handler
 */
export async function getPlayerStatsTool(args: PlayerStatsInput): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Validate input
  const validationResult = PlayerStatsInputSchema.safeParse(args);
  if (!validationResult.success) {
    const errorResponse = ErrorHandler.handleValidationError(
      'Invalid player ID provided',
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

  const { playerId } = validationResult.data;

  const result = await safeExecute(async (): Promise<PlayerStats> => {
    // Initialize FPL client
    const fpl = new FPL();
    
    // Get bootstrap data which includes all players, teams, and element types
    const bootstrapData = await fpl.getBootstrapData();
    
    if (!bootstrapData || !bootstrapData.elements || !bootstrapData.teams || !bootstrapData.element_types) {
      throw new Error('No player data available from FPL API');
    }

    const elements = bootstrapData.elements;
    const teams = bootstrapData.teams;
    const elementTypes = bootstrapData.element_types;
    
    // Find the player by ID
    const player = elements.find((element) => element.id === playerId);
    
    if (!player) {
      throw new FPLError(
        ErrorCode.PLAYER_NOT_FOUND,
        `Player with ID ${playerId} not found.`,
        { playerId }
      );
    }
    
    // Find the player's team
    const team = teams.find((t) => t.id === player.team);
    const teamName = team ? team.name : 'Unknown Team';
    
    // Find the player's position
    const elementType = elementTypes.find((et) => et.id === player.element_type);
    const position = elementType ? elementType.singular_name : 'Unknown Position';
    
    // Transform the API response to match our PlayerStats interface
    const playerStats: PlayerStats = {
      id: player.id,
      name: player.web_name,
      position: position,
      team: teamName,
      totalPoints: player.total_points,
      goals: player.goals_scored,
      assists: player.assists,
      cost: player.now_cost / 10, // FPL API returns cost in tenths of millions
      ownership: parseFloat(player.selected_by_percent),
      form: player.form
    };
    
    return playerStats;
  }, 'getPlayerStatsTool');

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