# Source Tree

```
strudel-kit-mcp-server/
├── src/
│   ├── server.ts              // Main server entry point
│   ├── core/
│   │   ├── registry.ts        // Tool auto-discovery & registration
│   │   ├── router.ts          // MCP request routing
│   │   ├── context.ts         // Execution context management
│   │   └── validator.ts       // Input/output validation
│   ├── middleware/
│   │   ├── auth.ts            // Optional authentication
│   │   ├── logging.ts         // Request/response logging
│   │   ├── rateLimit.ts       // Rate limiting
│   │   └── error.ts           // Error handling
│   ├── tools/
│   │   ├── base.tool.ts       // Abstract tool class
│   │   ├── create-project.ts
│   │   ├── add-task-flow.ts
│   │   ├── customize-components.ts
│   │   ├── configure-data-source.ts
│   │   └── generate-workflow.ts
│   ├── integrations/
│   │   ├── strudel/
│   │   │   ├── cli.ts         // CLI wrapper
│   │   │   ├── components.ts  // Component registry
│   │   │   └── templates.ts   // Template management
│   │   └── data/
│   │       ├── parsers.ts     // CSV, JSON, HDF5, NetCDF
│   │       └── validators.ts  // Schema validation
│   └── utils/
│       ├── fileSystem.ts      // File operations
│       ├── process.ts         // Child process management
│       └── cache.ts           // Response caching
├── docs/                      // Documentation
├── tests/                     // Unit and integration tests
├── config/                    // Configuration files
└── package.json               // Project configuration
```
