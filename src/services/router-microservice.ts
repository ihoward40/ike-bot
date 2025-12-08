// router-microservice.ts
// Express microservice for Gmail → Normalizer → Router → Make.com pipeline
// This is the "brain" behind SintraPrime's orchestration

import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

// Import JavaScript modules
const { normalizeGmailMessage } = require('../utils/normalizer-gmail');
const { routeMessage } = require('../utils/sintraprime-router-v1');
const { NotionCaseLinker } = require('../utils/notion-case-linker');
const { generateCountermeasures } = require('../utils/countermeasure-engine');

// Initialize Notion Case Linker (if configured)
let caseLinker: any = null;
if (process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID) {
  caseLinker = new NotionCaseLinker(
    process.env.NOTION_API_KEY,
    process.env.NOTION_DATABASE_ID
  );
  logger.info('Notion Case Linker initialized');
} else {
  logger.warn('Notion Case Linker not configured - set NOTION_API_KEY and NOTION_DATABASE_ID');
}

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  next();
});

// -----------------------
// Health Check
// -----------------------

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    service: 'SintraPrime Orchestration Router v1',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'SintraPrime Orchestration Router v1',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      routeEmail: 'POST /route-email',
      routeEmailBatch: 'POST /route-email/batch',
      testRouter: 'POST /test-router'
    },
    documentation: 'https://github.com/ihoward40/ike-bot/docs/SINTRAPRIME_ROUTER_USAGE.md'
  });
});

// -----------------------
// Main Routing Endpoint
// -----------------------

/**
 * POST /route-email
 * 
 * Main endpoint that Make.com will call.
 * Accepts raw Gmail message, normalizes it, routes it, and returns decision.
 * 
 * Request body: Raw Gmail API message object
 * Response: { ok: boolean, route: string, data: RouteDecision }
 */
app.post('/route-email', async (req: Request, res: Response) => {
  const traceId = generateTraceId();
  
  try {
    logger.info({ 
      traceId, 
      message: 'Received route-email request',
      hasBody: !!req.body 
    });

    const gmailRaw = req.body;

    // Step 1: Normalize Gmail message
    const normalized = normalizeGmailMessage(gmailRaw);
    logger.info({ 
      traceId, 
      message: 'Message normalized',
      messageId: normalized.id,
      from: normalized.from,
      subject: normalized.subject 
    });

    // Step 2: Route the message
    const decision = routeMessage(normalized);
    logger.info({ 
      traceId, 
      message: 'Routing decision made',
      dispatchTarget: decision.dispatchTarget,
      creditor: decision.creditor,
      riskLevel: decision.riskLevel 
    });

    // Step 3: Generate countermeasures (Router v4)
    let countermeasures = null;
    try {
      countermeasures = generateCountermeasures(decision);
      logger.info({ 
        traceId, 
        message: 'Countermeasures generated',
        priority: countermeasures.priority,
        posture: countermeasures.posture,
        actionCount: countermeasures.actions.length,
        requiresReview: countermeasures.requiresHumanReview
      });
    } catch (cmError: any) {
      logger.error({ 
        traceId, 
        message: 'Countermeasure generation failed',
        error: cmError.message 
      });
      // Continue processing even if countermeasures fail
    }

    // Step 4: Link to Notion case (if configured)
    let notionCase = null;
    if (caseLinker) {
      try {
        notionCase = await caseLinker.linkOrCreateCase(decision, normalized, {
          // Add countermeasure data if available
          ...(countermeasures && {
            recommendedPath: countermeasures.recommendedPath,
            enforcementPosture: countermeasures.posture,
            actionCount: countermeasures.actions.length,
            nextDeadline: countermeasures.timelines?.immediate?.deadline,
            requiresReview: countermeasures.requiresHumanReview
          })
        });
        logger.info({ 
          traceId, 
          message: 'Notion case linked',
          caseId: notionCase.caseId,
          action: notionCase.action,
          isNew: notionCase.isNew
        });
      } catch (notionError: any) {
        logger.error({ 
          traceId, 
          message: 'Notion linking failed',
          error: notionError.message 
        });
        // Continue processing even if Notion fails
      }
    }

    // Step 5: Log to database
    await logRoutingDecision(traceId, normalized, decision, notionCase, countermeasures);

    // Step 6: Return decision to Make.com
    res.json({
      ok: true,
      route: decision.dispatchTarget,
      data: decision,
      countermeasures: countermeasures || null,  // NEW: Router v4 output
      notionCase: notionCase ? {
        id: notionCase.caseId,
        title: notionCase.caseTitle,
        url: notionCase.caseUrl,
        action: notionCase.action,
        isNew: notionCase.isNew
      } : null,
      meta: {
        traceId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - extractTimestamp(traceId)
      }
    });

  } catch (err: any) {
    logger.error({ 
      traceId, 
      message: 'Routing error',
      error: err.message,
      stack: err.stack 
    });
    
    res.status(500).json({ 
      ok: false, 
      error: err.message,
      traceId 
    });
  }
});

// -----------------------
// Batch Routing Endpoint
// -----------------------

/**
 * POST /route-email/batch
 * 
 * Batch endpoint for processing multiple Gmail messages at once.
 * Useful for bulk processing or catch-up scenarios.
 * 
 * Request body: { messages: Array<GmailMessage> }
 * Response: { ok: boolean, results: Array<RouteDecision> }
 */
