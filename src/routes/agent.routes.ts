/**
 * Agent API Routes
 * Endpoints for interacting with SintraPrime agent mode
 */

import { Router, Request, Response } from "express";
import { agentCore, stateMachine, contextMemory, intentRouter, toolAuthority } from "../sintraPrime";
import { TaskState } from "../sintraPrime/agent";
import { logger } from "../config/logger";

const router = Router();

/**
 * Process input through agent
 * POST /api/agent/process
 */
router.post("/process", async (req: Request, res: Response) => {
  try {
    const { input, userId = "default", autoExecute = false } = req.body;

    if (!input) {
      return res.status(400).json({ error: "input is required" });
    }

    const result = await agentCore.processInput(input, userId, autoExecute);

    res.json(result);
  } catch (error) {
    logger.error({ error }, "[Agent API] Process failed");
    res.status(500).json({ error: "Agent processing failed" });
  }
});

/**
 * Approve and execute task
 * POST /api/agent/tasks/:taskId/approve
 */
router.post("/tasks/:taskId/approve", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { userId = "default" } = req.body;

    const result = await agentCore.approveAndExecute(taskId, userId);

    res.json(result);
  } catch (error) {
    logger.error({ error }, "[Agent API] Approve failed");
    res.status(500).json({ error: "Task approval failed" });
  }
});

/**
 * Cancel a task
 * POST /api/agent/tasks/:taskId/cancel
 */
router.post("/tasks/:taskId/cancel", (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { userId = "default", reason } = req.body ?? {};

    const task = agentCore.getTaskStatus(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    try {
      stateMachine.transitionTask(
        taskId,
        TaskState.CANCELLED,
        typeof reason === "string" && reason.length > 0 ? reason : `Cancelled by ${userId}`
      );

      res.json({ success: true, taskId, state: TaskState.CANCELLED });
    } catch (transitionError) {
      res.status(409).json({
        error: "Cannot cancel task in current state",
        taskId,
        state: task.state
      });
    }
  } catch (error) {
    logger.error({ error }, "[Agent API] Cancel task failed");
    res.status(500).json({ error: "Failed to cancel task" });
  }
});

/**
 * Get task status
 * GET /api/agent/tasks/:taskId
 */
router.get("/tasks/:taskId", (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const task = agentCore.getTaskStatus(taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    logger.error({ error }, "[Agent API] Get task failed");
    res.status(500).json({ error: "Failed to get task" });
  }
});

/**
 * List all tasks
 * GET /api/agent/tasks
 */
router.get("/tasks", (req: Request, res: Response) => {
  try {
    const { state } = req.query;

    let tasks;
    if (state) {
      tasks = stateMachine.getTasksByState(state as any);
    } else {
      tasks = stateMachine.getAllTasks();
    }

    res.json({ tasks });
  } catch (error) {
    logger.error({ error }, "[Agent API] List tasks failed");
    res.status(500).json({ error: "Failed to list tasks" });
  }
});

/**
 * Get user context
 * GET /api/agent/context/:userId
 */
router.get("/context/:userId", (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const summary = agentCore.getUserContextSummary(userId);

    res.json({ userId, summary });
  } catch (error) {
    logger.error({ error }, "[Agent API] Get context failed");
    res.status(500).json({ error: "Failed to get context" });
  }
});

/**
 * Get conversation history
 * GET /api/agent/history/:userId
 */
router.get("/history/:userId", (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    const history = contextMemory.getHistory(userId, limit ? parseInt(limit as string) : undefined);

    res.json({ userId, history });
  } catch (error) {
    logger.error({ error }, "[Agent API] Get history failed");
    res.status(500).json({ error: "Failed to get history" });
  }
});

/**
 * Classify intent (for testing)
 * POST /api/agent/classify
 */
router.post("/classify", async (req: Request, res: Response) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ error: "input is required" });
    }

    const intent = await intentRouter.classifyIntent(input);

    res.json(intent);
  } catch (error) {
    logger.error({ error }, "[Agent API] Classify failed");
    res.status(500).json({ error: "Classification failed" });
  }
});

/**
 * Get available tools
 * GET /api/agent/tools
 */
router.get("/tools", (req: Request, res: Response) => {
  try {
    const tools = toolAuthority.getAvailableTools();

    res.json({ tools });
  } catch (error) {
    logger.error({ error }, "[Agent API] Get tools failed");
    res.status(500).json({ error: "Failed to get tools" });
  }
});

/**
 * Grant tool approval
 * POST /api/agent/tools/:toolName/approve
 */
router.post("/tools/:toolName/approve", (req: Request, res: Response) => {
  try {
    const { toolName } = req.params;

    toolAuthority.grantToolApproval(toolName);

    res.json({ success: true, toolName, status: "approved" });
  } catch (error) {
    logger.error({ error }, "[Agent API] Approve tool failed");
    res.status(500).json({ error: "Failed to approve tool" });
  }
});

/**
 * Get agent stats
 * GET /api/agent/stats
 */
router.get("/stats", (req: Request, res: Response) => {
  try {
    const tasks = stateMachine.getAllTasks();
    const activeTasks = stateMachine.getActiveTasks();
    const memoryStats = contextMemory.getStats();

    const stats = {
      tasks: {
        total: tasks.length,
        active: activeTasks.length,
        byState: {
          created: stateMachine.getTasksByState("created" as any).length,
          planning: stateMachine.getTasksByState("planning" as any).length,
          awaiting_approval: stateMachine.getTasksByState("awaiting_approval" as any).length,
          executing: stateMachine.getTasksByState("executing" as any).length,
          paused: stateMachine.getTasksByState("paused" as any).length,
          waiting: stateMachine.getTasksByState("waiting" as any).length,
          completed: stateMachine.getTasksByState("completed" as any).length,
          failed: stateMachine.getTasksByState("failed" as any).length,
          cancelled: stateMachine.getTasksByState("cancelled" as any).length
        }
      },
      memory: memoryStats,
      tools: {
        available: toolAuthority.getAvailableTools().length,
        executionHistory: toolAuthority.getExecutionHistory().length
      }
    };

    res.json(stats);
  } catch (error) {
    logger.error({ error }, "[Agent API] Get stats failed");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

export default router;
