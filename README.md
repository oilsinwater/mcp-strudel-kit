# Strudel Kit MCP Server

A production-ready Model Context Protocol (MCP) server that transforms scientific UI development from weeks of specialized programming into conversational AI interactions. Built on the xmcp TypeScript framework, it delivers auto-discoverable tools for creating scientific applications through natural language.

[![CI Status](https://github.com/strudel-science/mcp-strudel-kit/workflows/CI/badge.svg)](https://github.com/strudel-science/mcp-strudel-kit/actions)
[![Coverage](https://codecov.io/gh/strudel-science/mcp-strudel-kit/branch/main/graph/badge.svg)](https://codecov.io/gh/strudel-science/mcp-strudel-kit)
[![npm version](https://badge.fury.io/js/strudel-kit-mcp-server.svg)](https://www.npmjs.com/package/strudel-kit-mcp-server)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm 8+** or **yarn 1.22+**
- **Strudel Kit CLI** (installed globally)

```bash
# Install Node.js 20+ (if not installed)
nvm install 20
nvm use 20

# Install Strudel Kit CLI globally
npm install -g @strudel-science/strudel-kit
```

### 5-Minute Setup

```bash
# 1. Clone the repository
git clone https://github.com/strudel-science/mcp-strudel-kit.git
cd mcp-strudel-kit

# 2. Install dependencies
npm install

# 3. Copy and configure environment
cp .env.example .env
# Edit .env with your preferences (defaults work for development)

# 4. Build the project
npm run build

# 5. Start development server
npm run dev
```

### BMAD Agent Management

This project uses BMAD (Better Model Agent Development) for AI agent management:

```bash
# Refresh BMAD agents
npm run bmad:refresh

# List available BMAD agents
npm run bmad:list

# Validate BMAD configuration
npm run bmad:validate
```

The server will start on `http://localhost:3000` with hot reloading enabled.

### Verify Installation

```bash
# Test server health
curl http://localhost:3000/health

# List available tools
curl http://localhost:3000/tools

# Expected response: List of auto-discovered MCP tools
```

## 🛠️ Development Workflow

### Project Structure

```
mcp-strudel-kit/
├── src/
│   ├── server.ts              # Main entry point
│   ├── core/                  # Core MCP functionality
│   │   ├── registry.ts        # Tool auto-discovery
│   │   ├── router.ts          # Request routing
│   │   └── validator.ts       # Input validation
│   ├── tools/                 # MCP tools (auto-discovered)
│   │   ├── base.tool.ts       # Base tool class
│   │   ├── create-project.ts  # Project creation tool
│   │   └── ...                # Other scientific tools
│   ├── middleware/            # Express middleware
│   ├── integrations/          # External service integrations
│   └── utils/                 # Shared utilities
├── .agents/                   # Documentation workspace (architecture, PRD, stories, QA)
├── tests/                     # Test suites
├── config/                    # Configuration files
└── dist/                      # Built output
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run dev:debug    # Start with Node inspector enabled

# Building
npm run build        # Build TypeScript into dist/

# Testing
npm run test         # Run the full Vitest suite
npm run test:unit    # Run unit tests only
npm run test:integration  # Run integration tests
npm run test:e2e     # Run end-to-end tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint         # Lint TypeScript code
npm run lint:fix     # Fix linting issues automatically
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run type-check   # TypeScript type checking

# Production
npm start            # Start production server (requires build)
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Essential settings for development
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Data storage
DATA_PATH=./data
PERSISTENCE_STRATEGY=file-with-cache

# Strudel Kit integration
STRUDEL_CLI_PATH=strudel
DEFAULT_TEMPLATE=basic-scientific

# Development features
HOT_RELOAD_ENABLED=true
DEBUG_ENDPOINTS=true
```

Claude, Gemini, Quinn, OpenCode, Crush, and Coding agents now share configurable MCP endpoints. Update `MCP_SERVER_SERENA_ENDPOINT`, `MCP_SERVER_PLAYWRIGHT_ENDPOINT`, and `MCP_SERVER_GITHUB_ENDPOINT` (plus the matching `*_ENABLED` flags) to point at your Serena, Playwright, and GitHub MCP servers before activating the agents.

See the [Architecture Guides](./.agents/architecture.md) for configuration details and environment setup references.

## 🔧 Creating Custom Tools

### Basic Tool Structure

Create a new file in `src/tools/` that extends `BaseMCPTool`:

```typescript
// src/tools/my-custom-tool.ts
import { BaseMCPTool, ToolDefinition, ToolInput, ToolOutput } from '@/core/base-tool';

export interface MyToolInput extends ToolInput {
  parameter1: string;
  parameter2?: number;
}

export interface MyToolOutput extends ToolOutput {
  result: any;
  metadata: {
    processingTime: number;
  };
}

export class MyCustomTool extends BaseMCPTool<MyToolInput, MyToolOutput> {
  definition: ToolDefinition = {
    name: 'my-custom-tool',
    description: 'Description of what this tool does',
    inputSchema: {
      type: 'object',
      properties: {
        parameter1: {
          type: 'string',
          description: 'Description of parameter1',
        },
        parameter2: {
          type: 'number',
          description: 'Optional numeric parameter',
          minimum: 0,
        },
      },
      required: ['parameter1'],
    },
  };

  async execute(input: MyToolInput): Promise<MyToolOutput> {
    const startTime = Date.now();

    // Tool implementation here
    const result = await this.processInput(input);

    return {
      success: true,
      result,
      metadata: {
        processingTime: Date.now() - startTime,
      },
    };
  }

  private async processInput(input: MyToolInput): Promise<any> {
    // Implement your tool logic
    return { processed: input.parameter1 };
  }
}
```

### Tool Auto-Discovery

Tools are automatically discovered and registered when:

1. File is in `src/tools/` directory
2. File exports a class extending `BaseMCPTool`
3. Class has a valid `definition` property
4. Server is restarted or hot reload detects changes

### Testing Your Tool

```typescript
// tests/unit/tools/my-custom-tool.test.ts
import { describe, it, expect } from 'vitest';
import { MyCustomTool } from '@/tools/my-custom-tool';

describe('MyCustomTool', () => {
  const tool = new MyCustomTool();

  it('should execute successfully with valid input', async () => {
    const input = { parameter1: 'test-value' };
    const result = await tool.execute(input);

    expect(result.success).toBe(true);
    expect(result.result.processed).toBe('test-value');
  });

  it('should validate input schema', async () => {
    const invalidInput = { wrongParameter: 'value' };

    await expect(tool.execute(invalidInput as any)).rejects.toThrow('Validation failed');
  });
});
```

## 🧪 Testing

### Test Organization

```
tests/
├── unit/              # Unit tests for individual components
├── integration/       # Integration tests for tool workflows
├── e2e/              # End-to-end tests with real MCP clients
└── setup/            # Test configuration and utilities
```

### Writing Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createServer } from '@/server';

describe('Tool Integration', () => {
  beforeEach(async () => {
    await createServer();
  });

  it('should handle MCP request/response cycle', async () => {
    const response = await executeToolRequest({
      tool: 'my-tool',
      params: { param: 'value' },
    });

    expect(response.result.success).toBe(true);
  });
});
```

### Running Tests

```bash
# Run all tests with coverage
npm run test:coverage

# Run specific test file
npm run test tests/unit/tools/create-project.test.ts

# Run tests in watch mode during development
npm run test:watch

# Debug failing tests
npm run test:debug
```

## 📊 Monitoring and Debugging

### Health Checks

```bash
# Basic health check
curl http://localhost:3000/health

# Detailed health check with metrics
curl http://localhost:3000/health/detailed
```

### Debug Endpoints (Development Only)

```bash
# List registered tools
GET /debug/tools

# View tool execution metrics
GET /debug/metrics

# Clear caches
POST /debug/cache/clear

# View system information
GET /debug/system
```

### Logging

Logs are structured JSON by default:

```json
{
  "timestamp": "2025-09-19T10:30:00.000Z",
  "level": "info",
  "message": "Tool execution completed",
  "correlationId": "req-123",
  "tool": "create-project",
  "duration": 1250,
  "metadata": {
    "projectPath": "/path/to/project"
  }
}
```

Configure logging in `.env`:

```bash
LOG_LEVEL=debug        # debug, info, warn, error
LOG_FORMAT=json        # json, text
LOG_REQUESTS=true      # Log all HTTP requests
```

## 🚀 Deployment

### Production Build

```bash
# Build for production
npm run build

# Start production server
NODE_ENV=production npm start
```

### Docker Deployment

```dockerfile
# Dockerfile included in repository
docker build -t mcp-strudel-kit .
docker run -p 3000:3000 -e NODE_ENV=production mcp-strudel-kit
```

### Environment Variables

Essential production environment variables:

```bash
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
PERSISTENCE_STRATEGY=file-with-database
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secure-jwt-secret
AUTH_ENABLED=true
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md).

### Development Process

1. **Fork and Clone**

   ```bash
   git clone https://github.com/your-username/mcp-strudel-kit.git
   cd mcp-strudel-kit
   ```

2. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Setup Development Environment**

   ```bash
   npm install
   cp .env.example .env
   npm run dev
   ```

4. **Make Changes and Test**

   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

5. **Submit Pull Request**
   - Include tests for new features
   - Update documentation as needed
   - Follow the existing code style

### Code Standards

- **TypeScript**: Strict mode enabled, comprehensive type definitions
- **ESLint**: Airbnb TypeScript configuration
- **Prettier**: Consistent code formatting
- **Testing**: >80% coverage requirement
- **Documentation**: JSDoc comments for public APIs

## 📖 Documentation

- [Architecture Overview](./.agents/architecture.md)
- [Product Requirements](./.agents/prd.md)
- [API Standards](./.agents/api-standards.md)
- [Monitoring & Logging](./.agents/monitoring-logging.md)
- [Persistence Strategy](./.agents/persistence-strategy.md)

## 🔗 Related Projects

- [Strudel Kit](https://github.com/strudel-science/strudel-kit) - Scientific UI component library
- [xmcp](https://github.com/xmcp/xmcp) - TypeScript MCP framework
- [Model Context Protocol](https://modelcontextprotocol.io/) - Protocol specification

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/strudel-science/mcp-strudel-kit/issues)
- **Discussions**: [Community discussions and questions](https://github.com/strudel-science/mcp-strudel-kit/discussions)
- **Documentation**: [Comprehensive guides and API docs](./.agents/)

---

**Built with ❤️ by the Scientific Computing Community**

Transform your research ideas into interactive applications with natural language interactions!
