import { describe, expect, it } from 'vitest';
import { createServer, bootstrapEnvironment } from '@/server';

describe('server bootstrap', () => {
  it('loads environment and completes placeholder startup without error', async () => {
    bootstrapEnvironment();

    await expect(createServer()).resolves.toBeUndefined();
  });
});
