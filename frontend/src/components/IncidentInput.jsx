import React from "react";
import { AlertCircle, Terminal, Activity, Zap, RotateCcw, FileText } from "lucide-react";

export function IncidentInput({
  form,
  onChange,
  onReset,
  onSubmit,
  isAnalyzing,
  isSample
}) {
  return (
    <div className="input-card">
      <div className="section-header">
        <div className="section-title">
          <Activity size={18} color="#06b6d4" />
          <span>Active Incident Workbench</span>
        </div>
        {isSample && (
          <div className="sample-notice">
            <AlertCircle size={14} />
            <span>Sample Incident Data Loaded (Click 'Run Dual-Agent Diagnosis' to compare agents)</span>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-row">
          {/* Incident Title */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <FileText size={14} /> Incident Title / Alert Summary *
            </label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="e.g. PostgreSQL Connection Pool Exhaustion on Checkout Service"
              value={form.title}
              onChange={onChange}
              required
            />
          </div>

          {/* Service / Component */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Service / Component *
            </label>
            <input
              type="text"
              name="service"
              className="form-input"
              placeholder="e.g. checkout-api, auth-gateway"
              value={form.service}
              onChange={onChange}
              required
            />
          </div>

          {/* Severity */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Severity Level *
            </label>
            <select
              name="severity"
              className="form-select"
              value={form.severity}
              onChange={onChange}
            >
              <option value="P1 - Critical">P1 - Critical (Outage)</option>
              <option value="P2 - High">P2 - High (Degraded)</option>
              <option value="P3 - Medium">P3 - Medium (Warning)</option>
              <option value="P4 - Low">P4 - Low (Informational)</option>
            </select>
          </div>
        </div>

        {/* Symptoms / Description */}
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label className="form-label">
            Incident Description & Observed Impact *
          </label>
          <textarea
            name="description"
            className="form-textarea"
            placeholder="Describe the failure, impact on users, error rates, or alert notifications..."
            value={form.description}
            onChange={onChange}
            rows={3}
            required
          />
        </div>

        {/* Error Logs / Traces */}
        <div className="form-group">
          <label className="form-label">
            <Terminal size={14} /> Error Logs / Stack Traces / Telemetry
          </label>
          <textarea
            name="logs"
            className="form-textarea code-textarea"
            placeholder="Paste raw log lines, stack traces, stderr output, or metrics..."
            value={form.logs}
            onChange={onChange}
            rows={5}
          />
        </div>

        {/* Form Footer */}
        <div className="form-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onReset}
            disabled={isAnalyzing}
          >
            <RotateCcw size={14} />
            <span>Clear Form</span>
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isAnalyzing || !form.title.trim() || !form.description.trim()}
            style={{ minWidth: "240px" }}
          >
            {isAnalyzing ? (
              <>
                <div className="radar-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                <span>Running Dual-Agent Diagnosis...</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Run Dual-Agent Diagnosis</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
