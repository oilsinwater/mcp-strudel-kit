export class ToolConcurrencyError extends Error {
  constructor(message = 'Maximum concurrent tool executions reached') {
    super(message);
    this.name = 'ToolConcurrencyError';
  }
}

export const TOOL_CONCURRENCY_ERROR_NAME = 'ToolConcurrencyError' as const;
