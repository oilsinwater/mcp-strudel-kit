/**
 * Environment Configuration Management
 * Centralized configuration loading and validation for all environments
 */

import { config } from 'dotenv';
import Joi from 'joi';
import path from 'path';

export type MCPServerType = 'serena' | 'playwright' | 'github';

export interface MCPServerConnectionDefinition {
  /** Identifies the MCP server integration type. */
  type: MCPServerType;
  /** Human-friendly server name for logging and dashboards. */
  name: string;
  /** Resolved endpoint URI used when establishing the MCP link. */
  endpoint: string;
  /** Allows disabling connections without removing configuration. */
  enabled: boolean;
}

export interface MCPAgentConnection {
  /** Stable identifier that maps to the consuming agent. */
  agentId: string;
  /** Display label surfaced to coordination tooling. */
  displayName: string;
  /** Optional description for documentation surfaces. */
  description?: string;
  /** MCP server connections the agent should establish. */
  servers: MCPServerConnectionDefinition[];
}

// Load environment variables from .env file
config();

/**
 * Configuration interface defining all application settings
 */
export interface AppConfig {
  // Server configuration
  server: {
    port: number;
    host: string;
    nodeEnv: 'development' | 'test' | 'staging' | 'production';
    instanceId: string;
  };

  // MCP server settings
  mcp: {
    toolExecutionTimeout: number;
    maxConcurrentTools: number;
    hotReloadEnabled: boolean;
    toolScanInterval: number;
  };

  // MCP agent connection registry
  mcpAgents: MCPAgentConnection[];

  // Logging configuration
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
    logRequests: boolean;
    filePath?: string;
    maxSize: number;
    maxFiles: number;
  };

  // Data persistence
  persistence: {
    strategy: 'file-only' | 'file-with-cache' | 'file-with-database';
    dataPath: string;
    compression: boolean;
    encryption: boolean;
    tempFileTTL: number;
    projectRetentionDays: number;
    autoCleanup: boolean;
  };

  // Caching configuration
  cache: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
    cleanupInterval: number;
  };

  // Security settings
  security: {
    authEnabled: boolean;
    jwtSecret?: string;
    jwtExpiresIn: string;
    rateLimitRequests: number;
    rateLimitWindow: number;
    corsEnabled: boolean;
    corsOrigins: string[];
    maxRequestSize: string;
  };

  // Strudel Kit integration
  strudelKit: {
    cliPath: string;
    defaultTemplate: string;
    cliTimeout: number;
    captureOutput: boolean;
  };

  // Scientific data processing
  dataProcessing: {
    maxFileSize: number;
    supportedFormats: string[];
    chunkSize: number;
    schemaInference: boolean;
    schemaConfidenceThreshold: number;
  };

  // External services
  externalServices: {
    apiTimeout: number;
    retries: number;
    retryDelay: number;
  };

  // Monitoring and metrics
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
    memoryAlertThreshold: number;
    executionTimeAlertThreshold: number;
    healthCheckEnabled: boolean;
    healthCheckInterval: number;
  };

  // Development settings
  development: {
    developmentMode: boolean;
    debugEndpoints: boolean;
    mockExternalServices: boolean;
    mockServicePort: number;
    requestTracing: boolean;
  };

  // Testing configuration
  testing: {
    testDataPath: string;
    testMode: boolean;
    testTimeout: number;
  };

  // Database configuration (optional)
  database?: {
    url: string;
    adapter: 'postgresql' | 'sqlite' | 'mongodb';
    poolSize: number;
    connectionTimeout: number;
    queryTimeout: number;
    migrationsEnabled: boolean;
  };

  // Cloud storage (optional)
  cloudStorage?: {
    provider: 's3' | 'gcs' | 'azure';
    config: Record<string, any>;
  };

  // Error reporting
  errorReporting: {
    service: 'sentry' | 'rollbar' | 'none';
    dsn?: string;
    sampleRate: number;
  };

  // Feature flags
  features: {
    experimental: boolean;
    newToolDiscovery: boolean;
    workflowGeneration: boolean;
    advancedDataProcessing: boolean;
  };
}

/**
 * Configuration schema for validation
 */
