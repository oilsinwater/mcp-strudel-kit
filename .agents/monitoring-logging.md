# Monitoring and Logging Strategy

**Version**: 1.0
**Date**: September 19, 2025
**Status**: Implementation Guide

## Overview

The Strudel Kit MCP Server employs comprehensive monitoring and logging to ensure reliability, performance, and observability. This document outlines the complete approach to monitoring system health, tracking performance metrics, and maintaining detailed logs for debugging and analysis.

## Logging Architecture

### Structured Logging Format

All logs follow a consistent JSON structure for machine readability and efficient processing:

```typescript
interface LogEntry {
  timestamp: string; // ISO 8601 format
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string; // Human-readable message
  correlationId: string; // Request correlation ID
  component: string; // Component generating the log
  tool?: string; // Tool name (if applicable)
  duration?: number; // Operation duration (ms)
  metadata: Record<string, any>; // Additional context data
  error?: {
    // Error details (for error logs)
    name: string;
    message: string;
    stack: string;
    code?: string;
  };
}
```

### Log Levels and Usage

| Level     | Usage                     | Examples                                        | Retention |
| --------- | ------------------------- | ----------------------------------------------- | --------- |
| **DEBUG** | Detailed flow information | Variable values, internal state changes         | 7 days    |
| **INFO**  | Normal operational events | Tool execution start/completion, server startup | 30 days   |
| **WARN**  | Warning conditions        | Performance degradation, deprecated features    | 90 days   |
| **ERROR** | Error conditions          | Tool failures, validation errors                | 1 year    |
| **FATAL** | System-critical failures  | Server crashes, unrecoverable errors            | Permanent |

### Logging Implementation

```typescript
// Core logging service
import winston from 'winston';
import { appConfig } from '@/config/environments';

export class Logger {
  private winston: winston.Logger;

  constructor(component: string) {
    this.winston = winston.createLogger({
      level: appConfig.logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { component },
      transports: this.createTransports(),
    });
  }

  info(message: string, metadata: any = {}, correlationId?: string): void {
    this.winston.info(message, {
      ...metadata,
      correlationId: correlationId || this.generateCorrelationId(),
    });
  }

  warn(message: string, metadata: any = {}, correlationId?: string): void {
    this.winston.warn(message, {
      ...metadata,
      correlationId: correlationId || this.generateCorrelationId(),
    });
  }

  error(message: string, error?: Error, metadata: any = {}, correlationId?: string): void {
    this.winston.error(message, {
      ...metadata,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
      correlationId: correlationId || this.generateCorrelationId(),
    });
  }

  debug(message: string, metadata: any = {}, correlationId?: string): void {
    this.winston.debug(message, {
      ...metadata,
      correlationId: correlationId || this.generateCorrelationId(),
    });
  }

  // Create child logger with additional context
  child(additionalMeta: Record<string, any>): Logger {
    const childLogger = new Logger(this.winston.defaultMeta.component);
    childLogger.winston = this.winston.child(additionalMeta);
    return childLogger;
  }

  private createTransports(): winston.transport[] {
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format:
          appConfig.logging.format === 'text'
            ? winston.format.combine(winston.format.colorize(), winston.format.simple())
            : winston.format.json(),
      }),
    ];

    // Add file transport if configured
    if (appConfig.logging.filePath) {
      transports.push(
        new winston.transports.File({
          filename: appConfig.logging.filePath,
          maxsize: appConfig.logging.maxSize,
          maxFiles: appConfig.logging.maxFiles,
          tailable: true,
        }),
      );
    }

    return transports;
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export configured logger instances
export const logger = new Logger('mcp-server');
export const toolLogger = new Logger('tool-execution');
export const requestLogger = new Logger('http-requests');
```

### Request Logging Middleware

