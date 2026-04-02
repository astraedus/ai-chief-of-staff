# AI Chief of Staff

An executive communication triage system that processes a CEO's morning messages across email, Slack, and WhatsApp. It classifies each message by action required, detects cross-message relationships (escalating threads, contradictions, scheduling conflicts), flags security threats, and generates a concise daily briefing readable in under two minutes.

## Architecture

The system uses a **two-pass LLM pipeline** -- the key architectural decision that separates this from a naive single-pass classifier:

```mermaid
flowchart TB
    subgraph Input
        A[Messages JSON] --> B[Validation & Parsing]
    end

    subgraph Pass1[Pass 1 -- Independent Classification]
        B --> C[Gemini 2.5 Flash]
        C --> D[Per-message classification]
        D --> D1[Category: Ignore / Delegate / Decide]
        D --> D2[Urgency: critical / high / medium / low]
        D --> D3[Security assessment]
        D --> D4[Drafted response]
    end

    subgraph Pass2[Pass 2 -- Cross-Reference and Synthesis]
        D1 --> E[All classifications fed back]
        D2 --> E
        D3 --> E
        D4 --> E
        E --> F[Gemini 2.5 Flash]
        F --> G[Thread detection]
        F --> H[Conflict detection]
        F --> I[Impact analysis]
        F --> J[Flag generation]
        F --> K[Daily briefing]
    end

    subgraph Output
        G --> L[Structured JSON response]
        H --> L
        I --> L
        J --> L
        K --> L
        L --> M[Executive Dashboard UI]
    end
```

### Why two passes?

A single-pass classifier sees each message in isolation. It would classify Tom Bradley's first Slack message ("API migration 60% done, no blockers") as a low-priority FYI. But his third message reveals 3% of live payments are failing and he needs a rollback/hotfix decision within an hour. Only by seeing all messages together in Pass 2 can the system:

- **Detect escalation**: Tom's three messages form a thread that escalates from "on track" to "critical production issue"
- **Surface contradictions**: The COO says "push the board deck" then reverses himself 90 minutes later
- **Find scheduling conflicts**: Investor meeting and leadership sync both booked at 2pm Thursday
- **Track deal changes**: Northwind deal announced at 120K ARR, then drops to 60K -- needs CEO decision
- **Catch resolved issues**: David flags Horizon timeline concerns, then resolves them with Lisa -- no CEO action needed
- **Identify phishing**: Suspicious domain (seczure-verify.com), urgency language, unverified sender -- flagged as security threat

### Design decisions

| Decision | Rationale |
|----------|-----------|
| **Two-pass pipeline** | Catches cross-message relationships that single-pass classification misses entirely. The data is designed with intentional interconnections. |
| **Structured JSON output** | Gemini's `responseMimeType: "application/json"` ensures reliable parsing. No regex or string extraction needed. |
| **Security-aware classification** | Every message gets a security assessment. Phishing detection is built into Pass 1, then escalated in Pass 2 flags. |
| **Channel-aware drafted responses** | Tone matches the channel: formal for email, casual for Slack/WhatsApp. Responses are ready to send. |
| **Lazy Gemini client init** | Client initialized on first API call, not at module load. Prevents build failures when env vars are unavailable during static analysis. |
| **Upload new data** | The system works with any CEO's messages, not just the sample set. Upload a JSON file and the full pipeline runs. |

## Setup

```bash
git clone https://github.com/astraedus/ai-chief-of-staff.git
cd ai-chief-of-staff
npm install
```

Create `.env.local`:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing with new data

1. Click **Upload Messages** in the header
2. Select a JSON file containing an array of message objects
3. Each message needs: `id` (number), `channel` ("email" | "slack" | "whatsapp"), `from` (string), `timestamp` (ISO string), `body` (string)
4. Optional fields: `to`, `subject` (email), `channel_name` (Slack)

The system accepts either a raw JSON array or `{ "messages": [...] }`.

## Tests

