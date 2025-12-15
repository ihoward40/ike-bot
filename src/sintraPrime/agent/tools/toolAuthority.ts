/**
 * Tool Authority - Autonomous tool execution without re-asking
 * Agent mode can use tools independently
 */

import { logger } from "../../../config/logger";
import { logEvent } from "../../core/memory";
import fs from "fs";
import path from "path";

/**
 * Tool execution result
 */
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

/**
 * Tool capability definition
 */
export interface ToolCapability {
  name: string;
  description: string;
  requiresApproval: boolean;
  riskLevel: "low" | "medium" | "high";
}

/**
 * Tool Authority - manages autonomous tool execution
 */
export class ToolAuthority {
  private approvedTools: Set<string> = new Set();
  private toolExecutionLog: Array<{
    tool: string;
    timestamp: Date;
    success: boolean;
  }> = [];

  /**
   * Available tool capabilities
   */
  private capabilities: Map<string, ToolCapability> = new Map([
    ["filesystem_read", {
      name: "filesystem_read",
      description: "Read files from disk",
      requiresApproval: false,
      riskLevel: "low"
    }],
    ["filesystem_write", {
      name: "filesystem_write",
      description: "Write files to disk",
      requiresApproval: true,
      riskLevel: "medium"
    }],
    ["make_com_execute", {
      name: "make_com_execute",
      description: "Execute Make.com automation scenarios",
      requiresApproval: true,
      riskLevel: "medium"
    }],
    ["email_send", {
      name: "email_send",
      description: "Send emails",
      requiresApproval: true,
      riskLevel: "medium"
    }],
    ["calendar_schedule", {
      name: "calendar_schedule",
      description: "Schedule calendar events",
      requiresApproval: false,
      riskLevel: "low"
    }],
    ["database_query", {
      name: "database_query",
      description: "Query database (read-only)",
      requiresApproval: false,
      riskLevel: "low"
    }],
    ["database_write", {
      name: "database_write",
      description: "Write to database",
      requiresApproval: true,
      riskLevel: "medium"
    }],
    ["api_call", {
      name: "api_call",
      description: "Make external API calls",
      requiresApproval: false,
      riskLevel: "low"
    }],
    ["webhook_trigger", {
      name: "webhook_trigger",
      description: "Trigger webhook endpoints",
      requiresApproval: true,
      riskLevel: "medium"
    }]
  ]);

  /**
   * Grant tool approval for autonomous use
   */
  grantToolApproval(toolName: string): void {
    if (!this.capabilities.has(toolName)) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    this.approvedTools.add(toolName);
    logger.info({ toolName }, "[SintraPrime Tools] Tool approval granted");
    
    logEvent("tool_approved", { toolName });
  }

  /**
   * Revoke tool approval
   */
  revokeToolApproval(toolName: string): void {
    this.approvedTools.delete(toolName);
    logger.info({ toolName }, "[SintraPrime Tools] Tool approval revoked");
    
    logEvent("tool_revoked", { toolName });
  }

  /**
   * Check if tool is approved for autonomous use
   */
  isToolApproved(toolName: string): boolean {
    const capability = this.capabilities.get(toolName);
    if (!capability) return false;

    // Low risk tools are always approved
    if (capability.riskLevel === "low") return true;

    // Check explicit approval for medium/high risk tools
    return this.approvedTools.has(toolName);
  }

  /**
   * Execute tool autonomously
   */
  async executeTool(toolName: string, parameters: Record<string, any>): Promise<ToolResult> {
    const startTime = Date.now();

    logger.info({ toolName, parameters }, "[SintraPrime Tools] Executing tool");

    // Check approval
    if (!this.isToolApproved(toolName)) {
      const error = `Tool ${toolName} requires approval before execution`;
      logger.warn({ toolName }, error);
      return {
        success: false,
        error,
        duration: Date.now() - startTime
      };
    }

    try {
      let result: any;

      // Execute based on tool type
      switch (toolName) {
        case "filesystem_read":
          result = await this.executeFilesystemRead(parameters);
          break;
        case "filesystem_write":
          result = await this.executeFilesystemWrite(parameters);
          break;
        case "make_com_execute":
          result = await this.executeMakeCom(parameters);
          break;
        case "email_send":
          result = await this.executeEmailSend(parameters);
          break;
        case "calendar_schedule":
          result = await this.executeCalendarSchedule(parameters);
          break;
        case "database_query":
          result = await this.executeDatabaseQuery(parameters);
          break;
        case "database_write":
          result = await this.executeDatabaseWrite(parameters);
          break;
        case "api_call":
          result = await this.executeApiCall(parameters);
          break;
        case "webhook_trigger":
          result = await this.executeWebhookTrigger(parameters);
          break;
        default:
          throw new Error(`Tool not implemented: ${toolName}`);
      }

      const duration = Date.now() - startTime;

      this.logToolExecution(toolName, true);
      logEvent("tool_executed", { 
        toolName, 
        success: true, 
        duration 
      });

      logger.info({ toolName, duration }, "[SintraPrime Tools] Tool executed successfully");

      return {
        success: true,
        data: result,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      this.logToolExecution(toolName, false);
      logEvent("tool_execution_failed", { 
        toolName, 
        error: errorMsg,
        duration 
      }, { severity: "error" });

      logger.error({ toolName, error: errorMsg }, "[SintraPrime Tools] Tool execution failed");

      return {
        success: false,
        error: errorMsg,
        duration
      };
    }
  }

  /**
   * Execute filesystem read
   */
  private async executeFilesystemRead(params: Record<string, any>): Promise<any> {
    const { filepath } = params;
    
    if (!filepath) throw new Error("filepath parameter required");
    
    const content = fs.readFileSync(filepath, "utf-8");
    return { content, filepath };
  }

  /**
   * Execute filesystem write
   */
  private async executeFilesystemWrite(params: Record<string, any>): Promise<any> {
    const { filepath, content } = params;
    
    if (!filepath || content === undefined) {
      throw new Error("filepath and content parameters required");
    }

    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filepath, content, "utf-8");
    return { filepath, bytesWritten: content.length };
  }

