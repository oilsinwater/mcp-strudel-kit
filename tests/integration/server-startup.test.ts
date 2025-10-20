import { afterEach, describe, expect, it } from 'vitest';
import { createServer, bootstrapEnvironment } from '@/server';

describe('server bootstrap', () => {
  let originalPort: string | undefined;
  let originalHost: string | undefined;

  afterEach(() => {
    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }

    if (originalHost === undefined) {
      delete process.env.HOST;
    } else {
      process.env.HOST = originalHost;
    }
  });

  it('starts and stops the MCP server without error', async () => {
    bootstrapEnvironment();
    originalPort = process.env.PORT;
    originalHost = process.env.HOST;
    process.env.PORT = '0';
    process.env.HOST = '0.0.0.0';

    const server = await createServer();

    try {
      await server.start();
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'EPERM') {
        console.warn(
          '[server-startup.test] Skipping test: sandbox denied network binding (EPERM).',
        );
        return;
      }
      throw error;
    }

    await expect(server.stop()).resolves.toBeUndefined();
  });
});
