import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// 🧠 Your OpenAI API Key
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.SINTRA_PRIME_PORT || 3000;

// 🔗 Main Route: Sintra Agents → ChatGPT → Response back
app.post("/sintra-prime", async (req, res) => {
  try {
    const { agent, message, metadata } = req.body;

    if (!agent || !message) {
      return res.status(400).json({ 
        error: "Missing required fields: agent and message" 
      });
    }

    // 🔥 Send request to ChatGPT (GPT-4 Turbo)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `
You are SintraPrime — the master AI supervising all Sintra helper agents.
Always return structured JSON so automations never break.
Your role is to coordinate between multiple automation agents and provide intelligent routing decisions.
`,
          },
          {
            role: "user",
            content: `
Agent: ${agent}
Message: ${message}
Metadata: ${JSON.stringify(metadata || {})}
`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    res.json({
      status: "ok",
      agent,
      reply: data.choices?.[0]?.message?.content || "(no response)",
      model: data.model,
      usage: data.usage,
    });
  } catch (err) {
    console.error("SintraPrime error:", err);
    res.status(500).json({ 
      status: "error",
      error: err.message 
    });
  }
});

// 🔗 Health Check Route
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    service: "SintraPrime",
    version: "1.0.0"
  });
});

// 🌐 Start Server
app.listen(PORT, () => {
  console.log(`✅ SintraPrime connector is running on port ${PORT}`);
  console.log(`🔗 Endpoint: http://localhost:${PORT}/sintra-prime`);
  console.log(`❤️ Health check: http://localhost:${PORT}/health`);
});
