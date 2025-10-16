import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootstrapEnvironment, createServer } from '@/server';

let server: Awaited<ReturnType<typeof createServer>>;
let baseUrl: string;
const originalPort = process.env.PORT;

describe('MCP HTTP endpoint', () => {
  beforeAll(async () => {
    bootstrapEnvironment();
    process.env.PORT = '0';

    server = await createServer();
    await server.start();

    const addressInfo = server.httpServer.address();
    if (addressInfo && typeof addressInfo === 'object') {
      baseUrl = `http://127.0.0.1:${addressInfo.port}`;
    } else {
      throw new Error('Failed to determine listening port for test server');
    }
  });

  afterAll(async () => {
    await server.stop();

    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }
  });

  it('initializes a session and executes the echo tool', async () => {
    const correlationId = 'test-correlation-id';

    const initResponse = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'X-Correlation-Id': correlationId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'init-1',
        method: 'initialize',
        params: {
          clientInfo: {
            name: 'integration-test-client',
            version: '1.0.0',
          },
          protocolVersion: '2024-10-07',
          capabilities: {},
        },
      }),
    });

    if (initResponse.status !== 200) {
      const errorBody = await initResponse.text();
      console.error('Init request failed with status:', initResponse.status);
      console.error('Error body:', errorBody);
    }

    expect(initResponse.status).toBe(200);
    const sessionId = initResponse.headers.get('mcp-session-id');
    expect(sessionId).toBeTruthy();

    const initBody = await initResponse.json();
    expect(initBody).toHaveProperty('result.serverInfo.name', 'strudel-kit-mcp-server');

    const callResponse = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'Mcp-Session-Id': sessionId ?? '',
        'X-Correlation-Id': correlationId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'call-1',
        method: 'tools/call',
        params: {
          name: 'echo_message',
          arguments: {
            message: 'hello world',
          },
        },
      }),
    });

    expect(callResponse.status).toBe(200);
    const callBody = await callResponse.json();
    expect(callBody).toHaveProperty('result.structuredContent.message', 'hello world');
    expect(callBody).toHaveProperty('result.structuredContent.correlationId', correlationId);
  });

  it('rejects malformed JSON-RPC requests', async () => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        invalid: true,
      }),
    });

    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result.error).toBeDefined();
  });
});
