import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

/**
 * Directory names that will participate in tool discovery once story 1.3 lands.
 * Keeping the constants centralized avoids magic strings sprinkled through the
 * codebase and mirrors the architecture/source-tree.md guidance.
 */
export const TOOL_DIRECTORIES = ['tools'];

export interface RegisteredToolMetadata {
  /** Absolute path to the tool implementation file. */
  filePath: string;
  /** Tool identifier derived from filename; will be refined in later stories. */
  slug: string;
}

export interface RegistrySnapshot {
  discoveredAt: Date;
  tools: RegisteredToolMetadata[];
}

/**
 * Placeholder tool discovery that simply lists TypeScript files under src/tools.
 * Story 1.3 will expand this to dynamic imports and validation.
 */
export async function discoverTools(baseDir: string = process.cwd()): Promise<RegistrySnapshot> {
  const toolsDir = path.resolve(baseDir, 'src', 'tools');
  const entries = await fs.readdir(toolsDir, { withFileTypes: true }).catch(() => []);

  const tools: RegisteredToolMetadata[] = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => ({
      filePath: path.join(toolsDir, entry.name),
      slug: entry.name.replace(/\.ts$/, ''),
    }));

  return {
    discoveredAt: new Date(),
    tools,
  };
}
