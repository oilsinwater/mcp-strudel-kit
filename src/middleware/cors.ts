import type { Request, Response, NextFunction } from 'express';

export interface CorsOptions {
  enabled: boolean;
  origins: string[];
}

export function createCorsMiddleware(options: CorsOptions) {
  if (!options.enabled) {
    return (_req: Request, _res: Response, next: NextFunction): void => next();
  }

  const allowedOrigins = new Set(options.origins);

  return (req: Request, res: Response, next: NextFunction): void => {
    const { origin } = req.headers;

    if (!origin || allowedOrigins.size === 0 || allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin ?? '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Correlation-Id');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Expose-Headers', 'X-Correlation-Id');
    }

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  };
}
