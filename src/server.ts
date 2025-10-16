import http from 'node:http';
import type { Socket } from 'node:net';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import express from 'express';
import type { Express } from 'express';
import { config as loadEnv } from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { AppConfig } from '@/core/config.js';
import { loadConfig } from '@/core/config.js';
import { ToolExecutor, ToolRegistry } from '@/core/tool-registry.js';
import coreTools from '@/tools/core-tools.js';
import { createLoggingMiddleware } from '@/middleware/logging.js';
import { correlationIdMiddleware } from '@/middleware/correlation.js';

import createRateLimitMiddleware from '@/middleware/rate-limit.js';
import { createCorsMiddleware } from '@/middleware/cors.js';
import errorHandler from '@/middleware/error-handler.js';

export interface RunningServer {
  app: Express;
  httpServer: http.Server;
  config: AppConfig;
  mcpServer: McpServer;
  transport: StreamableHTTPServerTransport;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * Bootstraps process-wide environment configuration for the MCP server.
 * This keeps side effects centralized so future stories can extend the
 * bootstrap pipeline without scattering dotenv calls.
 */
export function bootstrapEnvironment(): void {
  const rootDir = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(rootDir, '..', '.env');
  loadEnv({ path: envPath, override: false });
}

function createExpressApp(config: AppConfig) {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    createCorsMiddleware({
      enabled: config.security.corsEnabled,
      origins: config.security.corsOrigins,
    }),
  );
  app.use(correlationIdMiddleware);
  app.use(
    createLoggingMiddleware({
      level: config.logging.level,
      logRequests: config.logging.logRequests,
    }),
  );
  app.use(
    createRateLimitMiddleware(config.security.rateLimitRequests, config.security.rateLimitWindowMs),
  );
  // Note: We do NOT use express.raw() or any body parser for /mcp routes
  // The MCP transport reads the request body directly from the HTTP stream

  return app;
}

async function configureMcpServer(config: AppConfig): Promise<{
  mcpServer: McpServer;
  transport: StreamableHTTPServerTransport;
}> {
  const mcpServer = new McpServer({
    name: 'strudel-kit-mcp-server',
    version: '0.1.0',
  });

  const executor = new ToolExecutor({
    maxConcurrent: config.tooling.maxConcurrentTools,
    timeoutMs: config.tooling.toolExecutionTimeout,
  });

  const registry = new ToolRegistry(mcpServer, executor);
  coreTools().forEach((tool) => registry.register(tool));

  const transport = new StreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: () => randomUUID(),
  });

  // Do not call transport.start() - it will be called by mcpServer.connect()
  await mcpServer.connect(transport);

  return { mcpServer, transport };
}

export async function createServer(): Promise<RunningServer> {
  const config = loadConfig();
  const app = createExpressApp(config);
  const { mcpServer, transport } = await configureMcpServer(config);

  app.post('/mcp', (req, res, next) => {
    // Pass undefined so the transport reads the body from the request stream
    transport.handleRequest(req, res, undefined).catch(next);
  });

  app.get('/mcp', (req, res, next) => {
    transport.handleRequest(req, res).catch(next);
  });

  app.delete('/mcp', (req, res, next) => {
    transport.handleRequest(req, res).catch(next);
  });

  app.use(errorHandler);

  const httpServer = http.createServer(app);
  const activeSockets = new Set<Socket>();

  httpServer.on('connection', (socket) => {
    activeSockets.add(socket);
    socket.on('close', () => activeSockets.delete(socket));
  });

  const start = () =>
    new Promise<void>((resolve, reject) => {
      httpServer.once('error', reject);
      httpServer.listen(config.server.port, config.server.host, () => {
        httpServer.off('error', reject);
        // eslint-disable-next-line no-console -- Server lifecycle logging.
        console.info(`MCP server listening on http://${config.server.host}:${config.server.port}`);
        resolve();
      });
    });

  const stop = async () => {
    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });

      // Forcefully terminate connections that refuse to close within the timeout budget.
      setTimeout(() => {
        activeSockets.forEach((socket) => socket.destroy());
      }, config.tooling.toolExecutionTimeout).unref();
    });

    await mcpServer.close();
  };

  return {
    app,
    httpServer,
    config,
    mcpServer,
    transport,
    start,
    stop,
  };
}

async function main(): Promise<void> {
  bootstrapEnvironment();
  const server = await createServer();
  await server.start();

  const shutdown = async (signal: NodeJS.Signals) => {
    // eslint-disable-next-line no-console -- Server lifecycle logging.
    console.info(`Received ${signal}, initiating graceful shutdown.`);
    await server.stop();
    // eslint-disable-next-line no-console -- Server lifecycle logging.
    console.info('Shutdown complete.');
    process.exit(0);
  };

  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.once(signal, () => {
      shutdown(signal as NodeJS.Signals).catch((error) => {
        // eslint-disable-next-line no-console -- Surface critical shutdown failure.
        console.error('Failed to shut down cleanly', error);
        process.exit(1);
      });
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    // eslint-disable-next-line no-console -- Surface critical bootstrap failure.
    console.error('Failed to start Strudel Kit MCP Server', error);
    process.exitCode = 1;
  });
}
