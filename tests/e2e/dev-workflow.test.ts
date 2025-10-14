import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const packageJsonPath = path.resolve(process.cwd(), 'package.json');

describe('developer workflow configuration', () => {
  it('provides hot-reload dev server and coverage pipeline', async () => {
    const raw = await fs.readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(raw);

    expect(pkg.scripts.dev).toContain('tsx watch');
    expect(pkg.scripts.dev).toContain('--env-file=.env');
    expect(pkg.scripts['test:coverage']).toContain('--coverage');
  });

  it('wires lint-staged to enforce formatting in git hooks', async () => {
    const raw = await fs.readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(raw);

    expect(pkg['lint-staged']).toBeDefined();
    expect(pkg['lint-staged']['*.{ts,tsx}']).toContain('eslint --max-warnings=0');
  });
});
