/**
 * Player comparison tool
 * 
 * This tool retrieves and compares statistics for multiple players,
 * returning comparative data in a structured format for analysis.
 */

import FPL from 'fpl-fetch';
import { PlayerStats } from '../types/fpl-types.js';
import { ComparePlayersInputSchema, ComparePlayersInput } from '../types/tool-schemas.js';
import { safeExecute } from '../utils/error-handler.js';
import { ErrorHandler, ErrorCode, FPLError } from '../utils/error-handler.js';

/**
 * Interface for player comparison result
 */
interface PlayerComparison {
  validPlayers: PlayerStats[];
  invalidPlayerIds: number[];
  comparison: {
    totalPlayers: number;
    validPlayers: number;
    invalidPlayers: number;
  };
}

/**
 * Compare players tool handler
 */
export async function comparePlayersTool(args: ComparePlayersInput): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Validate input
  const validationResult = ComparePlayersInputSchema.safeParse(args);
  if (!validationResult.success) {
    const errorResponse = ErrorHandler.handleValidationError(
      'Invalid player IDs provided for comparison',
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

  const { playerIds } = validationResult.data;

  const result = await safeExecute(async (): Promise<PlayerComparison> => {
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
    
    const validPlayers: PlayerStats[] = [];
    const invalidPlayerIds: number[] = [];
    
    // Process each player ID
    for (const playerId of playerIds) {
      // Find the player by ID
      const player = elements.find((element) => element.id === playerId);
      
      if (!player) {
        invalidPlayerIds.push(playerId);
        continue;
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
      
      validPlayers.push(playerStats);
    }
    
    // If no valid players found, throw an error
    if (validPlayers.length === 0) {
      throw new FPLError(
        ErrorCode.PLAYER_NOT_FOUND,
        'None of the provided player IDs were found.',
        { invalidPlayerIds }
      );
    }
    
    return {
      validPlayers,
      invalidPlayerIds,
      comparison: {
        totalPlayers: playerIds.length,
        validPlayers: validPlayers.length,
        invalidPlayers: invalidPlayerIds.length
      }
    };
  }, 'comparePlayersTool');

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