/**
 * Current gameweek status tool
 * 
 * This tool retrieves the current gameweek information including
 * gameweek number, deadline, and completion status.
 */

import FPL from 'fpl-fetch';
import { GameweekStatus } from '../types/fpl-types.js';
import { safeExecute } from '../utils/error-handler.js';


/**
 * Get current gameweek status tool handler
 */
export async function getCurrentGameweekTool(_args: Record<string, never>): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await safeExecute(async (): Promise<GameweekStatus> => {
    // Initialize FPL client
    const fpl = new FPL();
    
    // Get bootstrap data which includes gameweek events
    const bootstrapData = await fpl.getBootstrapData();
    
    if (!bootstrapData || !bootstrapData.events || bootstrapData.events.length === 0) {
      throw new Error('No gameweek data available from FPL API');
    }
    
    const events = bootstrapData.events;
    
    // Find the current gameweek
    const currentGameweek = events.find((event) => event.is_current);
    
    if (!currentGameweek) {
      // If no current gameweek, find the next one
      const nextGameweek = events.find((event) => event.is_next);
      
      if (!nextGameweek) {
        throw new Error('Unable to determine current or next gameweek');
      }
      
      // Return next gameweek as current if no current is active
      return {
        current: nextGameweek.id,
        deadline: nextGameweek.deadline_time,
        finished: false,
        next: undefined
      };
    }
    
    // Find the next gameweek
    const nextGameweek = events.find((event) => event.is_next);
    
    // Transform the API response to match our GameweekStatus interface
    const gameweekStatus: GameweekStatus = {
      current: currentGameweek.id,
      deadline: currentGameweek.deadline_time,
      finished: currentGameweek.finished,
      next: nextGameweek ? nextGameweek.id : undefined
    };
    
    return gameweekStatus;
  }, 'getCurrentGameweekTool');

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