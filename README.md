# SparsaOS — Agentic CRM Operating System

> A production-grade multi-agent CRM platform built with FastAPI, GPT-4o, React, and Supabase. Three AI agents qualify leads, draft personalised emails, and recommend next best actions — all streaming live to the UI.

**Live demo:** [sparsaos.vercel.app](https://sparsaos.vercel.app)  
**Backend API:** [sparsaos.onrender.com/docs](https://sparsaos.onrender.com/docs)

---

## What it does

SparsaOS is a fully functional agentic CRM. When a lead is added, a 3-agent GPT-4o pipeline fires automatically:

1. **Lead Qualifier** — scores the lead HOT / WARM / COLD using few-shot prompting, returns confidence score and key buying signals
2. **Email Drafter** — writes a personalised follow-up email tailored to the lead's score and pain points
3. **Deal Advisor** — uses chain-of-thought reasoning to recommend the single best next action (schedule call, send demo, offer discount, drop lead)

Results stream live to the UI via Server-Sent Events — you watch each agent think and respond in real time.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Vercel)                        │
│                                                              │
│   React + TypeScript + Vite                                  │
│   ├── Leads table (sortable, filterable)                     │
│   ├── Lead detail modal (full data, Gmail compose)           │
│   ├── Agent modal (full-screen, 3 panels, live SSE stream)   │
│   ├── Analytics (donut chart, conversion funnel)             │
│   └── Agent run history                                      │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS + SSE
┌────────────────────────────▼────────────────────────────────┐
│                     Backend (Render)                         │
│                                                              │
│   FastAPI (Python 3.12)                                      │
│   ├── /leads/          — CRUD endpoints                      │
│   └── /pipeline/run/   — SSE streaming agent pipeline        │
│                                                              │
│   Agent Orchestrator                                         │
│   ├── Agent 1: Qualifier  (few-shot, temp=0.2)               │
│   ├── Agent 2: Drafter    (creative copy, temp=0.7)          │
│   └── Agent 3: Advisor    (chain-of-thought, temp=0.3)       │
│          └── Agents 2 + 3 run in parallel via asyncio.gather │
└────────────────────────────┬────────────────────────────────┘
                             │ PostgreSQL
┌────────────────────────────▼────────────────────────────────┐
│                   Database (Supabase)                        │
│   Hosted Postgres — persistent across deployments            │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8 |
| Backend | FastAPI, Python 3.12, SQLAlchemy |
| AI | OpenAI GPT-4o (3 agents) |
| Database | Supabase (PostgreSQL) |
| Streaming | Server-Sent Events (SSE) |
| Frontend host | Vercel |
| Backend host | Render |

---

## Agent design

### Agent 1 — Lead Qualifier
- **Technique:** Few-shot prompting with 2 calibration examples
- **Temperature:** 0.2 (consistent, repeatable scoring)
- **Output:** Score (hot/warm/cold), confidence (0–1), reasoning, key signals
- **Model:** GPT-4o with `response_format: json_object`

### Agent 2 — Email Drafter
- **Technique:** Role-based prompting, score-conditional tone instructions
- **Temperature:** 0.7 (human-sounding, varied copy)
- **Output:** Subject line, email body, tone, personalisation notes
- **Constraint:** Under 150 words, no generic openers

### Agent 3 — Deal Advisor
- **Technique:** Chain-of-thought — explicit 5-step reasoning before recommendation
- **Temperature:** 0.3 (decisive but considered)
- **Output:** Recommendation, urgency, full reasoning, 3 next steps
- **Options:** `schedule_call` / `send_demo` / `offer_discount` / `drop_lead`

### Orchestration
```
Qualifier ──► Drafter ─┐
                        ├──► asyncio.gather() ──► DB commit ──► SSE complete
             Advisor  ─┘
```
Qualifier runs first (drafter and advisor both depend on its output). Drafter and advisor then run in parallel via `asyncio.gather`, cutting total latency roughly in half.

---

## Key features

- **Live SSE streaming** — each agent yields its result the moment it finishes, no waiting for all three
- **Gmail compose integration** — "Open in Gmail" pre-fills recipient, subject, and body from the drafted email
- **Persistent Postgres** — Supabase ensures data survives Render restarts and redeployments
- **Sortable, filterable leads table** — full data always in view, click any row for detail modal
- **Analytics dashboard** — animated donut chart (Chart.js), conversion funnel with drop-off percentages
- **Agent run history** — full log of every pipeline execution with scores and recommendations

---

## Running locally

### Prerequisites
- Python 3.12
- Node.js 18+
- OpenAI API key

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Create .env
echo OPENAI_API_KEY=sk-your-key > .env

uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install

# Create .env.local
echo VITE_API_URL=http://localhost:8000 > .env.local

npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project structure

```
sparsaos/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, startup
│   │   ├── config.py            # Pydantic settings
│   │   ├── database.py          # SQLAlchemy engine, SessionLocal
│   │   ├── models.py            # Lead model, enums
│   │   ├── schemas.py           # Pydantic schemas incl. agent outputs
│   │   ├── agents/
│   │   │   ├── qualifier.py     # Few-shot lead scoring
│   │   │   ├── drafter.py       # Email generation
│   │   │   ├── advisor.py       # Chain-of-thought deal advice
│   │   │   └── orchestrator.py  # Parallel agent runner
│   │   └── routers/
│   │       ├── leads.py         # CRUD endpoints
│   │       └── pipeline.py      # SSE streaming endpoint
│   ├── requirements.txt
│   └── .python-version          # Pins Python 3.12
└── frontend/
    └── src/
        ├── App.tsx
        ├── api/client.ts
        ├── types/index.ts
        └── components/
            ├── LeadsTable.tsx
            ├── LeadDetailModal.tsx
            ├── AgentModal.tsx
            ├── AgentsPage.tsx
            ├── AnalyticsPage.tsx
            └── AddLeadModal.tsx
```

---

## Environment variables

### Backend (Render)
```
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-backend.onrender.com
```

---

Built by Abhay — portfolio project for Sparsa AI Full Stack Engineer internship application.