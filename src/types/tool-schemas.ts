import { z } from 'zod';

/**
 * Zod schemas for tool input validation
 */

// Player statistics tool input
export const PlayerStatsInputSchema = z.object({
  playerId: z.number()
    .int()
    .min(1, "Player ID must be at least 1")
    .max(1000, "Player ID must not exceed 1000")
});

export type PlayerStatsInput = z.infer<typeof PlayerStatsInputSchema>;

// Gameweek fixtures tool input
export const GameweekFixturesInputSchema = z.object({
  gameweek: z.number()
    .int()
    .min(1, "Gameweek must be at least 1")
    .max(38, "Gameweek must not exceed 38")
});

export type GameweekFixturesInput = z.infer<typeof GameweekFixturesInputSchema>;

// Player comparison tool input
export const ComparePlayersInputSchema = z.object({
  playerIds: z.array(
    z.number()
      .int()
      .min(1, "Player ID must be at least 1")
      .max(1000, "Player ID must not exceed 1000")
  )
    .min(2, "At least 2 players required for comparison")
    .max(10, "Cannot compare more than 10 players at once")
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Duplicate player IDs are not allowed"
    )
});

export type ComparePlayersInput = z.infer<typeof ComparePlayersInputSchema>;

// Team information tool input
export const TeamInfoInputSchema = z.object({
  teamId: z.number()
    .int()
    .min(1, "Team ID must be at least 1")
    .max(20, "Team ID must not exceed 20")
});

export type TeamInfoInput = z.infer<typeof TeamInfoInputSchema>;

// Current gameweek tool (no input required)
export const CurrentGameweekInputSchema = z.object({});

export type CurrentGameweekInput = z.infer<typeof CurrentGameweekInputSchema>;

// Search players tool input
export const SearchPlayersInputSchema = z.object({
  query: z.string()
    .min(1, "Search query must not be empty")
    .max(100, "Search query must not exceed 100 characters")
});

export type SearchPlayersInput = z.infer<typeof SearchPlayersInputSchema>;

// Search teams tool input
export const SearchTeamsInputSchema = z.object({
  query: z.string()
    .min(1, "Search query must not be empty")
    .max(100, "Search query must not exceed 100 characters")
});

export type SearchTeamsInput = z.infer<typeof SearchTeamsInputSchema>;