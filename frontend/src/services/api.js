const BASE_URL = "/api";

export async function fetchHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      status: "error",
      error: err.message,
      groq: { configured: false, error: "Backend unreachable" },
      hindsight: { configured: false, connected: false, error: "Backend unreachable" }
    };
  }
}

export async function fetchSamples() {
  const res = await fetch(`${BASE_URL}/incidents/samples`);
  if (!res.ok) throw new Error("Failed to fetch sample incidents");
  return await res.json();
}

export async function fetchHistory() {
  const res = await fetch(`${BASE_URL}/incidents/history`);
  if (!res.ok) throw new Error("Failed to fetch incident history");
  return await res.json();
}

export async function analyzeIncident(payload) {
  const res = await fetch(`${BASE_URL}/incidents/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok && !data.withoutMemory && !data.withMemory) {
    throw new Error(data.error || "Analysis failed");
  }
  return data;
}

export async function resolveIncident(payload) {
  const res = await fetch(`${BASE_URL}/incidents/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Resolution failed");
  return data;
}

export async function seedHindsightMemories() {
  const res = await fetch(`${BASE_URL}/hindsight/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Seeding failed");
  return data;
}

export async function fetchHindsightMemories(query = "") {
  const url = query ? `${BASE_URL}/hindsight/memories?q=${encodeURIComponent(query)}` : `${BASE_URL}/hindsight/memories`;
  const res = await fetch(url);
  const data = await res.json();
  return data;
}

export async function fetchHindsightStatus() {
  const res = await fetch(`${BASE_URL}/hindsight/status`);
  const data = await res.json();
  return data;
}
