import React from "react";
import { ShieldAlert, Brain, Database, Sparkles, RefreshCw } from "lucide-react";

export function Header({ health, onOpenMemoryExplorer, onSeedMemories, isSeeding }) {
  const groqConfigured = health?.groq?.configured;
  const hindsightConfigured = health?.hindsight?.configured;
  const hindsightConnected = health?.hindsight?.connected;

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand-section">
          <div className="brand-logo-icon">
            <Brain size={24} />
          </div>
          <div>
            <div className="brand-title">
              IncidentIQ
              <span className="brand-badge">Hindsight AI</span>
            </div>
            <div className="brand-subtitle">
              Dual-Agent Autonomous Incident Triage & Organizational Memory
            </div>
          </div>
        </div>

        <div className="header-actions">
          {/* Groq AI Status Pill */}
          <div className="status-pill" title={groqConfigured ? `Groq Active (${health.groq.model})` : "Groq API Key Missing"}>
            <span className={`status-dot ${groqConfigured ? "active" : "warning"}`} />
            <span>Groq AI:</span>
            <span style={{ color: groqConfigured ? "#38bdf8" : "#f59e0b", fontWeight: 600 }}>
              {groqConfigured ? "Connected" : "Missing Key"}
            </span>
          </div>

          {/* Hindsight Status Pill */}
          <div 
            className="status-pill" 
            title={hindsightConnected ? `Hindsight Bank: ${health?.hindsight?.bankId}` : "Hindsight Service Status"}
          >
            <span className={`status-dot ${hindsightConnected ? "active" : hindsightConfigured ? "warning" : "offline"}`} />
            <span>Hindsight:</span>
            <span style={{ color: hindsightConnected ? "#34d399" : "#f87171", fontWeight: 600 }}>
              {hindsightConnected ? "Live" : hindsightConfigured ? "Connecting" : "Unconfigured"}
            </span>
          </div>

          {/* Quick Action: Seed Memories */}
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={onSeedMemories}
            disabled={isSeeding || !hindsightConfigured}
            title={hindsightConfigured ? "Seed sample historical postmortems into Hindsight memory" : "Configure HINDSIGHT_API_KEY first"}
          >
            {isSeeding ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} color="#06b6d4" />}
            <span>{isSeeding ? "Seeding..." : "Seed Hindsight"}</span>
          </button>

          {/* Memory Explorer Button */}
          <button 
            className="btn btn-primary btn-sm" 
            onClick={onOpenMemoryExplorer}
          >
            <Database size={14} />
            <span>Memory Bank</span>
          </button>
        </div>
      </div>
    </header>
  );
}
