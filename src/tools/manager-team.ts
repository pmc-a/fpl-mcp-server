/**
 * Manager team tool
 * 
 * This tool retrieves a manager's team selection for a specific gameweek,
 * including starting XI, bench, captain choices, formation, and points.
 */

import FPL from 'fpl-fetch';
import { ManagerTeam, ManagerTeamPlayer } from '../types/fpl-types.js';
import { ManagerTeamInputSchema, ManagerTeamInput } from '../types/tool-schemas.js';
import { safeExecute, ErrorHandler, ErrorCode } from '../utils/error-handler.js';
import { bootstrapCache } from '../utils/bootstrap-cache.js';
import { logger } from '../utils/logger.js';

/**
 * Manager team tool handler
 */
export async function getManagerTeamTool(args: ManagerTeamInput): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Validate input
  const validationResult = ManagerTeamInputSchema.safeParse(args);
  if (!validationResult.success) {
    const errorResponse = ErrorHandler.handleValidationError(
      'Invalid manager team request',
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

  const { managerId, gameweek } = validationResult.data;

  const result = await safeExecute(async () => {
    const fpl = new FPL();
    
    // Get manager summary to verify manager exists and get current gameweek if not specified
    const managerSummary = await fpl.getManager(managerId);
    
    if (!managerSummary) {
      return ErrorHandler.createErrorResponse(
        ErrorCode.PLAYER_NOT_FOUND,
        `Manager with ID ${managerId} not found.`,
        { managerId }
      );
    }

    // Use current gameweek if not specified
    const targetGameweek = gameweek || managerSummary.current_event;
    
    // Get manager's picks for the specified gameweek
    const picks = await fpl.getManagerGameweekPicks(managerId, targetGameweek);
    
    if (!picks || !picks.picks || picks.picks.length === 0) {
      return ErrorHandler.createErrorResponse(
        ErrorCode.NO_DATA_AVAILABLE,
        `No team data available for manager ${managerId} in gameweek ${targetGameweek}.`,
        { managerId, gameweek: targetGameweek }
      );
    }

    // Get bootstrap data to enrich player information
    const bootstrapData = await bootstrapCache.getBootstrapData();
    
    // Build player details
    const playerDetails: ManagerTeamPlayer[] = picks.picks.map((pick) => {
      const player = bootstrapData.elements.find((p) => p.id === pick.element);
      const team = bootstrapData.teams.find((t) => t.id === player?.team);
      const position = bootstrapData.element_types.find((et) => et.id === pick.element_type);
      
      return {
        id: pick.element,
        name: player?.web_name || 'Unknown',
        position: position?.singular_name || 'Unknown',
        team: team?.short_name || 'Unknown',
        cost: player ? player.now_cost / 10 : 0,
        isCaptain: pick.is_captain,
        isViceCaptain: pick.is_vice_captain,
        multiplier: pick.multiplier,
        positionInTeam: pick.position,
      };
    });

    // Separate starting XI and bench (positions 1-11 are starting, 12-15 are bench)
    const startingXI = playerDetails.filter((p) => p.positionInTeam <= 11);
    const bench = playerDetails.filter((p) => p.positionInTeam > 11);
    
    // Find captain and vice captain
    const captain = playerDetails.find((p) => p.isCaptain);
    const viceCaptain = playerDetails.find((p) => p.isViceCaptain);
    
    if (!captain || !viceCaptain) {
      logger.warn('Captain or vice captain not found in picks', { managerId, gameweek: targetGameweek });
    }

    // Calculate formation (count defenders, midfielders, forwards in starting XI)
    const formation = calculateFormation(startingXI);

    const managerTeam: ManagerTeam = {
      managerId,
      managerName: managerSummary.name,
      gameweek: targetGameweek,
      points: picks.entry_history.points,
      totalPoints: picks.entry_history.total_points,
      overallRank: picks.entry_history.overall_rank,
      gameweekRank: picks.entry_history.rank,
      teamValue: picks.entry_history.value / 10,
      bank: picks.entry_history.bank / 10,
      activeChip: picks.active_chip,
      startingXI,
      bench,
      captain: captain!,
      viceCaptain: viceCaptain!,
      formation,
    };

    return managerTeam;
  }, 'getManagerTeamTool');

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

/**
 * Calculate formation from starting XI
 */
function calculateFormation(startingXI: ManagerTeamPlayer[]): string {
  const positionCounts = {
    Goalkeeper: 0,
    Defender: 0,
    Midfielder: 0,
    Forward: 0,
  };

  startingXI.forEach((player) => {
    if (player.position in positionCounts) {
      positionCounts[player.position as keyof typeof positionCounts]++;
    }
  });

  // Return formation as DEF-MID-FWD (excluding goalkeeper)
  return `${positionCounts.Defender}-${positionCounts.Midfielder}-${positionCounts.Forward}`;
}
