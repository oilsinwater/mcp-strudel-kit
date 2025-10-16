export class ToolTimeoutError extends Error {
  constructor(message = 'Tool execution timed out') {
    super(message);
    this.name = 'ToolTimeoutError';
  }
}

export const TOOL_TIMEOUT_ERROR_NAME = 'ToolTimeoutError' as const;
