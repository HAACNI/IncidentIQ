import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { SystemStatusBanner } from "./components/SystemStatusBanner";
import { SampleIncidentsBar } from "./components/SampleIncidentsBar";
import { IncidentInput } from "./components/IncidentInput";
import { ComparisonPanels } from "./components/ComparisonPanels";
import { IncidentHistory } from "./components/IncidentHistory";
import { ResolveModal } from "./components/ResolveModal";
import { MemoryExplorerModal } from "./components/MemoryExplorerModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { 
  fetchHealth, 
  fetchSamples, 
  fetchHistory, 
  analyzeIncident, 
  resolveIncident,
  seedHindsightMemories 
} from "./services/api";

export function App() {
  const [health, setHealth] = useState(null);
  const [samples, setSamples] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [activeSampleId, setActiveSampleId] = useState(null);
  const [isSample, setIsSample] = useState(false);
  
  const [form, setForm] = useState({
    title: "",
    service: "",
    severity: "P1 - Critical",
    description: "",
    logs: ""
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [currentIncident, setCurrentIncident] = useState(null);

  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isMemoryExplorerOpen, setIsMemoryExplorerOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Initial load
  const loadInitialData = async () => {
    try {
      const [h, s, hist] = await Promise.all([
        fetchHealth(),
        fetchSamples(),
        fetchHistory()
      ]);
      setHealth(h);
      if (s?.samples) {
        setSamples(s.samples);
        // Pre-select the first sample scenario for immediate demonstration!
        if (s.samples.length > 0) {
          handleSelectSample(s.samples[0]);
        }
      }
      if (hist?.history) {
        setHistory(hist.history);
      }
    } catch (err) {
      console.error("Initialization error:", err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const refreshHealth = async () => {
    try {
      const h = await fetchHealth();
      setHealth(h);
    } catch (err) {
      console.error("Health refresh error:", err);
    }
  };

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSelectSample = (sample) => {
    setActiveSampleId(sample.id);
    setIsSample(true);
    setForm({
      title: sample.title,
      service: sample.service,
      severity: sample.severity,
      description: sample.description,
      logs: sample.logs
    });
    setAnalysisData(null);
    setCurrentIncident(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetForm = () => {
    setActiveSampleId(null);
    setIsSample(false);
    setForm({
      title: "",
      service: "",
      severity: "P2 - High",
      description: "",
      logs: ""
    });
    setAnalysisData(null);
    setCurrentIncident(null);
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;

    setIsAnalyzing(true);
    try {
      const payload = {
        title: form.title,
        service: form.service,
        severity: form.severity,
        description: form.description,
        logs: form.logs,
        isSample
      };

      const result = await analyzeIncident(payload);
      setAnalysisData(result);
      setCurrentIncident(result.incident);

      // Refresh incident history
      const hist = await fetchHistory();
      if (hist?.history) setHistory(hist.history);
    } catch (err) {
      console.error("Analysis error:", err);
      showToast(`Analysis failed: ${err.message}`, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveResolution = async (resolutionPayload) => {
    const res = await resolveIncident(resolutionPayload);
    showToast(res.message, res.hindsightRetained ? "success" : "warning");
    
    // Refresh history
    const hist = await fetchHistory();
    if (hist?.history) setHistory(hist.history);
    
    // Update current incident state
    if (currentIncident) {
      setCurrentIncident((prev) => ({
        ...prev,
        status: "resolved",
        hindsightRetained: res.hindsightRetained
      }));
    }
    return res;
  };

  const handleSeedMemories = async () => {
    setIsSeeding(true);
    try {
      const res = await seedHindsightMemories();
      showToast(res.message || "Historical postmortems retained in Hindsight!", "success");
      refreshHealth();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSelectHistoryIncident = (inc) => {
    setActiveSampleId(null);
    setIsSample(inc.isSample);
    setForm({
      title: inc.title,
      service: inc.service,
      severity: inc.severity,
      description: inc.description,
      logs: inc.logs
    });
    setCurrentIncident(inc);
    if (inc.analysisResult) {
      setAnalysisData({
        withoutMemory: inc.analysisResult.withoutMemory,
        withMemory: inc.analysisResult.withMemory,
        hindsight: inc.analysisResult.hindsightRecall
      });
    }
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 100,
            background: toastMessage.type === "success" ? "#065f46" : "#7f1d1d",
            color: "#ffffff",
            padding: "0.85rem 1.25rem",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            fontSize: "0.85rem",
            fontWeight: 500,
            border: "1px solid rgba(255, 255, 255, 0.15)",
            animation: "fadeIn 0.2s ease"
          }}
        >
          {toastMessage.message}
        </div>
      )}

      {/* Header */}
      <Header
        health={health}
        onOpenMemoryExplorer={() => setIsMemoryExplorerOpen(true)}
        onSeedMemories={handleSeedMemories}
        isSeeding={isSeeding}
      />

      <main className="main-content">
        {/* System Configuration Guidance Banner */}
        <SystemStatusBanner
          health={health}
          onRefreshHealth={refreshHealth}
        />

        {/* 1-Click Demo Scenarios */}
        <SampleIncidentsBar
          samples={samples}
          activeSampleId={activeSampleId}
          onSelectSample={handleSelectSample}
        />

        {/* Incident Input Box */}
        <IncidentInput
          form={form}
          onChange={handleFormChange}
          onReset={handleResetForm}
          onSubmit={handleAnalyze}
          isAnalyzing={isAnalyzing}
          isSample={isSample}
        />

        {/* Dual Agent Side-by-Side Comparison Panels */}
        <ComparisonPanels
          isAnalyzing={isAnalyzing}
          analysisData={analysisData}
          onOpenResolveModal={() => setIsResolveModalOpen(true)}
          currentIncident={currentIncident}
        />

        {/* Incident History & Session Records */}
        <IncidentHistory
          history={history}
          onSelectIncident={handleSelectHistoryIncident}
          activeIncidentId={currentIncident?.id}
        />
      </main>

      {/* Resolution & Learning Modal */}
      <ResolveModal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        incident={currentIncident}
        onSaveResolution={handleSaveResolution}
      />

      {/* Memory Bank Explorer Modal */}
      <ErrorBoundary title="Memory Bank Explorer Error">
        <MemoryExplorerModal
          isOpen={isMemoryExplorerOpen}
          onClose={() => setIsMemoryExplorerOpen(false)}
          health={health}
          onMemoriesSeeded={refreshHealth}
        />
      </ErrorBoundary>
    </div>
  );
}
