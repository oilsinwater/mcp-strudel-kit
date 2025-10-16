# Tech Stack

## Development MCP Servers

The following MCP servers are recommended for developing the Strudel Kit MCP Server:

| MCP Server                                  | Purpose                                          | Rationale                                                                         |
| ------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| **@modelcontextprotocol/server-filesystem** | File operations and project structure management | Essential for tool auto-discovery, CLI integration, and generated output handling |
| **@modelcontextprotocol/server-git**        | Version control operations                       | Required for project collaboration and version management                         |
| **@modelcontextprotocol/server-typescript** | TypeScript compilation and type checking         | Core requirement for TypeScript 5.0+ development and strict mode compliance       |
| **@modelcontextprotocol/server-vitest**     | Testing framework support                        | Supports the 80% coverage requirement with native TypeScript and ESM support      |
| **@modelcontextprotocol/server-eslint**     | Code linting and style enforcement               | Enforces Airbnb TypeScript style guide and coding standards                       |
| **@modelcontextprotocol/server-npm**        | Package management                               | Manages scientific data parsing libraries (CSV, JSON, HDF5, NetCDF)               |
| **@modelcontextprotocol/server-subprocess** | Child process management                         | Critical for Strudel CLI integration via subprocess execution                     |
| **@modelcontextprotocol/server-markdown**   | Documentation maintenance                        | Supports architecture documentation and README management                         |
| **@modelcontextprotocol/server-mermaid**    | Diagram generation                               | Maintains architectural diagrams and component visualizations                     |

## Cloud Infrastructure

- **Provider:** N/A (Self-hosted/Developer machine)
- **Key Services:** N/A
- **Deployment Regions:** N/A

## Technology Stack Table

| Category          | Technology                   | Version | Purpose                      | Rationale                                                     |
| ----------------- | ---------------------------- | ------- | ---------------------------- | ------------------------------------------------------------- |
| **Language**      | TypeScript                   | 5.0+    | Primary development language | Strong typing, excellent tooling, aligns with Strudel Kit     |
| **Runtime**       | Node.js                      | 18.x    | JavaScript runtime           | LTS version, wide ecosystem, required by xmcp                 |
| **Framework**     | xmcp                         | latest  | MCP framework                | Core requirement for building MCP servers                     |
| **Web Framework** | Express.js                   | 4.x     | HTTP server                  | Provided by xmcp, lightweight and well-known                  |
| **Data Formats**  | CSV/JSON/HDF5/NetCDF parsers | latest  | Scientific data parsing      | Required for configure-data-source tool                       |
| **Testing**       | Vitest                       | latest  | Testing framework            | Native TypeScript support, faster execution, ESM-first design |
| **Build Tool**    | ESBuild/SWC                  | latest  | Compilation                  | Fast compilation, used by xmcp                                |
| **Development**   | Hot Module Replacement       | latest  | Development experience       | Required for hot reloading support                            |