  /**
   * Execute Make.com scenario
   */
  private async executeMakeCom(params: Record<string, any>): Promise<any> {
    const { scenarioId, data } = params;
    
    // Placeholder - would integrate with Make.com API
    logger.info({ scenarioId }, "[SintraPrime Tools] Make.com execution (placeholder)");
    
    return {
      scenarioId,
      status: "queued",
      message: "Make.com integration pending"
    };
  }

  /**
   * Execute email send
   */
  private async executeEmailSend(params: Record<string, any>): Promise<any> {
    const { to, subject, body } = params;
    
    // Placeholder - would integrate with email service
    logger.info({ to, subject }, "[SintraPrime Tools] Email send (placeholder)");
    
    return {
      to,
      subject,
      status: "queued",
      message: "Email integration pending"
    };
  }

  /**
   * Execute calendar schedule
   */
  private async executeCalendarSchedule(params: Record<string, any>): Promise<any> {
    const { title, date, duration } = params;
    
    // Placeholder - would integrate with calendar service
    logger.info({ title, date }, "[SintraPrime Tools] Calendar schedule (placeholder)");
    
    return {
      title,
      date,
      status: "scheduled",
      message: "Calendar integration pending"
    };
  }

  /**
   * Execute database query
   */
  private async executeDatabaseQuery(params: Record<string, any>): Promise<any> {
    const { query, table } = params;
    
    // Placeholder - would use Supabase client
    logger.info({ table }, "[SintraPrime Tools] Database query (placeholder)");
    
    return {
      query,
      results: [],
      message: "Database integration pending"
    };
  }

  /**
   * Execute database write
   */
  private async executeDatabaseWrite(params: Record<string, any>): Promise<any> {
    const { table, data } = params;
    
    // Placeholder - would use Supabase client
    logger.info({ table }, "[SintraPrime Tools] Database write (placeholder)");
    
    return {
      table,
      status: "success",
      message: "Database integration pending"
    };
  }

  /**
   * Execute API call
   */
  private async executeApiCall(params: Record<string, any>): Promise<any> {
    const { url, method = "GET", data } = params;
    
    // Placeholder - would use fetch or axios
    logger.info({ url, method }, "[SintraPrime Tools] API call (placeholder)");
    
    return {
      url,
      method,
      status: 200,
      message: "API integration pending"
    };
  }

  /**
   * Execute webhook trigger
   */
  private async executeWebhookTrigger(params: Record<string, any>): Promise<any> {
    const { url, data } = params;
    
    // Placeholder - would make HTTP POST request
    logger.info({ url }, "[SintraPrime Tools] Webhook trigger (placeholder)");
    
    return {
      url,
      status: "triggered",
      message: "Webhook integration pending"
    };
  }

  /**
   * Log tool execution for audit trail
   */
  private logToolExecution(tool: string, success: boolean): void {
    this.toolExecutionLog.push({
      tool,
      timestamp: new Date(),
      success
    });

    // Keep only last 1000 executions
    if (this.toolExecutionLog.length > 1000) {
      this.toolExecutionLog = this.toolExecutionLog.slice(-1000);
    }
  }

  /**
   * Get tool execution history
   */
  getExecutionHistory(): Array<{ tool: string; timestamp: Date; success: boolean }> {
    return [...this.toolExecutionLog];
  }

  /**
   * Get available tools
   */
  getAvailableTools(): ToolCapability[] {
    return Array.from(this.capabilities.values());
  }
}

// Singleton instance
export const toolAuthority = new ToolAuthority();
