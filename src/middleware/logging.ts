import type { Request, Response, NextFunction } from 'express';
import type { LogLevel } from '@/core/config.js';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface LoggingMiddlewareOptions {
  level: LogLevel;
  logRequests: boolean;
}

function shouldLog(level: LogLevel, target: LogLevel): boolean {
  return LEVEL_PRIORITY[target] >= LEVEL_PRIORITY[level];
}

export function createLoggingMiddleware(options: LoggingMiddlewareOptions) {
  const { level, logRequests } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const start = process.hrtime.bigint();

    if (!logRequests) {
      next();
      return;
    }

    const { method, originalUrl } = req;
    const { correlationId } = req as { correlationId?: string };
    const meta = correlationId ? `[${correlationId}]` : '';

    if (shouldLog('debug', level)) {
      // eslint-disable-next-line no-console -- Intentional server logging.
      console.debug(`${meta} ${method} ${originalUrl} started`);
    }

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      const message = `${meta} ${method} ${originalUrl} -> ${res.statusCode} (${durationMs.toFixed(
        2,
      )}ms)`;

      if (res.statusCode >= 500 && shouldLog('error', level)) {
        // eslint-disable-next-line no-console -- Intentional server logging.
        console.error(message);
        return;
      }

      if (res.statusCode >= 400 && shouldLog('warn', level)) {
        // eslint-disable-next-line no-console -- Intentional server logging.
        console.warn(message);
        return;
      }

      if (shouldLog('info', level)) {
        // eslint-disable-next-line no-console -- Intentional server logging.
        console.info(message);
      }
    });

    next();
  };
}
