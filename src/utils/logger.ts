import winston from 'winston';

/**
 * Winston logger configuration for MCP server
 * Logs to stderr to avoid interfering with stdio transport
 */

const logLevel = process.env.LOG_LEVEL || 'info';
const nodeEnv = process.env.NODE_ENV || 'development';

// Custom format for better readability
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    // Add stack trace if present
    if (stack) {
      msg += `\n${stack}`;
    }
    
    return msg;
  })
);

// Create the logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  transports: [
    // Write all logs to stderr
    new winston.transports.Stream({
      stream: process.stderr,
    }),
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Add colorization in development mode
if (nodeEnv === 'development') {
  logger.format = winston.format.combine(
    winston.format.colorize(),
    customFormat
  );
}

export default logger;
