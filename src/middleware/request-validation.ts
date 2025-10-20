import type { NextFunction, Request, Response } from 'express';

const MAX_REQUEST_BYTES = 1 * 1024 * 1024; // 1 MiB limit safeguards against oversized payloads

export type JsonRpcPayload = JsonRpcRequest | JsonRpcRequest[];

export interface JsonRpcRequest extends Record<string, unknown> {
  jsonrpc: '2.0';
  method: string;
  id: unknown;
}

export interface JsonRpcValidatedRequest extends Request {
  jsonRpcPayload?: JsonRpcPayload;
}

function isJsonRpcRequest(payload: unknown): payload is JsonRpcRequest {
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

function isJsonRpcBatch(payload: unknown): payload is JsonRpcRequest[] {
  return Array.isArray(payload) && payload.length > 0 && payload.every(isJsonRpcRequest);
}

function readRawBody(req: Request, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;

    const handlers = {
      cleanup(): void {
        req.off('data', handlers.onData);
        req.off('end', handlers.onEnd);
        req.off('error', handlers.onError);
        req.off('aborted', handlers.onAborted);
      },
      onError(error: Error): void {
        handlers.cleanup();
        reject(error);
      },
      onAborted(): void {
        handlers.cleanup();
        reject(new Error('Client aborted the request'));
      },
      onData(chunk: Buffer | string): void {
        const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
        total += buffer.length;

        if (total > limit) {
          handlers.cleanup();
          reject(new Error('Payload exceeds maximum allowed size'));
          return;
        }

        chunks.push(buffer);
      },
      onEnd(): void {
        handlers.cleanup();
        resolve(Buffer.concat(chunks));
      },
    };

    req.on('data', handlers.onData);
    req.on('end', handlers.onEnd);
    req.on('error', handlers.onError);
    req.on('aborted', handlers.onAborted);
  });
}

function respondJson(res: Response, status: number, code: number, message: string): void {
  res.status(status).json({
    jsonrpc: '2.0',
    error: {
      code,
      message,
    },
    id: null,
  });
}

function normalizeContentType(header: string | undefined): string {
  return header?.split(';')[0]?.trim().toLowerCase() ?? '';
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

  const contentType = normalizeContentType(req.header('content-type'));
  if (contentType !== 'application/json') {
    respondJson(res, 415, -32600, 'Content-Type must be application/json');
    return;
  }

  readRawBody(req, MAX_REQUEST_BYTES)
    .then((rawBody) => {
      if (!rawBody.length) {
        respondJson(res, 400, -32600, 'Request body is required');
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawBody.toString('utf-8'));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to parse request body';
        respondJson(res, 400, -32700, message);
        return;
      }

      if (!isJsonRpcRequest(parsed) && !isJsonRpcBatch(parsed)) {
        respondJson(res, 400, -32600, 'Invalid JSON-RPC request payload');
        return;
      }

      (req as JsonRpcValidatedRequest).jsonRpcPayload = parsed as JsonRpcPayload;
      next();
    })
    .catch((error: Error) => {
      if (error.message === 'Payload exceeds maximum allowed size') {
        respondJson(res, 413, -32000, error.message);
        return;
      }

      respondJson(res, 400, -32000, error.message);
    });
}
