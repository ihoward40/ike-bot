/**
 * Planning Engine - Creates execution plans with dependencies and failover
 * Plans before acting - step graphs, not just lists
 */

import { logger } from "../../../config/logger";
import { logEvent } from "../../core/memory";
import { IntentType } from "../intent/intentRouter";

/**
 * Execution step status
 */
export enum StepStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  SKIPPED = "skipped"
}

/**
 * Execution step in the plan
 */
export interface ExecutionStep {
  id: string;
  name: string;
  description: string;
  action: string;
  dependencies: string[];  // Step IDs that must complete first
  stopConditions?: string[];  // Conditions that would halt execution
  failoverSteps?: string[];   // Alternative steps if this fails
  estimatedDuration: string;
  status: StepStatus;
  result?: any;
  error?: string;
}

/**
 * Execution plan
 */
export interface ExecutionPlan {
  id: string;
  intent: IntentType;
  goal: string;
  steps: ExecutionStep[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: "draft" | "active" | "completed" | "failed" | "cancelled";
}

/**
 * Planning Engine - generates execution plans
 */
export class PlanningEngine {
  private plans: Map<string, ExecutionPlan> = new Map();

  /**
   * Create execution plan from intent
   */
  async createPlan(
    intent: IntentType, 
    goal: string, 
    parameters: Record<string, any>
  ): Promise<ExecutionPlan> {
    logger.info({ intent, goal }, "[SintraPrime Planner] Creating execution plan");

    const planId = this.generatePlanId();
    const steps = this.generateSteps(intent, goal, parameters);

    const plan: ExecutionPlan = {
      id: planId,
      intent,
      goal,
      steps,
      createdAt: new Date(),
      status: "draft"
    };

    this.plans.set(planId, plan);

    logEvent("plan_created", {
      planId,
      intent,
      stepCount: steps.length,
      goal: goal.substring(0, 100)
    });

    logger.info({ 
      planId, 
      stepCount: steps.length 
    }, "[SintraPrime Planner] Plan created");

    return plan;
  }

  /**
   * Generate execution steps based on intent type
   */
  private generateSteps(
    intent: IntentType, 
    goal: string, 
    parameters: Record<string, any>
  ): ExecutionStep[] {
    switch (intent) {
      case IntentType.DISPUTE:
        return this.generateDisputeSteps(goal, parameters);
      case IntentType.EXECUTE:
        return this.generateExecuteSteps(goal, parameters);
      case IntentType.RESEARCH:
        return this.generateResearchSteps(goal, parameters);
      case IntentType.DRAFT:
        return this.generateDraftSteps(goal, parameters);
      case IntentType.MONITOR:
        return this.generateMonitorSteps(goal, parameters);
      case IntentType.AUTOMATE:
        return this.generateAutomateSteps(goal, parameters);
      default:
        return this.generateGenericSteps(goal, parameters);
    }
  }

  /**
   * Generate steps for dispute handling
   */
  private generateDisputeSteps(goal: string, params: Record<string, any>): ExecutionStep[] {
    return [
      {
        id: "verify_facts",
        name: "Verify Facts",
        description: "Verify all facts and details of the dispute",
        action: "research",
        dependencies: [],
        estimatedDuration: "5-10 minutes",
        status: StepStatus.PENDING
      },
      {
        id: "pull_account_data",
        name: "Pull Account Data",
        description: "Retrieve relevant account information and history",
        action: "database_query",
        dependencies: ["verify_facts"],
        estimatedDuration: "2-5 minutes",
        status: StepStatus.PENDING
      },
      {
        id: "draft_narrative",
        name: "Draft Narrative",
        description: "Create complaint narrative based on facts",
        action: "document_generation",
        dependencies: ["pull_account_data"],
        estimatedDuration: "10-15 minutes",
        status: StepStatus.PENDING
      },
      {
        id: "select_regulator",
        name: "Select Regulator",
        description: "Determine appropriate regulatory body (CFPB, etc.)",
        action: "routing_decision",
        dependencies: ["verify_facts"],
        estimatedDuration: "2 minutes",
        status: StepStatus.PENDING
      },
      {
        id: "generate_submission",
        name: "Generate Submission",
        description: "Create formal submission package",
        action: "document_generation",
        dependencies: ["draft_narrative", "select_regulator"],
        estimatedDuration: "5-10 minutes",
        status: StepStatus.PENDING
      },
      {
        id: "log_case",
        name: "Log Case",
        description: "Record case in tracking system",
        action: "database_insert",
        dependencies: ["generate_submission"],
        estimatedDuration: "1 minute",
        status: StepStatus.PENDING
      },
      {
        id: "schedule_followup",
        name: "Schedule Follow-up",
        description: "Set reminder to check status in 30 days",
        action: "schedule_task",
        dependencies: ["log_case"],
        estimatedDuration: "1 minute",
        status: StepStatus.PENDING,
        stopConditions: ["user_cancellation"]
      }
    ];
  }

  /**
   * Generate steps for execution tasks
   */
  private generateExecuteSteps(goal: string, params: Record<string, any>): ExecutionStep[] {
    return [
      {
        id: "validate_input",
        name: "Validate Input",
        description: "Verify all required parameters are present",
        action: "validation",
        dependencies: [],
        estimatedDuration: "1 minute",
        status: StepStatus.PENDING
      },
      {
        id: "execute_action",
        name: "Execute Action",
        description: goal,
        action: "execute",
        dependencies: ["validate_input"],
        failoverSteps: ["rollback"],
        estimatedDuration: "5-20 minutes",
        status: StepStatus.PENDING
      },
      {
        id: "verify_result",
        name: "Verify Result",
        description: "Confirm action completed successfully",
        action: "verification",
        dependencies: ["execute_action"],
        estimatedDuration: "2 minutes",
        status: StepStatus.PENDING
      }
    ];
  }

