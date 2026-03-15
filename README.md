<div align="center">

<img src="https://img.shields.io/badge/SparsaOS-Agentic%20CRM-black?style=for-the-badge&logo=openai&logoColor=white" />

# SparsaOS

### A production-grade multi-agent CRM operating system

*Three GPT-4o agents that qualify leads, draft emails, and advise on deals — streaming live to a minimalist UI*

<br/>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-sparsaos.vercel.app-black?style=flat-square&logo=vercel)](https://sparsaos.vercel.app)
[![API Docs](https://img.shields.io/badge/API%20Docs-Swagger%20UI-85EA2D?style=flat-square&logo=swagger&logoColor=black)](https://sparsaos.onrender.com/docs)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render&logoColor=black)](https://sparsaos.onrender.com)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)

<br/>

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.12-3776AB?style=flat-square&logo=python&logoColor=white)
![OpenAI](https://img.shields.io/badge/GPT--4o-412991?style=flat-square&logo=openai&logoColor=white)
![Postgres](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)

<br/>

</div>

---

## ✦ What is SparsaOS?

SparsaOS is a fully functional agentic CRM. Add a lead and a **3-agent GPT-4o pipeline** fires instantly — qualifying the lead, drafting a personalised email, and recommending the best next action. Every agent streams its result live to the UI the moment it finishes thinking.

<br/>

```
  Add lead  ──►  Qualifier  ──►  Drafter ─┐
                                            ├──► asyncio.gather() ──► Saved to DB
                              Advisor  ────┘
```

<br/>

## ✦ Features

| | Feature |
|---|---|
| 🤖 | **3 GPT-4o agents** — qualifier, drafter, advisor running in an orchestrated pipeline |
| ⚡ | **Live SSE streaming** — each agent yields its result the moment it finishes, no waiting |
| 📊 | **Analytics dashboard** — animated donut chart, conversion funnel with drop-off rates |
| ✉️ | **Gmail compose** — one click opens Gmail pre-filled with the drafted email |
| 🗄️ | **Persistent Postgres** — Supabase ensures data survives server restarts |
| 🔍 | **Sortable, filterable table** — full lead data always visible, click any row for details |
| 📋 | **Agent run history** — full log of every pipeline execution |

<br/>

---

## ✦ Agent Design

<br/>

### `Agent 1` — Lead Qualifier

> *Few-shot prompting · temperature 0.2 · JSON response format*

Scores inbound leads as **HOT**, **WARM**, or **COLD** using two calibration examples baked into the prompt. Returns confidence score (0–1), full reasoning, and extracted buying signals.

```json
{
  "score": "hot",
  "reasoning": "CTO-level contact with explicit $150K budget and Q1 deadline.",
  "confidence": 0.95,
  "key_signals": ["Budget authority", "$150K allocated", "Hard deadline", "500-person company"]
}
```

<br/>

### `Agent 2` — Email Drafter

> *Role prompting · temperature 0.7 · score-conditional tone*

Writes a personalised follow-up email tailored to the lead's score. HOT leads get direct ROI-focused copy. WARM leads get education + soft CTA. COLD leads get a curiosity-driven opener. Under 150 words, no generic openers.

```json
{
  "subject": "Re: Your $2M pipeline problem — let's fix it this week",
  "body": "Hi James, broken pipeline tooling at your scale...",
  "tone": "direct",
  "personalization_notes": "Referenced $2M loss figure and Q1 deadline"
}
```

<br/>

### `Agent 3` — Deal Advisor

> *Chain-of-thought · temperature 0.3 · explicit 5-step reasoning*

Forces the model to reason through seniority, company size, expressed pain, and qualification score before committing to a recommendation. Returns urgency level and 3 concrete next steps.

```json
{
  "recommendation": "schedule_call",
  "urgency": "high",
  "reasoning": "Budget authority confirmed, hard deadline approaching, competitive situation...",
  "next_steps": ["Reach out within 24 hours", "Prepare ROI calculator", "Book 30-min discovery"]
}
```

<br/>

### Orchestration

Agents 2 and 3 depend on Agent 1's output but not on each other — so they run **in parallel** via `asyncio.gather`, cutting total latency roughly in half.

```python
qualification, tokens_1 = await qualify_lead(...)

(followup, tokens_2), (advisor, tokens_3) = await asyncio.gather(
    draft_followup(..., qualification=qualification),
    advise_deal(...,   qualification=qualification)
)
```

<br/>

---

## ✦ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend · Vercel                      │
│                                                          │
│  React 19 + TypeScript + Vite 8                          │
│  ┌──────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │ Leads Table  │  │  Agent Modal    │  │ Analytics  │  │
│  │ sortable     │  │  full-screen    │  │ donut +    │  │
│  │ filterable   │  │  3 live panels  │  │ funnel     │  │
│  └──────────────┘  └─────────────────┘  └────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │  HTTPS · Server-Sent Events
┌──────────────────────────▼──────────────────────────────┐
│                   Backend · Render                       │
│                                                          │
│  FastAPI · Python 3.12 · SQLAlchemy                      │
│                                                          │
│  GET  /leads/              List all leads                │
│  POST /leads/              Create lead                   │
│  GET  /pipeline/run/{id}   SSE agent stream              │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Agent Orchestrator                   │   │
│  │                                                   │   │
│  │  Qualifier ──► Drafter ─┐                         │   │
│  │                          ├─ asyncio.gather() ─►   │   │
│  │               Advisor  ─┘                         │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │  PostgreSQL (pooler · IPv4)
┌──────────────────────────▼──────────────────────────────┐
│                  Database · Supabase                     │
│  Hosted Postgres · persistent · free tier                │
└─────────────────────────────────────────────────────────┘
```

<br/>

---

## ✦ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 19 + TypeScript | Type-safe, fast, component model |
| Build | Vite 8 | Instant HMR, optimised builds |
| Backend | FastAPI + Python 3.12 | Async-first, auto Swagger docs |
| ORM | SQLAlchemy 2.0 | Clean model definitions, Postgres-ready |
| AI | OpenAI GPT-4o | Best reasoning + JSON mode |
| Streaming | Server-Sent Events | Native browser support, no WebSocket overhead |
| Database | Supabase (Postgres) | Persistent, free, zero config |
| Frontend host | Vercel | Instant deploys from GitHub |
| Backend host | Render | Free Python hosting, auto-deploy |

<br/>

---

## ✦ Running Locally

### Prerequisites
- Python 3.12
- Node.js 18+
- OpenAI API key

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac / Linux

pip install -r requirements.txt
```

Create `backend/.env`:
```env
OPENAI_API_KEY=sk-your-key-here
```

```bash
uvicorn app.main:app --reload --port 8000
```

Swagger UI → [http://localhost:8000/docs](http://localhost:8000/docs)

<br/>

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:8000
```

```bash
npm run dev
```

App → [http://localhost:5173](http://localhost:5173)

<br/>

---

## ✦ Project Structure

```
sparsaos/
├── backend/
│   ├── app/
│   │   ├── main.py              ← FastAPI app, CORS, startup event
│   │   ├── config.py            ← Pydantic settings
│   │   ├── database.py          ← SQLAlchemy engine + SessionLocal
│   │   ├── models.py            ← Lead model, LeadStatus/LeadScore enums
│   │   ├── schemas.py           ← Pydantic schemas incl. agent output types
│   │   ├── agents/
│   │   │   ├── qualifier.py     ← Few-shot lead scoring agent
│   │   │   ├── drafter.py       ← Email generation agent
│   │   │   ├── advisor.py       ← Chain-of-thought deal advisor
│   │   │   └── orchestrator.py  ← Parallel agent runner
│   │   └── routers/
│   │       ├── leads.py         ← CRUD endpoints
│   │       └── pipeline.py      ← SSE streaming pipeline endpoint
│   ├── requirements.txt
│   └── .python-version          ← Pins Python 3.12 for Render
│
└── frontend/
    └── src/
        ├── App.tsx              ← Root, tabs, header stats
        ├── api/client.ts        ← Fetch wrapper + EventSource
        ├── types/index.ts       ← Lead, AgentEvent types
        └── components/
            ├── LeadsTable.tsx       ← Sortable filterable table
            ├── LeadDetailModal.tsx  ← Full lead data + Gmail button
            ├── AgentModal.tsx       ← Full-screen live agent stream
            ├── AgentsPage.tsx       ← Run history + stats
            ├── AnalyticsPage.tsx    ← Charts + funnel
            └── AddLeadModal.tsx     ← Create lead form
```

<br/>

---

## ✦ Environment Variables

**Backend (Render)**
```env
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://postgres.xxx:password@pooler.supabase.com:5432/postgres
```

**Frontend (Vercel)**
```env
VITE_API_URL=https://your-service.onrender.com
```

<br/>

---

<div align="center">

Built by **Abhay** · Portfolio project for Sparsa AI Full Stack Engineer internship

[![GitHub](https://img.shields.io/badge/GitHub-senpaisaul-black?style=flat-square&logo=github)](https://github.com/senpaisaul/sparsaos)

</div>
