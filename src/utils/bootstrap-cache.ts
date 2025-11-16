/**
 * Bootstrap data cache and lookup utilities
 * 
 * This module provides cached access to FPL bootstrap data and helper functions
 * to search for players and teams by name, avoiding the need for LLMs to guess IDs.
 */

import FPL from 'fpl-fetch';
import { ErrorCode, FPLError } from './error-handler.js';

interface BootstrapData {
  elements: any[];
  teams: any[];
  element_types: any[];
  events: any[];
}

interface PlayerSearchResult {
  id: number;
  name: string;
  fullName: string;
  team: string;
  teamId: number;
  position: string;
  cost: number;
}

interface TeamSearchResult {
  id: number;
  name: string;
  shortName: string;
  code: number;
}

class BootstrapCache {
  private cache: BootstrapData | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

  /**
   * Get bootstrap data, using cache if available and fresh
   */
  async getBootstrapData(): Promise<BootstrapData> {
    const now = Date.now();
    
    if (this.cache && (now - this.lastFetch) < this.CACHE_TTL) {
      return this.cache;
    }

    const fpl = new FPL();
    const data = await fpl.getBootstrapData();
    
    if (!data || !data.elements || !data.teams || !data.element_types) {
      throw new FPLError(
        ErrorCode.NO_DATA_AVAILABLE,
        'Failed to fetch bootstrap data from FPL API',
        {}
      );
    }

    this.cache = data;
    this.lastFetch = now;
    
    return data;
  }

  /**
   * Search for players by name (fuzzy matching)
   */
  async searchPlayers(query: string): Promise<PlayerSearchResult[]> {
    const data = await this.getBootstrapData();
    const normalizedQuery = query.toLowerCase().trim();
    
    const matches = data.elements
      .filter((player) => {
        const webName = player.web_name.toLowerCase();
        const firstName = player.first_name.toLowerCase();
        const secondName = player.second_name.toLowerCase();
        const fullName = `${firstName} ${secondName}`;
        
        return (
          webName.includes(normalizedQuery) ||
          fullName.includes(normalizedQuery) ||
          firstName.includes(normalizedQuery) ||
          secondName.includes(normalizedQuery)
        );
      })
      .map((player) => {
        const team = data.teams.find((t) => t.id === player.team);
        const position = data.element_types.find((et) => et.id === player.element_type);
        
        return {
          id: player.id,
          name: player.web_name,
          fullName: `${player.first_name} ${player.second_name}`,
          team: team?.name || 'Unknown',
          teamId: player.team,
          position: position?.singular_name || 'Unknown',
          cost: player.now_cost / 10,
        };
      })
      .slice(0, 10); // Limit to top 10 results
    
    return matches;
  }

  /**
   * Get player by exact ID
   */
  async getPlayerById(playerId: number): Promise<PlayerSearchResult | null> {
    const data = await this.getBootstrapData();
    const player = data.elements.find((p) => p.id === playerId);
    
    if (!player) {
      return null;
    }
    
    const team = data.teams.find((t) => t.id === player.team);
    const position = data.element_types.find((et) => et.id === player.element_type);
    
    return {
      id: player.id,
      name: player.web_name,
      fullName: `${player.first_name} ${player.second_name}`,
      team: team?.name || 'Unknown',
      teamId: player.team,
      position: position?.singular_name || 'Unknown',
      cost: player.now_cost / 10,
    };
  }

  /**
   * Search for teams by name (fuzzy matching)
   */
  async searchTeams(query: string): Promise<TeamSearchResult[]> {
    const data = await this.getBootstrapData();
    const normalizedQuery = query.toLowerCase().trim();
    
    const matches = data.teams
      .filter((team) => {
        const name = team.name.toLowerCase();
        const shortName = team.short_name.toLowerCase();
        
        return name.includes(normalizedQuery) || shortName.includes(normalizedQuery);
      })
      .map((team) => ({
        id: team.id,
        name: team.name,
        shortName: team.short_name,
        code: team.code,
      }));
    
    return matches;
  }

  /**
   * Get team by exact ID
   */
  async getTeamById(teamId: number): Promise<TeamSearchResult | null> {
    const data = await this.getBootstrapData();
    const team = data.teams.find((t) => t.id === teamId);
    
    if (!team) {
      return null;
    }
    
    return {
      id: team.id,
      name: team.name,
      shortName: team.short_name,
      code: team.code,
    };
  }

  /**
   * Clear the cache (useful for testing or forcing refresh)
   */
  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }
}

// Export singleton instance
export const bootstrapCache = new BootstrapCache();
