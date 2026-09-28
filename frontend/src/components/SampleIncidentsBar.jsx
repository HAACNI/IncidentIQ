import React from "react";
import { Sparkles, Terminal, ArrowRight, Layers } from "lucide-react";

export function SampleIncidentsBar({ samples, activeSampleId, onSelectSample }) {
  if (!samples || samples.length === 0) return null;

  const getSeverityBadge = (sev) => {
    if (sev.includes("P1")) return <span className="badge-p1">P1 - Critical</span>;
    if (sev.includes("P2")) return <span className="badge-p2">P2 - High</span>;
    if (sev.includes("P3")) return <span className="badge-p3">P3 - Medium</span>;
    return <span className="badge-p4">{sev}</span>;
  };

  return (
    <div className="sample-bar">
      <div className="sample-bar-header">
        <div className="sample-bar-title">
          <Layers size={15} color="#06b6d4" />
          <span>⚡ Instant Demo Scenarios (Pre-configured Sample Incidents)</span>
        </div>
        <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
          Click any scenario to populate the diagnosis workbench
        </span>
      </div>

      <div className="sample-grid">
        {samples.map((sample) => {
          const isSelected = activeSampleId === sample.id;
          return (
            <button
              key={sample.id}
              className={`sample-card ${isSelected ? "active" : ""}`}
              onClick={() => onSelectSample(sample)}
            >
              <div className="sample-card-top">
                <span className="sample-service">{sample.service}</span>
                {getSeverityBadge(sample.severity)}
              </div>
              <div className="sample-card-title">{sample.title}</div>
              <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  Sample Incident
                </span>
                <span style={{ fontSize: "0.75rem", color: isSelected ? "var(--cyan)" : "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                  {isSelected ? "Selected" : "Load Scenario"} <ArrowRight size={12} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
