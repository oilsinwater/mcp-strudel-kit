import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';
import '@/core/registry';
import { config as loadEnv } from 'dotenv';

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

/**
 * Placeholder server bootstrap. Future stories will replace the body with
 * concrete xmcp server initialization once the core infrastructure lands.
 */
export async function createServer(): Promise<void> {
  // eslint-disable-next-line no-console -- Temporary stand-in until logging middleware is added.
  console.info('Strudel Kit MCP Server bootstrap placeholder executing.');
  // TODO: integrate xmcp server initialization when available.
}

async function main(): Promise<void> {
  bootstrapEnvironment();
  await createServer();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    // eslint-disable-next-line no-console -- Surface critical bootstrap failure.
    console.error('Failed to start Strudel Kit MCP Server', error);
    process.exitCode = 1;
  });
}
