import pino from 'pino';
import fs from 'fs';
import path from 'path';

export class PinoLogger {
  logger: pino.Logger;
  constructor() {
    // Ensure logs directory exists
    const logsDir = path.resolve(process.env.LOGS_DIR || 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create logger instance that writes to both console and file
    this.logger = pino({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: {
        targets: [
          /* transport to console */
          {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
            level: 'debug',
          },
          /* transport combined logs to file */
          {
            target: 'pino/file',
            options: {
              destination: path.join(logsDir, 'combined.log'),
              mkdir: true,
            },
            level: 'info',
          },
          /* transport error logs to file */
          {
            target: 'pino/file',
            options: {
              destination: path.join(logsDir, 'error.log'),
              mkdir: true,
            },
            level: 'error',
          },
          /* transport all logs to app.log */
          {
            target: 'pino/file',
            options: {
              destination: path.join(logsDir, 'app.log'),
              mkdir: true,
            },
            level: 'debug',
          },
        ],
      },
    });
  }

  public getLogger(): pino.Logger {
    return this.logger;
  }
}
