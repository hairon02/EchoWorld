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
