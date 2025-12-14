import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import beneficiaryRoutes from "./routes/beneficiary.routes";
import creditDisputeRoutes from "./routes/creditDispute.routes";
import webhookRoutes from "./routes/webhook.routes";
import { errorHandler } from "./middleware/errorHandler";
import { 
  traceMiddleware, 
  requestLogger, 
  responseLogger, 
  errorLogger 
} from "./middleware/logging.middleware";
import { logger } from "./config/logger";
import * as SintraPrime from "./sintraPrime";

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
  const sintraStatus = SintraPrime.getStatus();
  res.json({ 
    ok: true, 
    message: "IKE-BOT running",
    sintraPrime: sintraStatus
  });
});

// SintraPrime status endpoint
app.get("/api/sintraprime/status", (_req, res) => {
  const status = SintraPrime.getStatus();
  res.json(status);
});

// API Routes
app.use("/api/beneficiaries", beneficiaryRoutes);
app.use("/api/credit-disputes", creditDisputeRoutes);

// Error handling - error logger before error handler
app.use(errorLogger);
app.use(errorHandler);

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, async () => {
  logger.info({ port }, `Server listening on http://127.0.0.1:${port}`);
  
  // Activate SintraPrime
  try {
    await SintraPrime.activate();
  } catch (error) {
    logger.error({ error }, "Failed to activate SintraPrime");
  }
});

// Graceful shutdown handlers
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Received shutdown signal");
  
  try {
    // Deactivate SintraPrime
    await SintraPrime.deactivate();
    
    // Close server
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  } catch (error) {
    logger.error({ error }, "Error during shutdown");
    process.exit(1);
  }
}

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught exception");
  gracefulShutdown("uncaughtException");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  logger.fatal({ reason, promise }, "Unhandled rejection");
  gracefulShutdown("unhandledRejection");
});