app.post('/route-email/batch', async (req: Request, res: Response) => {
  const traceId = generateTraceId();
  
  try {
    const { messages } = req.body;
    
    if (!Array.isArray(messages)) {
      return res.status(400).json({
        ok: false,
        error: 'Request body must contain "messages" array'
      });
    }

    logger.info({ 
      traceId, 
      message: 'Received batch routing request',
      count: messages.length 
    });

    const results = [];
    const errors = [];

    for (let i = 0; i < messages.length; i++) {
      try {
        const normalized = normalizeGmailMessage(messages[i]);
        const decision = routeMessage(normalized);
        await logRoutingDecision(`${traceId}-${i}`, normalized, decision);
        results.push({ index: i, decision, error: null });
      } catch (err: any) {
        logger.error({ 
          traceId: `${traceId}-${i}`, 
          message: 'Batch item routing error',
          error: err.message 
        });
        errors.push({ index: i, error: err.message });
        results.push({ index: i, decision: null, error: err.message });
      }
    }

    res.json({
      ok: true,
      total: messages.length,
      successful: results.filter(r => r.decision).length,
      failed: errors.length,
      results,
      errors,
      meta: {
        traceId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err: any) {
    logger.error({ 
      traceId, 
      message: 'Batch routing error',
      error: err.message 
    });
    
    res.status(500).json({ 
      ok: false, 
      error: err.message,
      traceId 
    });
  }
});

// -----------------------
// Test Router Endpoint
// -----------------------

/**
 * POST /test-router
 * 
 * Test endpoint for validating routing logic without Gmail payload.
 * Accepts a pre-normalized message.
 * 
 * Request body: NormalizedMessage object
 * Response: { ok: boolean, data: RouteDecision }
 */
app.post('/test-router', async (req: Request, res: Response) => {
  const traceId = generateTraceId();
  
  try {
    const normalized = req.body;
    
    // Validate required fields
    if (!normalized.from || !normalized.subject) {
      return res.status(400).json({
        ok: false,
        error: 'Message must have "from" and "subject" fields'
      });
    }

    const decision = routeMessage(normalized);
    
    res.json({
      ok: true,
      data: decision,
      meta: {
        traceId,
        timestamp: new Date().toISOString(),
        mode: 'test'
      }
    });

  } catch (err: any) {
    logger.error({ 
      traceId, 
      message: 'Test routing error',
      error: err.message 
    });
    
    res.status(500).json({ 
      ok: false, 
      error: err.message,
      traceId 
    });
  }
});

// -----------------------
// Helper Functions
// -----------------------

/**
 * Generate a unique trace ID for request tracking
 */
function generateTraceId(): string {
  return `route_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Extract timestamp from trace ID
 */
function extractTimestamp(traceId: string): number {
  const match = traceId.match(/route_(\d+)_/);
  return match ? parseInt(match[1]) : Date.now();
}

/**
 * Log routing decision to Supabase
 */
async function logRoutingDecision(
  traceId: string, 
  normalized: any, 
  decision: any,
  notionCase?: any,
  countermeasures?: any
): Promise<void> {
  try {
    await supabase.from('agent_logs').insert({
      trace_id: traceId,
      level: countermeasures?.priority === 'critical' ? 'warn' : decision.riskLevel === 'critical' ? 'warn' : 'info',
      message: `Email routed: ${decision.dispatchTarget}${countermeasures ? ` | Posture: ${countermeasures.posture}` : ''}`,
      action: 'route_email',
      metadata: {
        messageId: normalized.id,
        threadId: normalized.threadId,
        from: normalized.from,
        subject: normalized.subject,
        dispatchTarget: decision.dispatchTarget,
        creditor: decision.creditor,
        riskLevel: decision.riskLevel,
        tags: decision.tags,
        reason: decision.reason,
        dishonorPrediction: decision.meta.dishonorPrediction,
        beneficiaryImpact: decision.meta.beneficiaryImpact,
        countermeasures: countermeasures ? {
          priority: countermeasures.priority,
          posture: countermeasures.posture,
          recommendedPath: countermeasures.recommendedPath,
          actionCount: countermeasures.actions.length,
          requiresHumanReview: countermeasures.requiresHumanReview,
          flags: countermeasures.flags
        } : null,
        notionCase: notionCase ? {
          caseId: notionCase.caseId,
          caseTitle: notionCase.caseTitle,
          action: notionCase.action,
          isNew: notionCase.isNew
        } : null
      }
    });
  } catch (err: any) {
    logger.error({ 
      traceId, 
      message: 'Failed to log routing decision',
      error: err.message 
    });
    // Don't throw - logging failure shouldn't break routing
  }
}

// -----------------------
// Error Handling
// -----------------------

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    message: 'Unhandled error',
    error: err.message,
    stack: err.stack,
    path: req.path
  });
  
  res.status(500).json({
    ok: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// -----------------------
// 404 Handler
// -----------------------

app.use((req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    error: 'Endpoint not found',
    path: req.path,
    availableEndpoints: [
      'GET /health',
      'POST /route-email',
      'POST /route-email/batch',
      'POST /test-router'
    ]
  });
});

// -----------------------
// Start Server
// -----------------------

const PORT = process.env.ROUTER_PORT || process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info({
      message: `SintraPrime Router v1 microservice listening on port ${PORT}`,
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    });
  });
}

export default app;
