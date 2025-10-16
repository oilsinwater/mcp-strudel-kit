import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const CORRELATION_HEADER = 'x-correlation-id';

export interface CorrelatedRequest extends Request {
  correlationId?: string;
}

function resolveCorrelationId(req: Request): string {
  const incoming = req.header(CORRELATION_HEADER);
  return incoming && incoming.trim().length > 0 ? incoming : randomUUID();
}

export function correlationIdMiddleware(
  req: CorrelatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const correlationId = resolveCorrelationId(req);
  req.correlationId = correlationId;
  res.setHeader(CORRELATION_HEADER, correlationId);

  next();
}
