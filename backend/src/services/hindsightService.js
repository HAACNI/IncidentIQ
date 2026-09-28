import { HindsightClient, recallResponseToPromptString } from "@vectorize-io/hindsight-client";
import { config } from "../config.js";
import { SAMPLE_INCIDENTS } from "../data/sampleIncidents.js";

class HindsightService {
  constructor() {
    this.client = null;
    this.bankInitialized = false;
    this.initClient();
  }

  initClient() {
    const isLocal = config.hindsight.baseUrl.includes("localhost") || config.hindsight.baseUrl.includes("127.0.0.1");
    if (!config.hindsight.apiKey && !isLocal) {
      this.client = null;
      return;
    }

    try {
      this.client = new HindsightClient({
        baseUrl: config.hindsight.baseUrl,
        apiKey: config.hindsight.apiKey || undefined
      });
    } catch (err) {
      console.error("[HindsightService] Error initializing Hindsight client:", err.message);
      this.client = null;
    }
  }

  isConfigured() {
    const isLocal = config.hindsight.baseUrl.includes("localhost") || config.hindsight.baseUrl.includes("127.0.0.1");
    if (!this.client && (config.hindsight.apiKey || isLocal)) {
      this.initClient();
    }
    return Boolean(this.client && (config.hindsight.apiKey || isLocal));
  }

  async checkHealth() {
    if (!this.isConfigured()) {
      return {
        configured: false,
        connected: false,
        bankId: config.hindsight.bankId,
        baseUrl: config.hindsight.baseUrl,
        error: "HINDSIGHT_API_KEY is not set in backend/.env. Add your key from https://hindsight.vectorize.io (or run local Docker container)."
      };
    }

    try {
      const version = await this.client.getVersion();
      return {
        configured: true,
        connected: true,
        bankId: config.hindsight.bankId,
        baseUrl: config.hindsight.baseUrl,
        apiVersion: version.api_version,
        features: version.features || {}
      };
    } catch (err) {
      return {
        configured: true,
        connected: false,
        bankId: config.hindsight.bankId,
        baseUrl: config.hindsight.baseUrl,
        error: `Failed to connect to Hindsight API (${config.hindsight.baseUrl}): ${err.message}`
      };
    }
  }

  async ensureBank() {
    if (!this.isConfigured() || this.bankInitialized) return;
    try {
      await this.client.createBank(config.hindsight.bankId, {
        name: "IncidentIQ Memory Bank",
        retainMission: "Extract software incidents, system architectures, root causes, troubleshooting steps, and verified production resolutions.",
        reflectMission: "Synthesize software incident root causes and suggest actionable fixes based on historical postmortems and past system failures."
      });
      this.bankInitialized = true;
    } catch (err) {
      // Bank may already exist or profile cannot be updated
      this.bankInitialized = true;
    }
  }

  /**
   * Recall relevant memories from Hindsight
   */
  async recallMemories(query, tags = []) {
    if (!this.isConfigured()) {
      return {
        configured: false,
        memories: [],
        count: 0,
        promptString: "",
        error: "Hindsight API key not configured. Memory retrieval bypassed."
      };
    }

    try {
      await this.ensureBank();
      const recallOptions = {
        budget: "mid",
        preferObservations: true
      };

      if (tags && tags.length > 0) {
        recallOptions.tags = tags;
        recallOptions.tagsMatch = "any";
      }

      const response = await this.client.recall(config.hindsight.bankId, query, recallOptions);
      
      const memories = (response.results || []).map((res) => ({
        id: res.id,
        text: res.text,
        type: res.type || "fact",
        context: res.context || null,
        entities: this.normalizeEntities(res.entities),
        metadata: res.metadata || {},
        documentId: res.document_id || null,
        chunkId: res.chunk_id || null
      }));

      const promptString = recallResponseToPromptString(response);

      return {
        configured: true,
        memories,
        count: memories.length,
        promptString,
        entities: response.entities || {},
        error: null
      };
    } catch (err) {
      console.error("[HindsightService] recallMemories failed:", err.message);
      return {
        configured: true,
        memories: [],
        count: 0,
        promptString: "",
        error: `Hindsight recall failed: ${err.message}`
      };
    }
  }