```typescript
// HTTP request/response logging middleware
export function requestLoggingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Add correlation ID to request for downstream use
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    const startTime = Date.now();

    // Log request
    requestLogger.info(
      'HTTP request received',
      {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        contentLength: req.headers['content-length'],
      },
      correlationId,
    );

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level = res.statusCode >= 400 ? 'error' : 'info';

      requestLogger[level](
        'HTTP request completed',
        {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          responseSize: res.getHeader('content-length'),
        },
        correlationId,
      );
    });

    next();
  };
}
```

## Performance Monitoring

### Metrics Collection

```typescript
// Performance metrics collector
export class MetricsCollector {
  private metrics: Map<string, MetricValue> = new Map();
  private timers: Map<string, number> = new Map();

  // Counter metrics
  incrementCounter(name: string, value: number = 1, tags: Record<string, string> = {}): void {
    const key = this.buildMetricKey(name, tags);
    const current = this.metrics.get(key) || { type: 'counter', value: 0, timestamp: Date.now() };
    current.value += value;
    current.timestamp = Date.now();
    this.metrics.set(key, current);
  }

  // Gauge metrics (current value)
  setGauge(name: string, value: number, tags: Record<string, string> = {}): void {
    const key = this.buildMetricKey(name, tags);
    this.metrics.set(key, {
      type: 'gauge',
      value,
      timestamp: Date.now(),
    });
  }

  // Histogram metrics (distribution of values)
  recordHistogram(name: string, value: number, tags: Record<string, string> = {}): void {
    const key = this.buildMetricKey(name, tags);
    const existing = (this.metrics.get(key) as HistogramMetric) || {
      type: 'histogram',
      values: [],
      count: 0,
      sum: 0,
      timestamp: Date.now(),
    };

    existing.values.push(value);
    existing.count++;
    existing.sum += value;
    existing.timestamp = Date.now();

    // Keep only last 1000 values for percentile calculation
    if (existing.values.length > 1000) {
      existing.values = existing.values.slice(-1000);
    }

    this.metrics.set(key, existing);
  }

  // Timer utilities
  startTimer(name: string): void {
    this.timers.set(name, Date.now());
  }

  endTimer(name: string, tags: Record<string, string> = {}): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn(`Timer not found: ${name}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(name);
    this.recordHistogram(`${name}.duration`, duration, tags);
    return duration;
  }

  // Get current metrics
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, metric] of this.metrics.entries()) {
      if (metric.type === 'histogram') {
        const values = (metric as HistogramMetric).values.sort((a, b) => a - b);
        result[key] = {
          count: metric.value,
          sum: (metric as HistogramMetric).sum,
          avg: (metric as HistogramMetric).sum / (metric as HistogramMetric).count,
          p50: this.percentile(values, 0.5),
          p95: this.percentile(values, 0.95),
          p99: this.percentile(values, 0.99),
          min: values[0],
          max: values[values.length - 1],
        };
      } else {
        result[key] = {
          value: metric.value,
          timestamp: metric.timestamp,
        };
      }
    }

    return result;
  }

  private buildMetricKey(name: string, tags: Record<string, string>): string {
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');

    return tagString ? `${name}{${tagString}}` : name;
  }

  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil(sortedValues.length * p) - 1;
    return sortedValues[Math.max(0, index)];
  }
}

interface MetricValue {
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  timestamp: number;
}

interface HistogramMetric extends MetricValue {
  type: 'histogram';
  values: number[];
  count: number;
  sum: number;
}

// Global metrics instance
export const metrics = new MetricsCollector();
```

### Key Performance Indicators

```typescript
// KPI tracking for MCP server operations
export class KPITracker {
  private metricsCollector: MetricsCollector;

  constructor(metricsCollector: MetricsCollector) {
    this.metricsCollector = metricsCollector;
  }

  // Tool execution metrics
  trackToolExecution(toolName: string, duration: number, success: boolean): void {
    this.metricsCollector.incrementCounter('tool.executions.total', 1, { tool: toolName });
    this.metricsCollector.recordHistogram('tool.execution.duration', duration, { tool: toolName });

    if (success) {
      this.metricsCollector.incrementCounter('tool.executions.success', 1, { tool: toolName });
    } else {
      this.metricsCollector.incrementCounter('tool.executions.error', 1, { tool: toolName });
    }

    // Alert on slow execution
    if (duration > appConfig.monitoring.executionTimeAlertThreshold) {
      logger.warn('Slow tool execution detected', {
        tool: toolName,
        duration,
        threshold: appConfig.monitoring.executionTimeAlertThreshold,
      });
    }
  }

