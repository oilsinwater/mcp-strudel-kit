import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import type { NextFunction, Request, Response } from 'express';

export default function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) {
    return;
  }

  const base = {
    jsonrpc: '2.0',
    id: null,
  };

  if (error instanceof McpError) {
    res.status(500).json({
      ...base,
      error: {
        code: error.code,
        message: error.message,
        data: error.data,
      },
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error';

  res.status(500).json({
    ...base,
    error: {
      code: ErrorCode.InternalError,
      message,
    },
  });
}
