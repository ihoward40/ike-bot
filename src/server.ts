import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import beneficiaryRoutes from "./routes/beneficiary.routes";
import creditDisputeRoutes from "./routes/creditDispute.routes";
import webhookRoutes from "./routes/webhook.routes";
import aiRoutes from "./routes/ai.routes";
import { errorHandler } from "./middleware/errorHandler";
import { 
  traceMiddleware, 
  requestLogger, 
  responseLogger, 
  errorLogger 
} from "./middleware/logging.middleware";
import { logger } from "./config/logger";

// SintraPrime Router v1-v8 Integration
const { buildCommandCenterLite } = require("./utils/command-center-lite");
const { getTelemetrySummary } = require("./utils/telemetry-summary");
const { getSystemHealth } = require("./utils/health-monitor");
const { sendSlackDigest } = require("./services/slack-digest");
const { buildCaseLinks } = require("./utils/case-linker");
const { handleEvent } = require("./utils/live-stream-processor");
const { replayLastFailure } = require("./utils/action-replay");

dotenv.config();

const app = express();

// Middleware - logging first to capture all requests
app.use(traceMiddleware);
app.use(requestLogger);
app.use(responseLogger);

app.use(cors());

// Webhooks need raw body for signature verification
app.use("/webhooks", webhookRoutes);

// JSON parsing for all other routes
app.use(express.json());

// Health check
app.get("/", (_req, res) => {
  res.json({ ok: true, message: "IKE-BOT running" });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, status: "healthy", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/beneficiaries", beneficiaryRoutes);
app.use("/api/credit-disputes", creditDisputeRoutes);
app.use("/api/ai", aiRoutes);

// ============================================================================
// SintraPrime Router v8 Foundation Intelligence Endpoints
// ============================================================================

/**
 * GET /command-center - Operational Dashboard UI
 */
app.get("/command-center", async (_req, res) => {
  try {
    const htmlPath = path.join(__dirname, "views", "command-center.html");
    res.sendFile(htmlPath);
  } catch (error) {
    logger.error({ error }, "Error serving command center UI");
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * GET /api/command-center-lite - Dashboard Data API
 */
app.get("/api/command-center-lite", async (_req, res) => {
  try {
    const data = await buildCommandCenterLite();
    res.json({ ok: true, data });
  } catch (error) {
    logger.error({ error }, "Command Center Lite error");
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * GET /api/telemetry-summary - Aggregated Telemetry Statistics
 */
app.get("/api/telemetry-summary", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 500;
    const summary = getTelemetrySummary(limit);
    res.json({ ok: true, summary });
  } catch (error) {
    logger.error({ error }, "Telemetry summary error");
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * GET /api/system-health - Current Health Metrics
 */
app.get("/api/system-health", async (_req, res) => {
  try {
    const health = getSystemHealth();
    res.json({ ok: true, health });
  } catch (error) {
    logger.error({ error }, "System health check error");
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /health-check-run - Manual Health Check Trigger
 */
app.post("/health-check-run", async (_req, res) => {
  try {
    const result = getSystemHealth();
    res.json({ ok: true, result });
  } catch (error) {
    logger.error({ error }, "Health check run error");
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /digest-run - Manual Slack Digest Trigger
 */
app.post("/digest-run", async (_req, res) => {
  try {
    await sendSlackDigest();
    res.json({ ok: true, message: "Slack digest sent" });
  } catch (error) {
    logger.error({ error }, "Digest run error");
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /case-linking-run - Manual Case Linking Trigger
 */
app.post("/case-linking-run", async (_req, res) => {
  try {
    await buildCaseLinks();
    res.json({ ok: true, message: "Case linking complete" });
  } catch (error) {
    logger.error({ error }, "Case linking error");
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /event-stream-ingest - Live Event Ingestion (v12A)
 */
app.post("/event-stream-ingest", async (req, res) => {
  try {
    const event = req.body;
    const result = await handleEvent(event);
    res.json({ ok: true, result });
  } catch (error) {
    logger.error({ error }, "Event stream error");
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /replay-last-failure - Action Replay Engine
 */
app.post("/replay-last-failure", async (_req, res) => {
  try {
    // Note: Requires execution engine integration
    res.json({ 
      ok: true, 
      message: "Replay functionality requires execution engine integration" 
    });
  } catch (error) {
    logger.error({ error }, "Replay error");
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Error handling - error logger before error handler
app.use(errorLogger);
app.use(errorHandler);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  logger.info({ port }, `Server listening on http://127.0.0.1:${port}`);
  logger.info("SintraPrime Router v1-v8 Foundation Intelligence Layer: ONLINE");
});
