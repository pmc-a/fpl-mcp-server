/**
 * Re-export types from fpl-fetch library
 */
export type {
  BootstrapData,
  Element,
  Event,
  Fixture as FPLFixture,
  Team,
  PlayerSummary,
  ManagerSummary,
  Gameweek,
  EventStatus
} from 'fpl-fetch';

/**
 * Custom types for our tool responses
 */
export interface GameweekStatus {
  current: number;
  deadline: string;
  finished: boolean;
  next?: number;
}

export interface PlayerStats {
  id: number;
  name: string;
  position: string;
  team: string;
  totalPoints: number;
  goals: number;
  assists: number;
  cost: number;
  ownership: number;
  form: string;
}

export interface Fixture {
  id: number;
  gameweek: number;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  homeScore?: number;
  awayScore?: number;
  finished: boolean;
}

export interface TeamInfo {
  id: number;
  name: string;
  shortName: string;
  code: number;
  players: PlayerStats[];
}

/**
 * Error response interface for consistent error handling
 */
export interface ErrorResponse {
  error: true;
  message: string;
  code: string;
  details?: any;
}

/**
 * Common response types
 */
export type ToolResponse<T> = T | ErrorResponse;

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;