/**
 * Context Memory - Cross-session contextual recall
 * Remembers user context, preferences, and history
 */

import fs from "fs";
import path from "path";
import { logger } from "../../../config/logger";
import { logEvent } from "../../core/memory";

/**
 * Context entry
 */
export interface ContextEntry {
  key: string;
  value: any;
  type: "fact" | "preference" | "history" | "relationship";
  confidence: number;
  source: string;
  createdAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
}

/**
 * User context
 */
export interface UserContext {
  userId: string;
  entries: Map<string, ContextEntry>;
  conversationHistory: Array<{
    timestamp: Date;
    role: "user" | "agent";
    content: string;
    intent?: string;
  }>;
  lastInteraction: Date;
}

/**
 * Context Memory - manages contextual information
 */
export class ContextMemory {
  private contexts: Map<string, UserContext> = new Map();
  private memoryFile: string;
  private maxHistoryLength = 100;
  private maxContextEntries = 1000;

  constructor() {
    this.memoryFile = path.join(process.cwd(), "memory", "context_memory.json");
    this.loadMemory();
  }

  /**
   * Get or create user context
   */
  getContext(userId: string): UserContext {
    if (!this.contexts.has(userId)) {
      const context: UserContext = {
        userId,
        entries: new Map(),
        conversationHistory: [],
        lastInteraction: new Date()
      };
      this.contexts.set(userId, context);
      this.persistMemory();
    }

    const context = this.contexts.get(userId)!;
    context.lastInteraction = new Date();
    return context;
  }

  /**
   * Store context entry
   */
  storeContext(
    userId: string, 
    key: string, 
    value: any, 
    type: ContextEntry["type"] = "fact",
    source: string = "user_interaction",
    confidence: number = 1.0
  ): void {
    const context = this.getContext(userId);

    const entry: ContextEntry = {
      key,
      value,
      type,
      confidence,
      source,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      accessCount: 0
    };

    context.entries.set(key, entry);

    // Limit total entries per user
    if (context.entries.size > this.maxContextEntries) {
      this.pruneOldEntries(context);
    }

    this.persistMemory();

    logger.debug({ userId, key, type }, "[SintraPrime Context] Entry stored");
    logEvent("context_stored", { userId, key, type });
  }

  /**
   * Retrieve context entry
   */
  retrieveContext(userId: string, key: string): any {
    const context = this.contexts.get(userId);
    if (!context) return null;

    const entry = context.entries.get(key);
    if (!entry) return null;

    // Update access tracking
    entry.lastAccessedAt = new Date();
    entry.accessCount++;

    return entry.value;
  }

  /**
   * Search context by pattern
   */
  searchContext(userId: string, pattern: RegExp | string): ContextEntry[] {
    const context = this.contexts.get(userId);
    if (!context) return [];

    const searchPattern = typeof pattern === "string" 
      ? new RegExp(pattern, "i") 
      : pattern;

    const results: ContextEntry[] = [];

    for (const [key, entry] of context.entries) {
      if (searchPattern.test(key) || searchPattern.test(JSON.stringify(entry.value))) {
        results.push(entry);
      }
    }

    return results;
  }

  /**
   * Get context by type
   */
  getContextByType(userId: string, type: ContextEntry["type"]): ContextEntry[] {
    const context = this.contexts.get(userId);
    if (!context) return [];

    return Array.from(context.entries.values()).filter(e => e.type === type);
  }

  /**
   * Add to conversation history
   */
  addToHistory(
    userId: string, 
    role: "user" | "agent", 
    content: string, 
    intent?: string
  ): void {
    const context = this.getContext(userId);

    context.conversationHistory.push({
      timestamp: new Date(),
      role,
      content,
      intent
    });

    // Limit history length
    if (context.conversationHistory.length > this.maxHistoryLength) {
      context.conversationHistory = context.conversationHistory.slice(-this.maxHistoryLength);
    }

    this.persistMemory();

    logger.debug({ userId, role }, "[SintraPrime Context] History added");
  }