  // Memory usage tracking
  trackMemoryUsage(): void {
    const usage = process.memoryUsage();

    this.metricsCollector.setGauge('memory.heap.used', usage.heapUsed);
    this.metricsCollector.setGauge('memory.heap.total', usage.heapTotal);
    this.metricsCollector.setGauge('memory.rss', usage.rss);
    this.metricsCollector.setGauge('memory.external', usage.external);

    // Alert on high memory usage
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    if (heapUsedMB > appConfig.monitoring.memoryAlertThreshold) {
      logger.warn('High memory usage detected', {
        heapUsedMB,
        threshold: appConfig.monitoring.memoryAlertThreshold,
        usage,
      });
    }
  }

  // Request metrics
  trackRequest(method: string, path: string, statusCode: number, duration: number): void {
    this.metricsCollector.incrementCounter('http.requests.total', 1, {
      method,
      path,
      status: statusCode.toString(),
    });

    this.metricsCollector.recordHistogram('http.request.duration', duration, {
      method,
      path,
    });

    if (statusCode >= 400) {
      this.metricsCollector.incrementCounter('http.requests.error', 1, {
        method,
        path,
        status: statusCode.toString(),
      });
    }
  }

  // System health metrics
  trackSystemHealth(): void {
    const startTime = Date.now();

    // CPU usage (simplified)
    const usage = process.cpuUsage();
    this.metricsCollector.setGauge('cpu.user', usage.user);
    this.metricsCollector.setGauge('cpu.system', usage.system);

    // Event loop lag
    setImmediate(() => {
      const lag = Date.now() - startTime;
      this.metricsCollector.recordHistogram('eventloop.lag', lag);
    });

    // Active handles and requests
    this.metricsCollector.setGauge('process.handles', (process as any)._getActiveHandles().length);
    this.metricsCollector.setGauge(
      'process.requests',
      (process as any)._getActiveRequests().length,
    );
  }
}

export const kpiTracker = new KPITracker(metrics);
```

## Health Monitoring

### Health Check Endpoints

```typescript
// Health check service
export class HealthCheckService {
  private checks: Map<string, HealthCheck> = new Map();

  registerCheck(name: string, check: HealthCheck): void {
    this.checks.set(name, check);
  }

  async runHealthChecks(): Promise<HealthStatus> {
    const results: Record<string, CheckResult> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    for (const [name, check] of this.checks.entries()) {
      try {
        const startTime = Date.now();
        const result = await Promise.race([check.execute(), this.timeout(check.timeout || 5000)]);

        results[name] = {
          status: 'healthy',
          duration: Date.now() - startTime,
          details: result,
        };
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          duration: Date.now() - Date.now(),
          error: error.message,
          details: null,
        };

        overallStatus = 'unhealthy';
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results,
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown',
    };
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), ms);
    });
  }
}

interface HealthCheck {
  execute(): Promise<any>;
  timeout?: number;
}

interface CheckResult {
  status: 'healthy' | 'unhealthy';
  duration: number;
  error?: string;
  details: any;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: Record<string, CheckResult>;
  uptime: number;
  version: string;
}

// Register default health checks
export const healthService = new HealthCheckService();

// Database connectivity check
healthService.registerCheck('database', {
  execute: async () => {
    if (!appConfig.database) return { status: 'not configured' };

    // Implement database ping
    return { status: 'connected' };
  },
  timeout: 3000,
});

// File system check
healthService.registerCheck('filesystem', {
  execute: async () => {
    const fs = require('fs').promises;
    await fs.access(appConfig.persistence.dataPath, fs.constants.W_OK);
    return { path: appConfig.persistence.dataPath, writable: true };
  },
});

