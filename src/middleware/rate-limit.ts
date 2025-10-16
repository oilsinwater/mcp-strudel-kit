import type { Request, Response, NextFunction } from 'express';

interface RateLimitState {
  hits: number;
  resetAt: number;
}

export default function createRateLimitMiddleware(maxRequests: number, windowMs: number) {
  const limits = new Map<string, RateLimitState>();

  function isWindowExpired(state: RateLimitState): boolean {
    return Date.now() > state.resetAt;
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const state = limits.get(key);

    if (!state || isWindowExpired(state)) {
      limits.set(key, { hits: 1, resetAt: now + windowMs });
      next();
      return;
    }

    state.hits += 1;

    res.setHeader('x-rate-limit-limit', String(maxRequests));
    res.setHeader('x-rate-limit-remaining', String(Math.max(0, maxRequests - state.hits)));
    res.setHeader('x-rate-limit-reset', String(state.resetAt));

    if (state.hits > maxRequests) {
      res.status(429).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Rate limit exceeded',
        },
        id: null,
      });
      return;
    }

    next();
  };
}
