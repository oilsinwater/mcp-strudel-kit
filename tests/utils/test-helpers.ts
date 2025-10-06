/**
 * Test helper utilities for common testing patterns
 */

import { vi } from 'vitest';
import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

/**
 * Mock implementations for common external dependencies
 */
export const mockHelpers = {
  /**
   * Mock child process for Strudel Kit CLI integration
   */
  createMockChildProcess(mockOutput: string = '', mockError: string = '', exitCode: number = 0): Partial<ChildProcess> {
    const mockProcess = new EventEmitter() as Partial<ChildProcess>;

    mockProcess.stdout = new EventEmitter() as any;
    mockProcess.stderr = new EventEmitter() as any;
    mockProcess.stdin = new EventEmitter() as any;

    // Simulate process execution
    setTimeout(() => {
      if (mockOutput) {
        mockProcess.stdout?.emit('data', mockOutput);
      }
      if (mockError) {
        mockProcess.stderr?.emit('data', mockError);
      }
      mockProcess.emit?.('close', exitCode);
    }, 10);

    return mockProcess;
  },

  /**
   * Mock file system operations
   */
  createMockFileSystem() {
    return {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
      readdir: vi.fn(),
      stat: vi.fn(),
      access: vi.fn()
    };
  },

  /**
   * Mock HTTP requests for external APIs
   */
  createMockHttpClient() {
    return {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };
  }
};

/**
 * Assertion helpers for MCP-specific testing
 */
export const mcpAssertions = {
  /**
   * Assert that a response follows MCP format
   */
  assertMCPResponse(response: any, expectedId?: string) {
    expect(response).toHaveProperty('jsonrpc', '2.0');
    expect(response).toHaveProperty('id');

    if (expectedId) {
      expect(response.id).toBe(expectedId);
    }

    // Should have either result or error, not both
    const hasResult = 'result' in response;
    const hasError = 'error' in response;

    expect(hasResult || hasError).toBe(true);
    expect(hasResult && hasError).toBe(false);
  },

  /**
   * Assert that an error response follows MCP error format
   */
  assertMCPError(response: any, expectedCode?: number, expectedMessage?: string) {
    mcpAssertions.assertMCPResponse(response);

    expect(response).toHaveProperty('error');
    expect(response.error).toHaveProperty('code');
    expect(response.error).toHaveProperty('message');

    if (expectedCode !== undefined) {
      expect(response.error.code).toBe(expectedCode);
    }

    if (expectedMessage) {
      expect(response.error.message).toBe(expectedMessage);
    }
  },

  /**
   * Assert that a successful response has expected structure
   */
  assertMCPSuccess(response: any, expectedResult?: any) {
    mcpAssertions.assertMCPResponse(response);

    expect(response).toHaveProperty('result');

    if (expectedResult !== undefined) {
      expect(response.result).toEqual(expectedResult);
    }
  }
};

/**
 * Performance testing helpers
 */
export const performanceHelpers = {
  /**
   * Measure execution time of an async function
   */
  async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    return { result, duration };
  },

  /**
   * Assert that execution time is within acceptable limits
   */
  assertExecutionTime(duration: number, maxMs: number, operation: string = 'Operation') {
    expect(duration).toBeLessThan(maxMs);
    console.debug(`${operation} completed in ${duration.toFixed(2)}ms (limit: ${maxMs}ms)`);
  }
};

/**
 * Data generation helpers for scientific data testing
 */
export const dataGenerators = {
  /**
   * Generate mock CSV data
   */
  generateMockCSV(rows: number = 10): string {
    const headers = ['timestamp', 'temperature', 'humidity', 'pressure'];
    const lines = [headers.join(',')];

    for (let i = 0; i < rows; i++) {
      const row = [
        new Date(Date.now() - i * 1000 * 60).toISOString(),
        (20 + Math.random() * 10).toFixed(2),
        (40 + Math.random() * 30).toFixed(2),
        (1013 + Math.random() * 10).toFixed(2)
      ];
      lines.push(row.join(','));
    }

    return lines.join('\n');
  },

  /**
   * Generate mock JSON data structure
   */
  generateMockJSON(structure: 'flat' | 'nested' | 'array' = 'flat'): any {
    switch (structure) {
      case 'flat':
        return {
          id: 'test-' + Math.random().toString(36).substr(2, 9),
          name: 'Test Dataset',
          value: Math.random() * 100,
          timestamp: new Date().toISOString()
        };

      case 'nested':
        return {
          metadata: {
            id: 'test-nested',
            created: new Date().toISOString()
          },
          data: {
            measurements: Array.from({ length: 5 }, (_, i) => ({
              index: i,
              value: Math.random() * 100
            }))
          }
        };

      case 'array':
        return Array.from({ length: 10 }, (_, i) => ({
          id: i,
          value: Math.random() * 100
        }));

      default:
        return {};
    }
  }
};

/**
 * Integration test helpers
 */
export const integrationHelpers = {
  /**
   * Create a test MCP server instance
   */
  async createTestMCPServer() {
    // This would create a real server instance for integration testing
    // Implementation depends on the actual server structure
    const mockServer = {
      start: vi.fn(),
      stop: vi.fn(),
      request: vi.fn(),
      port: 0
    };

    return mockServer;
  },

  /**
   * Cleanup test resources
   */
  async cleanupTestResources(...resources: Array<{ cleanup?: () => Promise<void> | void }>) {
    for (const resource of resources) {
      try {
        await resource.cleanup?.();
      } catch (error) {
        console.warn('Error during test cleanup:', error);
      }
    }
  }
};
