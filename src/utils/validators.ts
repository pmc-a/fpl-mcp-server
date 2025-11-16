import { z } from 'zod';
import { ErrorResponse } from '../types/fpl-types.js';

/**
 * Validation helper functions for common input patterns
 */

/**
 * Validates input against a Zod schema and returns either the parsed data or an error response
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; error: ErrorResponse } {
  try {
    const data = schema.parse(input);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          error: true,
          message: "Invalid input parameters",
          code: "VALIDATION_ERROR",
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }
      };
    }
    
    return {
      success: false,
      error: {
        error: true,
        message: "Unexpected validation error",
        code: "VALIDATION_ERROR",
        details: error
      }
    };
  }
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  /**
   * Validates a player ID is within valid range
   */
  isValidPlayerId: (id: number): boolean => {
    return Number.isInteger(id) && id >= 1 && id <= 1000;
  },

  /**
   * Validates a gameweek number is within valid range
   */
  isValidGameweek: (gameweek: number): boolean => {
    return Number.isInteger(gameweek) && gameweek >= 1 && gameweek <= 38;
  },

  /**
   * Validates a team ID is within valid range
   */
  isValidTeamId: (id: number): boolean => {
    return Number.isInteger(id) && id >= 1 && id <= 20;
  },

  /**
   * Validates an array of player IDs
   */
  isValidPlayerIdArray: (ids: number[]): boolean => {
    if (!Array.isArray(ids) || ids.length < 2 || ids.length > 10) {
      return false;
    }
    
    // Check for duplicates
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      return false;
    }
    
    // Check each ID is valid
    return ids.every(id => ValidationPatterns.isValidPlayerId(id));
  }
};