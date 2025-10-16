import { z } from 'zod';
import type { ToolDefinition } from '@/core/tool-registry';

export default function coreTools(): ToolDefinition[] {
  return [
    {
      name: 'health_check',
      title: 'Health Check',
      description: 'Provides basic service health metadata.',
      async handler(_args, context) {
        const structuredContent = {
          status: 'ok',
          timestamp: new Date().toISOString(),
          correlationId: context.correlationId,
        };

        return {
          content: [
            {
              type: 'text',
              text: 'MCP server is healthy.',
            },
          ],
          structuredContent,
        };
      },
    },
    {
      name: 'echo_message',
      title: 'Echo Message',
      description: 'Echoes the provided message payload.',
      inputSchema: {
        message: z.string().min(1).describe('Message to echo in the response body.'),
      },
      outputSchema: {
        message: z.string(),
        correlationId: z.string(),
        receivedAt: z.string(),
      },
      async handler(args, context) {
        const structuredContent = {
          message: args.message,
          correlationId: context.correlationId,
          receivedAt: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: args.message,
            },
          ],
          structuredContent,
        };
      },
    },
  ];
}