```bash
npm test        # Run all tests (42 tests across 4 suites)
npm run test:watch  # Watch mode
```

Test suites cover:
- **Validation**: Message schema validation (valid/invalid inputs, channel types, required fields)
- **JSON parsing**: Code fence stripping, nested objects, error handling
- **Prompt construction**: Both passes include correct instructions, all message data, security/escalation detection
- **Data integrity**: Sample dataset structure, sequential IDs, phishing message presence, crisis thread, deal renegotiation

## Production architecture (proposed)

The current demo runs both passes synchronously on each request. In production, the system decomposes naturally into real-time ingestion + batch analysis:

```mermaid
flowchart TB
    subgraph Ingestion["Ingestion -- Real-time"]
        G[Gmail API Watch] --> Q[Message Queue]
        S[Slack Events API] --> Q
        W[WhatsApp Business API] --> Q
        Q --> L1[Lambda / Cloud Run]
        L1 --> P1[Pass 1: Classify]
        P1 --> DB[(Database)]
    end

    subgraph Analysis["Analysis -- Batch, 6am daily"]
        CRON[Cron Trigger] --> L2[Lambda / Cloud Run]
        L2 --> FETCH[Fetch last 12h messages + classifications]
        DB --> FETCH
        FETCH --> P2[Pass 2: Cross-reference]
        P2 --> BRIEF[Generate Briefing + Flags]
        BRIEF --> DB
    end

    subgraph Delivery
        DB --> DASH[Web Dashboard]
        DB --> EMAIL[Daily Digest Email]
        DB --> VOICE[Voice Briefing -- TTS]
    end

    subgraph Feedback["Feedback Loop"]
        DASH --> OVERRIDE[CEO Overrides Classification]
        OVERRIDE --> CORRECTIONS[(Corrections Store)]
        CORRECTIONS --> P1
    end
```

**Why this split:**
- **Pass 1** (classify) is stateless and fast -- runs per-message in real-time as they arrive. Sub-second latency.
- **Pass 2** (cross-reference) needs the full picture -- runs as a batch over all recent messages. The CEO opens the dashboard and results are already there.
- **Corrections** from CEO overrides are stored per-user and injected as few-shot examples into Pass 1, so the system calibrates to each CEO's judgment over time.
- **Cost**: Gemini 2.5 Flash at ~$0.01 per 20 messages. Even at 100 messages/day, under $1/month in LLM costs.

## Tech stack

- **Next.js 16** (App Router, TypeScript, React 19)
- **Tailwind CSS v4** (minimal, professional styling)
- **Google Generative AI SDK** (`@google/generative-ai`) with Gemini 2.5 Flash
- **No component libraries** -- pure Tailwind for a lean, focused codebase

## Project structure

```
src/
  app/
    page.tsx                 # Dashboard entry point
    layout.tsx               # Root layout with metadata
    globals.css              # Design system tokens + animations
    api/triage/route.ts      # POST endpoint: validates input, runs pipeline
  components/
    Dashboard.tsx            # Main orchestrator: state, API calls, layout
    Briefing.tsx             # Executive summary with structured sections
    Flags.tsx                # Color-coded alert cards by severity
    TriageView.tsx           # Three-column kanban (Decide | Delegate | Ignore)
    MessageModal.tsx         # Detail modal with editable response + reclassify
    MessageCard.tsx          # Compact kanban card with preview
    UploadData.tsx           # File upload handler
    ProcessingOverlay.tsx    # Loading states with progress indicator
    ChannelIcon.tsx          # Email/Slack/WhatsApp channel indicators
    StatusBadge.tsx          # Category, urgency, and severity badges
  lib/
    types.ts                 # TypeScript interfaces for the full pipeline
    gemini.ts                # Lazy-initialized Gemini client
    prompts.ts               # System prompts for both passes
    triage.ts                # Two-pass pipeline orchestration
  data/
    messages.json            # Sample dataset (20 CEO morning messages)
```
