/**
 * State Machine - Persistent task state management
 * Maintains task state across sessions for follow-ups
 */

import fs from "fs";
import path from "path";
import { logger } from "../../../config/logger";
import { logEvent } from "../../core/memory";
import { ExecutionPlan } from "../planner/planningEngine";

/**
 * Task state
 */
export const enum TaskState {
  CREATED = "created",
  PLANNING = "planning",
  AWAITING_APPROVAL = "awaiting_approval",
  EXECUTING = "executing",
  PAUSED = "paused",
  WAITING = "waiting",              // Waiting for external condition
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled"
}

// String literal type for runtime usage
export type TaskStateValue = TaskState;

/**
 * Task entity with state
 */
export interface Task {
  id: string;
  goal: string;
  state: TaskState;
  plan?: ExecutionPlan;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  context: Record<string, any>;
  waitCondition?: {
    type: "time" | "event" | "condition";
    value: any;
    checkAt?: Date;
  };
  history: Array<{
    state: TaskState;
    timestamp: Date;
    reason?: string;
  }>;
}

/**
 * State Machine - manages task lifecycle
 */
export class StateMachine {
  private tasks: Map<string, Task> = new Map();
  private stateFile: string;

  constructor() {
    this.stateFile = path.join(process.cwd(), "memory", "task_state.json");
    this.loadState();
  }

  /**
   * Create new task
   */
  createTask(goal: string, context: Record<string, any> = {}): Task {
    const taskId = this.generateTaskId();
    
    const task: Task = {
      id: taskId,
      goal,
      state: TaskState.CREATED,
      createdAt: new Date(),
      updatedAt: new Date(),
      context,
      history: [{
        state: TaskState.CREATED,
        timestamp: new Date()
      }]
    };

    this.tasks.set(taskId, task);
    this.persistState();

    logger.info({ taskId, goal }, "[SintraPrime State] Task created");
    logEvent("task_created", { taskId, goal: goal.substring(0, 100) });

    return task;
  }

  /**
   * Transition task to new state
   */
  transitionTask(taskId: string, newState: TaskState, reason?: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const oldState = task.state;
    
    // Validate transition
    if (!this.isValidTransition(oldState, newState)) {
      throw new Error(`Invalid transition: ${oldState} -> ${newState}`);
    }

    task.state = newState;
    task.updatedAt = new Date();
    task.history.push({
      state: newState,
      timestamp: new Date(),
      reason
    });

    if (newState === TaskState.COMPLETED || newState === TaskState.FAILED || newState === TaskState.CANCELLED) {
      task.completedAt = new Date();
    }

    this.persistState();

    logger.info({ 
      taskId, 
      transition: `${oldState} -> ${newState}`,
      reason 
    }, "[SintraPrime State] Task transitioned");

    logEvent("task_transitioned", {
      taskId,
      fromState: oldState,
      toState: newState,
      reason
    });
  }

