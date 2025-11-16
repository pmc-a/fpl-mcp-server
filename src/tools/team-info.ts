/**
 * Team information tool
 * 
 * This tool retrieves team details and current squad information
 * for a specified Premier League team.
 */

import FPL from 'fpl-fetch';
import { TeamInfo, PlayerStats } from '../types/fpl-types.js';
import { TeamInfoInputSchema, TeamInfoInput } from '../types/tool-schemas.js';
import { safeExecute } from '../utils/error-handler.js';
import { ErrorHandler, ErrorCode, FPLError } from '../utils/error-handler.js';

/**
 * Team information tool handler
 */
export async function getTeamInfoTool(args: TeamInfoInput): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Validate input
  const validationResult = TeamInfoInputSchema.safeParse(args);
  if (!validationResult.success) {
    const errorResponse = ErrorHandler.handleValidationError(
      'Invalid team ID provided',
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

  const { teamId } = validationResult.data;

  const result = await safeExecute(async (): Promise<TeamInfo> => {
    // Initialize FPL client
    const fpl = new FPL();
    
    // Get bootstrap data which includes all teams, players, and element types
    const bootstrapData = await fpl.getBootstrapData();
    
    if (!bootstrapData || !bootstrapData.teams || !bootstrapData.elements || !bootstrapData.element_types) {
      throw new Error('No team data available from FPL API');
    }

    const teams = bootstrapData.teams;
    const elements = bootstrapData.elements;
    const elementTypes = bootstrapData.element_types;
    
    // Find the team by ID
    const team = teams.find((t) => t.id === teamId);
    
    if (!team) {
      throw new FPLError(
        ErrorCode.TEAM_NOT_FOUND,
        `Team with ID ${teamId} not found.`,
        { teamId }
      );
    }
    
    // Get all players for this team
    const teamPlayers = elements.filter((player) => player.team === teamId);
    
    // Transform players to PlayerStats format
    const players: PlayerStats[] = teamPlayers.map((player) => {
      // Find the player's position
      const elementType = elementTypes.find((et) => et.id === player.element_type);
      const position = elementType ? elementType.singular_name : 'Unknown Position';
      
      return {
        id: player.id,
        name: player.web_name,
        position: position,
        team: team.name,
        totalPoints: player.total_points,
        goals: player.goals_scored,
        assists: player.assists,
        cost: player.now_cost / 10, // FPL API returns cost in tenths of millions
        ownership: parseFloat(player.selected_by_percent),
        form: player.form
      };
    });
    
    // Create team info response
    const teamInfo: TeamInfo = {
      id: team.id,
      name: team.name,
      shortName: team.short_name,
      code: team.code,
      players: players
    };
    
    return teamInfo;
  }, 'teamInfoTool');

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