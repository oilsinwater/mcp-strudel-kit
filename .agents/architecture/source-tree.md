# Source Tree

```
strudel-kit-mcp-server/
├── .agents/                   // Hidden workspace docs (architecture, PRD shards, stories, QA)
│   ├── architecture/          // Detailed architecture shards
│   ├── stories/               // Epic and story specifications
│   ├── prd/                   // PRD shards and indices
│   ├── qa/                    // QA gates, risk profiles, and reviews
│   ├── architecture.md        // Architecture overview index
│   └── prd.md                 // PRD overview index
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
├── tests/                     // Unit and integration tests
├── config/                    // Configuration files
└── package.json               // Project configuration
```
