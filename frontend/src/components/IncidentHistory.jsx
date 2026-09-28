import React from "react";
import { History, CheckCircle2, Clock, Eye, AlertCircle, Sparkles } from "lucide-react";

export function IncidentHistory({ history, onSelectIncident, activeIncidentId }) {
  if (!history || history.length === 0) return null;

  const formatDate = (isoStr) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + d.toLocaleDateString();
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="history-card">
      <div className="section-header">
        <div className="section-title">
          <History size={18} color="var(--cyan)" />
          <span>Incident Investigation & Resolution History ({history.length})</span>
        </div>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Persisted incident postmortems & session triage records
        </span>
      </div>

      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Incident Title</th>
              <th>Service</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Hindsight Memory</th>
              <th>Created</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map((inc) => {
              const isSelected = activeIncidentId === inc.id;
              const isResolved = inc.status === "resolved";
              return (
                <tr key={inc.id} style={{ background: isSelected ? "rgba(6, 182, 212, 0.05)" : undefined }}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--cyan)" }}>
                    {inc.id}
                  </td>
                  <td style={{ fontWeight: 600, maxWidth: "300px" }}>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {inc.title}
                    </div>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.76rem", color: "#94a3b8" }}>
                    {inc.service}
                  </td>
                  <td>
                    <span className={inc.severity.includes("P1") ? "badge-p1" : inc.severity.includes("P2") ? "badge-p2" : "badge-p3"}>
                      {inc.severity}
                    </span>
                  </td>
                  <td>
                    {isResolved ? (
                      <span style={{ color: "#34d399", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600 }}>
                        <CheckCircle2 size={13} /> Resolved
                      </span>
                    ) : (
                      <span style={{ color: "#f59e0b", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Clock size={13} /> Investigating
                      </span>
                    )}
                  </td>
                  <td>
                    {inc.hindsightRetained ? (
                      <span style={{ color: "var(--cyan)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Sparkles size={13} /> Retained
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                        Not Retained
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {formatDate(inc.createdAt)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onSelectIncident(inc)}
                      title="Load this incident into the dual agent comparison panels"
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
