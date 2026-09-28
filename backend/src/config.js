import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly resolve backend/.env relative to this config file
const backendEnvPath = path.resolve(__dirname, "../.env");
const rootEnvPath = path.resolve(__dirname, "../../.env");

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

const cleanEnv = (val) => {
  if (!val) return "";
  let trimmed = val.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

export const config = {
  port: parseInt(cleanEnv(process.env.PORT) || "3001", 10),
  groq: {
    apiKey: cleanEnv(process.env.GROQ_API_KEY),
    model: (() => {
      const m = cleanEnv(process.env.GROQ_MODEL);
      if (!m || m === "llama-3.3-70b-versatile") return "qwen/qwen3.8-27b";
      return m;
    })()
  },
  hindsight: {
    apiKey: cleanEnv(process.env.HINDSIGHT_API_KEY),
    baseUrl: cleanEnv(process.env.HINDSIGHT_BASE_URL) || "https://api.hindsight.vectorize.io",
    bankId: cleanEnv(process.env.HINDSIGHT_BANK_ID) || "incidentiq-ops-bank"
  }
};



