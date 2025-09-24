# API Standards and Patterns

**Version**: 1.0
**Date**: September 19, 2025
**Status**: Implementation Guide

## Overview

This document defines the API standards, patterns, and conventions for the Strudel Kit MCP Server. It ensures consistency across all tool implementations and provides clear guidelines for developing new tools within the MCP ecosystem.

## MCP Protocol Compliance

### JSON-RPC 2.0 Specification

All MCP communication follows the JSON-RPC 2.0 specification exactly:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/execute",
  "params": {
    "tool": "tool-name",
    "input": { /* tool-specific parameters */ }
  },
  "id": "unique-request-id"
}
```

**Success Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "output": { /* tool-specific output */ }
  },
  "id": "unique-request-id"
}
```

**Error Response**:
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Tool execution failed",
    "data": {
      "toolName": "create-project",
      "details": "Project directory already exists"
    }
  },
  "id": "unique-request-id"
}
```

### Error Code Standards

| Code | Category | Description | Usage |
|------|----------|-------------|-------|
| -32700 | Parse Error | Invalid JSON | Malformed request |
| -32600 | Invalid Request | Invalid request object | Missing required fields |
| -32601 | Method Not Found | Tool not found | Unknown tool name |
| -32602 | Invalid Params | Invalid tool parameters | Parameter validation failed |
| -32603 | Internal Error | Server internal error | Unexpected server failure |
| -32000 | Tool Execution Error | Tool-specific failure | Tool logic error |
| -32001 | Tool Validation Error | Input validation failed | Parameter schema violation |
| -32002 | Tool Timeout Error | Execution timeout | Tool exceeded time limit |
| -32003 | Resource Error | Resource unavailable | File system, network issues |

## Tool Implementation Standards

### Base Tool Interface

All tools must extend the `BaseMCPTool` class:

```typescript
import { BaseMCPTool, ToolDefinition, ToolInput, ToolOutput } from '@/core/base-tool';

export interface CreateProjectInput extends ToolInput {
  name: string;
  domain?: 'astronomy' | 'biology' | 'chemistry' | 'physics' | 'general';
  template?: string;
  dataSource?: {
    type: 'csv' | 'json' | 'hdf5' | 'netcdf';
    url?: string;
    file?: string;
  };
}

export interface CreateProjectOutput extends ToolOutput {
  projectPath: string;
  components: string[];
  configFiles: string[];
  nextSteps: string[];
}

