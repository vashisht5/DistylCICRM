#!/usr/bin/env bash
# Distyl Intel — single command dev launcher (backend + frontend)
# Source user profile so npm/node are on PATH
[ -f ~/.zshrc ] && source ~/.zshrc 2>/dev/null || true
[ -f ~/.bashrc ] && source ~/.bashrc 2>/dev/null || true
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FE_DIR="$SCRIPT_DIR/frontend"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║        Distyl Competitive Intelligence Portal        ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Cleanup on exit ──────────────────────────────────────────
BE_PID=""
FE_PID=""
cleanup() {
  echo ""
  echo "Shutting down..."
  [ -n "$BE_PID" ] && kill "$BE_PID" 2>/dev/null
  [ -n "$FE_PID" ] && kill "$FE_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

# ── Kill anything already on these ports ─────────────────────
for port in 5002 5173; do
  if lsof -ti:$port >/dev/null 2>&1; then
    echo "→ Freeing port $port..."
    kill $(lsof -ti:$port) 2>/dev/null
    sleep 0.5
  fi
done

# ── Python deps ───────────────────────────────────────────────
echo "→ Checking Python dependencies..."
pip3 install -r "$SCRIPT_DIR/requirements.txt" --quiet -q

# ── Database ──────────────────────────────────────────────────
echo "→ Initializing database..."
cd "$SCRIPT_DIR"
python3 setup_db.py

# ── Backend ───────────────────────────────────────────────────
echo "→ Starting backend on :5002..."
python3 server.py > /tmp/distyl-be.log 2>&1 &
BE_PID=$!

# Wait for backend to be ready
for i in $(seq 1 10); do
  sleep 1
  if curl -s http://localhost:5002/api/health | grep -q "ok" 2>/dev/null; then
    echo "  ✓ Backend ready"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "  ✗ Backend failed to start. Check: tail -f /tmp/distyl-be.log"
    exit 1
  fi
done

# ── Frontend ──────────────────────────────────────────────────
echo "→ Installing frontend dependencies..."
cd "$FE_DIR"
npm install --silent

echo "→ Starting frontend on :5173..."
npm run dev > /tmp/distyl-fe.log 2>&1 &
FE_PID=$!

# Wait for Vite to be ready
for i in $(seq 1 15); do
  sleep 1
  if grep -q "Local:" /tmp/distyl-fe.log 2>/dev/null; then
    break
  fi
done

# ── Ready ─────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✓ Portal ready!                                     ║"
echo "║                                                      ║"
echo "║  Frontend  →  http://localhost:5173                  ║"
echo "║  Backend   →  http://localhost:5002                  ║"
echo "║  Health    →  http://localhost:5002/api/health       ║"
echo "║                                                      ║"
echo "║  Logs:                                               ║"
echo "║    tail -f /tmp/distyl-be.log  (backend)             ║"
echo "║    tail -f /tmp/distyl-fe.log  (frontend)            ║"
echo "║                                                      ║"
echo "║  Press Ctrl+C to stop everything                     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

open "http://localhost:5173" 2>/dev/null || true

# Keep alive — tail both logs
tail -f /tmp/distyl-be.log /tmp/distyl-fe.log
