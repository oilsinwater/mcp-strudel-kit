# Story 1.2: MCP Server Core Implementation

**Epic**: Foundation & Core Infrastructure
**Priority**: P0
**Story Points**: 5
**Dependencies**: Story 1.1 (Project Initialization)
**Assigned**: Developer Agent

## User Story

As an AI agent integrating with the MCP server, I want a fully compliant JSON-RPC 2.0 server built on the xmcp framework, so that I can send tool execution requests and receive properly formatted responses according to the Model Context Protocol specification.

## Acceptance Criteria

### AC1: xmcp Framework Integration
- [ ] xmcp server instance created and configured
- [ ] JSON-RPC 2.0 compliance verified
- [ ] MCP protocol message handling implemented
- [ ] Server starts on configurable port (default 3000)
- [ ] Graceful shutdown handling implemented

### AC2: Request/Response Handling
- [ ] Incoming MCP requests properly parsed and validated
- [ ] Request routing to appropriate tool handlers
- [ ] Response formatting follows MCP specification
- [ ] Error responses include proper error codes and messages
- [ ] Request correlation IDs maintained throughout processing

### AC3: Tool Execution Framework
- [ ] Generic tool execution interface defined
- [ ] Tool input validation before execution
- [ ] Tool output validation before response
- [ ] Execution context management for stateful operations
- [ ] Timeout handling for long-running operations

### AC4: Middleware Pipeline
- [ ] Logging middleware for request/response tracking
- [ ] Error handling middleware with structured errors
- [ ] Request validation middleware using Joi schemas
- [ ] CORS middleware for cross-origin requests
- [ ] Rate limiting middleware for basic protection

### AC5: Configuration Management
- [ ] Environment-based configuration loading
- [ ] Server port and host configuration
- [ ] Tool execution timeout configuration
- [ ] Logging level configuration
- [ ] Development vs production mode settings

## Implementation Details

### Core Server Structure
```typescript
// src/server.ts
import { createMCPServer } from 'xmcp';
import { toolRouter } from './core/router';
import { errorHandler } from './middleware/error';
import { logger } from './middleware/logging';

const server = createMCPServer({
  port: process.env.PORT || 3000,
  router: toolRouter,
  middleware: [logger, errorHandler]
});
```

### Request Flow
1. AI agent sends JSON-RPC 2.0 request
2. xmcp framework parses and validates format
3. Request routed to tool registry
4. Tool identified and input validated
5. Tool executed with context management
6. Output validated and formatted
7. Response sent back to agent

### Error Handling Strategy
```typescript
interface MCPError {
  code: number;
  message: string;
  data?: any;
  correlationId: string;
}

// Standard MCP error codes
const ErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  TOOL_EXECUTION_ERROR: -32000
};
```

## Testing Requirements

### Unit Tests
- [ ] Server initialization and configuration
- [ ] Request parsing and validation
- [ ] Response formatting compliance
- [ ] Error handling for various scenarios
- [ ] Middleware pipeline execution order

### Integration Tests
- [ ] End-to-end request/response cycle
- [ ] Tool execution through MCP interface
- [ ] Error scenarios with proper error responses
- [ ] Timeout handling for slow operations
- [ ] Concurrent request handling

### Compliance Tests
- [ ] JSON-RPC 2.0 specification compliance
- [ ] MCP protocol adherence
- [ ] Response format validation
- [ ] Error code compliance

## Definition of Done

- [ ] xmcp server runs and accepts connections
- [ ] JSON-RPC 2.0 compliance verified with test suite
- [ ] Sample tool can be executed through MCP interface
- [ ] All error scenarios return proper error responses
- [ ] Middleware pipeline processes requests correctly
- [ ] Configuration system works across environments
- [ ] Performance benchmarks meet requirements (<500ms simple tools)
- [ ] Memory usage remains stable under load
- [ ] Graceful shutdown preserves in-flight requests

## API Standards

### Request Format
```json
{
  "jsonrpc": "2.0",
  "method": "tools/execute",
  "params": {
    "tool": "create-project",
    "input": {
      "name": "my-science-app",
      "domain": "astronomy"
    }
  },
  "id": "req-123"
}
```

### Response Format
```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "output": {
      "projectPath": "/path/to/my-science-app",
      "components": ["DataViewer", "AnalysisPanel"]
    }
  },
  "id": "req-123"
}
```

## Risk Considerations

- **xmcp Framework Dependencies**: Monitor framework updates and compatibility
- **Performance Under Load**: Implement basic load testing early
- **Memory Leaks**: Monitor memory usage in long-running operations
- **Error State Recovery**: Ensure server remains stable after errors

## Blockers/Dependencies

- **Depends on**: Story 1.1 (Project structure and dependencies)
- **Blocks**: All subsequent tool implementation stories

## Estimated Effort

- **xmcp Integration**: 6-8 hours
- **Request/Response Handling**: 4-6 hours
- **Middleware Implementation**: 4-6 hours
- **Testing**: 6-8 hours
- **Documentation**: 2-3 hours

**Total**: 3-4 days