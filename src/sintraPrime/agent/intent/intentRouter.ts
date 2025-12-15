/**
 * Intent Router - Classifies incoming requests into work types
 * This replaces prompting with structured intent classification
 */

import { logger } from "../../../config/logger";
import { logEvent } from "../../core/memory";

/**
 * Work type classifications for agent mode
 */
export enum IntentType {
  RESEARCH = "research",           // Gather information, analyze data
  EXECUTE = "execute",             // Perform actions, make changes
  MONITOR = "monitor",             // Watch for conditions, track state
  DRAFT = "draft",                 // Create documents, content
  DISPUTE = "dispute",             // Handle complaints, disputes
  AUTOMATE = "automate",           // Set up automation workflows
  ESCALATE = "escalate",           // Escalate to human or higher authority
  WAIT_AND_RECHECK = "wait_and_recheck"  // Schedule future check-ins
}

/**
 * Intent classification result
 */
export interface Intent {
  type: IntentType;
  confidence: number;
  reasoning: string;
  parameters: Record<string, any>;
  requiresHumanApproval: boolean;
  estimatedDuration?: string;
}

/**
 * Intent Router - analyzes input and classifies work type
 */
export class IntentRouter {
  /**
   * Classify intent from user input
   */
  async classifyIntent(input: string, context?: Record<string, any>): Promise<Intent> {
    logger.info({ input, context }, "[SintraPrime Intent] Analyzing input");

    const normalized = input.toLowerCase().trim();
    
    // Pattern matching for intent classification
    const intent = this.matchIntent(normalized, context);

    // Log classification
    logEvent("intent_classified", {
      input: input.substring(0, 100),
      intent: intent.type,
      confidence: intent.confidence,
      requiresApproval: intent.requiresHumanApproval
    });

    logger.info({ 
      intent: intent.type, 
      confidence: intent.confidence 
    }, "[SintraPrime Intent] Classification complete");

    return intent;
  }

  /**
   * Match patterns to determine intent type
   */
  private matchIntent(input: string, context?: Record<string, any>): Intent {
    // Research intent patterns
    if (this.matchesPattern(input, [
      "research", "analyze", "investigate", "look up", "find out", 
      "what is", "how does", "tell me about", "explain"
    ])) {
      return {
        type: IntentType.RESEARCH,
        confidence: 0.9,
        reasoning: "Input requests information gathering or analysis",
        parameters: this.extractResearchParams(input),
        requiresHumanApproval: false
      };
    }

    // Execute intent patterns
    if (this.matchesPattern(input, [
      "execute", "run", "perform", "do", "create", "send", 
      "file", "submit", "process", "build"
    ])) {
      return {
        type: IntentType.EXECUTE,
        confidence: 0.85,
        reasoning: "Input requests action or execution",
        parameters: this.extractExecuteParams(input),
        requiresHumanApproval: true, // Execution requires approval by default
        estimatedDuration: "5-30 minutes"
      };
    }

    // Monitor intent patterns
    if (this.matchesPattern(input, [
      "monitor", "watch", "track", "check", "alert me", 
      "notify when", "keep an eye on"
    ])) {
      return {
        type: IntentType.MONITOR,
        confidence: 0.88,
        reasoning: "Input requests ongoing monitoring",
        parameters: this.extractMonitorParams(input),
        requiresHumanApproval: false
      };
    }

    // Draft intent patterns
    if (this.matchesPattern(input, [
      "draft", "write", "compose", "prepare", "generate",
      "letter", "document", "email", "report"
    ])) {
      return {
        type: IntentType.DRAFT,
        confidence: 0.87,
        reasoning: "Input requests document creation",
        parameters: this.extractDraftParams(input),
        requiresHumanApproval: false
      };
    }

    // Dispute intent patterns
    if (this.matchesPattern(input, [
      "dispute", "complaint", "challenge", "object to",
      "cfpb", "credit report", "file complaint"
    ])) {
      return {
        type: IntentType.DISPUTE,
        confidence: 0.92,
        reasoning: "Input requests dispute or complaint handling",
        parameters: this.extractDisputeParams(input),
        requiresHumanApproval: true,
        estimatedDuration: "1-2 hours"
      };
    }

    // Automate intent patterns
    if (this.matchesPattern(input, [
      "automate", "workflow", "schedule", "routine",
      "every", "whenever", "automatically"
    ])) {
      return {
        type: IntentType.AUTOMATE,
        confidence: 0.86,
        reasoning: "Input requests automation setup",
        parameters: this.extractAutomateParams(input),
        requiresHumanApproval: true
      };
    }

    // Escalate intent patterns
    if (this.matchesPattern(input, [
      "escalate", "urgent", "emergency", "critical",
      "need help", "can't handle", "human needed"
    ])) {
      return {
        type: IntentType.ESCALATE,
        confidence: 0.95,
        reasoning: "Input requires human intervention or escalation",
        parameters: { urgency: "high", reason: input },
        requiresHumanApproval: false // Already escalating
      };
    }

    // Wait and recheck patterns
    if (this.matchesPattern(input, [
      "remind me", "follow up", "check back", "later",
      "in", "after", "when"
    ])) {
      return {
        type: IntentType.WAIT_AND_RECHECK,
        confidence: 0.84,
        reasoning: "Input requests delayed action or follow-up",
        parameters: this.extractWaitParams(input),
        requiresHumanApproval: false
      };
    }

    // Default: Research with low confidence
    return {
      type: IntentType.RESEARCH,
      confidence: 0.5,
      reasoning: "Intent unclear, defaulting to research mode",
      parameters: { query: input },
      requiresHumanApproval: false
    };
  }

