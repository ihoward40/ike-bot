import express from "express";
import dotenv from "dotenv";
import cors from "cors";
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
import { getSintraPrime } from "./sintraPrime/core/sintraPrime";
import sintraDashboardRoutes from "./sintraPrime/dashboard/routes";

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

// SintraPrime Dashboard & API
app.use("/sintra", sintraDashboardRoutes);

// Error handling - error logger before error handler
app.use(errorLogger);
app.use(errorHandler);

const port = Number(process.env.PORT) || 3000;
const sintraPort = Number(process.env.SINTRA_PORT) || 7777;

// Start main server
app.listen(port, () => {
  logger.info({ port }, `Server listening on http://127.0.0.1:${port}`);
});

// Start SintraPrime on separate port
const sintraApp = express();
sintraApp.use(cors());
sintraApp.use(express.json());
sintraApp.use("/", sintraDashboardRoutes);

sintraApp.listen(sintraPort, async () => {
  logger.info({ port: sintraPort }, `SintraPrime Dashboard on http://localhost:${sintraPort}`);
  
  // Initialize and start SintraPrime
  const sintra = getSintraPrime();
  try {
    await sintra.start();
  } catch (error) {
    logger.error({ error }, 'Failed to start SintraPrime');
    await sintra.handleCriticalError(error as Error);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  const sintra = getSintraPrime();
  await sintra.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  const sintra = getSintraPrime();
  await sintra.stop();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  const sintra = getSintraPrime();
  await sintra.handleCriticalError(error);
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  logger.fatal({ reason }, 'Unhandled rejection');
  const sintra = getSintraPrime();
  await sintra.handleCriticalError(new Error(String(reason)));
  process.exit(1);
});
