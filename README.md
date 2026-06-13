# EchoWorld

An AI-powered adventure where every choice reshapes the story in real time.

## Overview

EchoWorld is a real-time narrative adventure game built as a JavaScript monorepo.

- **Client:** React 18 + Vite
- **Server:** Node.js + Express + Socket.io
- **Database:** MongoDB (Mongoose)
- **AI orchestration:** LangChain / Azure Foundry IQ (planned)
- **Architecture:** monorepo with separate `client` and `server` packages

## Repository Structure

- `client/` — React + Vite frontend
- `server/` — Express + Socket.io backend
- `package.json` — root monorepo scripts
- `.gitignore` — excludes `node_modules`, `.env`, and secret files

## Setup

```bash
cd EchoWorld
npm install
npm run install:all
npm run dev
```

## Server & Socket events

The server runs at `server/src/index.js` and exposes realtime game events over Socket.io. Major events the client and server use:

- `game:start` — payload: `{ playerName }`. Server creates a new session, joins the socket to the session room, and emits `game:scene` with the initial scene and history.
- `game:choice` — payload: `{ sessionId, choiceId }`. Server records the decision, advances the scene, and emits `game:scene` with the updated scene, history, and decisions.
- `game:end` — payload: `{ sessionId }`. Client calls this when finishing intentionally. Server persists the session to MongoDB (status: `completed`) and emits `game:summary` with final stats.
- `disconnect` — low-level socket disconnect. The server treats this as an unexpected drop: it attempts best-effort cleanup and may mark the session `abandoned` in the DB.

Design notes:

- Prefer sending `game:end` from the client for intentional finishes so the server can persist a `completed` session and return a `game:summary`.
- `disconnect` is a fallback cleanup mechanism — make it idempotent and avoid relying on client responses.

## Database (MongoDB)

The server connects to MongoDB using `server/src/db/mongo.js`. Provide your Atlas connection string via the `MONGODB_URI` environment variable (see `.env.example`). When present the server will attempt to connect at startup; if the variable is missing the server continues in in-memory-only mode.

Models created:

- `Session` — stores completed or abandoned sessions with fields: `sessionId`, `playerName`, `startedAt`, `endedAt`, `decisions`, `status`.
- `Scene` — stores narrative scenes: `sceneId`, `narrativeText`, `choices`, and optional `worldContext`.

If you add new environment variables, update `.env.example` accordingly.

## AI Configuration

EchoWorld separates world knowledge (Foundry IQ) from the LLM used for narrative generation. Configure the following environment variables in the `server/.env` file or your environment.

- `AZURE_FOUNDRY_ENDPOINT` — Foundry IQ endpoint (used for world/context queries)
- `AZURE_FOUNDRY_KEY` — Key for Foundry IQ
- `AZURE_OPENAI_ENDPOINT` — (optional) Azure OpenAI endpoint (if you want to use Azure for LLMs)
- `AZURE_OPENAI_KEY` — (optional) Key for Azure OpenAI
- `LLM_PROVIDER` — `openai` or `claude` (defaults to `claude`)
- `LLM_API_KEY` — (optional) Public OpenAI API key if not using Azure
- `LLM_MODEL_ID` — Model/deployment id (e.g. `gpt-4o`, `gpt-5-mini`, or an Azure deployment name)

Recommended quick setup (mixed mode):

1. Use Foundry for world context:

```
AZURE_FOUNDRY_ENDPOINT=https://your-foundry-instance.openai.azure.com
AZURE_FOUNDRY_KEY=your-foundry-key
```

2. Use Azure OpenAI for LLMs (preferred for enterprise):

```
LLM_PROVIDER=openai
AZURE_OPENAI_ENDPOINT=https://your-azure-openai-resource.openai.azure.com
AZURE_OPENAI_KEY=your-azure-openai-key
LLM_MODEL_ID=gpt-5-mini
```

Or, use the public OpenAI API by setting `LLM_PROVIDER=openai` and `LLM_API_KEY`.

The orchestrator injects Foundry context into the system prompt to avoid hallucinations.

## Testing

Unit tests for the orchestrator live at `server/src/orchestrator/__tests__/NarrativeOrchestrator.test.js` and mock Foundry and LLM responses. Run tests with:

```bash
npx jest server/src/orchestrator/__tests__/NarrativeOrchestrator.test.js --runInBand
```

To run all tests:

```bash
npx jest
```
