/* eslint-disable no-console */
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

/**
 * Global test setup - runs once before all tests
 * Sets up test databases, mock services, and shared resources
 */
type MockServer = {
  close: () => void | Promise<void>;
} | null;

type ActiveMockServer = Exclude<MockServer, null>;

export default async function globalSetup(): Promise<() => void> {
  console.log('🚀 Setting up global test environment...');

  // Create temporary directories for test artifacts
  const testTempDir = path.join(process.cwd(), 'temp/test');
  await mkdir(testTempDir, { recursive: true });

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0'; // Use random available port
  process.env.LOG_LEVEL = 'error'; // Reduce noise in tests
  process.env.TEST_TEMP_DIR = testTempDir;

  // Start mock services if needed
  // eslint-disable-next-line prefer-const -- This will be assigned when mock services are enabled.
  let mockServer: MockServer = null;

  // Mock external API endpoints for testing
  if (process.env.START_MOCK_SERVICES === 'true') {
    // This would start a mock server for external dependencies
    // mockServer = await startMockServer();
  }

  console.log('✅ Global test environment ready');

  // Return cleanup function
  return async () => {
    console.log('🧹 Cleaning up global test environment...');

    // Stop mock services
    if (mockServer !== null) {
      await (mockServer as ActiveMockServer).close();
    }

    // Clean up temporary files
    try {
      await rm(testTempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Warning: Could not clean up test temp directory:', error);
    }

    console.log('✅ Global test cleanup complete');
  };
}

/**
 * Helper function to start mock external services
 * Uncomment and implement when external dependencies are added
 */
// async function startMockServer() {
//   const express = require('express');
//   const app = express();
//
//   app.use(express.json());
//
//   // Mock Strudel Kit CLI responses
//   app.post('/mock/strudel-kit/*', (req, res) => {
//     res.json({ success: true, mockResponse: true });
//   });
//
//   return new Promise((resolve) => {
//     const server = app.listen(0, () => {
//       const port = server.address()?.port;
//       process.env.MOCK_SERVER_PORT = port?.toString();
//       console.log(`Mock server started on port ${port}`);
//       resolve(server);
//     });
//   });
// }