export class CreateProjectTool extends BaseMCPTool<CreateProjectInput, CreateProjectOutput> {
  definition: ToolDefinition = {
    name: 'create-project',
    description: 'Creates a new Strudel Kit scientific application project',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Project name (alphanumeric, hyphens, underscores only)',
          pattern: '^[a-zA-Z0-9_-]+$'
        },
        domain: {
          type: 'string',
          enum: ['astronomy', 'biology', 'chemistry', 'physics', 'general'],
          description: 'Scientific domain for optimized component selection'
        }
      },
      required: ['name']
    }
  };

  async execute(input: CreateProjectInput): Promise<CreateProjectOutput> {
    // Tool implementation
  }
}
```

### Input Validation Standards

#### Schema Definition Requirements

1. **Required Fields**: Always specify required parameters
2. **Type Safety**: Use strict TypeScript types and JSON Schema
3. **Validation Messages**: Provide clear, actionable error messages
4. **Default Values**: Document default behavior explicitly

```typescript
// Good: Detailed schema with validation
inputSchema: {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Project name (3-50 characters, alphanumeric with hyphens/underscores)',
      pattern: '^[a-zA-Z][a-zA-Z0-9_-]{2,49}$',
      examples: ['my-science-app', 'data_analyzer', 'research_tool']
    },
    dataSource: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['csv', 'json', 'hdf5', 'netcdf'],
          description: 'Data format type'
        }
      },
      required: ['type']
    }
  },
  required: ['name'],
  additionalProperties: false
}
```

#### Validation Error Handling

```typescript
// Validation error response pattern
if (!isValidProjectName(input.name)) {
  throw new ToolValidationError(
    'Invalid project name',
    {
      field: 'name',
      value: input.name,
      constraint: 'Must be 3-50 characters, alphanumeric with hyphens/underscores',
      suggestion: 'Try: "my-research-project" or "data_analysis_tool"'
    }
  );
}
```

### Output Format Standards

#### Consistent Success Response Structure

```typescript
interface StandardToolOutput {
  success: boolean;
  data: any; // Tool-specific data
  metadata: {
    executionTime: number;
    toolVersion: string;
    timestamp: string;
  };
  nextActions?: {
    description: string;
    command?: string;
    tools?: string[];
  }[];
  warnings?: {
    message: string;
    severity: 'low' | 'medium' | 'high';
    action?: string;
  }[];
}
```

#### File System Operations Response

```typescript
interface FileOperationOutput extends ToolOutput {
  files: {
    created: string[];
    modified: string[];
    deleted: string[];
  };
  directories: {
    created: string[];
  };
  totalSize: number; // bytes
  permissions: {
    [path: string]: string;
  };
}
```

## HTTP API Standards (if applicable)

### RESTful Endpoint Patterns

While primarily MCP-focused, if HTTP endpoints are needed:

```
GET    /health                 # Health check
GET    /tools                  # List available tools
POST   /tools/:name/execute    # Execute specific tool
GET    /tools/:name/schema     # Get tool input schema
POST   /tools/batch            # Execute multiple tools
```

### Request/Response Headers

```http
Content-Type: application/json
Accept: application/json
X-Request-ID: unique-correlation-id
X-Tool-Version: 1.0.0
X-Execution-Timeout: 30000
```

## Data Format Standards

### Scientific Data Handling

#### CSV Format Requirements
```typescript
interface CSVParseOptions {
  delimiter: ',' | ';' | '\t';
  headers: boolean;
  encoding: 'utf8' | 'latin1';
  skipEmptyLines: boolean;
  maxRows?: number;
}
```

#### JSON Schema Validation
```typescript
interface JSONDataSchema {
  type: 'object' | 'array';
  structure: 'flat' | 'nested' | 'time-series';
  validation: {
    required: string[];
    types: Record<string, string>;
    constraints: Record<string, any>;
  };
}
```

### File Path Conventions

```typescript
// Path patterns for different operations
const PathPatterns = {
  PROJECT_ROOT: /^[a-zA-Z0-9_-]+$/,
  DATA_FILE: /^[a-zA-Z0-9_-]+\.(csv|json|hdf5|nc)$/,
  CONFIG_FILE: /^[a-zA-Z0-9_-]+\.(json|yaml|toml)$/,
  COMPONENT_FILE: /^[A-Z][a-zA-Z0-9]+\.(tsx?|jsx?)$/
};

// Absolute path requirements
const VALID_PROJECT_PATH = /^\/[a-zA-Z0-9_/-]+$/;
```

## Security Standards

### Input Sanitization

```typescript
// Required sanitization for all inputs
function sanitizeInput(input: any): any {
  // Remove null bytes
  // Validate path traversal attempts
  // Sanitize shell command injection
  // Validate file extensions
  // Check maximum input sizes
}
```

### File System Security

```typescript
// Safe file operations
const ALLOWED_EXTENSIONS = ['.csv', '.json', '.md', '.txt', '.ts', '.tsx', '.js', '.jsx'];
const FORBIDDEN_PATHS = ['/etc', '/usr', '/var', '/sys', '/proc'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

function validateFilePath(path: string): boolean {
  // Validate against directory traversal
  // Check allowed extensions
  // Verify path within project boundaries
  // Confirm write permissions
}
```

## Performance Standards

### Response Time Requirements

| Operation Type | Target (p95) | Maximum | Notes |
|----------------|--------------|---------|-------|
| Simple Tools | <250ms | 500ms | File operations, validation |
| Project Creation | <2s | 5s | Scaffolding, dependency installation |
| Data Processing | <1s | 10s | CSV/JSON parsing, schema inference |
| Complex Operations | <5s | 30s | Multi-step workflows |

### Memory Usage Guidelines

```typescript
// Memory monitoring in tools
class BaseMCPTool {
  protected async monitorMemoryUsage(): Promise<MemoryMetrics> {
    const usage = process.memoryUsage();

    // Alert if memory usage exceeds thresholds
    if (usage.heapUsed > 512 * 1024 * 1024) { // 512MB
      this.logger.warn('High memory usage detected', usage);
    }

    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss
    };
  }
}
```

## Logging Standards

### Structured Logging Format

```typescript
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  correlationId: string;
  tool?: string;
  duration?: number;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack: string;
  };
}

