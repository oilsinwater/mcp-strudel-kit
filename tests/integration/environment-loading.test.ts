import { promises as fs } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { bootstrapEnvironment } from '@/server';

const envPath = path.resolve(process.cwd(), '.env');

describe('environment bootstrap', () => {
  let originalHotReload: string | undefined;

  beforeEach(async () => {
    originalHotReload = process.env.HOT_RELOAD_ENABLED;

    const envContents = await fs.readFile(envPath, 'utf-8');
    if (!envContents.includes('HOT_RELOAD_ENABLED=')) {
      throw new Error('Expected HOT_RELOAD_ENABLED entry in .env for bootstrap validation');
    }

    delete process.env.HOT_RELOAD_ENABLED;
  });

  it('loads settings from .env into process.env', () => {
    bootstrapEnvironment();
    expect(process.env.HOT_RELOAD_ENABLED).toBeDefined();
    expect(process.env.HOT_RELOAD_ENABLED).toBe('true');
  });

  afterEach(() => {
    if (originalHotReload === undefined) {
      delete process.env.HOT_RELOAD_ENABLED;
      return;
    }
    process.env.HOT_RELOAD_ENABLED = originalHotReload;
  });
});