// Memory check
healthService.registerCheck('memory', {
  execute: async () => {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;

    return {
      heapUsedMB,
      threshold: appConfig.monitoring.memoryAlertThreshold,
      status: heapUsedMB < appConfig.monitoring.memoryAlertThreshold ? 'ok' : 'warning',
    };
  },
});

// Tool registry check
healthService.registerCheck('tools', {
  execute: async () => {
    // Check that tools are loaded and discoverable
    const toolCount = 5; // This would be actual tool count
    return {
      toolsLoaded: toolCount,
      autoDiscoveryEnabled: appConfig.mcp.hotReloadEnabled,
    };
  },
});
```

### Real-time Monitoring Dashboard

```typescript
// WebSocket-based monitoring dashboard
export class MonitoringDashboard {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: any) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocket();
    this.startMetricsBroadcast();
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);

      // Send initial data
      this.sendToClient(ws, {
        type: 'init',
        data: {
          config: this.getSafeConfig(),
          initialMetrics: metrics.getMetrics(),
        },
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          logger.error('Invalid WebSocket message', error);
        }
      });
    });
  }

  private startMetricsBroadcast(): void {
    setInterval(() => {
      const currentMetrics = metrics.getMetrics();
      this.broadcast({
        type: 'metrics',
        timestamp: Date.now(),
        data: currentMetrics,
      });
    }, appConfig.monitoring.metricsInterval);
  }

  private broadcast(message: any): void {
    const payload = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  private sendToClient(client: WebSocket, message: any): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  private handleClientMessage(client: WebSocket, message: any): void {
    switch (message.type) {
      case 'getHealth':
        healthService.runHealthChecks().then((health) => {
          this.sendToClient(client, {
            type: 'health',
            data: health,
          });
        });
        break;

      case 'clearMetrics':
        // Reset metrics (development only)
        if (appConfig.development.developmentMode) {
          // Implementation to clear metrics
          this.sendToClient(client, {
            type: 'metricsCleared',
            timestamp: Date.now(),
          });
        }
        break;
    }
  }

  private getSafeConfig(): any {
    // Return configuration without sensitive data
    return {
      nodeEnv: appConfig.server.nodeEnv,
      version: process.env.npm_package_version,
      features: appConfig.features,
      monitoring: appConfig.monitoring,
    };
  }
}
```

## Alerting and Notifications

### Alert Rules

```typescript
// Alert rules engine
export class AlertManager {
  private rules: AlertRule[] = [];
  private alertHistory: Alert[] = [];
  private suppressions: Map<string, number> = new Map();

  constructor() {
    this.setupDefaultRules();
  }

  private setupDefaultRules(): void {
    // High memory usage alert
    this.addRule({
      name: 'high_memory_usage',
      condition: (metrics) => {
        const memoryUsage = metrics['memory.heap.used']?.value || 0;
        return memoryUsage > appConfig.monitoring.memoryAlertThreshold * 1024 * 1024;
      },
      severity: 'warning',
      message: 'Memory usage exceeds threshold',
      suppressionTime: 300000, // 5 minutes
    });

    // Slow tool execution alert
    this.addRule({
      name: 'slow_tool_execution',
      condition: (metrics) => {
        const p95 = metrics['tool.execution.duration']?.p95 || 0;
        return p95 > appConfig.monitoring.executionTimeAlertThreshold;
      },
      severity: 'warning',
      message: 'Tool execution time exceeds threshold',
      suppressionTime: 600000, // 10 minutes
    });

    // High error rate alert
    this.addRule({
      name: 'high_error_rate',
      condition: (metrics) => {
        const totalRequests = metrics['http.requests.total']?.value || 0;
        const errorRequests = metrics['http.requests.error']?.value || 0;
        const errorRate = totalRequests > 0 ? errorRequests / totalRequests : 0;
        return errorRate > 0.1; // 10% error rate
      },
      severity: 'critical',
      message: 'HTTP error rate exceeds 10%',
      suppressionTime: 180000, // 3 minutes
    });
  }

  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  checkAlerts(): void {
    const currentMetrics = metrics.getMetrics();

    for (const rule of this.rules) {
      const alertKey = rule.name;
      const now = Date.now();

      // Check if alert is suppressed
      const suppressedUntil = this.suppressions.get(alertKey);
      if (suppressedUntil && now < suppressedUntil) {
        continue;
      }

      // Evaluate condition
      if (rule.condition(currentMetrics)) {
        const alert: Alert = {
          name: rule.name,
          severity: rule.severity,
          message: rule.message,
          timestamp: new Date().toISOString(),
          metrics: this.extractRelevantMetrics(currentMetrics, rule),
          resolved: false,
        };

        this.fireAlert(alert);

        // Set suppression
        if (rule.suppressionTime) {
          this.suppressions.set(alertKey, now + rule.suppressionTime);
        }
      }
    }
  }

