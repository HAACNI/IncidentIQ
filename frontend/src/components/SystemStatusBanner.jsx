import React from "react";
import { AlertTriangle, Key, ExternalLink, RefreshCw, CheckCircle2 } from "lucide-react";

export function SystemStatusBanner({ health, onRefreshHealth }) {
  const groqMissing = !health?.groq?.configured;
  const hindsightMissing = !health?.hindsight?.configured;
  const hindsightError = health?.hindsight?.error;

  if (!groqMissing && !hindsightMissing && health?.hindsight?.connected) {
    return null; // All systems green!
  }

  return (
    <div className="system-banner warning">
      <AlertTriangle size={22} color="#f59e0b" style={{ flexShrink: 0, marginTop: "2px" }} />
      <div className="banner-content">
        <div className="banner-title">
          Configuration Notice: Setup API Credentials for Full AI & Memory Capabilities
        </div>
        <div className="banner-desc">
          {groqMissing && (
            <p style={{ marginBottom: "0.4rem" }}>
              ⚡ <strong>Groq API Key Missing:</strong> Get a free, lightning-fast API key at{" "}
              <a 
                href="https://console.groq.com/keys" 
                target="_blank" 
                rel="noreferrer" 
                style={{ color: "#38bdf8", textDecoration: "underline" }}
              >
                console.groq.com <ExternalLink size={12} style={{ display: "inline" }} />
              </a>{" "}
              and add <code className="banner-code">GROQ_API_KEY=gsk_...</code> to <code className="banner-code">backend/.env</code>.
            </p>
          )}

          {hindsightMissing ? (
            <p>
              🧠 <strong>Hindsight Memory Service Unconfigured:</strong> The "With Memory Agent" and learning features require the official Hindsight API. 
              Sign up at{" "}
              <a 
                href="https://hindsight.vectorize.io" 
                target="_blank" 
                rel="noreferrer" 
                style={{ color: "#34d399", textDecoration: "underline" }}
              >
                hindsight.vectorize.io <ExternalLink size={12} style={{ display: "inline" }} />
              </a>{" "}
              or run a local instance, and add <code className="banner-code">HINDSIGHT_API_KEY=hsk_...</code> to <code className="banner-code">backend/.env</code>.
            </p>
          ) : hindsightError ? (
            <p style={{ color: "#fca5a5" }}>
              ⚠️ <strong>Hindsight Service Notice:</strong> {hindsightError}
            </p>
          ) : null}
        </div>
      </div>
      <button 
        className="btn btn-secondary btn-sm" 
        onClick={onRefreshHealth}
        title="Re-check backend API keys status"
      >
        <RefreshCw size={13} />
        <span>Check Status</span>
      </button>
    </div>
  );
}
