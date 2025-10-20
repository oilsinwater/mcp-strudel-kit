h# Story 1.2: MCP Server Core Implementation

## Status

Ready for Review

## Story

**As a** downstream AI agent integrating with the MCP server,  
**I want** a fully compliant JSON-RPC 2.0 server built on the xmcp framework,  
**so that** I can execute tools and receive correctly formatted responses that follow the Model Context Protocol.

## Acceptance Criteria

1. **XMCP Framework Integration**
   - [x] xmcp server instance created and configured
   - [x] JSON-RPC 2.0 compliance verified
   - [x] MCP protocol message handling implemented
   - [x] Server starts on configurable port (default 3000)
   - [x] Graceful shutdown handling implemented
2. **Request/Response Handling**
   - [x] Incoming MCP requests parsed and validated
   - [x] Requests routed to appropriate tool handlers
   - [x] Responses formatted per MCP specification
   - [x] Error responses include proper codes and messages
   - [x] Correlation IDs maintained throughout processing
3. **Tool Execution Framework**
   - [x] Generic tool execution interface defined
   - [x] Tool input validation before execution
   - [x] Tool output validation before response
   - [x] Execution context management for stateful operations
   - [x] Timeout handling for long-running operations
4. **Middleware Pipeline**
   - [x] Logging middleware for request/response tracking
   - [x] Error handling middleware with structured errors
   - [x] Request validation middleware using Joi schemas
   - [x] CORS middleware for cross-origin requests
   - [x] Rate limiting middleware for baseline protection
5. **Configuration Management**
   - [x] Environment-based configuration loading
   - [x] Server port and host configuration exposed
   - [x] Tool execution timeout configurable
   - [x] Logging level configurable
   - [x] Development vs production mode toggles available

## Tasks / Subtasks

- [x] Establish xmcp server entry point in `src/server.ts`, wiring router and middleware (AC: 1, 2, 4)
  - [x] Load environment configuration (port, host, timeouts) via `config/` helpers and `.env` defaults (AC: 1, 5)
- [x] Implement request routing in `src/core/router.ts` to dispatch to registered tools using correlation IDs (AC: 2, 3)
  - [x] Integrate tool registry lookup and execution context management (AC: 3)
- [x] Build middleware stack in `src/middleware/` (logging, error, validation, rate limiting, CORS) and register with server (AC: 2, 4)
  - [x] Ensure logging attaches correlation IDs using Winston transport (AC: 2, 4)
- [x] Create base tool execution interface and validation utilities in `src/core/validator.ts` and `src/core/context.ts` (AC: 3)
  - [x] Implement timeout handling and cleanup hooks in execution context (AC: 3)
- [x] Document configuration keys and add defaults/tests for configuration behavior in `tests/integration/server-startup.test.ts` (AC: 5)
  - [x] Add unit tests for router, middleware, and validation utilities following project testing standards (AC: 2, 3, 4)

## Dev Notes

### Previous Story Insights

