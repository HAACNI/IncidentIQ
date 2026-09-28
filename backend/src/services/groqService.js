import Groq from "groq-sdk";
import { config } from "../config.js";

class GroqService {
  constructor() {
    this.client = null;
    this.initClient();
  }

  initClient() {
    if (!config.groq.apiKey) {
      this.client = null;
      return;
    }

    try {
      this.client = new Groq({
        apiKey: config.groq.apiKey
      });
    } catch (err) {
      console.error("[GroqService] Error initializing Groq client:", err.message);
      this.client = null;
    }
  }

  isConfigured() {
    if (!this.client && config.groq.apiKey) {
      this.initClient();
    }
    return Boolean(this.client && config.groq.apiKey);
  }

  checkHealth() {
    return {
      configured: this.isConfigured(),
      model: config.groq.model,
      error: this.isConfigured()
        ? null
        : "GROQ_API_KEY is not set in backend/.env. Obtain a free key at https://console.groq.com/keys and configure it."
    };
  }

  /**
   * AGENT WITHOUT MEMORY:
   * Direct zero-shot LLM inference without any Hindsight memory or historical context.
   */
  async analyzeWithoutMemory(incident) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "GROQ_API_KEY is not configured in backend/.env. Please add your Groq API key.",
        latencyMs: 0
      };
    }

    const startTime = Date.now();

    const systemPrompt = `You are a standard Site Reliability Engineering (SRE) AI assistant.
You do NOT have access to any historical organization memory, previous incident reports, postmortems, or past team resolutions.
Your task is to analyze this incident strictly based on general computing knowledge.

Provide your response in JSON format with the following keys:
{
  "summary": "Brief 1-2 sentence assessment",
  "diagnosis": "Technical analysis of what might be happening based on standard symptoms",
  "troubleshootingSteps": [
    "Step 1: Check...",
    "Step 2: Inspect...",
    "Step 3: Attempt restart or restart container...",
    "Step 4: Collect more diagnostics..."
  ],
  "potentialRisks": [
    "Risk 1...",
    "Risk 2..."
  ],
  "memoryContextUsed": false
}
IMPORTANT: Only respond with valid JSON. Do not include markdown code block backticks.`;

    const userPrompt = `INCIDENT DETAILS:
Title: ${incident.title}
Service: ${incident.service || "Unknown Service"}
Severity: ${incident.severity || "P2 - High"}
Description: ${incident.description}

LOGS & TRACES:
${incident.logs || "No stack trace provided."}`;

    try {
      const completion = await this.client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: config.groq.model,
        temperature: 0.2,
        max_tokens: 750,
        response_format: { type: "json_object" }
      });

      const latencyMs = Date.now() - startTime;
      const content = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);

      return {
        success: true,
        latencyMs,
        model: config.groq.model,
        agentType: "without_memory",
        data: {
          summary: parsed.summary || "General symptom diagnosis",
          diagnosis: parsed.diagnosis || "Standard diagnosis without historical context",
          troubleshootingSteps: parsed.troubleshootingSteps || [
            "Check service CPU and memory metrics",
            "Verify database connectivity and query latency",
            "Review application logs for unhandled exceptions",
            "Consider restarting affected instances"
          ],
          potentialRisks: parsed.potentialRisks || [
            "Trial-and-error changes may exacerbate production latency",
            "Generic troubleshooting may overlook known recurring root causes"
          ],
          memoryContextUsed: false
        }
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      console.error("[GroqService] analyzeWithoutMemory failed:", err.message);
      return {
        success: false,
        error: `Groq LLM call failed: ${err.message}`,
        latencyMs
      };
    }
  }

  /**
   * AGENT WITH HINDSIGHT MEMORY:
   * Augments prompt with retrieved memories from the Hindsight memory system.
   */
  async analyzeWithMemory(incident, hindsightRecallResult) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "GROQ_API_KEY is not configured in backend/.env. Please add your Groq API key.",
        latencyMs: 0
      };
    }

    const startTime = Date.now();
    const hasMemories = hindsightRecallResult?.memories?.length > 0;
    const memoryPromptString = hindsightRecallResult?.promptString || "No matching historical records found in Hindsight.";

    const systemPrompt = `You are IncidentIQ, an elite AI Incident Response Agent powered by the Hindsight Long-Term Memory System.
You have access to historical incident postmortems, verified resolutions, and organizational memory retrieved from Hindsight.

Your objective:
1. Synthesize the current incident with the retrieved Hindsight memories.
2. Directly identify if this is a recurring issue, related incident, or has a precedent in the memory bank.
3. Pinpoint the EXACT root cause by citing past incidents and postmortems.
4. Prescribe a high-confidence, actionable fix and concrete mitigation commands based on proven historical resolutions.
5. Detail which past incident records and memories directly informed your decision.
Keep the diagnosis concise, focused, and punchy (under 350 words total) to fit within token limits while retaining full technical precision.

Respond in JSON format with the following keys:
{
  "summary": "Concise executive summary highlighting the past precedent match",
  "diagnosis": "Concise root cause analysis tying current symptoms directly to historical postmortems",
  "suggestedFix": [
    "Action 1: Immediate mitigation (commands/config)...",
    "Action 2: Permanent patch...",
    "Action 3: Verification command..."
  ],
  "preventionAdvice": "Long term architectural guardrail or alert setting to prevent recurrence",
  "confidenceScore": 95,
  "citedPastIncidents": [
    {
      "incidentId": "INC-XXXX-YYY or Document ID",
      "relevance": "Why this past incident applies to the current outage",
      "resolutionReused": "Key fix extracted from past memory"
    }
  ],
  "hindsightAdvantage": "Explanation of how Hindsight memory avoided generic guesswork and reduced MTTR (Mean Time to Resolution)"
}
IMPORTANT: Only respond with valid JSON. Do not include markdown code block backticks.`;

    const userPrompt = `CURRENT INCIDENT TO INVESTIGATE:
Title: ${incident.title}
Service: ${incident.service || "Unknown Service"}
Severity: ${incident.severity || "P2 - High"}
Description: ${incident.description}

LOGS & TRACES:
${incident.logs || "No stack trace provided."}

============================================================
RETRIEVED HINDSIGHT ORGANIZATIONAL MEMORIES:
============================================================
${memoryPromptString.slice(0, 3500)}
============================================================`;

    try {
      const completion = await this.client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: config.groq.model,
        temperature: 0.1,
        max_tokens: 750,
        response_format: { type: "json_object" }
      });

      const latencyMs = Date.now() - startTime;
      const content = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);

      return {
        success: true,
        latencyMs,
        model: config.groq.model,
        agentType: "with_memory",
        data: {
          summary: parsed.summary || "Memory-augmented incident diagnosis",
          diagnosis: parsed.diagnosis || "Root cause diagnosed using historical postmortems",
          suggestedFix: parsed.suggestedFix || [
            "Apply verified mitigation from historical postmortem",
            "Verify service health telemetry"
          ],
          preventionAdvice: parsed.preventionAdvice || "Deploy preventative alerts and configurations.",
          confidenceScore: parsed.confidenceScore || (hasMemories ? 92 : 65),
          citedPastIncidents: parsed.citedPastIncidents || [],
          hindsightAdvantage: parsed.hindsightAdvantage || "Leveraged organizational memory to bypass generic triage.",
          retrievedMemoriesCount: hindsightRecallResult?.memories?.length || 0,
          rawRetrievedMemories: hindsightRecallResult?.memories || [],
          memoryContextUsed: hasMemories
        }
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      console.error("[GroqService] analyzeWithMemory failed:", err.message);
      return {
        success: false,
        error: `Groq LLM call failed: ${err.message}`,
        latencyMs
      };
    }
  }
}

export const groqService = new GroqService();