  /**
   * Get conversation history
   */
  getHistory(userId: string, limit?: number): Array<{
    timestamp: Date;
    role: "user" | "agent";
    content: string;
    intent?: string;
  }> {
    const context = this.contexts.get(userId);
    if (!context) return [];

    const history = context.conversationHistory;
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get recent context (most frequently/recently accessed)
   */
  getRecentContext(userId: string, limit: number = 10): ContextEntry[] {
    const context = this.contexts.get(userId);
    if (!context) return [];

    return Array.from(context.entries.values())
      .sort((a, b) => {
        // Sort by recency and frequency
        const scoreA = a.accessCount * 0.3 + (Date.now() - a.lastAccessedAt.getTime()) * -0.7;
        const scoreB = b.accessCount * 0.3 + (Date.now() - b.lastAccessedAt.getTime()) * -0.7;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Build context summary for agent
   */
  buildContextSummary(userId: string): string {
    const context = this.contexts.get(userId);
    if (!context) return "No prior context available.";

    const facts = this.getContextByType(userId, "fact");
    const preferences = this.getContextByType(userId, "preference");
    const recentHistory = this.getHistory(userId, 5);

    let summary = "Context Summary:\n\n";

    if (facts.length > 0) {
      summary += "Known Facts:\n";
      facts.slice(0, 5).forEach(f => {
        summary += `- ${f.key}: ${JSON.stringify(f.value)}\n`;
      });
      summary += "\n";
    }

    if (preferences.length > 0) {
      summary += "Preferences:\n";
      preferences.slice(0, 5).forEach(p => {
        summary += `- ${p.key}: ${JSON.stringify(p.value)}\n`;
      });
      summary += "\n";
    }

    if (recentHistory.length > 0) {
      summary += "Recent Interactions:\n";
      recentHistory.forEach(h => {
        const time = h.timestamp.toLocaleTimeString();
        summary += `- [${time}] ${h.role}: ${h.content.substring(0, 100)}\n`;
      });
    }

    return summary;
  }

  /**
   * Clear context for user
   */
  clearContext(userId: string): void {
    this.contexts.delete(userId);
    this.persistMemory();
    
    logger.info({ userId }, "[SintraPrime Context] Context cleared");
    logEvent("context_cleared", { userId });
  }

  /**
   * Prune old entries to manage memory
   */
  private pruneOldEntries(context: UserContext): void {
    const entries = Array.from(context.entries.entries());
    
    // Sort by last accessed time and access count
    entries.sort(([, a], [, b]) => {
      const scoreA = a.accessCount * 0.3 + (Date.now() - a.lastAccessedAt.getTime()) * -0.7;
      const scoreB = b.accessCount * 0.3 + (Date.now() - b.lastAccessedAt.getTime()) * -0.7;
      return scoreB - scoreA;
    });

    // Keep only top entries
    const keepCount = Math.floor(this.maxContextEntries * 0.8);
    const entriesToKeep = entries.slice(0, keepCount);
    
    context.entries = new Map(entriesToKeep);

    logger.debug({ 
      userId: context.userId, 
      removed: entries.length - keepCount 
    }, "[SintraPrime Context] Entries pruned");
  }

  /**
   * Persist memory to disk
   */
  private persistMemory(): void {
    try {
      const memoryData = {
        contexts: Array.from(this.contexts.entries()).map(([userId, context]) => ({
          userId,
          entries: Array.from(context.entries.entries()).map(([entryKey, entry]) => ({
            key: entryKey,
            value: entry.value,
            type: entry.type,
            confidence: entry.confidence,
            source: entry.source,
            createdAt: entry.createdAt.toISOString(),
            lastAccessedAt: entry.lastAccessedAt.toISOString(),
            accessCount: entry.accessCount
          })),
          conversationHistory: context.conversationHistory.map(h => ({
            ...h,
            timestamp: h.timestamp.toISOString()
          })),
          lastInteraction: context.lastInteraction.toISOString()
        })),
        lastSaved: new Date().toISOString()
      };

      // Ensure directory exists
      const dir = path.dirname(this.memoryFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.memoryFile, JSON.stringify(memoryData, null, 2), "utf-8");
      
      logger.debug("[SintraPrime Context] Memory persisted");
    } catch (error) {
      logger.error({ error }, "[SintraPrime Context] Failed to persist memory");
    }
  }

  /**
   * Load memory from disk
   */
  private loadMemory(): void {
    try {
      if (!fs.existsSync(this.memoryFile)) {
        logger.info("[SintraPrime Context] No existing memory file");
        return;
      }

      const data = JSON.parse(fs.readFileSync(this.memoryFile, "utf-8"));
      
      this.contexts = new Map(
        data.contexts.map((ctx: any) => [
          ctx.userId,
          {
            userId: ctx.userId,
            entries: new Map(
              ctx.entries.map((e: any) => [
                e.key,
                {
                  ...e,
                  createdAt: new Date(e.createdAt),
                  lastAccessedAt: new Date(e.lastAccessedAt)
                }
              ])
            ),
            conversationHistory: ctx.conversationHistory.map((h: any) => ({
              ...h,
              timestamp: new Date(h.timestamp)
            })),
            lastInteraction: new Date(ctx.lastInteraction)
          }
        ])
      );

      logger.info({ 
        userCount: this.contexts.size 
      }, "[SintraPrime Context] Memory loaded");

    } catch (error) {
      logger.error({ error }, "[SintraPrime Context] Failed to load memory");
    }
  }

  /**
   * Get all user IDs
   */
  getUserIds(): string[] {
    return Array.from(this.contexts.keys());
  }

  /**
   * Get memory stats
   */
  getStats(): {
    totalUsers: number;
    totalEntries: number;
    totalHistoryItems: number;
  } {
    let totalEntries = 0;
    let totalHistoryItems = 0;

    for (const context of this.contexts.values()) {
      totalEntries += context.entries.size;
      totalHistoryItems += context.conversationHistory.length;
    }

    return {
      totalUsers: this.contexts.size,
      totalEntries,
      totalHistoryItems
    };
  }
}

// Singleton instance
export const contextMemory = new ContextMemory();