  /**
   * Validate state transition
   */
  private isValidTransition(from: TaskState, to: TaskState): boolean {
    const validTransitions: Record<TaskState, TaskState[]> = {
      [TaskState.CREATED]: [TaskState.PLANNING, TaskState.CANCELLED],
      [TaskState.PLANNING]: [TaskState.AWAITING_APPROVAL, TaskState.EXECUTING, TaskState.FAILED, TaskState.CANCELLED],
      [TaskState.AWAITING_APPROVAL]: [TaskState.EXECUTING, TaskState.CANCELLED],
      [TaskState.EXECUTING]: [TaskState.PAUSED, TaskState.WAITING, TaskState.COMPLETED, TaskState.FAILED, TaskState.CANCELLED],
      [TaskState.PAUSED]: [TaskState.EXECUTING, TaskState.CANCELLED],
      [TaskState.WAITING]: [TaskState.EXECUTING, TaskState.COMPLETED, TaskState.FAILED, TaskState.CANCELLED],
      [TaskState.COMPLETED]: [],
      [TaskState.FAILED]: [TaskState.CREATED], // Can retry
      [TaskState.CANCELLED]: []
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  /**
   * Set task waiting condition
   */
  setWaitCondition(
    taskId: string, 
    type: "time" | "event" | "condition", 
    value: any, 
    checkAt?: Date
  ): void {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    task.waitCondition = { type, value, checkAt };
    task.updatedAt = new Date();
    this.persistState();

    logger.info({ taskId, type, value }, "[SintraPrime State] Wait condition set");
    logEvent("wait_condition_set", { taskId, type, value });
  }

  /**
   * Check tasks that are waiting and should be resumed
   */
  getTasksToResume(): Task[] {
    const now = new Date();
    
    return Array.from(this.tasks.values()).filter(task => {
      if (task.state !== TaskState.WAITING) return false;
      if (!task.waitCondition) return false;

      // Check time-based conditions
      if (task.waitCondition.type === "time" && task.waitCondition.checkAt) {
        return task.waitCondition.checkAt <= now;
      }

      return false;
    });
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get tasks by state
   */
  getTasksByState(state: TaskState): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.state === state);
  }

  /**
   * Get active tasks (not completed/failed/cancelled)
   */
  getActiveTasks(): Task[] {
    return Array.from(this.tasks.values()).filter(t => 
      ![TaskState.COMPLETED, TaskState.FAILED, TaskState.CANCELLED].includes(t.state)
    );
  }

  /**
   * Update task context
   */
  updateContext(taskId: string, context: Record<string, any>): void {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    task.context = { ...task.context, ...context };
    task.updatedAt = new Date();
    this.persistState();

    logger.debug({ taskId }, "[SintraPrime State] Context updated");
  }

  /**
   * Attach execution plan to task
   */
  attachPlan(taskId: string, plan: ExecutionPlan): void {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    task.plan = plan;
    task.updatedAt = new Date();
    this.persistState();

    logger.info({ taskId, planId: plan.id }, "[SintraPrime State] Plan attached");
  }

  /**
   * Persist state to disk
   */
  private persistState(): void {
    try {
      const stateData = {
        tasks: Array.from(this.tasks.entries()).map(([id, task]) => ({
          ...task,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          completedAt: task.completedAt?.toISOString(),
          history: task.history.map(h => ({
            ...h,
            timestamp: h.timestamp.toISOString()
          })),
          waitCondition: task.waitCondition ? {
            ...task.waitCondition,
            checkAt: task.waitCondition.checkAt?.toISOString()
          } : undefined
        })),
        lastSaved: new Date().toISOString()
      };

      // Ensure directory exists
      const dir = path.dirname(this.stateFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.stateFile, JSON.stringify(stateData, null, 2), "utf-8");
      
      logger.debug("[SintraPrime State] State persisted");
    } catch (error) {
      logger.error({ error }, "[SintraPrime State] Failed to persist state");
    }
  }

  /**
   * Load state from disk
   */
  private loadState(): void {
    try {
      if (!fs.existsSync(this.stateFile)) {
        logger.info("[SintraPrime State] No existing state file");
        return;
      }

      const data = JSON.parse(fs.readFileSync(this.stateFile, "utf-8"));
      
      this.tasks = new Map(
        data.tasks.map((task: any) => [
          task.id,
          {
            ...task,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
            completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
            history: task.history.map((h: any) => ({
              ...h,
              timestamp: new Date(h.timestamp)
            })),
            waitCondition: task.waitCondition ? {
              ...task.waitCondition,
              checkAt: task.waitCondition.checkAt ? new Date(task.waitCondition.checkAt) : undefined
            } : undefined
          }
        ])
      );

      logger.info({ 
        taskCount: this.tasks.size 
      }, "[SintraPrime State] State loaded");

    } catch (error) {
      logger.error({ error }, "[SintraPrime State] Failed to load state");
    }
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Clean up old completed tasks
   */
  cleanupOldTasks(olderThanDays: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let removed = 0;
    for (const [id, task] of this.tasks.entries()) {
      if (task.completedAt && task.completedAt < cutoffDate) {
        this.tasks.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      this.persistState();
      logger.info({ removed }, "[SintraPrime State] Old tasks cleaned up");
    }

    return removed;
  }
}

// Singleton instance
export const stateMachine = new StateMachine();
