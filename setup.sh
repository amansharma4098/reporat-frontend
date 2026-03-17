#!/bin/bash
# ============================================
# RepoRat Frontend - GitHub Setup (Linux/Mac)
# ============================================
# Prerequisites:
#   1. Create empty repo on github.com/new -> reporat-frontend
#   2. Replace YOUR_GITHUB_USERNAME below
#   3. Run this from INSIDE the reporat-frontend folder
# ============================================

GITHUB_USER="amansharma4098"

set -e

echo ""
echo "========================================="
echo "  RepoRat Frontend - GitHub Setup"
echo "========================================="
echo ""

echo "[1/5] Initializing git..."
git init

echo "[2/5] Adding files..."
git add -A

echo "[3/5] Committing..."
git commit -m "feat: initial commit - RepoRat frontend dashboard

- Next.js 15 App Router + TypeScript
- Tailwind CSS dark hacker theme
- Dashboard with scan stats and history
- New scan form with live WebSocket terminal
- Scan detail page with issues/tests/bugs tabs
- Connectors management page
- Responsive sidebar navigation
- Docker support"

echo "[4/5] Setting remote..."
git branch -M main
git remote add origin "https://github.com/${GITHUB_USER}/reporat-frontend.git"

echo "[5/5] Pushing to GitHub..."
git push -u origin main

echo ""
echo "========================================="
echo "  Frontend pushed successfully!"
echo "========================================="
echo ""
echo "  Repo: https://github.com/${GITHUB_USER}/reporat-frontend"
echo ""
echo "  To run locally:"
echo "    npm install"
echo "    cp .env.example .env.local"
echo "    # Edit .env.local -> set NEXT_PUBLIC_API_URL=http://localhost:8000"
echo "    npm run dev"
echo ""
echo "  Dashboard: http://localhost:3000"
echo "========================================="
