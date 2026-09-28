import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../../data");
const STORE_FILE = path.join(DATA_DIR, "incident-history.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class StoreService {
  constructor() {
    this.incidents = [];
    this.loadStore();
  }

  loadStore() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, "utf-8");
        this.incidents = JSON.parse(raw);
      }
    } catch (err) {
      console.warn("[StoreService] Failed to load incident history file, starting empty:", err.message);
      this.incidents = [];
    }
  }

  saveStore() {
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.incidents, null, 2), "utf-8");
    } catch (err) {
      console.error("[StoreService] Failed to persist incident history:", err.message);
    }
  }

  getAll() {
    return [...this.incidents].reverse();
  }

  getById(id) {
    return this.incidents.find((inc) => inc.id === id);
  }

  addIncident(incident) {
    const record = {
      id: incident.id || `INC-${Date.now()}`,
      title: incident.title,
      service: incident.service || "unknown-service",
      severity: incident.severity || "P2 - High",
      description: incident.description,
      logs: incident.logs || "",
      status: incident.status || "investigating", // "investigating" | "resolved"
      analysisResult: incident.analysisResult || null,
      createdAt: incident.createdAt || new Date().toISOString(),
      resolvedAt: incident.resolvedAt || null,
      resolutionData: incident.resolutionData || null,
      isSample: !!incident.isSample,
      hindsightRetained: !!incident.hindsightRetained
    };

    // If an incident with the same ID exists, update it, else prepend
    const existingIndex = this.incidents.findIndex((item) => item.id === record.id);
    if (existingIndex >= 0) {
      this.incidents[existingIndex] = { ...this.incidents[existingIndex], ...record };
    } else {
      this.incidents.push(record);
    }

    this.saveStore();
    return record;
  }

  markResolved(id, { rootCause, resolution, preventativeAction, tags, hindsightRetained = false, hindsightDocId = null }) {
    const incident = this.getById(id);
    if (!incident) return null;

    incident.status = "resolved";
    incident.resolvedAt = new Date().toISOString();
    incident.resolutionData = {
      rootCause,
      resolution,
      preventativeAction: preventativeAction || "",
      tags: tags || [],
      hindsightDocId
    };
    incident.hindsightRetained = hindsightRetained;

    this.saveStore();
    return incident;
  }
}

export const storeService = new StoreService();
