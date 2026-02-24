#!/bin/bash
# Distyl Intel Portal - Launcher Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "============================================================"
echo "Distyl Competitive Intelligence Portal"
echo "============================================================"
echo ""

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "Warning: ANTHROPIC_API_KEY not set"
fi

# Kill any existing server on port 5002
if lsof -ti:5002 >/dev/null 2>&1; then
    echo "Stopping existing server on port 5002..."
    kill $(lsof -t -i:5002) 2>/dev/null
    sleep 1
fi

# Install/check dependencies
pip3 install -r "$SCRIPT_DIR/requirements.txt" --quiet 2>&1

# Initialize database
cd "$SCRIPT_DIR"
python3 -c "from database import init_db; import models; init_db()" 2>&1

# Start the server
echo "Starting Distyl Intel server on port 5002..."
python3 server.py > /tmp/distyl-intel.log 2>&1 &
SERVER_PID=$!

sleep 2

if ! lsof -ti:5002 >/dev/null 2>&1; then
    echo "Server failed to start. Check logs:"
    echo "   tail -f /tmp/distyl-intel.log"
    exit 1
fi

echo "Server running on http://localhost:5002"
echo ""
echo "View logs:    tail -f /tmp/distyl-intel.log"
echo "Stop server:  kill $SERVER_PID"
echo "============================================================"
echo ""

tail -f /tmp/distyl-intel.log
