import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true, message: "IKE-BOT running" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "trust-navigator-api" });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Server listening on http://127.0.0.1:${port}`);
});