  /**
   * Retain an incident resolution in Hindsight
   */
  async retainIncident({ id, title, service, severity, description, logs, rootCause, resolution, preventativeAction, tags = [] }) {
    if (!this.isConfigured()) {
      throw new Error("Hindsight API is not configured. Set HINDSIGHT_API_KEY in backend/.env to store memories.");
    }

    await this.ensureBank();

    const formattedContent = `[SOFTWARE INCIDENT POSTMORTEM REPORT]
Incident ID: ${id}
Title: ${title}
Service / Component: ${service}
Severity: ${severity}
Date: ${new Date().toISOString()}

SYMPTOMS & LOGS:
Description: ${description}
Error Log Traces:
${logs || "No stack trace provided."}

ROOT CAUSE ANALYSIS:
${rootCause}

VERIFIED RESOLUTION & MITIGATION STEPS:
${resolution}

PREVENTATIVE MEASURES & ACTION ITEMS:
${preventativeAction || "None specified."}
`;

    const docId = `inc-postmortem-${id.toLowerCase().replace(/[^a-z0-9_-]/g, "-")}`;
    const cleanTags = [...new Set(["incident", "postmortem", service.toLowerCase(), ...(tags || [])])];

    const retainRes = await this.client.retain(config.hindsight.bankId, formattedContent, {
      documentId: docId,
      context: `Postmortem and resolution guide for incident ${id} in service ${service}`,
      tags: cleanTags,
      metadata: {
        incident_id: id,
        service: service,
        severity: severity,
        stored_at: new Date().toISOString()
      }
    });

    return {
      success: true,
      documentId: docId,
      bankId: config.hindsight.bankId,
      retainResult: retainRes
    };
  }

  /**
   * Seed the sample incidents into live Hindsight memory bank
   */
  async seedSampleIncidents() {
    if (!this.isConfigured()) {
      throw new Error("Hindsight API is not configured. Add HINDSIGHT_API_KEY to backend/.env to seed memory.");
    }

    await this.ensureBank();
    const seeded = [];

    for (const sample of SAMPLE_INCIDENTS) {
      const hist = sample.historicalRecord;
      const content = `[HISTORICAL POSTMORTEM RECORD - INCIDENT ARCHIVE]
Reference ID: ${hist.pastIncidentId}
Title: ${hist.title}
Target Service: ${hist.service}
Severity: ${sample.severity}

BACKGROUND PROBLEM:
${sample.description}

OBSERVED ERROR TRACES:
${sample.logs}

CONFIRMED ROOT CAUSE:
${hist.rootCause}

PROVEN RESOLUTION STEPS:
${hist.resolution}

PREVENTATIVE ARCHITECTURE CHANGES:
${hist.preventativeAction}
`;

      const docId = `sample-postmortem-${hist.pastIncidentId.toLowerCase()}`;
      await this.client.retain(config.hindsight.bankId, content, {
        documentId: docId,
        context: `Historical incident ${hist.pastIncidentId} resolution for ${hist.service}`,
        tags: hist.tags,
        metadata: {
          past_incident_id: hist.pastIncidentId,
          service: hist.service,
          source: "sample_knowledge_base"
        }
      });

      seeded.push({
        pastIncidentId: hist.pastIncidentId,
        title: hist.title,
        service: hist.service,
        docId
      });
    }

    return {
      success: true,
      count: seeded.length,
      seededIncidents: seeded
    };
  }


  normalizeEntities(entities) {
    if (!entities) return [];
    if (Array.isArray(entities)) {
      return entities
        .map((e) => (typeof e === "object" && e !== null ? (e.name || e.label || JSON.stringify(e)) : String(e).trim()))
        .filter(Boolean);
    }
    if (typeof entities === "string") {
      return entities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }

  async listMemories(queryText = "") {
    if (!this.isConfigured()) {
      return {
        configured: false,
        memories: [],
        total: 0,
        error: "Hindsight API key is not configured."
      };
    }

    try {
      await this.ensureBank();
      const res = await this.client.listMemories(config.hindsight.bankId, {
        limit: 50,
        q: queryText || undefined
      });

      const rawItems = res.items || [];
      const normalizedMemories = rawItems.map((item) => ({
        id: item.id,
        text: item.text || "",
        type: item.fact_type || item.type || "fact",
        context: item.context || null,
        entities: this.normalizeEntities(item.entities),
        tags: Array.isArray(item.tags) ? item.tags : [],
        documentId: item.document_id || null,
        chunkId: item.chunk_id || null,
        metadata: item.metadata || {},
        date: item.date || item.occurred_start || item.mentioned_at || null
      }));

      return {
        configured: true,
        memories: normalizedMemories,
        total: res.total !== undefined ? res.total : normalizedMemories.length,
        error: null
      };
    } catch (err) {
      return {
        configured: true,
        memories: [],
        total: 0,
        error: err.message
      };
    }
  }
}

export const hindsightService = new HindsightService();