// Example usage
logger.info('Tool execution completed', {
  tool: 'create-project',
  duration: 1250,
  output: { projectPath: '/path/to/project' },
  correlationId: 'req-123'
});
```

### Log Levels and Usage

- **DEBUG**: Detailed flow information, variable values, internal state
- **INFO**: Tool execution start/completion, major operations
- **WARN**: Recoverable errors, performance issues, deprecated features
- **ERROR**: Tool failures, unrecoverable errors, security issues

## Documentation Standards

### Tool Documentation Requirements

Each tool must include:

1. **Purpose**: Clear description of what the tool accomplishes
2. **Input Parameters**: Complete parameter documentation with examples
3. **Output Format**: Expected output structure and meaning
4. **Usage Examples**: Real-world usage scenarios
5. **Error Scenarios**: Common failure modes and solutions
6. **Performance Notes**: Expected execution time and resource usage

### OpenAPI Specification

```yaml
# Example tool specification
/tools/create-project:
  post:
    summary: Create a new Strudel Kit scientific application
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateProjectInput'
    responses:
      200:
        description: Project created successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateProjectOutput'
      400:
        $ref: '#/components/responses/ValidationError'
      500:
        $ref: '#/components/responses/InternalError'
```

## Testing Standards

### Test Coverage Requirements

- **Unit Tests**: >90% coverage for tool logic
- **Integration Tests**: End-to-end tool execution scenarios
- **Performance Tests**: Response time and memory usage validation
- **Security Tests**: Input sanitization and path traversal prevention

### Test Naming Conventions

```typescript
describe('CreateProjectTool', () => {
  describe('execute()', () => {
    it('should create project with valid input', async () => {});
    it('should reject invalid project names', async () => {});
    it('should handle file system errors gracefully', async () => {});
    it('should complete within performance targets', async () => {});
  });

  describe('validation', () => {
    it('should validate required parameters', () => {});
    it('should provide helpful error messages', () => {});
  });
});
```

## Versioning and Compatibility

### Tool Versioning Strategy

```typescript
interface ToolDefinition {
  name: string;
  version: string; // Semantic versioning: major.minor.patch
  apiVersion: string; // MCP API version compatibility
  deprecated?: {
    since: string;
    removedIn: string;
    replacement?: string;
    reason: string;
  };
}
```

### Backward Compatibility Guidelines

- **Major Version**: Breaking changes to input/output schemas
- **Minor Version**: New features, non-breaking changes
- **Patch Version**: Bug fixes, performance improvements

### Deprecation Process

1. **Warning Phase**: Log deprecation warnings (1 minor version)
2. **Deprecation Phase**: Mark as deprecated in documentation (1 major version)
3. **Removal Phase**: Remove deprecated functionality

## Migration and Evolution

### Schema Evolution

```typescript
// Support for schema versioning
interface VersionedInput {
  _version?: string; // Input schema version
  _migration?: {
    from: string;
    applied: string[];
  };
}

// Automatic input migration
function migrateInput(input: any, fromVersion: string, toVersion: string): any {
  // Apply migration transformations
  // Log migration warnings
  // Return transformed input
}
```

This API standards document ensures consistency, maintainability, and interoperability across all MCP tools while providing clear guidelines for future development.