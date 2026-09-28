import React, { useState } from "react";
import { 
  Bot, 
  Brain, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Check, 
  Copy, 
  ShieldCheck, 
  Database,
  ArrowRight,
  TrendingDown,
  Sparkles,
  BookmarkPlus
} from "lucide-react";

export function ComparisonPanels({
  isAnalyzing,
  analysisData,
  onOpenResolveModal,
  currentIncident
}) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (isAnalyzing) {
    return (
      <div className="agent-panel" style={{ marginBottom: "2rem" }}>
        <div className="scanning-state">
          <div className="radar-spinner" />
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginTop: "0.5rem" }}>
            Dual-Agent SRE Triage in Progress...
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: 500, textAlign: "center" }}>
            Querying Groq LLM (Base Agent) while concurrently interrogating the Hindsight Memory System for matching historical incident postmortems.
          </p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return null;
  }

  const { withoutMemory, withMemory, hindsight } = analysisData;
  const withoutData = withoutMemory?.data;
  const withData = withMemory?.data;

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="comparison-container">
      <div className="comparison-header">
        <h2 className="comparison-headline">Side-by-Side Dual Agent Evaluation</h2>
        <p className="comparison-sub">
          Compare standard zero-shot LLM inference against Hindsight Memory-Augmented incident diagnosis.
        </p>
      </div>

      <div className="panels-grid">
        {/* ==========================================
            PANEL 1: AGENT WITHOUT MEMORY
           ========================================== */}
        <div className="agent-panel panel-without-memory">
          <div className="panel-top">
            <div className="panel-agent-info">
              <div className="agent-avatar avatar-standard">
                <Bot size={20} />
              </div>
              <div>
                <div className="agent-name">Agent Without Memory</div>
                <div className="agent-badge-desc">Standard LLM (Zero-Shot) • No Past Context</div>
              </div>
            </div>

            <div className="panel-meta-tags">
              {withoutMemory?.latencyMs !== undefined && (
                <span className="latency-pill">
                  <Clock size={11} style={{ display: "inline", marginRight: 3 }} />
                  {withoutMemory.latencyMs}ms
                </span>
              )}
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Memory: None
              </span>
            </div>
          </div>

          {withoutMemory?.error ? (
            <div className="diagnosis-box box-muted" style={{ borderColor: "#f43f5e" }}>
              <p style={{ color: "#fca5a5" }}>⚠️ {withoutMemory.error}</p>
            </div>
          ) : withoutData ? (
            <>
              {/* Executive Summary */}
              <div className="panel-section">
                <div className="panel-section-title">
                  <AlertTriangle size={13} color="#94a3b8" /> Initial Assessment
                </div>
                <div className="diagnosis-box box-muted">
                  <strong>{withoutData.summary}</strong>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="panel-section">
                <div className="panel-section-title">
                  Probable Diagnosis (Theoretical)
                </div>
                <p style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                  {withoutData.diagnosis}
                </p>
              </div>

              {/* Troubleshooting Checklist */}
              <div className="panel-section">
                <div className="panel-section-title">
                  Generic Troubleshooting Steps
                </div>
                <ul className="steps-list">
                  {(withoutData.troubleshootingSteps || []).map((step, idx) => (
                    <li key={idx} className="step-item">
                      <span className="step-number">{idx + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Potential Risks */}
              {withoutData.potentialRisks && (
                <div className="panel-section">
                  <div className="panel-section-title" style={{ color: "#f87171" }}>
                    Potential Risks & Trial-and-Error Overhead
                  </div>
                  <ul className="steps-list">
                    {withoutData.potentialRisks.map((risk, idx) => (
                      <li key={idx} className="step-item" style={{ borderColor: "rgba(244, 63, 94, 0.2)" }}>
                        <span style={{ color: "#f43f5e", fontSize: "0.8rem", marginRight: "4px" }}>⚠️</span>
                        <span style={{ color: "#fda4af" }}>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Limitation Callout */}
              <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                <em>* Note: This agent operates without access to historical postmortems or past team resolutions. Suggested actions require trial-and-error verification.</em>
              </div>
            </>
          ) : null}
        </div>

        {/* ==========================================
            PANEL 2: AGENT WITH HINDSIGHT MEMORY
           ========================================== */}
        <div className="agent-panel panel-with-memory">
          <div className="panel-top">
            <div className="panel-agent-info">
              <div className="agent-avatar avatar-memory">
                <Brain size={20} />
              </div>
              <div>
                <div className="agent-name" style={{ color: "var(--cyan)" }}>
                  Agent With Hindsight Memory
                </div>
                <div className="agent-badge-desc">Hindsight Memory Augmented • Historical Context</div>
              </div>
            </div>

            <div className="panel-meta-tags">
              {withMemory?.latencyMs !== undefined && (
                <span className="latency-pill" style={{ borderColor: "rgba(6, 182, 212, 0.3)", color: "var(--cyan)" }}>
                  <Clock size={11} style={{ display: "inline", marginRight: 3 }} />
                  {withMemory.latencyMs}ms
                </span>
              )}
              {withData?.confidenceScore && (
                <span className="confidence-pill">
                  {withData.confidenceScore}% Confidence
                </span>
              )}
            </div>
          </div>

          {withMemory?.error ? (
            <div className="diagnosis-box box-cyan" style={{ borderColor: "#f43f5e" }}>
              <p style={{ color: "#fca5a5" }}>⚠️ {withMemory.error}</p>
            </div>
          ) : withData ? (
            <>
              {/* Executive Summary */}
              <div className="panel-section">
                <div className="panel-section-title">
                  <Sparkles size={13} color="var(--cyan)" /> Precedent-Informed Assessment
                </div>
                <div className="diagnosis-box box-cyan">
                  <strong style={{ color: "#67e8f9" }}>{withData.summary}</strong>
                </div>
              </div>

              {/* Pinpointed Diagnosis */}
              <div className="panel-section">
                <div className="panel-section-title">
                  Pinpointed Root Cause (From Historical Memory)
                </div>
                <p style={{ fontSize: "0.85rem", color: "#e2e8f0", lineHeight: 1.5 }}>
                  {withData.diagnosis}
                </p>
              </div>

              {/* Suggested Fix & Commands */}
              <div className="panel-section">
                <div className="panel-section-title" style={{ color: "#34d399" }}>
                  <ShieldCheck size={13} color="#34d399" /> Verified Fix & Exact Mitigation Steps
                </div>
                <ul className="steps-list">
                  {(withData.suggestedFix || []).map((step, idx) => (
                    <li key={idx} className="step-item fix-action">
                      <span className="step-number">{idx + 1}</span>
                      <span style={{ flex: 1 }}>{step}</span>
                      <button 
                        className="btn-close"
                        style={{ padding: "0.15rem", color: copiedIndex === idx ? "var(--emerald)" : "var(--text-muted)" }}
                        onClick={() => handleCopy(step, idx)}
                        title="Copy command to clipboard"
                      >
                        {copiedIndex === idx ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preventative Advice */}
              {withData.preventionAdvice && (
                <div className="panel-section">
                  <div className="panel-section-title">
                    Long-term Guardrail / Preventative Action
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#94a3b8", background: "rgba(255, 255, 255, 0.02)", padding: "0.55rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                    {withData.preventionAdvice}
                  </div>
                </div>
              )}

              {/* Retrieved Past Incidents from Hindsight */}
              <div className="retrieved-memories-card">
                <div className="memories-header">
                  <div className="memories-title">
                    <Database size={14} />
                    <span>Retrieved Past Incidents from Hindsight ({hindsight?.memories?.length || 0} recalled)</span>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--cyan)", fontFamily: "var(--font-mono)" }}>
                    Recall: {hindsight?.recallLatencyMs || 0}ms
                  </span>
                </div>

                {hindsight?.memories && hindsight.memories.length > 0 ? (
                  <div className="memories-list">
                    {hindsight.memories.map((mem) => {
                      const entityList = Array.isArray(mem.entities)
                        ? mem.entities
                        : typeof mem.entities === "string"
                        ? mem.entities.split(",").map((s) => s.trim()).filter(Boolean)
                        : [];
                      return (
                        <div key={mem.id} className="memory-entry">
                          <div className="memory-top">
                            <span className="memory-id">{mem.documentId || mem.id}</span>
                            <span className="memory-type">{mem.type}</span>
                          </div>
                          <p className="memory-text">{mem.text}</p>
                          {entityList.length > 0 && (
                            <div className="memory-entities">
                              {entityList.map((ent, i) => (
                                <span key={i} className="entity-tag">
                                  {typeof ent === "object" && ent !== null ? (ent.name || JSON.stringify(ent)) : String(ent)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    {hindsight?.configured ? (
                      <span>No prior postmortems in Hindsight matched this query. Mark this incident as resolved to retain it for future analysis!</span>
                    ) : (
                      <span>Hindsight API is unconfigured. Set HINDSIGHT_API_KEY in backend/.env to retrieve persistent memories.</span>
                    )}
                  </div>
                )}
              </div>

              {/* MTTR Advantage */}
              <div className="mttr-banner">
                <TrendingDown size={18} color="var(--emerald)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Hindsight Advantage:</strong> Reused verified organizational fix, avoiding generic trial-and-error restarts and drastically lowering MTTR.
                </span>
              </div>

              {/* Action Button: Mark as Resolved & Learn */}
              <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
                <button 
                  className="btn btn-emerald"
                  onClick={onOpenResolveModal}
                >
                  <BookmarkPlus size={15} />
                  <span>Mark Resolved & Save to Hindsight</span>
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
