import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  ErrorCode,
  McpError,
  type CallToolResult,
  type ToolAnnotations,
} from '@modelcontextprotocol/sdk/types.js';
import { z, type ZodRawShape } from 'zod';
import { createExecutionContext, type ToolExecutionContext } from './context';
import { ToolConcurrencyError, ToolTimeoutError } from './errors';
import type { ToolExecutor } from './tool-executor';

export type ToolShape = ZodRawShape;

export { ToolExecutor } from './tool-executor';

export interface ToolDefinition<
  Input extends ToolShape | undefined = undefined,
  Output extends ToolShape | undefined = undefined,
> {
  name: string;
  title: string;
  description: string;
  inputSchema?: Input;
  outputSchema?: Output;
  annotations?: ToolAnnotations;
  handler: (
    args: Input extends ToolShape ? z.infer<z.ZodObject<Input>> : Record<string, never>,
    context: ToolExecutionContext,
  ) => Promise<CallToolResult>;
}

function ensureContent(
  result: Partial<CallToolResult>,
  context: ToolExecutionContext,
): CallToolResult {
  if (result.content && result.content.length > 0) {
    return result as CallToolResult;
  }

  return {
    ...result,
    content: [
      {
        type: 'text',
        text: result.structuredContent
          ? JSON.stringify(result.structuredContent, null, 2)
          : 'Operation completed successfully.',
        _meta: {
          correlationId: context.correlationId,
        },
      },
    ],
  } as CallToolResult;
}

function normalizeOutputSchema(shape?: ToolShape): ToolShape | undefined {
  if (!shape) {
    return undefined;
  }

  // Ensure structured content includes default metadata for downstream consumers.
  return {
    ...shape,
    correlationId: z.string().describe('Correlation identifier for tracing'),
  };
}

export class ToolRegistry {
  constructor(
    private readonly server: McpServer,
    private readonly executor: ToolExecutor,
  ) {}

  register<Input extends ToolShape | undefined, Output extends ToolShape | undefined>(
    definition: ToolDefinition<Input, Output>,
  ): void {
    const { name, title, description, inputSchema, annotations } = definition;
    const outputSchema = normalizeOutputSchema(definition.outputSchema);

    this.server.registerTool(
      name,
      {
        title,
        description,
        inputSchema,
        outputSchema,
        annotations,
      },
      async (args, extra) => {
        const context = createExecutionContext(extra);

        if (context.signal.aborted) {
          throw new McpError(ErrorCode.RequestTimeout, 'Tool execution aborted before start');
        }

        try {
          const result = await this.executor.run(async () => {
            const resolved = await definition.handler(
              (args ?? {}) as Input extends ToolShape
                ? z.infer<z.ZodObject<Input>>
                : Record<string, never>,
              context,
            );

            if (outputSchema && !resolved.structuredContent) {
              throw new McpError(
                ErrorCode.InternalError,
                `Tool "${name}" must provide structuredContent to satisfy output schema`,
              );
            }

            const normalized = ensureContent(resolved, context);

            if (
              normalized.structuredContent &&
              'correlationId' in normalized.structuredContent === false
            ) {
              normalized.structuredContent = {
                ...normalized.structuredContent,
                correlationId: context.correlationId,
              };
            }

            return normalized;
          }, context);

          return result;
        } catch (error) {
          if (error instanceof ToolTimeoutError) {
            throw new McpError(ErrorCode.RequestTimeout, error.message);
          }

          if (error instanceof ToolConcurrencyError) {
            throw new McpError(
              ErrorCode.InternalError,
              'Server is handling maximum concurrent tool executions. Retry shortly.',
            );
          }

          if (error instanceof McpError) {
            throw error;
          }

          const message = error instanceof Error ? error.message : 'Unknown tool execution failure';
          throw new McpError(ErrorCode.InternalError, message);
        }
      },
    );
  }
}
