import React, { useState, useEffect } from "react";
import { 
  X, 
  Search, 
  Database, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  Tag, 
  Calendar, 
  FileText, 
  Copy, 
  Check, 
  Layers,
  ExternalLink
} from "lucide-react";
import { fetchHindsightMemories, seedHindsightMemories } from "../services/api";

// Safe helper to convert any entity representation into an array of displayable strings
function safeList(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (item === null || item === undefined) return "";
        if (typeof item === "object") {
          return item.name || item.label || item.id || JSON.stringify(item);
        }
        return String(item).trim();
      })
      .filter(Boolean);
  }
  if (typeof val === "string") {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function MemoryExplorerModal({ isOpen, onClose, health, onMemoriesSeeded }) {
  if (!isOpen) return null;

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const loadMemories = async (searchQuery = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchHindsightMemories(searchQuery);
      if (res && res.error) {
        setError(res.error);
        setMemories([]);
        setTotalCount(0);
      } else if (res && Array.isArray(res.memories)) {
        setMemories(res.memories);
        setTotalCount(res.total !== undefined ? res.total : res.memories.length);
      } else {
        setMemories([]);
        setTotalCount(0);
      }
    } catch (err) {
      setError(err?.message || "Failed to load memories from backend");
      setMemories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadMemories(query);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedNotice(null);
    try {
      const res = await seedHindsightMemories();
      setSeedNotice({
        type: "success",
        text: `Successfully retained ${res.details?.count || 4} sample postmortems in Hindsight!`
      });
      loadMemories(query);
      if (onMemoriesSeeded) onMemoriesSeeded();
    } catch (err) {
      setSeedNotice({
        type: "error",
        text: err?.message || "Seeding failed"
      });
    } finally {
      setSeeding(false);
    }
  };

  const getTypeBadge = (type) => {
    const t = String(type || "fact").toLowerCase();
    if (t === "observation") {
      return <span style={{ background: "rgba(139, 92, 246, 0.2)", color: "#c4b5fd", border: "1px solid rgba(139, 92, 246, 0.4)", padding: "0.15rem 0.45rem", borderRadius: "4px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase" }}>Observation</span>;
    }
    if (t === "world") {
      return <span style={{ background: "rgba(6, 182, 212, 0.15)", color: "#67e8f9", border: "1px solid rgba(6, 182, 212, 0.35)", padding: "0.15rem 0.45rem", borderRadius: "4px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase" }}>World Fact</span>;
    }
    if (t === "experience") {
      return <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#6ee7b7", border: "1px solid rgba(16, 185, 129, 0.35)", padding: "0.15rem 0.45rem", borderRadius: "4px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase" }}>Experience</span>;
    }
    return <span style={{ background: "rgba(100, 116, 139, 0.2)", color: "#cbd5e1", border: "1px solid rgba(100, 116, 139, 0.3)", padding: "0.15rem 0.45rem", borderRadius: "4px", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase" }}>{t}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return null;
    }
  };

  // Safe memory list
  const safeMemories = Array.isArray(memories) ? memories : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: 880, maxHeight: "88vh", display: "flex", flexDirection: "column" }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ marginBottom: "1rem" }}>
          <div className="modal-title">
            <Database size={20} color="var(--cyan)" />
            <span>Hindsight Memory Bank Explorer</span>
            <span style={{ fontSize: "0.75rem", background: "rgba(6, 182, 212, 0.15)", color: "var(--cyan)", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 600, border: "1px solid rgba(6, 182, 212, 0.3)" }}>
              {totalCount} Units Stored
            </span>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Bank Connection Details Card */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ background: "rgba(0, 0, 0, 0.35)", padding: "0.75rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>MEMORY BANK ID</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--cyan)", fontWeight: 700, marginTop: "0.2rem" }}>
              {health?.hindsight?.bankId || "incidentiq-ops-bank"}
            </div>
          </div>

          <div style={{ background: "rgba(0, 0, 0, 0.35)", padding: "0.75rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>API BASE ENDPOINT</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "#cbd5e1", marginTop: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {health?.hindsight?.baseUrl || "https://api.hindsight.vectorize.io"}
            </div>
          </div>

          <div style={{ background: "rgba(0, 0, 0, 0.35)", padding: "0.75rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>HINDSIGHT STATUS</span>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: health?.hindsight?.connected ? "var(--emerald)" : "var(--amber)", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span className={`status-dot ${health?.hindsight?.connected ? "active" : "warning"}`} style={{ display: "inline-block" }} />
              {health?.hindsight?.connected ? `Connected (v${health.hindsight.apiVersion || "0.10.1"})` : health?.hindsight?.configured ? "Connecting..." : "Unconfigured"}
            </div>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", flex: 1, minWidth: "260px" }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, padding: "0.5rem 0.75rem" }}
              placeholder="Search recalled memories, services, or root causes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary" style={{ padding: "0.5rem 0.85rem" }}>
              <Search size={14} />
              <span>Search</span>
            </button>
            {query && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: "0.5rem 0.75rem" }}
                onClick={() => { setQuery(""); loadMemories(""); }}
                title="Clear search"
              >
                Clear
              </button>
            )}
          </form>

          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: "0.5rem 0.95rem" }}
            onClick={handleSeed}
            disabled={seeding || !health?.hindsight?.configured}
            title={health?.hindsight?.configured ? "Populate Hindsight with sample historical incident postmortems" : "Configure HINDSIGHT_API_KEY first"}
          >
            {seeding ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
            <span>{seeding ? "Seeding..." : "Seed Historical Postmortems"}</span>
          </button>
        </div>

        {/* Seed Notification Banner */}
        {seedNotice && (
          <div 
            style={{
              padding: "0.65rem 0.85rem",
              borderRadius: "6px",
              fontSize: "0.8rem",
              marginBottom: "1rem",
              background: seedNotice.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
              color: seedNotice.type === "success" ? "#6ee7b7" : "#fda4af",
              border: `1px solid ${seedNotice.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)"}`
            }}
          >
            {seedNotice.text}
          </div>
        )}

        {/* Memories Content Section */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Extracted Incident Facts & Mental Models ({safeMemories.length})
            </span>
            <button 
              onClick={() => loadMemories(query)} 
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}
            >
              <RefreshCw size={11} className={loading ? "spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", background: "rgba(0, 0, 0, 0.2)", borderRadius: "8px" }}>
              <div className="radar-spinner" style={{ margin: "0 auto 0.75rem", width: 32, height: 32, borderWidth: 2 }} />
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Querying Hindsight memory bank...</span>
            </div>
          ) : error ? (
            <div style={{ padding: "1.5rem", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#fcd34d", fontWeight: 700, fontSize: "0.88rem" }}>
                <AlertCircle size={16} />
                <span>Memory Service Notice</span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "#cbd5e1", marginTop: "0.4rem", lineHeight: 1.5 }}>
                {error}
              </p>
            </div>
          ) : safeMemories.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1.5rem", border: "1px dashed var(--border-light)", borderRadius: "10px", background: "rgba(0,0,0,0.15)" }}>
              <Database size={36} color="var(--text-muted)" style={{ margin: "0 auto 0.75rem", opacity: 0.6 }} />
              <h4 style={{ color: "var(--text-primary)", fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                No memory records found
              </h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", maxWidth: "420px", margin: "0 auto 1rem", lineHeight: 1.45 }}>
                {query 
                  ? `No memories matched "${query}". Try clearing the search filter.`
                  : "This memory bank is currently empty. Resolve an incident or click 'Seed Historical Postmortems' to store your first verified resolution in Hindsight."
                }
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto", paddingRight: "0.4rem", flex: 1, maxHeight: "440px" }}>
              {safeMemories.map((mem, idx) => {
                const entityList = safeList(mem.entities);
                const tagList = safeList(mem.tags);
                const docId = mem.documentId || mem.document_id || null;
                const memText = typeof mem.text === "string" ? mem.text : JSON.stringify(mem.text || mem);
                const formattedDate = formatDate(mem.date || mem.occurred_start || mem.mentioned_at);
                const memId = mem.id || `mem-${idx}`;

                return (
                  <div key={memId} className="memory-entry" style={{ background: "rgba(10, 15, 24, 0.75)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "0.85rem 1rem" }}>
                    {/* Header Row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.45rem", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        {docId && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--cyan)", fontWeight: 700, background: "rgba(6, 182, 212, 0.1)", padding: "0.15rem 0.45rem", borderRadius: "4px", border: "1px solid rgba(6, 182, 212, 0.25)" }}>
                            {docId}
                          </span>
                        )}
                        {getTypeBadge(mem.type || mem.fact_type)}
                        {mem.id && !docId && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {mem.id.slice(0, 8)}...
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        {formattedDate && (
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <Calendar size={11} /> {formattedDate}
                          </span>
                        )}
                        <button
                          className="btn-close"
                          style={{ padding: "0.2rem", color: copiedId === memId ? "var(--emerald)" : "var(--text-muted)" }}
                          onClick={() => handleCopy(memText, memId)}
                          title="Copy memory text"
                        >
                          {copiedId === memId ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Memory Content Text */}
                    <p style={{ color: "#e2e8f0", fontSize: "0.84rem", lineHeight: 1.5, marginBottom: "0.5rem" }}>
                      {memText}
                    </p>

                    {/* Context info if available */}
                    {mem.context && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.45rem", fontStyle: "italic", background: "rgba(0, 0, 0, 0.2)", padding: "0.3rem 0.5rem", borderRadius: "4px" }}>
                        Context: {mem.context}
                      </div>
                    )}

                    {/* Tags and Entities Row */}
                    {(entityList.length > 0 || tagList.length > 0) && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap", paddingTop: "0.35rem", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                        {entityList.map((ent, i) => (
                          <span 
                            key={`ent-${i}`} 
                            className="entity-tag"
                            style={{ background: "rgba(6, 182, 212, 0.08)", color: "#7dd3fc", border: "1px solid rgba(6, 182, 212, 0.2)", fontSize: "0.68rem", padding: "0.1rem 0.4rem", borderRadius: "4px" }}
                          >
                            {ent}
                          </span>
                        ))}
                        {tagList.map((tag, i) => (
                          <span 
                            key={`tag-${i}`} 
                            style={{ fontSize: "0.68rem", background: "rgba(255, 255, 255, 0.05)", color: "#94a3b8", padding: "0.1rem 0.4rem", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}
                          >
                            <Tag size={9} /> {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
