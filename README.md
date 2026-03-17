# RepoRat Frontend

Dashboard UI for RepoRat — AI-powered repository scanner.

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** (custom dark hacker theme)
- **Lucide React** icons
- **WebSocket** for real-time scan updates

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with stats and recent scans |
| `/scan` | New scan form with live terminal output |
| `/scans` | Scan history listing |
| `/scans/[id]` | Scan detail with issues, tests, bugs tabs |
| `/connectors` | Bug tracker connector config and testing |

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your backend URL
npm run dev
```

Runs on [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API URL |

## Build

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t reporat-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://api:8000 reporat-frontend
```