  /**
   * Generate steps for research tasks
   */
  private generateResearchSteps(goal: string, params: Record<string, any>): ExecutionStep[] {
    return [
      {
        id: "gather_sources",
        name: "Gather Sources",
        description: "Identify relevant information sources",
        action: "research",
        dependencies: [],
        estimatedDuration: "3-5 minutes",
        status: StepStatus.PENDING
      },
      {
        id: "analyze_data",
        name: "Analyze Data",
        description: "Process and analyze gathered information",
        action: "analysis",
        dependencies: ["gather_sources"],
        estimatedDuration: "5-10 minutes",
        status: StepStatus.PENDING
      },
      {
        id: "synthesize_findings",
        name: "Synthesize Findings",
        description: "Create summary of research findings",
        action: "synthesis",
        dependencies: ["analyze_data"],
        estimatedDuration: "3-5 minutes",
        status: StepStatus.PENDING
      }
    ];
  }

  /**
   * Generate steps for drafting tasks
   */
  private generateDraftSteps(goal: string, params: Record<string, any>): ExecutionStep[] {
    return [
      {
        id: "gather_requirements",
        name: "Gather Requirements",
        description: "Collect all necessary information for document",
        action: "research",
        dependencies: [],
        estimatedDuration: "2-5 minutes",
        status: StepStatus.PENDING
      },
      {
        id: "create_draft",
        name: "Create Draft",
        description: "Generate initial document draft",
        action: "document_generation",
        dependencies: ["gather_requirements"],
        estimatedDuration: "10-20 minutes",
        status: StepStatus.PENDING
      },
      {
        id: "review_draft",
        name: "Review Draft",
        description: "Quality check and refinement",
        action: "review",
        dependencies: ["create_draft"],
        estimatedDuration: "5 minutes",
        status: StepStatus.PENDING
      }
    ];
  }

  /**
   * Generate steps for monitoring tasks
   */
  private generateMonitorSteps(goal: string, params: Record<string, any>): ExecutionStep[] {
    return [
      {
        id: "setup_monitor",
        name: "Setup Monitor",
        description: "Configure monitoring parameters",
        action: "configuration",
        dependencies: [],
        estimatedDuration: "2 minutes",
        status: StepStatus.PENDING
      },
      {
        id: "start_monitoring",
        name: "Start Monitoring",
        description: "Begin continuous monitoring",
        action: "monitor",
        dependencies: ["setup_monitor"],
        estimatedDuration: "ongoing",
        status: StepStatus.PENDING
      }
    ];
  }

  /**
   * Generate steps for automation tasks
   */
  private generateAutomateSteps(goal: string, params: Record<string, any>): ExecutionStep[] {
    return [
      {
        id: "define_workflow",
        name: "Define Workflow",
        description: "Map out automation workflow steps",
        action: "planning",
        dependencies: [],
        estimatedDuration: "5-10 minutes",
        status: StepStatus.PENDING
      },
      {
        id: "configure_triggers",
        name: "Configure Triggers",
        description: "Set up workflow triggers and conditions",
        action: "configuration",
        dependencies: ["define_workflow"],
        estimatedDuration: "3-5 minutes",
        status: StepStatus.PENDING
      },
      {
        id: "test_workflow",
        name: "Test Workflow",
        description: "Verify workflow functions correctly",
        action: "testing",
        dependencies: ["configure_triggers"],
        estimatedDuration: "5 minutes",
        status: StepStatus.PENDING
      },
      {
        id: "activate_workflow",
        name: "Activate Workflow",
        description: "Enable automation workflow",
        action: "activation",
        dependencies: ["test_workflow"],
        estimatedDuration: "1 minute",
        status: StepStatus.PENDING
      }
    ];
  }

  /**
   * Generate generic steps
   */
  private generateGenericSteps(goal: string, params: Record<string, any>): ExecutionStep[] {
    return [
      {
        id: "analyze_request",
        name: "Analyze Request",
        description: "Understand the requirements",
        action: "analysis",
        dependencies: [],
        estimatedDuration: "2 minutes",
        status: StepStatus.PENDING
      },
      {
        id: "execute_task",
        name: "Execute Task",
        description: goal,
        action: "execute",
        dependencies: ["analyze_request"],
        estimatedDuration: "5-15 minutes",
        status: StepStatus.PENDING
      }
    ];
  }

  /**
   * Get plan by ID
   */
  getPlan(planId: string): ExecutionPlan | undefined {
    return this.plans.get(planId);
  }

  /**
   * Update step status
   */
  updateStepStatus(planId: string, stepId: string, status: StepStatus, result?: any, error?: string): void {
    const plan = this.plans.get(planId);
    if (!plan) return;

    const step = plan.steps.find(s => s.id === stepId);
    if (!step) return;

    step.status = status;
    if (result) step.result = result;
    if (error) step.error = error;

    logEvent("step_status_updated", {
      planId,
      stepId,
      status,
      hasError: !!error
    });
  }

  /**
   * Get next executable steps (dependencies met)
   */
  getNextSteps(planId: string): ExecutionStep[] {
    const plan = this.plans.get(planId);
    if (!plan) return [];

    return plan.steps.filter(step => {
      if (step.status !== StepStatus.PENDING) return false;
      
      // Check if all dependencies are completed
      return step.dependencies.every(depId => {
        const depStep = plan.steps.find(s => s.id === depId);
        return depStep?.status === StepStatus.COMPLETED;
      });
    });
  }

  /**
   * Generate unique plan ID
   */
  private generatePlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

// Singleton instance
export const planningEngine = new PlanningEngine();
