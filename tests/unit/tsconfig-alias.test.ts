import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const tsconfigPath = path.resolve(__dirname, '../../tsconfig.json');

describe('tsconfig path aliases', () => {
  it('exposes @ namespace mapping to src directories', async () => {
    const raw = await fs.readFile(tsconfigPath, 'utf-8');
    const config = JSON.parse(raw);
    const paths = config.compilerOptions?.paths ?? {};

    expect(paths['@/*']).toEqual(['src/*']);
    expect(paths['@/core/*']).toEqual(['src/core/*']);
    expect(paths['@/tools/*']).toEqual(['src/tools/*']);
  });
});
