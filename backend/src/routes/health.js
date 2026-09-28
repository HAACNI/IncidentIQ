import express from "express";
import { groqService } from "../services/groqService.js";
import { hindsightService } from "../services/hindsightService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const groqHealth = groqService.checkHealth();
  const hindsightHealth = await hindsightService.checkHealth();

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    groq: groqHealth,
    hindsight: hindsightHealth
  });
});

export default router;
