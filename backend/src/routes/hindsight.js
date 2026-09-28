import express from "express";
import { hindsightService } from "../services/hindsightService.js";

const router = express.Router();

/**
 * GET /api/hindsight/status
 * Returns Hindsight connection status, bank details, and API version
 */
router.get("/status", async (req, res) => {
  try {
    const health = await hindsightService.checkHealth();
    res.json(health);
  } catch (err) {
    res.status(500).json({
      configured: false,
      connected: false,
      error: err.message
    });
  }
});

/**
 * POST /api/hindsight/seed
 * Seeds official sample incident postmortems into Hindsight memory bank
 */
router.post("/seed", async (req, res) => {
  try {
    if (!hindsightService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: "Cannot seed memories: HINDSIGHT_API_KEY is not configured in backend/.env. Please configure your key first."
      });
    }

    const result = await hindsightService.seedSampleIncidents();
    res.json({
      success: true,
      message: `Successfully seeded ${result.count} historical incident postmortems into Hindsight memory bank!`,
      details: result
    });
  } catch (err) {
    console.error("[HindsightRoute] /seed error:", err);
    res.status(500).json({
      success: false,
      error: `Failed to seed Hindsight memories: ${err.message}`
    });
  }
});

/**
 * GET /api/hindsight/memories
 * Lists memories stored in the current Hindsight memory bank
 */
router.get("/memories", async (req, res) => {
  try {
    const q = req.query.q || "";
    const result = await hindsightService.listMemories(q);
    res.json(result);
  } catch (err) {
    console.error("[HindsightRoute] /memories error:", err);
    res.status(500).json({
      configured: false,
      memories: [],
      error: err.message
    });
  }
});

/**
 * POST /api/hindsight/recall
 * Direct recall test endpoint for testing queries against Hindsight
 */
router.post("/recall", async (req, res) => {
  try {
    const { query, tags } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query string is required" });
    }

    const result = await hindsightService.recallMemories(query, tags);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
