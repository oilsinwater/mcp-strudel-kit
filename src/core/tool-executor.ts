import { setTimeout as delay } from 'node:timers/promises';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import type { ToolExecutionContext } from '@/core/context';
import { ToolConcurrencyError, ToolTimeoutError } from '@/core/errors';

type QueueResolver = () => void;

export interface ToolExecutorOptions {
  maxConcurrent: number;
  timeoutMs: number;
}

export class ToolExecutor {
  private readonly maxConcurrent: number;

  private readonly timeoutMs: number;

  private active = 0;

  private readonly queue: QueueResolver[] = [];

  constructor(options: ToolExecutorOptions) {
    this.maxConcurrent = Math.max(1, options.maxConcurrent);
    this.timeoutMs = Math.max(0, options.timeoutMs);
  }

  private async acquireSlot(signal: AbortSignal): Promise<void> {
    if (this.active < this.maxConcurrent) {
      this.active += 1;
      return;
    }

    await new Promise<void>((resolve, reject) => {
      let resolver: QueueResolver;

      const cleanup = () => {
        const index = this.queue.indexOf(resolver);
        if (index >= 0) {
          this.queue.splice(index, 1);
        }
      };

      const abortHandler = () => {
        signal.removeEventListener('abort', abortHandler);
        cleanup();
        reject(new McpError(ErrorCode.RequestTimeout, 'Tool execution aborted by client'));
      };

      resolver = () => {
        signal.removeEventListener('abort', abortHandler);
        cleanup();
        this.active += 1;
        resolve();
      };

      this.queue.push(resolver);

      // Fail fast if the queue grows beyond a safe bound to avoid unbounded memory usage.
      if (this.queue.length > this.maxConcurrent * 10) {
        signal.removeEventListener('abort', abortHandler);
        cleanup();
        reject(new ToolConcurrencyError());
        return;
      }

      if (signal.aborted) {
        abortHandler();
        return;
      }

      signal.addEventListener('abort', abortHandler, { once: true });
    });
  }

  private releaseSlot(): void {
    this.active = Math.max(0, this.active - 1);
    const resolver = this.queue.shift();
    if (resolver) {
      resolver();
    }
  }

  private async runWithTimeout<T>(
    operation: () => Promise<T>,
    context: ToolExecutionContext,
  ): Promise<T> {
    if (this.timeoutMs === 0) {
      return operation();
    }

    let timedOut = false;

    const timeoutPromise = (async () => {
      await delay(this.timeoutMs);
      timedOut = true;
      throw new ToolTimeoutError();
    })();

    try {
      const result = await Promise.race([operation(), timeoutPromise]);

      if (context.signal.aborted) {
        throw new McpError(ErrorCode.RequestTimeout, 'Tool execution aborted by client');
      }

      return result;
    } catch (error) {
      if (context.signal.aborted && !timedOut) {
        throw new McpError(ErrorCode.RequestTimeout, 'Tool execution aborted by client');
      }
      throw error;
    }
  }

  async run<T>(operation: () => Promise<T>, context: ToolExecutionContext): Promise<T> {
    await this.acquireSlot(context.signal);

    try {
      return await this.runWithTimeout(operation, context);
    } finally {
      this.releaseSlot();
    }
  }
}
