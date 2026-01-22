/**
 * Rate Limiter Middleware
 * Prevents API abuse and ensures system stability
 */

import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis
 */
export class RateLimiter {
  private clients: Map<string, ClientRecord> = new Map();
  private config: RateLimitConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      windowMs: config.windowMs || 60000,  // 1 minute default
      maxRequests: config.maxRequests || 60  // 60 requests/minute default
    };

    // Cleanup old entries every minute
    this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
    // Allow process to exit gracefully
    this.cleanupTimer.unref();
  }

  /**
   * Stop the cleanup timer (for graceful shutdown)
   */
  stop() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Create Express middleware
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientId = this.getClientId(req);
      const now = Date.now();

      let client = this.clients.get(clientId);

      // Initialize or reset if window expired
      if (!client || now > client.resetTime) {
        client = {
          count: 0,
          resetTime: now + this.config.windowMs
        };
        this.clients.set(clientId, client);
      }

      client.count++;

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", this.config.maxRequests);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, this.config.maxRequests - client.count));
      res.setHeader("X-RateLimit-Reset", new Date(client.resetTime).toISOString());

      if (client.count > this.config.maxRequests) {
        logger.warn({ clientId, count: client.count }, "[RateLimiter] Rate limit exceeded");
        res.status(429).json({
          error: "Too many requests",
          message: `Rate limit exceeded. Try again after ${new Date(client.resetTime).toISOString()}`,
          retryAfter: Math.ceil((client.resetTime - now) / 1000)
        });
        return;
      }

      next();
    };
  }

  /**
   * Get client identifier
   */
  private getClientId(req: Request): string {
    // Use user ID if authenticated, otherwise use IP
    return (req.body?.userId || req.headers["x-user-id"] || req.ip || "unknown") as string;
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now();
    for (const [clientId, client] of this.clients.entries()) {
      if (now > client.resetTime + this.config.windowMs) {
        this.clients.delete(clientId);
      }
    }
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalClients: this.clients.size,
      config: this.config
    };
  }
}

// Export default instance
export const defaultRateLimiter = new RateLimiter();

// Export specific limiters for different endpoints
export const agentRateLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 30  // 30 agent requests per minute
});

export const classifyRateLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 100  // 100 classification requests per minute
});
