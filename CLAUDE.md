# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server built with TypeScript, designed to transform scientific UI development from weeks of specialized programming into conversational AI interactions. It's built on the xmcp TypeScript framework.

## Architecture

### Core Components

- **Server Core**: Built on Express.js with custom MCP transport layer using @modelcontextprotocol/sdk
- **Tool System**: Auto-discovery of tools from the `src/tools/` directory with validation and execution handling
- **Middleware Pipeline**: CORS handling, request validation, rate limiting, correlation ID tracking, structured logging, error handling
- **Configuration Management**: Environment-based configuration using Joi validation
- **Execution Management**: Concurrency management with execution limits and timeouts via ToolExecutor

### Project Structure

```
mcp-strudel-kit/
├── src/
│   ├── server.ts              # Main entry point
│   ├── core/                  # Core MCP functionality
│   │   ├── config.ts          # Environment configuration loading
│   │   ├── context.ts         # Tool execution context
│   │   ├── errors/            # Custom error classes
│   │   ├── tool-executor.ts   # Tool execution management
│   │   ├── tool-registry.ts   # Tool registration and handling
│   ├── tools/                 # MCP tools (auto-discovered)
│   │   └── core-tools.ts      # Built-in core tools
│   ├── middleware/            # Express middleware
│   └── utils/                 # Shared utilities
├── tests/                     # Test suites
├── docs/                      # Project documentation
├── config/                    # Configuration files
└── dist/                      # Built output
```

## Common Development Commands

### Development Workflow

1. **Environment Setup**: Copy `.env.example` to `.env` and configure as needed
2. **Installation**: `npm install` to install dependencies
3. **Development**: `npm run dev` for hot-reloading development server
4. **Testing**: `npm test` to run the full test suite
5. **Building**: `npm run build` to compile TypeScript to JavaScript
6. **Production**: `npm start` to run the built application

### Key npm Scripts

- `npm run dev`: Start development server with hot reload
- `npm run dev:debug`: Start with Node inspector enabled
- `npm run build`: Build TypeScript into dist/
- `npm test`: Run the full Vitest suite
- `npm run test:unit`: Run unit tests only
- `npm run test:integration`: Run integration tests
- `npm run test:e2e`: Run end-to-end tests
- `npm run test:coverage`: Generate coverage report
- `npm run lint`: Lint TypeScript code
- `npm run lint:fix`: Fix linting issues automatically
- `npm run format`: Format code with Prettier
- `npm start`: Start production server (requires build)

### Running Individual Tests

- Run a specific test file: `npm run test tests/unit/tool-executor.test.ts`
- Run tests in watch mode: `npm run test:watch`
- Run tests with coverage: `npm run test:coverage`

## Testing

The project uses Vitest as its testing framework with:

- Unit tests for individual components in `tests/unit/`
- Integration tests for tool workflows in `tests/integration/`
- End-to-end tests with real MCP clients in `tests/e2e/`
- 80% coverage threshold for branches, functions, lines, and statements

## Build System

- **TypeScript**: Version 5.5.4 with strict mode enabled
- **Module System**: ES Modules (NodeNext)
- **Build Tool**: TypeScript compiler (tsc) with separate build config
- **Development Server**: tsx for hot reloading during development
- **Output**: Compiled JavaScript in the `dist/` directory with declaration files

## Creating Custom Tools

Tools are automatically discovered when:

1. File is in `src/tools/` directory
2. File exports a ToolDefinition object
3. Server is restarted or hot reload detects changes

Tool structure:

```typescript
{
  name: 'tool-name',
  title: 'Tool Title',
  description: 'Description of what this tool does',
  inputSchema: { /* Zod schema */ },
  outputSchema: { /* Zod schema */ },
  async handler(args, context) {
    // Tool implementation
    return {
      content: [{ type: 'text', text: 'Response' }],
      structuredContent: { /* structured data */ }
    };
  }
}
```
