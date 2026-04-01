# AI Chief of Staff

An executive communication triage system that processes a CEO's morning messages across email, Slack, and WhatsApp. It classifies each message by action required, detects cross-message relationships (escalating threads, contradictions, scheduling conflicts), flags security threats, and generates a concise daily briefing readable in under two minutes.

## Architecture

The system uses a **two-pass LLM pipeline** -- the key architectural decision that separates this from a naive single-pass classifier:

```mermaid
flowchart TB
    subgraph Input
        A[Messages JSON] --> B[Validation & Parsing]
    end

    subgraph Pass 1 — Independent Classification
        B --> C[Gemini 2.5 Flash]
        C --> D[Per-message classification]
        D --> D1[Category: Ignore / Delegate / Decide]
        D --> D2[Urgency: critical / high / medium / low]
        D --> D3[Security assessment]
        D --> D4[Drafted response]
    end

    subgraph Pass 2 — Cross-Reference & Synthesis
        D1 & D2 & D3 & D4 --> E[All messages + classifications fed back]
        E --> F[Gemini 2.5 Flash]
        F --> G[Thread detection]
        F --> H[Conflict & contradiction detection]
        F --> I[Cascading impact analysis]
        F --> J[Flag generation]
        F --> K[Daily briefing]
    end

    subgraph Output
        G & H & I & J & K --> L[Structured JSON response]
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
    TriageView.tsx           # Filterable message list with tabs
    MessageCard.tsx          # Expandable message with classification details
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
