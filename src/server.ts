import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import beneficiaryRoutes from "./routes/beneficiary.routes";
import creditDisputeRoutes from "./routes/creditDispute.routes";
import enforcementPacketRoutes from "./routes/enforcementPacket.routes";
import webhookRoutes from "./routes/webhook.routes";
import { errorHandler } from "./middleware/errorHandler";
import { 
  traceMiddleware, 
  requestLogger, 
  responseLogger, 
  errorLogger 
} from "./middleware/logging.middleware";
import { logger } from "./config/logger";

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

// API Routes
app.use("/api/beneficiaries", beneficiaryRoutes);
app.use("/api/credit-disputes", creditDisputeRoutes);
app.use("/api/enforcement-packets", enforcementPacketRoutes);

// Error handling - error logger before error handler
app.use(errorLogger);
app.use(errorHandler);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  logger.info({ port }, `Server listening on http://127.0.0.1:${port}`);
});
