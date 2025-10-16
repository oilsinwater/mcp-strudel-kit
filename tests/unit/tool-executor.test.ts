import { describe, expect, it } from 'vitest';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types';
import { ToolExecutor } from '@/core/tool-registry';
import { ToolTimeoutError } from '@/core/errors';

interface TestContext {
  correlationId: string;
  requestId: string;
  startedAt: Date;
  signal: AbortSignal;
}

function createContext(overrides: Partial<TestContext> = {}): TestContext {
  const controller = new AbortController();

  return {
    correlationId: 'test-correlation',
    requestId: 'req-1',
    startedAt: new Date(),
    signal: controller.signal,
    ...overrides,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('ToolExecutor', () => {
  it('enforces execution timeout', async () => {
    const executor = new ToolExecutor({ maxConcurrent: 1, timeoutMs: 25 });
    const context = createContext();

    await expect(
      executor.run(async () => {
        await sleep(100);
        return 'done';
      }, context),
    ).rejects.toBeInstanceOf(ToolTimeoutError);
  });

  it('serializes executions when exceeding concurrency limit', async () => {
    const executor = new ToolExecutor({ maxConcurrent: 1, timeoutMs: 250 });
    const results: number[] = [];
    let concurrent = 0;

    const execution = async (value: number) =>
      executor.run(async () => {
        concurrent += 1;
        expect(concurrent).toBe(1);
        await sleep(30);
        concurrent -= 1;
        results.push(value);
        return value;
      }, createContext());

    await Promise.all([execution(1), execution(2), execution(3)]);
    expect(results).toEqual([1, 2, 3]);
  });

  it('honors aborted signals while waiting for a slot', async () => {
    const executor = new ToolExecutor({ maxConcurrent: 1, timeoutMs: 250 });

    const controller = new AbortController();
    const waitingContext = createContext({ signal: controller.signal });

    const firstExecution = executor.run(async () => {
      await sleep(100);
      return 'first';
    }, createContext());

    const waitingExecution = executor.run(async () => 'second', waitingContext);

    controller.abort();

    await expect(waitingExecution).rejects.toBeInstanceOf(McpError);
    await expect(waitingExecution).rejects.toMatchObject({ code: ErrorCode.RequestTimeout });
    await expect(firstExecution).resolves.toBe('first');
  });
});
