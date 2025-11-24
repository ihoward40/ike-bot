import express from "express";
import dotenv from "dotenv";
import beneficiaryRoutes from "./routes/beneficiaryRoutes";
import disputeRoutes from "./routes/disputeRoutes";
import billingAlertRoutes from "./routes/billingAlertRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
app.use(express.json());

// Health check endpoint
app.get("/", (_req, res) => {
  res.json({ ok: true, message: "IKE-BOT running" });
});

// API routes for Trust Navigator
app.use("/api/beneficiaries", beneficiaryRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/billing-alerts", billingAlertRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Server listening on http://127.0.0.1:${port}`);
});

export default app;
