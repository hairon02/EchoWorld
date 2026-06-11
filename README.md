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
