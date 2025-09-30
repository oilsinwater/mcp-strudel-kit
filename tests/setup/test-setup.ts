/**
 * Test setup file - runs before each test file
 * Configures test environment and provides common test utilities
 */

import { randomUUID } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, vi } from 'vitest';

// Global test configuration
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  vi.restoreAllMocks();

  // Set consistent test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';

  // Mock console methods to reduce test noise
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});

  // Keep error and debug for debugging purposes
  // console.error and console.debug remain unmocked
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
});

// Export common test utilities
type JsonRpcId = string | number | null;

export interface MockMcpRequest<TParams = Record<string, unknown>> {
  jsonrpc: '2.0';
  method: string;
  params: TParams;
  id: JsonRpcId;
}

export interface MockMcpSuccessResponse<TResult = unknown> {
  jsonrpc: '2.0';
  result: TResult;
  id: JsonRpcId;
}

export interface MockMcpErrorResponse<TData = unknown> {
  jsonrpc: '2.0';
  error: {
    code: number;
    message: string;
    data?: TData;
  };
  id: JsonRpcId;
}

export const testUtils = {
  /**
   * Create a temporary directory for test files
   */
  async createTempDir(testName: string): Promise<string> {
    const tempDir = path.join(process.env.TEST_TEMP_DIR || 'temp/test', testName);
    await mkdir(tempDir, { recursive: true });
    return tempDir;
  },

  /**
   * Clean up temporary directory
   */
  async cleanupTempDir(dirPath: string): Promise<void> {
    try {
      await rm(dirPath, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors in tests
    }
  },

  /**
   * Create a mock MCP request
   */
  createMockMCPRequest<TParams = Record<string, unknown>>(
    method: string,
    params: TParams = {} as TParams,
    id: JsonRpcId = 'test-1',
  ): MockMcpRequest<TParams> {
    return {
      jsonrpc: '2.0' as const,
      method,
      params,
      id,
    };
  },

  /**
   * Create expected MCP response format
   */
  createExpectedMCPResponse<TResult = unknown>(
    result: TResult,
    id: JsonRpcId = 'test-1',
  ): MockMcpSuccessResponse<TResult> {
    return {
      jsonrpc: '2.0' as const,
      result,
      id,
    };
  },

  /**
   * Create expected MCP error response
   */
  createExpectedMCPError<TData = unknown>(
    code: number,
    message: string,
    id: JsonRpcId = 'test-1',
    data?: TData,
  ): MockMcpErrorResponse<TData> {
    return {
      jsonrpc: '2.0' as const,
      error: {
        code,
        message,
        ...(data !== undefined ? { data } : {}),
      },
      id,
    };
  },

  /**
   * Wait for a specified amount of time (for async operations)
   */
  async wait(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  },

  /**
   * Generate random test data
   */
  generateTestId(): string {
    return randomUUID();
  },
};

// Make test utilities available globally
type GlobalWithTestUtils = typeof globalThis & { testUtils: typeof testUtils };

(globalThis as GlobalWithTestUtils).testUtils = testUtils;