const configSchema = Joi.object<AppConfig>({
  server: Joi.object({
    port: Joi.number().port().default(3000),
    host: Joi.string().default('localhost'),
    nodeEnv: Joi.string().valid('development', 'test', 'staging', 'production').default('development'),
    instanceId: Joi.string().default('mcp-server-1')
  }).required(),

  mcp: Joi.object({
    toolExecutionTimeout: Joi.number().min(1000).default(30000),
    maxConcurrentTools: Joi.number().min(1).default(10),
    hotReloadEnabled: Joi.boolean().default(true),
    toolScanInterval: Joi.number().min(1000).default(5000)
  }).required(),

  mcpAgents: Joi.array()
    .items(
      Joi.object({
        agentId: Joi.string().required(),
        displayName: Joi.string().required(),
        description: Joi.string().allow('').optional(),
        servers: Joi.array()
          .items(
            Joi.object({
              type: Joi.string().valid('serena', 'playwright', 'github').required(),
              name: Joi.string().required(),
              endpoint: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
              enabled: Joi.boolean().default(true)
            })
          )
          .min(1)
          .required()
      })
    )
    .min(1)
    .required(),

  logging: Joi.object({
    level: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
    format: Joi.string().valid('json', 'text').default('json'),
    logRequests: Joi.boolean().default(true),
    filePath: Joi.string().optional(),
    maxSize: Joi.number().min(1024).default(10485760),
    maxFiles: Joi.number().min(1).default(5)
  }).required(),

  persistence: Joi.object({
    strategy: Joi.string().valid('file-only', 'file-with-cache', 'file-with-database').default('file-with-cache'),
    dataPath: Joi.string().default('./data'),
    compression: Joi.boolean().default(false),
    encryption: Joi.boolean().default(false),
    tempFileTTL: Joi.number().min(60000).default(3600000),
    projectRetentionDays: Joi.number().min(1).default(30),
    autoCleanup: Joi.boolean().default(true)
  }).required(),

  cache: Joi.object({
    enabled: Joi.boolean().default(true),
    maxSize: Joi.number().min(10).default(1000),
    ttl: Joi.number().min(1000).default(300000),
    cleanupInterval: Joi.number().min(10000).default(60000)
  }).required(),

  security: Joi.object({
    authEnabled: Joi.boolean().default(false),
    jwtSecret: Joi.string().when('authEnabled', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    jwtExpiresIn: Joi.string().default('24h'),
    rateLimitRequests: Joi.number().min(1).default(100),
    rateLimitWindow: Joi.number().min(1000).default(60000),
    corsEnabled: Joi.boolean().default(true),
    corsOrigins: Joi.array().items(Joi.string()).default(['http://localhost:3000']),
    maxRequestSize: Joi.string().default('10mb')
  }).required(),

  strudelKit: Joi.object({
    cliPath: Joi.string().default('strudel'),
    defaultTemplate: Joi.string().default('basic-scientific'),
    cliTimeout: Joi.number().min(5000).default(60000),
    captureOutput: Joi.boolean().default(true)
  }).required(),

  dataProcessing: Joi.object({
    maxFileSize: Joi.number().min(1024).default(104857600),
    supportedFormats: Joi.array().items(Joi.string()).default(['csv', 'json', 'hdf5', 'netcdf']),
    chunkSize: Joi.number().min(100).default(1000),
    schemaInference: Joi.boolean().default(true),
    schemaConfidenceThreshold: Joi.number().min(0).max(1).default(0.8)
  }).required(),

  externalServices: Joi.object({
    apiTimeout: Joi.number().min(1000).default(10000),
    retries: Joi.number().min(0).default(3),
    retryDelay: Joi.number().min(100).default(1000)
  }).required(),

  monitoring: Joi.object({
    enabled: Joi.boolean().default(true),
    metricsInterval: Joi.number().min(1000).default(60000),
    memoryAlertThreshold: Joi.number().min(100).default(512),
    executionTimeAlertThreshold: Joi.number().min(1000).default(5000),
    healthCheckEnabled: Joi.boolean().default(true),
    healthCheckInterval: Joi.number().min(1000).default(30000)
  }).required(),

  development: Joi.object({
    developmentMode: Joi.boolean().default(false),
    debugEndpoints: Joi.boolean().default(false),
    mockExternalServices: Joi.boolean().default(false),
    mockServicePort: Joi.number().port().default(3001),
    requestTracing: Joi.boolean().default(false)
  }).required(),

  testing: Joi.object({
    testDataPath: Joi.string().default('./test-data'),
    testMode: Joi.boolean().default(false),
    testTimeout: Joi.number().min(1000).default(30000)
  }).required(),

  database: Joi.object({
    url: Joi.string().required(),
    adapter: Joi.string().valid('postgresql', 'sqlite', 'mongodb').default('postgresql'),
    poolSize: Joi.number().min(1).default(10),
    connectionTimeout: Joi.number().min(1000).default(5000),
    queryTimeout: Joi.number().min(1000).default(10000),
    migrationsEnabled: Joi.boolean().default(true)
  }).optional(),

  cloudStorage: Joi.object({
    provider: Joi.string().valid('s3', 'gcs', 'azure').required(),
    config: Joi.object().required()
  }).optional(),

  errorReporting: Joi.object({
    service: Joi.string().valid('sentry', 'rollbar', 'none').default('none'),
    dsn: Joi.string().when('service', {
      is: Joi.valid('sentry', 'rollbar'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    sampleRate: Joi.number().min(0).max(1).default(1.0)
  }).required(),

  features: Joi.object({
    experimental: Joi.boolean().default(false),
    newToolDiscovery: Joi.boolean().default(true),
    workflowGeneration: Joi.boolean().default(false),
    advancedDataProcessing: Joi.boolean().default(false)
  }).required()
});

/**
 * Load and validate configuration from environment variables
 */
function loadConfig(): AppConfig {
  const serenaEndpoint = process.env.MCP_SERVER_SERENA_ENDPOINT || 'http://localhost:4100';
  const playwrightEndpoint = process.env.MCP_SERVER_PLAYWRIGHT_ENDPOINT || 'http://localhost:4200';
  const githubEndpoint = process.env.MCP_SERVER_GITHUB_ENDPOINT || 'https://api.github.com';

  const serenaEnabled = process.env.MCP_SERVER_SERENA_ENABLED !== 'false';
  const playwrightEnabled = process.env.MCP_SERVER_PLAYWRIGHT_ENABLED !== 'false';
  const githubEnabled = process.env.MCP_SERVER_GITHUB_ENABLED !== 'false';

  const baseServerDefinitions: MCPServerConnectionDefinition[] = [
    {
      type: 'serena',
      name: 'Serena MCP Server',
      endpoint: serenaEndpoint,
      enabled: serenaEnabled
    },
    {
      type: 'playwright',
      name: 'Playwright MCP Server',
      endpoint: playwrightEndpoint,
      enabled: playwrightEnabled
    },
    {
      type: 'github',
      name: 'GitHub MCP Server',
      endpoint: githubEndpoint,
      enabled: githubEnabled
    }
  ];

  const agentDefinitions: Array<{ agentId: string; displayName: string; description?: string }> = [
    { agentId: 'claude', displayName: 'Claude' },
    { agentId: 'gemini', displayName: 'Gemini' },
    { agentId: 'quinn', displayName: 'Quinn' },
    { agentId: 'opencode', displayName: 'OpenCode' },
    { agentId: 'crush', displayName: 'Crush' },
    { agentId: 'coding', displayName: 'Coding Agents' }
  ];

  const agentConnections: MCPAgentConnection[] = agentDefinitions.map(({ agentId, displayName, description }) => ({
    agentId,
    displayName,
    description,
    servers: baseServerDefinitions.map((server) => ({ ...server }))
  }));

  const rawConfig = {
    server: {
      port: parseInt(process.env.PORT || '3000'),
      host: process.env.HOST || 'localhost',
      nodeEnv: process.env.NODE_ENV || 'development',
      instanceId: process.env.INSTANCE_ID || 'mcp-server-1'
    },

    mcp: {
      toolExecutionTimeout: parseInt(process.env.TOOL_EXECUTION_TIMEOUT || '30000'),
      maxConcurrentTools: parseInt(process.env.MAX_CONCURRENT_TOOLS || '10'),
      hotReloadEnabled: process.env.HOT_RELOAD_ENABLED !== 'false',
      toolScanInterval: parseInt(process.env.TOOL_SCAN_INTERVAL || '5000')
    },

    mcpAgents: agentConnections,

    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'json',
      logRequests: process.env.LOG_REQUESTS !== 'false',
      filePath: process.env.LOG_FILE_PATH || undefined,
      maxSize: parseInt(process.env.LOG_MAX_SIZE || '10485760'),
      maxFiles: parseInt(process.env.LOG_MAX_FILES || '5')
    },

    persistence: {
      strategy: process.env.PERSISTENCE_STRATEGY || 'file-with-cache',
      dataPath: process.env.DATA_PATH || './data',
      compression: process.env.ENABLE_COMPRESSION === 'true',
      encryption: process.env.ENABLE_ENCRYPTION === 'true',
      tempFileTTL: parseInt(process.env.TEMP_FILE_TTL || '3600000'),
      projectRetentionDays: parseInt(process.env.PROJECT_RETENTION_DAYS || '30'),
      autoCleanup: process.env.AUTO_CLEANUP !== 'false'
    },

    cache: {
      enabled: process.env.CACHE_ENABLED !== 'false',
      maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000'),
      ttl: parseInt(process.env.CACHE_TTL || '300000'),
      cleanupInterval: parseInt(process.env.CACHE_CLEANUP_INTERVAL || '60000')
    },

    security: {
      authEnabled: process.env.AUTH_ENABLED === 'true',
      jwtSecret: process.env.JWT_SECRET,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
      rateLimitRequests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
      corsEnabled: process.env.CORS_ENABLED !== 'false',
      corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb'
    },

    strudelKit: {
      cliPath: process.env.STRUDEL_CLI_PATH || 'strudel',
      defaultTemplate: process.env.DEFAULT_TEMPLATE || 'basic-scientific',
      cliTimeout: parseInt(process.env.STRUDEL_CLI_TIMEOUT || '60000'),
      captureOutput: process.env.CAPTURE_CLI_OUTPUT !== 'false'
    },

    dataProcessing: {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'),
      supportedFormats: process.env.SUPPORTED_FORMATS?.split(',') || ['csv', 'json', 'hdf5', 'netcdf'],
      chunkSize: parseInt(process.env.DATA_CHUNK_SIZE || '1000'),
      schemaInference: process.env.ENABLE_SCHEMA_INFERENCE !== 'false',
      schemaConfidenceThreshold: parseFloat(process.env.SCHEMA_CONFIDENCE_THRESHOLD || '0.8')
    },

    externalServices: {
      apiTimeout: parseInt(process.env.EXTERNAL_API_TIMEOUT || '10000'),
      retries: parseInt(process.env.EXTERNAL_API_RETRIES || '3'),
      retryDelay: parseInt(process.env.EXTERNAL_API_RETRY_DELAY || '1000')
    },

    monitoring: {
      enabled: process.env.MONITORING_ENABLED !== 'false',
      metricsInterval: parseInt(process.env.METRICS_INTERVAL || '60000'),
      memoryAlertThreshold: parseInt(process.env.MEMORY_ALERT_THRESHOLD || '512'),
      executionTimeAlertThreshold: parseInt(process.env.EXECUTION_TIME_ALERT_THRESHOLD || '5000'),
      healthCheckEnabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000')
    },

    development: {
      developmentMode: process.env.DEVELOPMENT_MODE === 'true',
      debugEndpoints: process.env.DEBUG_ENDPOINTS === 'true',
      mockExternalServices: process.env.MOCK_EXTERNAL_SERVICES === 'true',
      mockServicePort: parseInt(process.env.MOCK_SERVICE_PORT || '3001'),
      requestTracing: process.env.REQUEST_TRACING === 'true'
    },

    testing: {
      testDataPath: process.env.TEST_DATA_PATH || './test-data',
      testMode: process.env.TEST_MODE === 'true',
      testTimeout: parseInt(process.env.TEST_TIMEOUT || '30000')
    },

    errorReporting: {
      service: process.env.ERROR_REPORTING || 'none',
      dsn: process.env.SENTRY_DSN,
      sampleRate: parseFloat(process.env.ERROR_SAMPLE_RATE || '1.0')
    },

    features: {
      experimental: process.env.EXPERIMENTAL_FEATURES === 'true',
      newToolDiscovery: process.env.ENABLE_NEW_TOOL_DISCOVERY !== 'false',
      workflowGeneration: process.env.ENABLE_WORKFLOW_GENERATION === 'true',
      advancedDataProcessing: process.env.ENABLE_ADVANCED_DATA_PROCESSING === 'true'
    }
  };

  // Add optional database configuration
  if (process.env.DATABASE_URL) {
    (rawConfig as any).database = {
      url: process.env.DATABASE_URL,
      adapter: process.env.DB_ADAPTER || 'postgresql',
      poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '10000'),
      migrationsEnabled: process.env.DB_MIGRATIONS_ENABLED !== 'false'
    };
  }

  // Add optional cloud storage configuration
  if (process.env.CLOUD_STORAGE_PROVIDER) {
    const provider = process.env.CLOUD_STORAGE_PROVIDER as 's3' | 'gcs' | 'azure';
    let config: Record<string, any> = {};

    switch (provider) {
      case 's3':
        config = {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION,
          bucket: process.env.S3_BUCKET_NAME
        };
        break;
      case 'gcs':
        config = {
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          keyFile: process.env.GOOGLE_CLOUD_KEY_FILE,
          bucket: process.env.GCS_BUCKET_NAME
        };
        break;
      case 'azure':
        config = {
          account: process.env.AZURE_STORAGE_ACCOUNT,
          key: process.env.AZURE_STORAGE_KEY,
          container: process.env.AZURE_CONTAINER_NAME
        };
        break;
    }

    (rawConfig as any).cloudStorage = { provider, config };
  }

  // Validate configuration
  const { error, value } = configSchema.validate(rawConfig, {
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    throw new Error(`Configuration validation failed: ${error.message}`);
  }

  return value;
}

/**
 * Environment-specific configuration overrides
 */
function applyEnvironmentOverrides(config: AppConfig): AppConfig {
  switch (config.server.nodeEnv) {
    case 'development':
      return {
        ...config,
        development: {
          ...config.development,
          developmentMode: true,
          debugEndpoints: true
        },
        logging: {
          ...config.logging,
          level: 'debug',
          format: 'text'
        }
      };

    case 'test':
      return {
        ...config,
        testing: {
          ...config.testing,
          testMode: true
        },
        logging: {
          ...config.logging,
          level: 'error',
          logRequests: false
        },
        cache: {
          ...config.cache,
          enabled: false
        }
      };

    case 'staging':
      return {
        ...config,
        monitoring: {
          ...config.monitoring,
          enabled: true
        },
        security: {
          ...config.security,
          authEnabled: true
        }
      };

    case 'production':
      return {
        ...config,
        development: {
          ...config.development,
          developmentMode: false,
          debugEndpoints: false,
          mockExternalServices: false,
          requestTracing: false
        },
        logging: {
          ...config.logging,
          level: 'info'
        },
        security: {
          ...config.security,
          authEnabled: true
        },
        monitoring: {
          ...config.monitoring,
          enabled: true
        }
      };

    default:
      return config;
  }
}

/**
 * Load and export the application configuration
 */
export const appConfig: AppConfig = applyEnvironmentOverrides(loadConfig());

/**
 * Configuration validation helper
 */
export function validateConfig(): void {
  // Additional runtime validations
  if (appConfig.security.authEnabled && !appConfig.security.jwtSecret) {
    throw new Error('JWT_SECRET is required when authentication is enabled');
  }

  if (appConfig.server.nodeEnv === 'production' && appConfig.development.developmentMode) {
    throw new Error('Development mode should be disabled in production');
  }

  // Validate paths exist and are writable
  const fs = require('fs');
  try {
    fs.accessSync(path.dirname(appConfig.persistence.dataPath), fs.constants.W_OK);
  } catch {
    throw new Error(`Data path is not writable: ${appConfig.persistence.dataPath}`);
  }
}

/**
 * Get configuration for specific component
 */
export function getComponentConfig<K extends keyof AppConfig>(component: K): AppConfig[K] {
  return appConfig[component];
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
  return appConfig.features[feature];
}

/**
 * Get environment-specific settings
 */
export function getEnvironmentInfo() {
  return {
    nodeEnv: appConfig.server.nodeEnv,
    isDevelopment: appConfig.server.nodeEnv === 'development',
    isTest: appConfig.server.nodeEnv === 'test',
    isStaging: appConfig.server.nodeEnv === 'staging',
    isProduction: appConfig.server.nodeEnv === 'production',
    instanceId: appConfig.server.instanceId
  };
}
