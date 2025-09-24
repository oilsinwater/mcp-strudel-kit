/**
 * Test setup file - runs before each test file
 * Configures test environment and provides common test utilities
 */

import { beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

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
export const testUtils = {
  /**
   * Create a temporary directory for test files
   */
  async createTempDir(testName: string): Promise<string> {
    const tempDir = path.join(process.env.TEST_TEMP_DIR || 'temp/test', testName);
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  },

  /**
   * Clean up temporary directory
   */
  async cleanupTempDir(dirPath: string): Promise<void> {
    try {
      await fs.rmdir(dirPath, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  },

  /**
   * Create a mock MCP request
   */
  createMockMCPRequest(method: string, params: any = {}, id: string = 'test-1') {
    return {
      jsonrpc: '2.0' as const,
      method,
      params,
      id
    };
  },

  /**
   * Create expected MCP response format
   */
  createExpectedMCPResponse(result: any, id: string = 'test-1') {
    return {
      jsonrpc: '2.0' as const,
      result,
      id
    };
  },

  /**
   * Create expected MCP error response
   */
  createExpectedMCPError(code: number, message: string, id: string = 'test-1', data?: any) {
    return {
      jsonrpc: '2.0' as const,
      error: {
        code,
        message,
        ...(data && { data })
      },
      id
    };
  },

  /**
   * Wait for a specified amount of time (for async operations)
   */
  async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Generate random test data
   */
  generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

// Make test utilities available globally
declare global {
  var testUtils: typeof testUtils;
}

global.testUtils = testUtils;