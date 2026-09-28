import React, { useState, useEffect } from "react";
import { X, CheckCircle, Brain, Database, Sparkles, AlertCircle } from "lucide-react";

export function ResolveModal({ isOpen, onClose, incident, onSaveResolution, isResolving }) {
  if (!isOpen || !incident) return null;

  const [rootCause, setRootCause] = useState("");
  const [resolution, setResolution] = useState("");
  const [preventativeAction, setPreventativeAction] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);

  // Initialize modal with suggested resolution data if available from analysis
  useEffect(() => {
    if (incident) {
      const withData = incident.analysisResult?.withMemory?.data;
      if (withData) {
        setRootCause(withData.diagnosis || "");
        setResolution((withData.suggestedFix || []).join("\n"));
        setPreventativeAction(withData.preventionAdvice || "");
      } else {
        setRootCause("");
        setResolution("");
        setPreventativeAction("");
      }
      setTagsInput(incident.service ? `${incident.service.toLowerCase()}, incident, postmortem` : "incident, postmortem");
      setStatusMessage(null);
    }
  }, [incident]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rootCause.trim() || !resolution.trim()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await onSaveResolution({
        id: incident.id,
        title: incident.title,
        service: incident.service,
        severity: incident.severity,
        description: incident.description,
        logs: incident.logs,
        rootCause,
        resolution,
        preventativeAction,
        tags
      });

      setStatusMessage({
        type: res.hindsightRetained ? "success" : "warning",
        text: res.message || "Resolution saved successfully."
      });

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: `Error saving resolution: ${err.message}`
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Brain size={20} color="var(--cyan)" />
            <span>Mark Incident as Resolved & Learn with Hindsight</span>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>INCIDENT REFERENCE</span>
            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#f8fafc" }}>
              [{incident.id}] {incident.title}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--cyan)", fontFamily: "var(--font-mono)" }}>
              Service: {incident.service} • Severity: {incident.severity}
            </div>
          </div>

          {/* Root Cause */}
          <div className="form-group">
            <label className="form-label">
              Confirmed Root Cause *
            </label>
            <textarea
              className="form-textarea"
              placeholder="What specifically caused this outage or failure?"
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              rows={3}
              required
            />
          </div>

          {/* Resolution Steps */}
          <div className="form-group">
            <label className="form-label">
              Verified Resolution & Mitigation Steps Applied *
            </label>
            <textarea
              className="form-textarea"
              placeholder="Step-by-step actions that resolved the incident (commands, configs, patches)..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Preventative Action */}
          <div className="form-group">
            <label className="form-label">
              Preventative Measures & Long-term Action Items
            </label>
            <textarea
              className="form-textarea"
              placeholder="Architectural guardrails, alert threshold updates, tests added..."
              value={preventativeAction}
              onChange={(e) => setPreventativeAction(e.target.value)}
              rows={2}
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">
              Tags / Keywords (comma-separated for Hindsight recall filtering)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="postgres, connection-pool, checkout, p1"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div 
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                fontSize: "0.82rem",
                marginBottom: "1rem",
                background: statusMessage.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                border: `1px solid ${statusMessage.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                color: statusMessage.type === "success" ? "#6ee7b7" : "#fcd34d",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              {statusMessage.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isResolving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-emerald"
              disabled={isResolving || !rootCause.trim() || !resolution.trim()}
            >
              <Database size={15} />
              <span>{isResolving ? "Retaining in Hindsight..." : "Retain in Hindsight Memory"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
