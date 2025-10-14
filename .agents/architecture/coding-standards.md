# Coding Standards

## Core Standards

- **Languages & Runtimes:** TypeScript 5.7+, Node.js 20.x (LTS)
- **Style & Linting:** ESLint 9.x with Airbnb TypeScript style guide, Prettier 3.x for formatting
- **Test Organization:** Tests colocated with implementation files using `__tests__` subdirectories or `*.test.ts` naming convention
```

## Critical Rules

- **Tool Implementation:** All tools must extend BaseMCPTool class
- **Error Handling:** All tool methods must handle errors gracefully
- **Async Operations:** Use async/await consistently
- **File Operations:** Use provided fileSystem utilities, not direct fs calls

## Language-Specific Guidelines

- **TypeScript Specifics:**
  - **Interfaces:** Use interfaces for data structures
  - **Types:** Use types for unions and primitives
  - **Strict Mode:** Enable all strict TypeScript compiler options

# Test Strategy and Standards

## Testing Philosophy

- **Approach:** Test-after development with focus on integration testing
- **Coverage Goals:** 80% code coverage minimum
- **Test Pyramid:** 70% unit tests, 25% integration tests, 5% end-to-end tests

## Test Types and Organization

### Unit Tests

- **Framework:** Vitest
- **File Convention:** `*.test.ts` alongside implementation
- **Location:** Same directory as source files
- **Mocking Library:** Vitest built-in mocks
- **Coverage Requirement:** 80% per tool

**AI Agent Requirements:**
- Generate tests for all public methods
- Cover edge cases and error conditions
- Follow AAA pattern (Arrange, Act, Assert)
- Mock all external dependencies

### Integration Tests

- **Scope:** Tool execution with mocked file system
- **Location:** `tests/integration/`
- **Test Infrastructure:**
  - **File System:** In-memory file system mock
  - **Strudel CLI:** Mocked CLI responses
  - **Data Parsers:** Mocked parser outputs

### End-to-End Tests

- **Framework:** Vitest with real file system
- **Scope:** Complete tool workflows
- **Environment:** Temporary directories
- **Test Data:** Generated test projects

## Test Data Management

- **Strategy:** Generate test data programmatically
- **Fixtures:** `tests/fixtures/` directory
- **Factories:** Factory functions for common objects
- **Cleanup:** Vitest afterEach hooks for cleanup

## Continuous Testing

- **CI Integration:** Run on every git push
- **Performance Tests:** N/A for this project type
- **Security Tests:** npm audit in CI pipeline

# Security

## Input Validation

- **Validation Library:** Joi (via xmcp)
- **Validation Location:** At tool boundaries
- **Required Rules:**
  - All external inputs MUST be validated
  - Validation at API boundary before processing
  - Whitelist approach preferred over blacklist

## Authentication & Authorization

- **Auth Method:** Optional JWT middleware
- **Session Management:** Stateless JWT tokens
- **Required Patterns:**
  - Token validation before tool execution
  - Role-based access control for tools

## Secrets Management

- **Development:** .env files (gitignored)
- **Production:** Environment variables
- **Code Requirements:**
  - NEVER hardcode secrets
  - Access via configuration service only
  - No secrets in logs or error messages

## API Security

- **Rate Limiting:** Express-rate-limit middleware
- **CORS Policy:** Restrict to localhost in development
- **Security Headers:** Helmet.js middleware
- **HTTPS Enforcement:** Required in production

## Data Protection

- **Encryption at Rest:** N/A (User's local files)
- **Encryption in Transit:** HTTPS for remote deployments
- **PII Handling:** No PII processed by default
- **Logging Restrictions:** No sensitive data in logs

## Dependency Security

- **Scanning Tool:** npm audit
- **Update Policy:** Monthly dependency updates
- **Approval Process:** Review audit reports before updates

## Security Testing

- **SAST Tool:** ESLint security plugin
- **DAST Tool:** N/A (No public web interface)
- **Penetration Testing:** Annual third-party review

# Checklist Results Report

To be completed after review with the Product Owner.

# Next Steps

After completing the architecture:

1. If project has UI components:
   - Use "Frontend Architecture Mode"
   - Provide this document as input

2. For all projects:
   - Review with Product Owner
   - Begin story implementation with Dev agent
   - Set up infrastructure with DevOps agent

3. Specific prompts for next agents if needed:
   - For Frontend Architect: "Create frontend architecture for Strudel Kit MCP Server based on this backend architecture, focusing on React/TypeScript implementation with Strudel Kit components"