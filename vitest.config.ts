import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment configuration
    environment: 'node',

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test-utils/**'
      ]
    },

    // Test file patterns
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts',
      'src/**/*.test.ts'
    ],

    // Global setup and teardown
    globalSetup: './tests/setup/global-setup.ts',
    setupFiles: ['./tests/setup/test-setup.ts'],

    // Test timeout configuration
    testTimeout: 10000,
    hookTimeout: 10000,

    // Parallel test execution
    threads: true,
    maxThreads: 4,

    // Reporter configuration
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './test-results.json'
    },

    // Mock configuration
    clearMocks: true,
    restoreMocks: true,

    // Watch mode configuration
    watch: false,
    watchExclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**'
    ]
  },

  // Path resolution for tests
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/tools': path.resolve(__dirname, './src/tools'),
      '@/middleware': path.resolve(__dirname, './src/middleware'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/integrations': path.resolve(__dirname, './src/integrations'),
      '@/tests': path.resolve(__dirname, './tests')
    }
  },

  // Esbuild configuration for TypeScript
  esbuild: {
    target: 'node18'
  }
});