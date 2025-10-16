import { describe, expect, it } from 'vitest';
import { loadConfig } from '@/core/config';

describe('configuration loader', () => {
  it('applies default values when environment variables are absent', () => {
    const config = loadConfig({});

    expect(config.server.port).toBe(3000);
    expect(config.tooling.toolExecutionTimeout).toBe(30_000);
    expect(config.logging.level).toBe('info');
    expect(config.security.corsOrigins).toEqual([]);
  });

  it('parses numeric and boolean environment overrides', () => {
    const config = loadConfig({
      PORT: '4100',
      HOT_RELOAD_ENABLED: 'true',
      RATE_LIMIT_REQUESTS: '42',
      CORS_ORIGINS: 'http://localhost:3000, https://example.com ',
    });

    expect(config.server.port).toBe(4100);
    expect(config.tooling.hotReloadEnabled).toBe(true);
    expect(config.security.rateLimitRequests).toBe(42);
    expect(config.security.corsOrigins).toEqual(['http://localhost:3000', 'https://example.com']);
  });
});
