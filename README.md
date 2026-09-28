# IncidentIQ – AI Incident Response Agent

> **Autonomous Dual-Agent Incident Triage Powered by Hindsight Long-Term Memory and Groq LLM**

IncidentIQ is an AI-powered Site Reliability Engineering (SRE) incident response assistant built for high-stakes software outages. Standard LLMs are stateless—they lack institutional memory and repeat generic, textbook troubleshooting steps (e.g., "restart the container", "inspect metrics") during critical downtime. 

**IncidentIQ solves this by integrating the official Hindsight memory system.** It recalls verified organizational postmortems, historical failure precedents, and past engineering fixes—drastically cutting **Mean Time to Resolution (MTTR)** and eliminating trial-and-error downtime.

---

## ⚡ Key Highlights & Core Features

### 1. Dual-Agent Side-by-Side Comparison
When an incident is submitted, IncidentIQ evaluates it using two distinct AI agents in real time:

| Capability | Agent Without Memory (Zero-Shot) | Agent With Hindsight Memory |
| :--- | :--- | :--- |
| **Context** | Broad, generic computing theory only | Historical postmortems & organizational incident records |
| **Diagnosis** | General symptom summary | Pinpointed root cause matched against verified past precedents |
| **Actionable Fix** | Textbook troubleshooting checklist | Exact mitigation commands, config parameters, and patches |
| **Risk Profile** | High risk of trial-and-error downtime | High-confidence playbook with verified recovery steps |
| **Citations** | None | Explicitly cites recalled memories & past incident IDs |

