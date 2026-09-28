import express from "express";
import cors from "cors";
import { config } from "./config.js";
import healthRouter from "./routes/health.js";
import incidentsRouter from "./routes/incidents.js";
import hindsightRouter from "./routes/hindsight.js";
import { hindsightService } from "./services/hindsightService.js";
import { groqService } from "./services/groqService.js";

const app = express();

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/health", healthRouter);
app.use("/api/incidents", incidentsRouter);
app.use("/api/hindsight", hindsightRouter);

// Root greeting / health
app.get("/", (req, res) => {
  res.json({
    name: "IncidentIQ API",
    description: "AI Incident Response Agent with Hindsight Memory System and Groq LLM",
    version: "1.0.0",
    docs: "/api/health"
  });
});

// Start server
app.listen(config.port, async () => {
  console.log(`\n==================================================`);
  console.log(`🚀 IncidentIQ Backend Server running on port ${config.port}`);
  console.log(`🌐 Base URL: http://localhost:${config.port}`);
  console.log(`--------------------------------------------------`);
  
  // Log Groq configuration
  if (groqService.isConfigured()) {
    console.log(`⚡ Groq AI: Configured (Model: ${config.groq.model})`);
  } else {
    console.warn(`⚠️  Groq AI: Missing GROQ_API_KEY in backend/.env`);
  }

  // Log Hindsight configuration
  if (hindsightService.isConfigured()) {
    console.log(`🧠 Hindsight Memory: Configured (Bank: ${config.hindsight.bankId})`);
    console.log(`🔗 Hindsight Base URL: ${config.hindsight.baseUrl}`);
    try {
      const health = await hindsightService.checkHealth();
      if (health.connected) {
        console.log(`✅ Hindsight Connected (API Version: ${health.apiVersion})`);
      } else {
        console.warn(`⚠️  Hindsight Connection Error: ${health.error}`);
      }
    } catch (e) {
      console.warn(`⚠️  Hindsight Health Check: ${e.message}`);
    }
  } else {
    console.warn(`⚠️  Hindsight Memory: Missing HINDSIGHT_API_KEY in backend/.env`);
    console.warn(`   Official API: https://hindsight.vectorize.io`);
  }
  console.log(`==================================================\n`);
});
