import express from "express";
import { groqService } from "../services/groqService.js";
import { hindsightService } from "../services/hindsightService.js";
import { storeService } from "../services/storeService.js";
import { SAMPLE_INCIDENTS } from "../data/sampleIncidents.js";

const router = express.Router();

/**
 * GET /api/incidents/samples
 * Returns realistic sample incidents for instant demo
 */
router.get("/samples", (req, res) => {
  res.json({
    success: true,
    samples: SAMPLE_INCIDENTS
  });
});

/**
 * GET /api/incidents/history
 * Returns investigated incidents and their resolution states
 */
router.get("/history", (req, res) => {
  const history = storeService.getAll();
  res.json({
    success: true,
    history
  });
});

/**
 * POST /api/incidents/analyze
 * Runs side-by-side analysis:
 * 1) Agent Without Memory (Direct LLM)
 * 2) Agent With Hindsight Memory (Hindsight recall + LLM)
 */
router.post("/analyze", async (req, res) => {
  try {
    const { id, title, service, severity, description, logs, isSample } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: "Incident title and description are required."
      });
    }

    const incident = {
      id: id || `INC-${Date.now().toString().slice(-6)}`,
      title,
      service: service || "core-service",
      severity: severity || "P2 - High",
      description,
      logs: logs || "",
      isSample: Boolean(isSample)
    };

    // 1. Kick off Agent Without Memory
    const withoutMemoryPromise = groqService.analyzeWithoutMemory(incident);

    // 2. Query Hindsight memory bank for relevant past incidents
    const recallQuery = `${incident.title} ${incident.service} ${incident.description} ${incident.logs}`.slice(0, 1000);
    const tags = [incident.service.toLowerCase(), incident.severity.toLowerCase().replace(/[^a-z0-9]/g, "")];
    
    const recallStartTime = Date.now();
    const hindsightRecall = await hindsightService.recallMemories(recallQuery, tags);
    const recallLatencyMs = Date.now() - recallStartTime;

    // 3. Kick off Agent With Hindsight Memory
    const withMemoryPromise = groqService.analyzeWithMemory(incident, hindsightRecall);

    // Await both agents in parallel
    const [withoutMemoryResult, withMemoryResult] = await Promise.all([
      withoutMemoryPromise,
      withMemoryPromise
    ]);

    // Attach recall metadata to withMemory response
    if (withMemoryResult.data) {
      withMemoryResult.data.recallLatencyMs = recallLatencyMs;
      withMemoryResult.data.hindsightConfigured = hindsightRecall.configured;
    }

    // Save this incident into store
    const storedRecord = storeService.addIncident({
      ...incident,
      analysisResult: {
        withoutMemory: withoutMemoryResult,
        withMemory: withMemoryResult,
        hindsightRecall: {
          configured: hindsightRecall.configured,
          memoriesCount: hindsightRecall.count,
          error: hindsightRecall.error
        }
      }
    });

    res.json({
      success: true,
      incident: storedRecord,
      withoutMemory: withoutMemoryResult,
      withMemory: withMemoryResult,
      hindsight: {
        configured: hindsightRecall.configured,
        memoriesCount: hindsightRecall.count,
        memories: hindsightRecall.memories,
        error: hindsightRecall.error,
        recallLatencyMs
      }
    });
  } catch (err) {
    console.error("[IncidentsRoute] /analyze error:", err);
    res.status(500).json({
      success: false,
      error: `Failed to analyze incident: ${err.message}`
    });
  }
});

/**
 * POST /api/incidents/resolve
 * Marks incident as resolved and saves postmortem to Hindsight memory bank
 */
router.post("/resolve", async (req, res) => {
  try {
    const {
      id,
      title,
      service,
      severity,
      description,
      logs,
      rootCause,
      resolution,
      preventativeAction,
      tags
    } = req.body;

    if (!id || !rootCause || !resolution) {
      return res.status(400).json({
        success: false,
        error: "Incident ID, root cause, and resolution steps are required to store in memory."
      });
    }

    let hindsightRetained = false;
    let hindsightDocId = null;
    let hindsightError = null;

    // Check if Hindsight is configured
    if (hindsightService.isConfigured()) {
      try {
        const retainResult = await hindsightService.retainIncident({
          id,
          title,
          service,
          severity,
          description,
          logs,
          rootCause,
          resolution,
          preventativeAction,
          tags: tags || []
        });
        hindsightRetained = true;
        hindsightDocId = retainResult.documentId;
      } catch (err) {
        console.error("[IncidentsRoute] Failed to retain in Hindsight:", err.message);
        hindsightError = err.message;
      }
    } else {
      hindsightError = "Hindsight API key not configured. Memory was not saved to Hindsight cloud.";
    }

    // Update local store
    const updated = storeService.markResolved(id, {
      rootCause,
      resolution,
      preventativeAction,
      tags,
      hindsightRetained,
      hindsightDocId
    });

    res.json({
      success: true,
      incident: updated,
      hindsightRetained,
      hindsightDocId,
      hindsightError,
      message: hindsightRetained
        ? "Incident resolution successfully retained in Hindsight memory bank!"
        : "Incident marked resolved locally. Note: Hindsight memory retain requires valid HINDSIGHT_API_KEY in backend/.env."
    });
  } catch (err) {
    console.error("[IncidentsRoute] /resolve error:", err);
    res.status(500).json({
      success: false,
      error: `Failed to resolve incident: ${err.message}`
    });
  }
});

export default router;