- Story 1.1 delivered the TypeScript project scaffold, including strict TypeScript configuration, linting, and the directory layout under `src/`, `middleware/`, and `core/`, which this story must now populate rather than restructure. [Source: .agents/stories/story-1.1-project-initialization.md#acceptance-criteria]

### Core Server Responsibilities

- `src/server.ts` hosts the xmcp server entry point and should expose the MCP Gateway component responsible for JSON-RPC request intake. The implementation must align with the documented gateway responsibilities and leverage Express via xmcp. [Source: .agents/architecture/source-tree.md#source-tree] [Source: .agents/architecture/components.md#mcp-gateway-component]
- The server must comply with the chosen technology stack: Node.js 18+, TypeScript 5.0+, xmcp framework, and Express-based middleware. [Source: .agents/architecture/tech-stack.md#technology-stack-table]

### Request Routing & Tool Execution

- Route handling belongs in `src/core/router.ts`, delegating to the Tool Router Component and invoking the Tool Registry for lookups, keeping dispatch logic isolated from the server bootstrap. [Source: .agents/architecture/source-tree.md#source-tree] [Source: .agents/architecture/components.md#tool-router-component]
- Execution context management and validation utilities reside in `src/core/context.ts` and `src/core/validator.ts`, enabling consistent state and schema enforcement for every tool invocation. [Source: .agents/architecture/source-tree.md#source-tree] [Source: .agents/architecture/components.md#context-manager-component]
- Tool discovery and registration will be finalized in Story 1.3, but the router must already respect the registry contract defined there so future stories can plug in without refactoring. [Source: .agents/architecture/components.md#tool-registry-component]

### Middleware Pipeline

- Logging middleware should be based on Winston, emit JSON-formatted entries, and include correlation IDs per request. [Source: .agents/architecture/error-handling-strategy.md#logging-standards]
- Error handling must translate internal exceptions into structured MCP error responses using the error model and codes defined in the architecture. [Source: .agents/architecture/error-handling-strategy.md#general-approach]
- Validation middleware should apply Joi schemas at the MCP boundary to enforce whitelist validation and prevent unvalidated input from reaching tool logic. [Source: .agents/architecture/coding-standards.md#security]
- Rate limiting, CORS restrictions, and security headers follow the security requirements, with configurations favoring localhost during development. [Source: .agents/architecture/coding-standards.md#security]

### Configuration & Environment

- Configuration values (port, host, timeouts, logging levels) must load from `.env` with fallbacks and should be centralized in `config/` utilities for reuse. [Source: .agents/architecture/source-tree.md#source-tree]
- Timeout defaults for CLI interactions start at 30 seconds and should be exposed for override. [Source: .agents/architecture/error-handling-strategy.md#external-api-errors]
- Ensure the server exposes toggles for development vs production modes to enable stricter logging and middleware in production. [Source: .agents/architecture/tech-stack.md#technology-stack-table]

### Logging & Error Handling

- Generate a UUID correlation ID per request, propagate through middleware, and include it in success and error responses to satisfy observability needs. [Source: .agents/architecture/error-handling-strategy.md#logging-standards]
- Standardize error codes (e.g., `PARSE_ERROR`, `INVALID_PARAMS`, `TOOL_EXECUTION_ERROR`) and map thrown exceptions to the MCP error schema before responding. [Source: .agents/architecture/error-handling-strategy.md#error-handling-patterns]

### Data & Context Considerations

- Execution context should retain references to active project IDs, tool metadata, and data source handles so downstream tools (e.g., configure-data-source) can rely on consistent state. [Source: .agents/architecture/components.md#context-manager-component]
- No new persistent models are introduced, but ensure the context object can surface `ProjectModel` identifiers defined in the architecture for future persistence work. [Source: .agents/architecture/data-models.md#project-model]

### File Placement Guidance

- Follow the established source tree: server bootstrap in `src/server.ts`, router/registry/context/validator within `src/core/`, middleware per concern in `src/middleware/`, and shared utilities in `src/utils/`. [Source: .agents/architecture/source-tree.md#source-tree]
- Tests for `src/server.ts` and routing logic should live alongside their modules using `*.test.ts` naming, while higher-level integration scenarios belong in `tests/integration/`. [Source: .agents/architecture/coding-standards.md#test-strategy-and-standards]

### Security Considerations

- Apply input validation and rate limiting before tool execution to mitigate malformed or abusive requests, following the documented security posture. [Source: .agents/architecture/coding-standards.md#security]
- Ensure secrets (e.g., CLI tokens) are pulled from environment variables and never hard-coded. [Source: .agents/architecture/coding-standards.md#secrets-management]

### Testing

- Adhere to the Vitest-based testing strategy with colocated unit tests for router, middleware, and validator modules, and integration tests under `tests/integration/` to exercise end-to-end request handling. [Source: .agents/architecture/coding-standards.md#test-strategy-and-standards]
- Include scenarios covering success, validation failures, tool execution errors, timeout paths, and graceful shutdown behavior to meet the 80% coverage target. [Source: .agents/architecture/coding-standards.md#testing-philosophy]

## Change Log

| Date       | Version | Description                                                                                         | Author      |
| ---------- | ------- | --------------------------------------------------------------------------------------------------- | ----------- |
| 2025-10-16 | 0.1.0   | Implemented MCP server core routing, request validation middleware, and refreshed integration tests | James (dev) |

## Dev Agent Record

### Agent Model Used

- Codex (GPT-5)

### Debug Log References

- None

### Completion Notes

- Added streaming-aware JSON-RPC validation middleware to enforce content-type, payload size, and schema before delegating to the MCP transport.
- Introduced dedicated `/mcp` router wiring request validation and transport forwarding, simplifying server bootstrap responsibilities.
- Updated server bootstrap to register new router while preserving existing middleware pipeline and graceful shutdown semantics.
- Hardened integration tests to configure sandbox-safe host bindings and validated full request/response flow plus regression suite (`npm run test`).

### File List

- src/middleware/request-validation.ts
- src/core/router.ts
- src/server.ts
- tests/integration/mcp-endpoint.test.ts
- tests/integration/server-startup.test.ts

## QA Results
