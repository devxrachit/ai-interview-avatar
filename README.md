# 🤖 InterviewForge: AI Avatar Interview Platform for Engineers

> A real-time AI-powered mock interview platform with an animated avatar interviewer, adaptive question generation, code execution, and post-session analytics. Built specifically for software engineers who want to practice like it's the real thing.

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

**InterviewForge** is a full end-to-end AI interview simulation platform built for software engineers. Instead of practicing with static question lists or awkward text-based tools, you get a lifelike AI avatar that actually talks to you, listens to your answers, runs your code, and gives you honest feedback at the end.

It covers the three rounds that actually matter: DSA, system design, and behavioral. Everything happens in the browser. No downloads, no setup overhead for candidates.

The platform is built for three types of users:

1. **Candidates** who want to do serious mock interviews with real feedback before the actual thing.
2. **Bootcamps and colleges** that want a structured, repeatable interview readiness program.
3. **Recruiters** (on the roadmap) who want async AI screening before scheduling human rounds.

---

## Features

### Core
- 🧑‍💻 **AI Avatar Interviewer** - Animated 2D/3D avatar with lip-sync powered by D-ID or HeyGen API
- 🎤 **Voice I/O** - Real-time speech-to-text via Whisper plus text-to-speech via ElevenLabs or browser TTS
- 🧠 **Adaptive Question Engine** - LLM-driven question generation that adapts based on role, difficulty, and how you answered the last question
- 💻 **In-Browser Code Editor** - Monaco Editor with multi-language support and a live execution sandbox
- 📊 **Post-Session Analytics** - Scoring rubric, answer quality breakdown, and specific improvement suggestions
- 🔁 **Session Replay** - Full transcript and audio/video replay so you can review exactly what happened

### Engineering-Specific
- DSA rounds covering arrays, trees, graphs, and DP with automatic test case validation
- System design rounds with a live whiteboard (Excalidraw embedded or custom canvas)
- Behavioral rounds scored against a STAR-method rubric

### Auth and User Management
- OAuth login via GitHub or Google (a natural fit for the target audience)
- Interview history dashboard with session-by-session progress
- Role and track selection across Frontend, Backend, ML, Fullstack, and DevOps

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

### Phase 0: Foundation (Week 1-2)
> Get the boring stuff right. Auth, database, local dev environment, and a bare-bones UI shell.

- [ ] Monorepo setup (turborepo or nx) with `apps/web` and `apps/api`
- [ ] PostgreSQL schema: `users`, `sessions`, `questions`, `answers`, `reports`
- [ ] Alembic migration setup
- [ ] FastAPI boilerplate with JWT auth (register, login, token refresh)
- [ ] NextAuth.js v5 with GitHub and Google OAuth
- [ ] Dashboard shell with session history list and role selector
- [ ] Docker Compose for local dev (postgres, redis, api, web)

---

### Phase 1: Interview Engine Core (Week 3-5)
> The brain of the whole thing: session state machine, LLM question generation, and real-time transcript.

- [ ] **Session FSM** with states: `SETUP -> INTRO -> ROUND_ACTIVE -> BREAK -> ANALYSIS -> DONE`
- [ ] **LLM Question Generator** with system prompt design per round type (DSA, SysDesign, Behavioral)
- [ ] **Adaptive follow-up logic** that injects the previous answer and rubric score into the next prompt
- [ ] **WebSocket session room** with a server-side connection manager and message protocol
- [ ] **STT pipeline** from browser mic to audio chunk to Whisper API to transcript to LLM
- [ ] **TTS pipeline** from LLM response text to ElevenLabs to audio stream to browser playback
- [ ] Basic end-to-end voice interview test (no avatar yet, just voice)

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

### Phase 2: Avatar Integration (Week 6-7)
> Bringing the interviewer to life so it actually feels like talking to someone.

- [ ] Evaluate D-ID Streaming API vs HeyGen Live Portrait and pick one
- [ ] Integrate the chosen SDK and stream avatar video into a `<video>` element
- [ ] Sync avatar speech playback with TTS audio output
- [ ] Handle idle, listening, and speaking state transitions cleanly
- [ ] Avatar persona config (name, appearance, voice style)
- [ ] Fallback to a static avatar image with an animated waveform if streaming fails

**D-ID Integration Flow:**
```
TTS text -> POST /talks (D-ID API) -> streaming video URL -> 
<video> element -> plays synchronized with audio
```

---

### Phase 3: Code Interview Layer (Week 8-9)
> DSA rounds with an actual code editor and real execution, not a text box.

- [ ] Monaco Editor with language selector (Python, JS, Java, C++)
- [ ] Problem statement panel with rendered Markdown and test cases
- [ ] Code submission from Monaco to FastAPI to Docker sandbox runner
- [ ] Sandbox: isolated Docker container, 5s timeout, memory limit enforced
- [ ] Auto-test against hidden test cases, return pass/fail per case
- [ ] LLM code review with time/space complexity analysis and written feedback
- [ ] Live hints system (3 hints per problem, each one progressively more specific)

