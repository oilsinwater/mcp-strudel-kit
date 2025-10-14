# External APIs

## Strudel Kit CLI API

- **Purpose:** Generate and modify Strudel Kit applications
- **Documentation:** https://github.com/strudel-science/strudel-kit
- **Base URL(s):** Executed as subprocess commands
- **Authentication:** N/A (local execution)
- **Rate Limits:** Limited by system resources

**Key Endpoints Used:**
- `npx strudel-kit create` - Create new projects
- `npx strudel-kit add-flow` - Add task flows to existing projects
- `npx strudel-kit customize` - Modify component properties

**Integration Notes:** The CLI is executed as a child process with specific parameters based on MCP tool requests. Results are captured and processed by the server.