  private fireAlert(alert: Alert): void {
    logger.error(`ALERT: ${alert.message}`, {
      alert: alert.name,
      severity: alert.severity,
      metrics: alert.metrics,
    });

    this.alertHistory.push(alert);

    // Send notifications based on severity
    switch (alert.severity) {
      case 'critical':
        this.sendNotification(alert, ['email', 'slack']);
        break;
      case 'warning':
        this.sendNotification(alert, ['slack']);
        break;
      case 'info':
        // Log only, no external notifications
        break;
    }
  }

  private sendNotification(alert: Alert, channels: string[]): void {
    // Implementation would integrate with notification services
    logger.info('Alert notification sent', {
      alert: alert.name,
      channels,
      severity: alert.severity,
    });
  }

  private extractRelevantMetrics(metrics: any, rule: AlertRule): any {
    // Extract metrics relevant to the alert
    return Object.keys(metrics)
      .filter((key) => rule.relevantMetrics?.includes(key) || key.includes(rule.name.split('_')[0]))
      .reduce((acc, key) => {
        acc[key] = metrics[key];
        return acc;
      }, {} as any);
  }

  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }
}

interface AlertRule {
  name: string;
  condition: (metrics: any) => boolean;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suppressionTime?: number;
  relevantMetrics?: string[];
}

interface Alert {
  name: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  metrics: any;
  resolved: boolean;
}

export const alertManager = new AlertManager();

// Run alert checks periodically
if (appConfig.monitoring.enabled) {
  setInterval(() => {
    alertManager.checkAlerts();
  }, 60000); // Check every minute
}
```

## Log Aggregation and Analysis

### Log Shipping Configuration

```typescript
// Log shipping to external services
export class LogShipper {
  private enabled: boolean;
  private endpoint?: string;
  private buffer: LogEntry[] = [];
  private bufferSize: number = 100;
  private flushInterval: number = 30000; // 30 seconds

  constructor() {
    this.enabled = process.env.LOG_SHIPPING_ENABLED === 'true';
    this.endpoint = process.env.LOG_SHIPPING_ENDPOINT;

    if (this.enabled && this.endpoint) {
      this.startPeriodicFlush();
    }
  }

  shipLog(logEntry: LogEntry): void {
    if (!this.enabled) return;

    this.buffer.push(logEntry);

    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0 || !this.endpoint) return;

    const logs = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.LOG_SHIPPING_TOKEN}`,
        },
        body: JSON.stringify({
          logs,
          source: 'mcp-strudel-kit',
          instance: appConfig.server.instanceId,
        }),
      });

      logger.debug(`Shipped ${logs.length} logs to external service`);
    } catch (error) {
      logger.error('Failed to ship logs', error);
      // Re-add logs to buffer for retry
      this.buffer.unshift(...logs);
    }
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
}

export const logShipper = new LogShipper();
```

This comprehensive monitoring and logging approach ensures the Strudel Kit MCP Server maintains high availability, performance, and observability while providing detailed insights for debugging and optimization.
