import type { Request, Response, NextFunction } from 'express';

function isJsonRpcRequest(payload: unknown): payload is Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const data = payload as Record<string, unknown>;
  return (
    data.jsonrpc === '2.0' &&
    typeof data.method === 'string' &&
    Object.prototype.hasOwnProperty.call(data, 'id')
  );
}

export default function requestValidationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.method !== 'POST') {
    next();
    return;
  }

  if (!req.is('application/json')) {
    res.status(415).json({
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'Content-Type must be application/json',
      },
      id: null,
    });
    return;
  }

  try {
    const body = req.body?.length ? JSON.parse(req.body.toString('utf-8')) : undefined;
    if (!body || !isJsonRpcRequest(body)) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: 'Invalid JSON-RPC request payload',
        },
        id: null,
      });
      return;
    }

    // Store the parsed payload for downstream handlers.
    (req as Request & { jsonRpcPayload?: Record<string, unknown> }).jsonRpcPayload = body;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse JSON body';
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message,
      },
      id: null,
    });
  }
}