  /**
   * Check if input matches any of the patterns
   */
  private matchesPattern(input: string, patterns: string[]): boolean {
    return patterns.some(pattern => input.includes(pattern));
  }

  /**
   * Extract parameters for research intent
   */
  private extractResearchParams(input: string): Record<string, any> {
    return {
      query: input,
      depth: input.includes("detailed") || input.includes("comprehensive") ? "deep" : "standard"
    };
  }

  /**
   * Extract parameters for execute intent
   */
  private extractExecuteParams(input: string): Record<string, any> {
    return {
      action: input,
      dryRun: false
    };
  }

  /**
   * Extract parameters for monitor intent
   */
  private extractMonitorParams(input: string): Record<string, any> {
    return {
      target: input,
      frequency: "hourly" // Default
    };
  }

  /**
   * Extract parameters for draft intent
   */
  private extractDraftParams(input: string): Record<string, any> {
    return {
      documentType: this.detectDocumentType(input),
      content: input
    };
  }

  /**
   * Extract parameters for dispute intent
   */
  private extractDisputeParams(input: string): Record<string, any> {
    return {
      disputeType: this.detectDisputeType(input),
      details: input
    };
  }

  /**
   * Extract parameters for automate intent
   */
  private extractAutomateParams(input: string): Record<string, any> {
    return {
      workflow: input,
      trigger: "manual" // Default
    };
  }

  /**
   * Extract parameters for wait intent
   */
  private extractWaitParams(input: string): Record<string, any> {
    return {
      delay: this.extractTimeDelay(input),
      action: input
    };
  }

  /**
   * Detect document type from input
   */
  private detectDocumentType(input: string): string {
    if (input.includes("letter")) return "letter";
    if (input.includes("email")) return "email";
    if (input.includes("report")) return "report";
    if (input.includes("complaint")) return "complaint";
    return "document";
  }

  /**
   * Detect dispute type from input
   */
  private detectDisputeType(input: string): string {
    if (input.includes("credit")) return "credit_report";
    if (input.includes("cfpb")) return "cfpb_complaint";
    if (input.includes("billing")) return "billing_dispute";
    return "general";
  }

  /**
   * Extract time delay from input
   */
  private extractTimeDelay(input: string): string {
    if (input.includes("hour")) return "1h";
    if (input.includes("day")) return "1d";
    if (input.includes("week")) return "1w";
    if (input.includes("month")) return "1M";
    return "1h"; // Default
  }
}

// Singleton instance
export const intentRouter = new IntentRouter();
