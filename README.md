# 🤖 InterviewForge — AI Avatar Interview Platform for Engineers

> A real-time, AI-powered mock interview platform with an animated avatar interviewer, adaptive question generation, code execution, and post-session analytics — built for software engineers.

[![Tech Stack](https://img.shields.io/badge/stack-Next.js%20%7C%20FastAPI%20%7C%20Python-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()
[![Status](https://img.shields.io/badge/status-In%20Development-yellow)]()

---

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Development Roadmap](#development-roadmap)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**InterviewForge** is an end-to-end AI interview simulation platform tailored for software engineers. It uses a lifelike AI avatar to conduct voice-based technical interviews — covering DSA, system design, and behavioral rounds — with real-time feedback, a built-in code editor, and a post-session performance report.

The product is designed for three use cases:

1. **Candidates** — Self-paced mock interviews with real feedback before the real thing.
2. **Bootcamps / Colleges** — Structured interview readiness programs.
3. **Recruiters (future)** — Async AI screening to shortlist candidates.

---

## Features

### Core
- 🧑‍💻 **AI Avatar Interviewer** — Animated 2D/3D avatar with lip-sync powered by D-ID or HeyGen API
- 🎤 **Voice I/O** — Real-time speech-to-text (Whisper) + text-to-speech (ElevenLabs / browser TTS)
- 🧠 **Adaptive Question Engine** — LLM-driven question generation based on role, difficulty, and prior answers
- 💻 **In-Browser Code Editor** — Monaco Editor with multi-language support and live execution sandbox
- 📊 **Post-Session Analytics** — Scoring rubric, answer quality breakdown, improvement suggestions
- 🔁 **Session Replay** — Full transcript and audio/video replay of the session

### Engineering-Specific
- DSA rounds (arrays, trees, graphs, DP) with automatic test case validation
- System design rounds with a live whiteboard (Excalidraw embed or custom canvas)
- Behavioral rounds scored using STAR-method rubric

### Auth & User Management
- OAuth login (GitHub / Google) — natural fit for engineers
- Interview history dashboard
- Role/track selection (Frontend, Backend, ML, Fullstack, DevOps)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Next.js)                         │
│                                                                 │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────────────┐   │
│  │  Avatar UI │  │  Code Editor │  │  Whiteboard (Design)  │   │
│  │ (D-ID/     │  │  (Monaco)    │  │  (Excalidraw)         │   │
│  │  HeyGen)   │  │              │  │                       │   │
│  └────────────┘  └──────────────┘  └───────────────────────┘   │
│        │                │                       │               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │          WebSocket / REST API Layer                    │    │
│  └────────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / WSS
┌───────────────────────────▼─────────────────────────────────────┐
│                      API GATEWAY (FastAPI)                      │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  Auth Service│  │ Interview    │  │  Code Execution       │ │
│  │  (JWT/OAuth) │  │ Engine       │  │  Sandbox (Docker)     │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
│                           │                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  STT Service │  │  LLM Service │  │  Analytics Engine     │ │
│  │  (Whisper)   │  │  (GPT-4o /   │  │  (Scoring Rubric)     │ │
│  │              │  │   Claude)    │  │                       │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │  TTS Service │  │  Celery +    │                            │
│  │  (ElevenLabs)│  │  Redis Queue │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        ┌─────▼────┐   ┌──────▼────┐  ┌──────▼────┐
        │PostgreSQL│   │  Redis    │  │  S3 /     │
        │(sessions,│   │  (cache,  │  │  Cloudflare│
        │  users)  │   │  queues)  │  │  R2 (audio,│
        └──────────┘   └───────────┘  │  replays) │
                                      └───────────┘
```

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State Management | Zustand |
| Real-time | WebSockets (native) / Socket.io-client |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| Avatar Rendering | D-ID Streaming API or HeyGen Embed |
| Voice Input | Web Speech API + Whisper (fallback) |
| Whiteboard | Excalidraw (embedded) |
| Auth | NextAuth.js v5 (GitHub + Google OAuth) |

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI (Python 3.11+) |
| Async Workers | Celery + Redis |
| Database | PostgreSQL (via SQLAlchemy + Alembic) |
| Cache | Redis |
| STT | OpenAI Whisper (local or API) |
| LLM | OpenAI GPT-4o / Anthropic Claude |
| TTS | ElevenLabs API |
| Code Sandbox | Docker (isolated containers per submission) |
| Storage | AWS S3 / Cloudflare R2 |
| Auth | JWT (python-jose) |

### DevOps
| Layer | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Deployment | Railway / Render / AWS ECS |
| Monitoring | Sentry + Prometheus + Grafana |

---

## Project Structure

```
interviewforge/
├── apps/
│   ├── web/                        # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/             # Login, Register
│   │   │   ├── (dashboard)/        # Home, History, Profile
│   │   │   ├── interview/
│   │   │   │   ├── [session_id]/   # Live interview room
│   │   │   │   └── setup/          # Pre-interview config
│   │   │   └── results/
│   │   │       └── [session_id]/   # Post-session report
│   │   ├── components/
│   │   │   ├── avatar/             # Avatar renderer, lip-sync wrapper
│   │   │   ├── editor/             # Monaco Editor integration
│   │   │   ├── whiteboard/         # Excalidraw wrapper
│   │   │   ├── voice/              # Mic capture, waveform UI
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── hooks/
│   │   │   ├── useInterview.ts
│   │   │   ├── useVoice.ts
│   │   │   └── useCodeRunner.ts
│   │   ├── lib/
│   │   │   ├── api.ts              # API client
│   │   │   └── websocket.ts        # WS client
│   │   └── stores/                 # Zustand stores
│
├── apps/
│   └── api/                        # FastAPI backend
│       ├── main.py
│       ├── routers/
│       │   ├── auth.py
│       │   ├── interviews.py
│       │   ├── questions.py
│       │   ├── code.py
│       │   └── analytics.py
│       ├── services/
│       │   ├── llm_service.py      # Question gen + evaluation
│       │   ├── stt_service.py      # Whisper transcription
│       │   ├── tts_service.py      # ElevenLabs synthesis
│       │   ├── code_runner.py      # Docker sandbox runner
│       │   └── scoring_service.py  # Rubric-based scoring
│       ├── models/                 # SQLAlchemy ORM models
│       ├── schemas/                # Pydantic schemas
│       ├── tasks/                  # Celery async tasks
│       ├── db/                     # DB setup, migrations
│       └── websocket/              # WS connection manager
│
├── docker/
│   ├── Dockerfile.web
│   ├── Dockerfile.api
│   ├── Dockerfile.sandbox          # Isolated code runner
│   └── docker-compose.yml
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
└── docs/
    ├── architecture.md
    ├── api-reference.md
    └── deployment.md
```

---

## Development Roadmap

### Phase 0 — Foundation (Week 1–2)
> Repo setup, auth, database, base UI shell

- [ ] Monorepo init (turborepo or nx) with `apps/web` and `apps/api`
- [ ] PostgreSQL schema: `users`, `sessions`, `questions`, `answers`, `reports`
- [ ] Alembic migration setup
- [ ] FastAPI boilerplate with JWT auth (register, login, refresh)
- [ ] NextAuth.js v5 with GitHub + Google OAuth
- [ ] Dashboard shell — session history list, role selector
- [ ] Docker Compose for local dev (postgres, redis, api, web)

---

### Phase 1 — Interview Engine Core (Week 3–5)
> The brain: session management, LLM question generation, real-time transcript

- [ ] **Session FSM** — states: `SETUP → INTRO → ROUND_ACTIVE → BREAK → ANALYSIS → DONE`
- [ ] **LLM Question Generator** — system prompt design per round type (DSA / SysDesign / Behavioral)
- [ ] **Adaptive follow-up logic** — inject previous answer + rubric score into next prompt
- [ ] **WebSocket session room** — server-side connection manager, message protocol
- [ ] **STT pipeline** — browser mic → audio chunk → Whisper API → transcript → send to LLM
- [ ] **TTS pipeline** — LLM response text → ElevenLabs → audio stream → play in browser
- [ ] Basic end-to-end voice interview test (no avatar yet)

**LLM Prompt Architecture:**
```
system: You are a senior {role} engineer at {company_tier}. 
        Conduct a {round_type} interview. 
        Current difficulty: {difficulty}. 
        Ask one question at a time. Score each answer on: 
        correctness (40%), clarity (30%), edge cases (30%).

user: [previous_context + candidate_answer]
```

---

### Phase 2 — Avatar Integration (Week 6–7)
> Bringing the interviewer to life

- [ ] Evaluate D-ID Streaming API vs HeyGen Live Portrait
- [ ] Integrate chosen SDK — stream avatar video to `<video>` element
- [ ] Sync avatar speech playback with TTS audio output
- [ ] Idle / listening / speaking state transitions
- [ ] Avatar persona config (name, appearance, voice style)
- [ ] Fallback: static avatar image + animated waveform if streaming fails

**D-ID Integration Flow:**
```
TTS text → POST /talks (D-ID API) → streaming video URL → 
<video> element → plays synchronized with audio
```

---

### Phase 3 — Code Interview Layer (Week 8–9)
> DSA rounds with real code execution

- [ ] Monaco Editor — language selector (Python, JS, Java, C++)
- [ ] Problem statement panel (rendered Markdown + test cases)
- [ ] Code submission → FastAPI → Docker sandbox runner
- [ ] Sandbox: isolated Docker container, 5s timeout, memory limit
- [ ] Auto-test against hidden test cases, return pass/fail per case
- [ ] LLM code review — time/space complexity analysis, feedback
- [ ] Live hints system (3 hints per problem, progressively more specific)

**Sandbox Security Model:**
```
User code → Celery task → spawn Docker container 
  (no network, read-only FS, PID limit, 256MB RAM, 5s CPU) 
→ capture stdout/stderr → destroy container → return result
```

---

### Phase 4 — System Design Round (Week 10)
> Whiteboard + verbal explanation

- [ ] Embed Excalidraw in a resizable panel
- [ ] Candidate draws, LLM evaluates verbal explanation via STT
- [ ] Prompts: scale requirement, bottleneck identification, trade-off discussion
- [ ] Diagram saved as SVG/JSON to S3 for replay
- [ ] Scoring: coverage of components, scalability, data flow correctness

---

### Phase 5 — Scoring & Analytics (Week 11–12)
> The report card

- [ ] **Per-question scoring** — LLM-as-judge with structured output (JSON rubric scores)
- [ ] **Overall session report** — aggregate score, category breakdown, percentile
- [ ] **Strength/weakness summary** — LLM-generated narrative paragraph
- [ ] **Improvement recommendations** — linked resources (LeetCode tags, reading list)
- [ ] **Session replay** — transcript timeline + code submissions + whiteboard snapshot
- [ ] PDF report export

**Scoring Rubric (per answer):**
```json
{
  "correctness": 0-10,
  "communication": 0-10,
  "edge_case_handling": 0-10,
  "time_complexity_awareness": 0-10,
  "overall": 0-40,
  "feedback": "string",
  "suggested_follow_up_topics": ["array"]
}
```

---

### Phase 6 — Polish & Launch Prep (Week 13–14)
> Reliability, UX, and the "wow" moments

- [ ] Connection resilience — WS reconnect on drop, session state recovery
- [ ] Mobile responsive (interview view degrades gracefully on tablet)
- [ ] Onboarding flow — role picker, difficulty picker, resume upload (optional)
- [ ] Rate limiting on API (per-user session limit)
- [ ] Error boundaries and fallback UIs throughout
- [ ] Sentry integration (frontend + backend)
- [ ] Landing page
- [ ] Alpha user cohort — 10 engineers, collect feedback

---

### Phase 7 — Growth Features (Post-Launch)
> After proving the core loop

- [ ] Interview question bank (community-sourced)
- [ ] Company-specific tracks (Google L4, Meta E3, startup generalist)
- [ ] Peer practice rooms (2 candidates, 1 AI judge)
- [ ] Recruiter portal — async screening with auto-scored reports
- [ ] LeetCode integration — sync solved problems to personalize question selection
- [ ] Mobile app (React Native)

---

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker + Docker Compose
- PostgreSQL 15+
- Redis 7+

### 1. Clone the repository
```bash
git clone https://github.com/your-username/interviewforge.git
cd interviewforge
```

### 2. Start infrastructure
```bash
docker compose up -d postgres redis
```

### 3. Backend setup
```bash
cd apps/api
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --port 8000
```

### 4. Frontend setup
```bash
cd apps/web
npm install
npm run dev
```

App runs at `http://localhost:3000`, API at `http://localhost:8000`.

### 5. Run Celery worker (for async tasks)
```bash
cd apps/api
celery -A tasks worker --loglevel=info
```

---

## Environment Variables

### Backend (`apps/api/.env`)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/interviewforge
REDIS_URL=redis://localhost:6379/0

JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256

OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...
DID_API_KEY=...

AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=interviewforge-media

DOCKER_SANDBOX_IMAGE=interviewforge-sandbox:latest
```

### Frontend (`apps/web/.env.local`)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## API Reference

### Session Endpoints
```
POST   /api/v1/sessions          → Create new interview session
GET    /api/v1/sessions/{id}     → Get session details
PATCH  /api/v1/sessions/{id}     → Update session state
GET    /api/v1/sessions/{id}/report → Fetch full session report
```

### Code Execution
```
POST   /api/v1/code/run          → Submit code for execution
POST   /api/v1/code/submit       → Submit final solution (runs all test cases)
```

### WebSocket
```
WS     /ws/{session_id}          → Main interview real-time channel

# Client → Server messages:
{ "type": "audio_chunk", "data": "<base64>" }
{ "type": "code_update", "data": { "lang": "python", "code": "..." } }
{ "type": "ready" }
{ "type": "end_session" }

# Server → Client messages:
{ "type": "transcript", "text": "...", "speaker": "candidate|interviewer" }
{ "type": "avatar_stream", "url": "..." }
{ "type": "question", "data": { ... } }
{ "type": "score_update", "data": { ... } }
{ "type": "session_end", "report_id": "..." }
```

---

## Key Design Decisions

**Why Docker for code sandboxing?** Security isolation is non-negotiable when executing arbitrary user code. Each submission spawns a fresh container with no network access, a hard CPU timeout, and a constrained memory limit, then is immediately destroyed.

**Why WebSockets over HTTP polling?** Interview flow is inherently real-time — voice chunks, avatar state changes, live transcripts, and score updates all require sub-100ms latency. WebSockets make the architecture simpler and faster than polling or SSE for bidirectional data.

**Why Celery for TTS/STT?** Audio processing (Whisper transcription, ElevenLabs synthesis) can take 1–3 seconds. Offloading to async workers keeps the WebSocket handler non-blocking and lets the avatar respond as soon as audio is ready.

**LLM-as-judge for scoring:** Rather than hard-coded rubrics, the LLM evaluates answers against a structured prompt that defines the rubric. This generalizes across question types and produces human-readable feedback, not just a number.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/avatar-lip-sync`
3. Commit changes: `git commit -m "feat: add D-ID streaming integration"`
4. Push and open a PR against `main`

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

<div align="center">
  Built by engineers, for engineers. &nbsp;·&nbsp;
  <a href="https://rachitdev.uk">rachitdev.uk</a>
</div>
