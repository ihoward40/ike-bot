import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { config } from "./config";
import { requestLogger, logger } from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";

// Import routes
import authRoutes from "./routes/auth";
import beneficiariesRoutes from "./routes/beneficiaries";
import noticesRoutes from "./routes/notices";
import disputesRoutes from "./routes/disputes";
import billingRoutes from "./routes/billing";
import webhooksRoutes from "./routes/webhooks";

// Import rate limiters
import { apiLimiter, authLimiter, webhookLimiter } from "./middleware/rateLimiter";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve static files from client directory
app.use(express.static(path.join(__dirname, "../client")));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ ok: true, status: "healthy", timestamp: new Date().toISOString() });
});

// API endpoints
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    message: "IKE BOT - Trust Enforcement & Automation API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      beneficiaries: "/api/beneficiaries",
      notices: "/api/notices",
      disputes: "/api/disputes",
      billing: "/api/billing",
      webhooks: "/api/webhooks",
    },
  });
});

// Mount API routes with rate limiting
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/beneficiaries", apiLimiter, beneficiariesRoutes);
app.use("/api/notices", apiLimiter, noticesRoutes);
app.use("/api/disputes", apiLimiter, disputesRoutes);
app.use("/api/billing", apiLimiter, billingRoutes);
app.use("/api/webhooks", webhookLimiter, webhooksRoutes);

// Catch-all for client-side routing
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "../client/index.html"));
  } else {
    res.status(404).json({ error: "Endpoint not found" });
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

const port = config.port;
app.listen(port, () => {
  logger.info(`🚀 IKE BOT Server listening on http://127.0.0.1:${port}`);
  logger.info(`📚 API Documentation available at http://127.0.0.1:${port}/`);
  logger.info(`🎨 Client UI available at http://127.0.0.1:${port}/client`);
});
