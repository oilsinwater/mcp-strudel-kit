import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const packageJsonPath = path.resolve(__dirname, '../../package.json');

describe('package.json configuration', () => {
  it('contains required scripts for development workflow', async () => {
    const raw = await fs.readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(raw);

    expect(pkg.scripts).toMatchObject({
      dev: expect.any(String),
      build: expect.any(String),
      lint: expect.any(String),
      test: expect.any(String),
      format: expect.any(String),
      prepare: expect.any(String),
    });
  });

  it('enforces Node 20 runtime via engines field', async () => {
    const raw = await fs.readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(raw);

    expect(pkg.engines).toMatchObject({
      node: expect.stringContaining('20'),
    });
  });
});