**Sandbox Security Model:**
```
User code -> Celery task -> spawn Docker container 
  (no network, read-only FS, PID limit, 256MB RAM, 5s CPU) 
-> capture stdout/stderr -> destroy container -> return result
```

---

### Phase 4: System Design Round (Week 10)
> Whiteboard plus verbal explanation. The round most people under-prepare for.

- [ ] Embed Excalidraw in a resizable panel alongside the avatar
- [ ] Candidate draws while explaining; LLM evaluates the verbal explanation via STT
- [ ] Prompts covering scale requirements, bottleneck identification, and trade-off discussion
- [ ] Save diagram as SVG/JSON to S3 for replay after the session
- [ ] Score based on component coverage, scalability thinking, and data flow correctness

---

### Phase 5: Scoring and Analytics (Week 11-12)
> The part candidates actually care about: what did I do well, what did I mess up, and what do I work on next.

- [ ] **Per-question scoring** using LLM-as-judge with structured JSON rubric output
- [ ] **Overall session report** with aggregate score, category breakdown, and percentile
- [ ] **Strength/weakness summary** as a readable narrative paragraph, not just numbers
- [ ] **Improvement recommendations** with linked resources (LeetCode tags, reading list)
- [ ] **Session replay** showing transcript timeline, code submissions, and whiteboard snapshot
- [ ] PDF report export for sharing or keeping records

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

### Phase 6: Polish and Launch Prep (Week 13-14)
> Reliability, UX, and making sure the first 10 users don't bounce.

- [ ] Connection resilience with WS reconnect on drop and session state recovery
- [ ] Mobile responsive layout (interview view degrades gracefully on tablet)
- [ ] Onboarding flow with role picker, difficulty picker, and optional resume upload
- [ ] Rate limiting on the API (per-user session limit)
- [ ] Error boundaries and fallback UIs throughout the app
- [ ] Sentry integration on both frontend and backend
- [ ] Landing page
- [ ] Alpha cohort of 10 engineers to collect real feedback

---

### Phase 7: Growth Features (Post-Launch)
> After proving that the core loop actually works.

- [ ] Interview question bank sourced from the community
- [ ] Company-specific tracks (Google L4, Meta E3, startup generalist, etc.)
- [ ] Peer practice rooms with 2 candidates and 1 AI judge
- [ ] Recruiter portal for async AI screening with auto-scored candidate reports
- [ ] LeetCode integration to sync solved problems and personalize question selection
- [ ] Mobile app built in React Native

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

The app runs at `http://localhost:3000` and the API at `http://localhost:8000`.

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
POST   /api/v1/sessions              -> Create a new interview session
GET    /api/v1/sessions/{id}         -> Get session details
PATCH  /api/v1/sessions/{id}         -> Update session state
GET    /api/v1/sessions/{id}/report  -> Fetch the full session report
```

### Code Execution
```
POST   /api/v1/code/run      -> Submit code for a quick execution run
POST   /api/v1/code/submit   -> Submit final solution against all test cases
```

### WebSocket
```
WS     /ws/{session_id}   -> Main interview real-time channel

# Client to Server messages:
{ "type": "audio_chunk", "data": "<base64>" }
{ "type": "code_update", "data": { "lang": "python", "code": "..." } }
{ "type": "ready" }
{ "type": "end_session" }

# Server to Client messages:
{ "type": "transcript", "text": "...", "speaker": "candidate|interviewer" }
{ "type": "avatar_stream", "url": "..." }
{ "type": "question", "data": { ... } }
{ "type": "score_update", "data": { ... } }
{ "type": "session_end", "report_id": "..." }
```

---

## Key Design Decisions

**Why Docker for code sandboxing?** Security isolation is non-negotiable when you're executing arbitrary user code. Each submission spawns a fresh container with no network access, a hard CPU timeout, and a constrained memory limit, then gets destroyed immediately after. There's no shared state between submissions and no way for user code to touch the host.

**Why WebSockets over HTTP polling?** The interview flow is inherently real-time. Voice chunks, avatar state changes, live transcripts, and score updates all need to move in both directions with sub-100ms latency. WebSockets make the architecture simpler and faster than polling or SSE for this kind of bidirectional, low-latency data.

**Why Celery for TTS/STT?** Audio processing via Whisper and ElevenLabs can take anywhere from 1 to 3 seconds per call. Offloading to async workers keeps the WebSocket handler non-blocking and lets the avatar start responding as soon as the audio is ready, instead of stalling the whole session.

**LLM-as-judge for scoring:** Rather than hard-coded rubrics that break for anything unexpected, the LLM evaluates each answer against a structured prompt that defines the scoring criteria. This generalizes cleanly across question types and produces human-readable feedback alongside the scores, not just a number out of 40.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/avatar-lip-sync`
3. Commit your changes: `git commit -m "feat: add D-ID streaming integration"`
4. Push and open a PR against `main`

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## License

MIT. See [LICENSE](./LICENSE) for details.

---

<div align="center">
  Built by engineers, for engineers. &nbsp;·&nbsp;
  <a href="https://rachitdev.uk">rachitdev.uk</a>
</div>
