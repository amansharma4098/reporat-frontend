# ============================================
# RepoRat Frontend - GitHub Setup (Windows)
# ============================================
# Prerequisites:
#   1. Create empty repo on github.com/new -> reporat-frontend
#   2. Replace YOUR_GITHUB_USERNAME below
#   3. Run this from INSIDE the reporat-frontend folder
# ============================================

$GITHUB_USER = "amansharma4098"

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  RepoRat Frontend - GitHub Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Init and push
Write-Host "[1/5] Initializing git..." -ForegroundColor Yellow
git init

Write-Host "[2/5] Adding files..." -ForegroundColor Yellow
git add -A

Write-Host "[3/5] Committing..." -ForegroundColor Yellow
git commit -m "feat: initial commit - RepoRat frontend dashboard

- Next.js 15 App Router + TypeScript
- Tailwind CSS dark hacker theme
- Dashboard with scan stats and history
- New scan form with live WebSocket terminal
- Scan detail page with issues/tests/bugs tabs
- Connectors management page
- Responsive sidebar navigation
- Docker support"

Write-Host "[4/5] Setting remote..." -ForegroundColor Yellow
git branch -M main
git remote add origin "https://github.com/$GITHUB_USER/reporat-frontend.git"

Write-Host "[5/5] Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Frontend pushed successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Repo: https://github.com/$GITHUB_USER/reporat-frontend" -ForegroundColor White
Write-Host ""
Write-Host "  To run locally:" -ForegroundColor Yellow
Write-Host "    npm install"
Write-Host "    copy .env.example .env.local"
Write-Host "    # Edit .env.local -> set NEXT_PUBLIC_API_URL=http://localhost:8000"
Write-Host "    npm run dev"
Write-Host ""
Write-Host "  Dashboard: http://localhost:3000" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
