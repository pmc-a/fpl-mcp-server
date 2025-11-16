/**
 * Gameweek fixtures tool
 * 
 * This tool retrieves all fixtures for a specific gameweek
 * including team names, kickoff times, and match results.
 */

import FPL from 'fpl-fetch';
import { Fixture } from '../types/fpl-types.js';
import { GameweekFixturesInput } from '../types/tool-schemas.js';
import { safeExecute } from '../utils/error-handler.js';

/**
 * Get gameweek fixtures tool handler
 */
export async function getGameweekFixturesTool(args: GameweekFixturesInput): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await safeExecute(async (): Promise<Fixture[]> => {
    const { gameweek } = args;
    
    // Initialize FPL client
    const fpl = new FPL();
    
    // Get bootstrap data to access team information
    const bootstrapData = await fpl.getBootstrapData();
    
    if (!bootstrapData || !bootstrapData.teams) {
      throw new Error('Unable to retrieve team data from FPL API');
    }
    
    // Create team mapping for ID to name conversion
    const teams = bootstrapData.teams;
    const teamMap = new Map<number, string>();
    teams.forEach(team => {
      teamMap.set(team.id, team.name);
    });
    
    // Get fixtures for the specified gameweek
    const fixturesData = await fpl.getFixtures();
    
    if (!fixturesData || !Array.isArray(fixturesData)) {
      throw new Error('Unable to retrieve fixtures data from FPL API');
    }
    
    // Use the typed fixtures from fpl-fetch
    const allFixtures = fixturesData;
    const gameweekFixtures = allFixtures.filter(fixture => fixture.event === gameweek);
    
    // Check if gameweek has any fixtures
    if (gameweekFixtures.length === 0) {
      // Check if gameweek is valid (1-38)
      if (gameweek < 1 || gameweek > 38) {
        throw new Error(`Invalid gameweek number: ${gameweek}. Must be between 1 and 38.`);
      }
      
      // Return empty array for valid gameweeks with no fixtures yet
      return [];
    }
    
    // Transform fixtures to match our Fixture interface
    const transformedFixtures: Fixture[] = gameweekFixtures.map(fixture => {
      const homeTeam = teamMap.get(fixture.team_h);
      const awayTeam = teamMap.get(fixture.team_a);
      
      if (!homeTeam || !awayTeam) {
        throw new Error(`Unable to find team names for fixture ${fixture.id}`);
      }
      
      return {
        id: fixture.id,
        gameweek: fixture.event,
        homeTeam,
        awayTeam,
        kickoffTime: fixture.kickoff_time || 'TBD',
        homeScore: fixture.team_h_score ?? undefined,
        awayScore: fixture.team_a_score ?? undefined,
        finished: fixture.finished
      };
    });
    
    // Sort fixtures by kickoff time for better presentation
    transformedFixtures.sort((a, b) => {
      if (a.kickoffTime === 'TBD' && b.kickoffTime === 'TBD') return 0;
      if (a.kickoffTime === 'TBD') return 1;
      if (b.kickoffTime === 'TBD') return -1;
      return new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime();
    });
    
    return transformedFixtures;
  }, 'getGameweekFixturesTool');

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