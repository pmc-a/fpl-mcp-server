import { ErrorResponse } from '../types/fpl-types.js';
import { logger } from './logger.js';

/**
 * Error classification and handling utilities
 */

export enum ErrorCode {
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_PLAYER_ID = 'INVALID_PLAYER_ID',
  INVALID_GAMEWEEK = 'INVALID_GAMEWEEK',
  INVALID_TEAM_ID = 'INVALID_TEAM_ID',
  
  // API errors
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  API_TIMEOUT = 'API_TIMEOUT',
  API_RATE_LIMITED = 'API_RATE_LIMITED',
  API_INVALID_RESPONSE = 'API_INVALID_RESPONSE',
  
  // Data errors
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  TEAM_NOT_FOUND = 'TEAM_NOT_FOUND',
  GAMEWEEK_NOT_FOUND = 'GAMEWEEK_NOT_FOUND',
  NO_DATA_AVAILABLE = 'NO_DATA_AVAILABLE',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export class FPLError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'FPLError';
  }
}

/**
 * Centralized error handling with consistent error response format
 */
export class ErrorHandler {
  /**
   * Creates a standardized error response
   */
  static createErrorResponse(
    code: ErrorCode,
    message: string,
    details?: any
  ): ErrorResponse {
    return {
      error: true,
      message,
      code,
      details
    };
  }

  /**
   * Handles validation errors
   */
  static handleValidationError(message: string, details?: any): ErrorResponse {
    return this.createErrorResponse(ErrorCode.VALIDATION_ERROR, message, details);
  }

  /**
   * Handles API-related errors
   */
  static handleApiError(error: any): ErrorResponse {
    if (error?.response?.status === 429) {
      return this.createErrorResponse(
        ErrorCode.API_RATE_LIMITED,
        'FPL API rate limit exceeded. Please try again later.',
        { status: error.response.status }
      );
    }

    if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
      return this.createErrorResponse(
        ErrorCode.NETWORK_ERROR,
        'Unable to connect to FPL API. Please check your internet connection.',
        { code: error.code }
      );
    }

    if (error?.code === 'ETIMEDOUT') {
      return this.createErrorResponse(
        ErrorCode.API_TIMEOUT,
        'FPL API request timed out. Please try again.',
        { code: error.code }
      );
    }

    if (error?.response?.status >= 500) {
      return this.createErrorResponse(
        ErrorCode.API_UNAVAILABLE,
        'FPL API is currently unavailable. Please try again later.',
        { status: error.response.status }
      );
    }

    return this.createErrorResponse(
      ErrorCode.API_INVALID_RESPONSE,
      'Received invalid response from FPL API.',
      { error: error.message }
    );
  }

  /**
   * Handles data-related errors
   */
  static handleDataError(code: ErrorCode, message: string, details?: any): ErrorResponse {
    return this.createErrorResponse(code, message, details);
  }

  /**
   * Handles player-specific errors
   */
  static handlePlayerError(playerId: number): ErrorResponse {
    return this.createErrorResponse(
      ErrorCode.PLAYER_NOT_FOUND,
      `Player with ID ${playerId} not found.`,
      { playerId }
    );
  }

  /**
   * Handles team-specific errors
   */
  static handleTeamError(teamId: number): ErrorResponse {
    return this.createErrorResponse(
      ErrorCode.TEAM_NOT_FOUND,
      `Team with ID ${teamId} not found.`,
      { teamId }
    );
  }

  /**
   * Handles gameweek-specific errors
   */
  static handleGameweekError(gameweek: number): ErrorResponse {
    return this.createErrorResponse(
      ErrorCode.GAMEWEEK_NOT_FOUND,
      `Gameweek ${gameweek} not found or no data available.`,
      { gameweek }
    );
  }

  /**
   * Handles unexpected errors
   */
  static handleUnexpectedError(error: any): ErrorResponse {
    logger.error('Unexpected error', { error });
    
    return this.createErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred. Please try again.',
      process.env.NODE_ENV === 'development' ? { error: error.message, stack: error.stack } : undefined
    );
  }

  /**
   * Determines if an error is retryable
   */
  static isRetryableError(error: ErrorResponse): boolean {
    const retryableCodes = [
      ErrorCode.API_TIMEOUT,
      ErrorCode.NETWORK_ERROR,
      ErrorCode.API_UNAVAILABLE
    ];
    
    return retryableCodes.includes(error.code as ErrorCode);
  }
}

/**
 * Utility function to safely execute async operations with error handling
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  errorContext?: string
): Promise<T | ErrorResponse> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof FPLError) {
      return ErrorHandler.createErrorResponse(error.code, error.message, error.details);
    }
    
    logger.error(`Error in ${errorContext || 'operation'}`, { error });
    return ErrorHandler.handleUnexpectedError(error);
  }
}