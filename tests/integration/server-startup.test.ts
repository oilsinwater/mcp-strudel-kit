import { afterEach, describe, expect, it } from 'vitest';
import { createServer, bootstrapEnvironment } from '@/server';

describe('server bootstrap', () => {
  let originalPort: string | undefined;

  afterEach(() => {
    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }
  });

  it('starts and stops the MCP server without error', async () => {
    bootstrapEnvironment();
    originalPort = process.env.PORT;
    process.env.PORT = '0';

    const server = await createServer();

    await expect(server.start()).resolves.toBeUndefined();
    await expect(server.stop()).resolves.toBeUndefined();
  });
});
