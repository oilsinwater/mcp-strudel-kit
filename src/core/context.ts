import { randomUUID } from 'node:crypto';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type { ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types.js';

export interface ToolExecutionContext {
  correlationId: string;
  requestId: string;
  startedAt: Date;
  signal: AbortSignal;
}

type RequestHeaders = Record<string, string | string[] | undefined>;

function extractCorrelationId(headers: RequestHeaders): string | undefined {
  const header = headers['x-correlation-id'] ?? headers['X-Correlation-Id'];

  if (Array.isArray(header)) {
    return header[0];
  }

  return header;
}

export function createExecutionContext(
  extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
): ToolExecutionContext {
  const headers = extra.requestInfo?.headers ?? {};
  const correlationId = extractCorrelationId(headers) ?? randomUUID();

  return {
    correlationId,
    requestId: String(extra.requestId),
    startedAt: new Date(),
    signal: extra.signal,
  };
}
