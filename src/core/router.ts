import type { Express, NextFunction, Request, Response } from 'express';
import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import requestValidationMiddleware, {
  type JsonRpcPayload,
  type JsonRpcValidatedRequest,
} from '@/middleware/request-validation.js';

const MCP_ROUTE = '/mcp';

function forwardRequest(
  transport: StreamableHTTPServerTransport,
  req: Request,
  res: Response,
  next: NextFunction,
  parsedBody?: JsonRpcPayload,
): void {
  transport.handleRequest(req, res, parsedBody).catch(next);
}

export default function registerMcpRoutes(
  app: Express,
  transport: StreamableHTTPServerTransport,
): void {
  app.post(
    MCP_ROUTE,
    requestValidationMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      const parsedBody = (req as JsonRpcValidatedRequest).jsonRpcPayload;
      forwardRequest(transport, req, res, next, parsedBody);
    },
  );

  app.get(MCP_ROUTE, (req: Request, res: Response, next: NextFunction) =>
    forwardRequest(transport, req, res, next),
  );

  app.delete(MCP_ROUTE, (req: Request, res: Response, next: NextFunction) =>
    forwardRequest(transport, req, res, next),
  );
}