### 2. Official Hindsight Memory Integration
Built directly with the official [`@vectorize-io/hindsight-client`](https://www.npmjs.com/package/@vectorize-io/hindsight-client):
- **Semantic & Graph Recall (`client.recall`)**: Retrieves relevant past incidents, extracted facts, and entity connections based on incident symptoms and service context.
- **Continuous Learning Loop (`client.retain`)**: Allows engineers to mark an incident as resolved, ingesting the confirmed root cause, applied mitigation, and preventative guardrails into Hindsight for future incident triage.
- **Cognitive Memory Architecture**: Categorizes retained knowledge into distinct networks: **World Facts** (system specifications), **Experience** (past incident events), and **Observations** (consolidated mental models).

### 3. Hindsight Memory Bank Explorer
- Inspect active bank ID, API endpoint, connection health, and total memory units stored.
- Search memories by keywords, service names, or incident IDs.
- View extracted facts, entity linkages, document IDs, and timestamps.
- **1-Click Seed Button**: Populate your Hindsight bank with realistic historical postmortems for immediate testing.

### 4. Incident Investigation & Resolution History
- Automatic tracking of all investigated and resolved incidents.
- Status indicators (`Investigating` vs `Resolved & Retained in Hindsight`).
- 1-click incident reload to review any past incident analysis in the dual-agent workbench.

### 5. Interactive Demo Scenarios
Four pre-configured, realistic production incident scenarios for instant demonstration:
1. **PostgreSQL Connection Pool Exhaustion** (`checkout-api`, P1): Connection slot starvation during flash sale traffic.
2. **Redis Cache Stampede & 99% CPU** (`catalog-service`, P2): Synchronized midnight TTL expirations.
3. **Kubernetes OOMKilled Worker** (`pdf-export-worker`, P2): Unbounded in-memory buffer concatenation in bulk export jobs.
4. **Stale JWT Signature Verification Failure** (`auth-gateway`, P1): IdP key rotation without dynamic JWKS refresh.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Vanilla CSS (Custom dark glassmorphic design system, Google Fonts `Inter` & `JetBrains Mono`, Lucide icons)
- **Backend**: Node.js (ESM), Express, CORS, Dotenv
- **AI Engine**: [Groq API](https://console.groq.com) (`groq-sdk`, model: `qwen/qwen3.8-27b`)
- **Memory System**: [Official Hindsight API](https://hindsight.vectorize.io) (`@vectorize-io/hindsight-client`)

---

## 📂 Project Architecture

```
incidentIQ/
├── package.json              # Monorepo runner & dependencies
├── .gitignore                # Excludes node_modules, .env, build outputs, logs
├── .env.example              # Root environment variable template
├── README.md                 # Project documentation
├── backend/
│   ├── .env.example          # Backend environment variable template
│   ├── .env                  # Local secret credentials (git-ignored)
│   ├── package.json          # Express, Groq, and Hindsight client dependencies
│   ├── src/
│   │   ├── index.js          # Express server entrypoint & health checks
│   │   ├── config.js         # Environment loader with path resolution
│   │   ├── services/
│   │   │   ├── groqService.js       # Dual-agent Groq LLM inference
│   │   │   ├── hindsightService.js  # Official Hindsight client (retain/recall/list)
│   │   │   └── storeService.js      # Incident history persistence
│   │   ├── routes/
│   │   │   ├── health.js     # Health probe & API credential validation
│   │   │   ├── incidents.js  # /analyze, /resolve, /history, /samples
│   │   │   └── hindsight.js  # /status, /seed, /memories, /recall
│   │   └── data/
│   │       └── sampleIncidents.js   # Pre-configured demonstration scenarios
│   └── data/
│       ├── .gitkeep          # Preserves data directory
│       └── incident-history.json # Local session history (git-ignored)
└── frontend/
    ├── package.json          # React, Vite, Lucide dependencies
    ├── vite.config.js        # Vite config with backend /api reverse proxy
    ├── index.html            # Shell with Inter & JetBrains Mono fonts
    └── src/
        ├── main.jsx          # React DOM entrypoint
        ├── App.jsx           # App state coordinator
        ├── index.css         # Dark glassmorphic design system
        ├── services/
        │   └── api.js        # API client for backend communication
        └── components/
            ├── Header.jsx              # Status badges & quick navigation
            ├── SystemStatusBanner.jsx  # Configuration guide banner
            ├── SampleIncidentsBar.jsx  # 1-click scenario selector
            ├── IncidentInput.jsx       # Incident form & terminal log editor
            ├── ComparisonPanels.jsx    # Side-by-side dual-agent evaluation
            ├── ResolveModal.jsx        # Learning loop: mark resolved & retain
            ├── MemoryExplorerModal.jsx # Search & inspect stored Hindsight memories
            ├── IncidentHistory.jsx     # Persisted investigation audit log
            └── ErrorBoundary.jsx       # Fault tolerance & error isolation
```

---

## 🚀 Prerequisites & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Groq API Key**: Free API key from [console.groq.com/keys](https://console.groq.com/keys)
- **Hindsight API**: Cloud key from [hindsight.vectorize.io](https://hindsight.vectorize.io) or local Docker container

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd incidentIQ
```

### 2. Configure Environment Variables
Copy `.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and insert your API keys:
```ini
# Groq API Configuration
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b

# Hindsight Memory API Configuration
HINDSIGHT_API_KEY=hsk_your_hindsight_api_key_here
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
HINDSIGHT_BANK_ID=incidentiq-ops-bank

# Server Port
PORT=3001
```

> **Local Hindsight Docker Alternative**:
> To run Hindsight locally without cloud credentials:
> ```bash
> docker run -p 8888:8888 ghcr.io/vectorize-io/hindsight:latest
> ```
> Then set `HINDSIGHT_BASE_URL=http://localhost:8888` and leave `HINDSIGHT_API_KEY` blank.

### 3. Install All Dependencies
Install root, backend, and frontend dependencies in one command:
```bash
npm run install:all
```
*(Or run `npm install` in the root, `backend/`, and `frontend/` directories individually)*

---

## 💻 Running Locally

### Option 1: Unified Dev Server (Recommended)
From the project root:
```bash
npm run dev
```
This concurrently starts:
- **Backend API**: `http://localhost:3001`
- **Frontend Dashboard**: `http://localhost:5173`

### Option 2: Running Individually

**Backend**:
```bash
cd backend
npm run dev
```

**Frontend**:
```bash
cd frontend
npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

## 🧪 Build & Production Validation

To validate and build the frontend bundle:
```bash
npm run build:frontend
```
Or directly within the frontend folder:
```bash
cd frontend && npm run build
```

---

## 🔒 Security & Secrets Management
- All API keys are stored exclusively in `backend/.env` and processed on the backend.
- Neither `backend/.env` nor any local credential files are tracked by Git (`.gitignore` enforces this).
- No API keys are exposed to the client or browser bundle.

---

## 📜 License
MIT License. Built for the Hackathon Demonstration.
