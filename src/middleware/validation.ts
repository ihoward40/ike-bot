/**
 * Input Validation Middleware
 * Uses Zod for type-safe validation
 */

import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";
import { logger } from "../config/logger";

/**
 * Create validation middleware for request body
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn({ errors: error.issues, path: req.path }, "[Validation] Request validation failed");
        res.status(400).json({
          error: "Validation error",
          details: error.issues.map((e: any) => ({
            path: e.path.join("."),
            message: e.message
          }))
        });
      } else {
        next(error);
      }
    }
  };
}

/**
 * Common validation schemas
 */
export const schemas = {
  processInput: z.object({
    input: z.string().min(1).max(5000),
    userId: z.string().min(1).max(100).default("default"),  // Default preserved for backward compatibility
    autoExecute: z.boolean().optional().default(false)
  }),

  approveTask: z.object({
    userId: z.string().min(1).max(100)
  }),

  classifyIntent: z.object({
    input: z.string().min(1).max(5000)
  }),

  cancelTask: z.object({
    userId: z.string().min(1).max(100),
    reason: z.string().max(500).optional()
  }),

  approveTool: z.object({
    userId: z.string().min(1).max(100).optional()
  }),

  taskQuery: z.object({
    state: z.enum([
      "created",
      "planning",
      "awaiting_approval",
      "executing",
      "paused",
      "waiting",
      "completed",
      "failed",
      "cancelled"
    ]).optional(),
    userId: z.string().min(1).max(100).optional(),
    limit: z.number().int().min(1).max(100).optional().default(20)
  })
};
