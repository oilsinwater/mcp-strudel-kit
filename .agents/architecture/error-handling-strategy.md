# Error Handling Strategy

## General Approach

- **Error Model:** Exception-based with structured error responses
- **Exception Hierarchy:** BaseMCPError -> SpecificErrorTypes
- **Error Propagation:** Through tool execution chain with context preservation

## Logging Standards

- **Library:** Winston (via xmcp)
- **Format:** JSON with timestamp, level, message, and context
- **Levels:** error, warn, info, debug
- **Required Context:**
  - Correlation ID: UUID generated per request
  - Service Context: Tool name and version
  - User Context: Project ID when applicable

## Error Handling Patterns

### External API Errors

- **Retry Policy:** Exponential backoff for CLI operations
- **Circuit Breaker:** N/A (local CLI execution)
- **Timeout Configuration:** 30 seconds for CLI commands
- **Error Translation:** Map CLI errors to user-friendly messages

### Business Logic Errors

- **Custom Exceptions:** ToolValidationError, ProjectCreationError, DataSourceError
- **User-Facing Errors:** Structured JSON responses with error codes
- **Error Codes:** PROJECT_EXISTS, INVALID_TOOL_PARAMS, DATA_PARSE_ERROR

### Data Consistency

- **Transaction Strategy:** N/A (File system operations)
- **Compensation Logic:** Rollback file operations on failure
- **Idempotency:** Tools designed to be idempotent where possible
