import Joi from 'joi';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ServerConfig {
  host: string;
  port: number;
  nodeEnv: 'development' | 'test' | 'staging' | 'production';
}

export interface ToolingConfig {
  toolExecutionTimeout: number;
  maxConcurrentTools: number;
  hotReloadEnabled: boolean;
  toolScanInterval: number;
}

export interface LoggingConfig {
  level: LogLevel;
  logRequests: boolean;
}

export interface SecurityConfig {
  rateLimitRequests: number;
  rateLimitWindowMs: number;
  corsEnabled: boolean;
  corsOrigins: string[];
}

export interface AppConfig {
  server: ServerConfig;
  tooling: ToolingConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
}

const booleanSchema = Joi.boolean().truthy('true').truthy('1').falsy('false').falsy('0');

const envSchema = Joi.object({
  PORT: Joi.number().port().default(3000),
  HOST: Joi.string().default('0.0.0.0'),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'staging', 'production')
    .default('development'),
  TOOL_EXECUTION_TIMEOUT: Joi.number().integer().min(1000).default(30_000),
  MAX_CONCURRENT_TOOLS: Joi.number().integer().min(1).default(5),
  HOT_RELOAD_ENABLED: booleanSchema.default(false),
  TOOL_SCAN_INTERVAL: Joi.number().integer().min(1000).default(15_000),
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
  LOG_REQUESTS: booleanSchema.default(true),
  RATE_LIMIT_REQUESTS: Joi.number().integer().min(1).default(120),
  RATE_LIMIT_WINDOW: Joi.number().integer().min(1000).default(60_000),
  CORS_ENABLED: booleanSchema.default(true),
  CORS_ORIGINS: Joi.string().allow('').default(''),
}).unknown(true);

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const { value, error } = envSchema.validate(env, { abortEarly: false, convert: true });

  if (error) {
    throw new Error(`Invalid environment configuration: ${error.message}`);
  }

  const corsOriginsRaw = value.CORS_ORIGINS as string;
  const corsOrigins = corsOriginsRaw
    .split(',')
    .map((origin: string) => origin.trim())
    .filter((origin: string) => origin.length > 0);

  return {
    server: {
      host: value.HOST,
      port: value.PORT,
      nodeEnv: value.NODE_ENV,
    },
    tooling: {
      toolExecutionTimeout: value.TOOL_EXECUTION_TIMEOUT,
      maxConcurrentTools: value.MAX_CONCURRENT_TOOLS,
      hotReloadEnabled: value.HOT_RELOAD_ENABLED,
      toolScanInterval: value.TOOL_SCAN_INTERVAL,
    },
    logging: {
      level: value.LOG_LEVEL,
      logRequests: value.LOG_REQUESTS,
    },
    security: {
      rateLimitRequests: value.RATE_LIMIT_REQUESTS,
      rateLimitWindowMs: value.RATE_LIMIT_WINDOW,
      corsEnabled: value.CORS_ENABLED,
      corsOrigins,
    },
  };
}
