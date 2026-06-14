# EchoWorld

An AI-powered adventure where every choice reshapes the story in real time. Built for the **Microsoft Agents League Hackathon**.

## Overview

EchoWorld is a real-time narrative adventure game where an AI Game Master (powered by **Gemini 3.5 Flash**) generates immersive scenes grounded in world lore retrieved from **Azure AI Foundry IQ**.

- **Client:** React 18 + Vite + Framer Motion
- **Server:** Node.js + Express + Socket.io
- **Database:** MongoDB (Mongoose)
- **AI Orchestration:** Google Gemini 3.5 Flash (LLM) + Azure AI Foundry IQ (Knowledge Base)
- **Architecture:** Monorepo with separate `client` and `server` packages

## Repository Structure

- `client/` — React + Vite frontend
- `server/` — Express + Socket.io backend
- `knowledge-base/` — JSON world definition files (lore, characters, rules)
- `package.json` — Root monorepo scripts
- `.gitignore` — Excludes `node_modules`, `.env`, and secret files

## Setup

```bash
# Install dependencies for both client and server
npm install
npm run install:all

# Start both in development mode
npm run dev
```

## AI Configuration

Configure the following environment variables in your `server/.env` file.

### 1. World Lore (Azure AI Foundry IQ)
- `AZURE_FOUNDRY_ENDPOINT` — Your Project Query endpoint
- `AZURE_FOUNDRY_KEY` — Your API key
- `AZURE_FOUNDRY_TIMEOUT_MS` — Timeout for grounding queries (default: 8000)

### 2. Narrative Generation (Google Gemini)
- `GEMINI_API_KEY` — Your Google AI Studio API Key
- `GEMINI_MODEL` — Model to use (default: `gemini-3.5-flash`)

## Server & Socket Events

The server runs at `server/src/index.js` and handles real-time gameplay via Socket.io:

- `game:start` — Initializes a new AI-driven session.
- `game:choice` — Processes a player decision and triggers Gemini to generate the next scene.
- `game:end` — Persists the final journey to MongoDB.

## Testing & Verification

### Unit Tests
Verify the orchestrator logic with mocked AI responses:
```bash
npx jest server/src/orchestrator/__tests__/NarrativeOrchestrator.test.js
```

### Integration Verification
Verify the Gemini + Foundry integration with a real API call:
```bash
cd server && node verify-gemini.js
```

## Database (MongoDB)

The server connects to MongoDB to store game sessions. Provide your connection string via `MONGODB_URI` in the `.env` file. If missing, the server operates in-memory.
