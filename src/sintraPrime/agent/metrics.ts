/**
 * Metrics Collection for Agent Mode
 * Tracks performance, success rates, and system health
 */

import { logger } from "../../config/logger";
import { TaskState } from "./state/stateMachine";
import { IntentType } from "./intent/intentRouter";

interface MetricPoint {
  timestamp: Date;
  value: number;
  labels?: Record<string, string>;
}

interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  averageCompletionTime: number;
  byIntent: Map<IntentType, number>;
  byState: Map<TaskState, number>;
}

interface ToolMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  byTool: Map<string, {
    executions: number;
    successes: number;
    failures: number;
    avgTime: number;
  }>;
}

/**
 * Metrics Collector
 */
export class MetricsCollector {
  private taskMetrics: Array<{
    taskId: string;
    intent: IntentType;
    state: TaskState;
    createdAt: Date;
    completedAt?: Date;
    duration?: number;
  }> = [];

  private toolMetrics: Array<{
    tool: string;
    success: boolean;
    duration: number;
    timestamp: Date;
  }> = [];

  private requestMetrics: Array<{
    endpoint: string;
    method: string;
    statusCode: number;
    duration: number;
    timestamp: Date;
  }> = [];

  private pruneTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Prune old metrics every hour
    this.pruneTimer = setInterval(() => {
      this.pruneOldMetrics();
    }, 60 * 60 * 1000);
    // Allow process to exit gracefully
    this.pruneTimer.unref();
  }

  /**
   * Stop the prune timer (for graceful shutdown)
   */
  stop() {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }
  }

  /**
   * Record task creation
   */
  recordTaskCreated(taskId: string, intent: IntentType) {
    this.taskMetrics.push({
      taskId,
      intent,
      state: TaskState.CREATED,
      createdAt: new Date()
    });
    logger.debug({ taskId, intent }, "[Metrics] Task created");
  }

  /**
   * Record task state change
   */
  recordTaskStateChange(taskId: string, newState: TaskState) {
    const task = this.taskMetrics.find(t => t.taskId === taskId);
    if (task) {
      task.state = newState;
      
      if (newState === TaskState.COMPLETED || newState === TaskState.FAILED || newState === TaskState.CANCELLED) {
        task.completedAt = new Date();
        task.duration = task.completedAt.getTime() - task.createdAt.getTime();
      }
    }
    logger.debug({ taskId, newState }, "[Metrics] Task state changed");
  }

  /**
   * Record tool execution
   */
  recordToolExecution(tool: string, success: boolean, duration: number) {
    this.toolMetrics.push({
      tool,
      success,
      duration,
      timestamp: new Date()
    });
    logger.debug({ tool, success, duration }, "[Metrics] Tool executed");
  }

  /**
   * Record API request
   */
  recordRequest(endpoint: string, method: string, statusCode: number, duration: number) {
    this.requestMetrics.push({
      endpoint,
      method,
      statusCode,
      duration,
      timestamp: new Date()
    });
  }

  /**
   * Get aggregated task metrics
   */
  getTaskMetrics(): TaskMetrics {
    const byIntent = new Map<IntentType, number>();
    const byState = new Map<TaskState, number>();
    let totalCompletionTime = 0;
    let completedCount = 0;

    for (const task of this.taskMetrics) {
      // Count by intent
      byIntent.set(task.intent, (byIntent.get(task.intent) || 0) + 1);
      
      // Count by state
      byState.set(task.state, (byState.get(task.state) || 0) + 1);
      
      // Calculate average completion time
      if (task.duration) {
        totalCompletionTime += task.duration;
        completedCount++;
      }
    }

    return {
      totalTasks: this.taskMetrics.length,
      completedTasks: byState.get(TaskState.COMPLETED) || 0,
      failedTasks: byState.get(TaskState.FAILED) || 0,
      cancelledTasks: byState.get(TaskState.CANCELLED) || 0,
      averageCompletionTime: completedCount > 0 ? totalCompletionTime / completedCount : 0,
      byIntent,
      byState
    };
  }

  /**
   * Get aggregated tool metrics
   */
  getToolMetrics(): ToolMetrics {
    const byTool = new Map<string, {
      executions: number;
      successes: number;
      failures: number;
      avgTime: number;
    }>();

    let totalSuccesses = 0;
    let totalFailures = 0;
    let totalTime = 0;

    for (const metric of this.toolMetrics) {
      if (!byTool.has(metric.tool)) {
        byTool.set(metric.tool, {
          executions: 0,
          successes: 0,
          failures: 0,
          avgTime: 0
        });
      }

      const toolStats = byTool.get(metric.tool)!;
      toolStats.executions++;
      
      if (metric.success) {
        toolStats.successes++;
        totalSuccesses++;
      } else {
        toolStats.failures++;
        totalFailures++;
      }

      toolStats.avgTime = (toolStats.avgTime * (toolStats.executions - 1) + metric.duration) / toolStats.executions;
      totalTime += metric.duration;
    }

    return {
      totalExecutions: this.toolMetrics.length,
      successfulExecutions: totalSuccesses,
      failedExecutions: totalFailures,
      averageExecutionTime: this.toolMetrics.length > 0 ? totalTime / this.toolMetrics.length : 0,
      byTool
    };
  }

  /**
   * Get request metrics
   */
  getRequestMetrics() {
    const byEndpoint = new Map<string, {
      count: number;
      avgDuration: number;
      successRate: number;
    }>();

    for (const req of this.requestMetrics) {
      const key = `${req.method} ${req.endpoint}`;
      if (!byEndpoint.has(key)) {
        byEndpoint.set(key, {
          count: 0,
          avgDuration: 0,
          successRate: 0
        });
      }

      const stats = byEndpoint.get(key)!;
      stats.count++;
      stats.avgDuration = (stats.avgDuration * (stats.count - 1) + req.duration) / stats.count;
      stats.successRate = (stats.successRate * (stats.count - 1) + (req.statusCode < 400 ? 1 : 0)) / stats.count;
    }

    return {
      totalRequests: this.requestMetrics.length,
      byEndpoint: Object.fromEntries(byEndpoint)
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    return {
      tasks: this.getTaskMetrics(),
      tools: this.getToolMetrics(),
      requests: this.getRequestMetrics(),
      timestamp: new Date()
    };
  }

  /**
   * Prune old metrics (keep last 24 hours)
   */
  pruneOldMetrics() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    this.taskMetrics = this.taskMetrics.filter(m => m.createdAt > cutoff);
    this.toolMetrics = this.toolMetrics.filter(m => m.timestamp > cutoff);
    this.requestMetrics = this.requestMetrics.filter(m => m.timestamp > cutoff);
    
    logger.info("[Metrics] Pruned old metrics");
  }
}

// Export singleton instance
export const metricsCollector = new MetricsCollector();

// Graceful shutdown support
process.on('SIGTERM', () => {
  metricsCollector.stop();
});

process.on('SIGINT', () => {
  metricsCollector.stop();
});
