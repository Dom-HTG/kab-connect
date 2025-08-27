import pino from 'pino';

/* transport logs to console */
export const createConsoleTransport = (): pino.TransportTargetOptions => {
  return {
    target: 'pino-pretty', // For pretty printing in development
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  };
};

/* transport combined logs to console */
export const createFileTransport = (): pino.TransportTargetOptions => {
  const logsDir = process.env.LOGS_DIR || 'logs';

  return {
    target: 'pino/file',
    level: 'info',
    options: {
      destination: `${logsDir}/combined.log`,
      mkdir: true, // Create directory if it doesn't exist
    },
  };
};

/* transport error logs to logs/error.log */
export const createErrorFileTransport = (): pino.TransportTargetOptions => {
  const logsDir = process.env.LOGS_DIR || 'logs';

  return {
    target: 'pino/file',
    level: 'error',
    options: {
      destination: `${logsDir}/error.log`,
      mkdir: true,
    },
  };
};
