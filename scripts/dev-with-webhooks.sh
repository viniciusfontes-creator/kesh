#!/bin/bash
# ============================================================
# Dev script: starts Next.js + ngrok tunnel for Pluggy webhooks
# Usage: ./scripts/dev-with-webhooks.sh
# ============================================================

set -e

NGROK_BIN="${HOME}/bin/ngrok"

# Check if ngrok exists
if ! command -v "$NGROK_BIN" &> /dev/null; then
  echo "❌ ngrok not found at $NGROK_BIN"
  echo "   Install: curl -sSL https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-arm64.zip -o /tmp/ngrok.zip && unzip -o /tmp/ngrok.zip -d ~/bin"
  exit 1
fi

echo "🚀 Starting ngrok tunnel on port 3000..."
$NGROK_BIN http 3000 --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 3

# Get the public URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import sys,json; tunnels=json.load(sys.stdin)['tunnels']; print(next(t['public_url'] for t in tunnels if t['public_url'].startswith('https')))" 2>/dev/null)

if [ -z "$NGROK_URL" ]; then
  echo "❌ Failed to get ngrok URL. Check if you need to authenticate: ~/bin/ngrok config add-authtoken YOUR_TOKEN"
  kill $NGROK_PID 2>/dev/null
  exit 1
fi

echo "✅ ngrok tunnel active: $NGROK_URL"
echo "📡 Webhook URL: ${NGROK_URL}/api/pluggy/webhook"
echo ""
echo "Setting PLUGGY_WEBHOOK_URL in environment..."

# Export for the Next.js dev server
export PLUGGY_WEBHOOK_URL="$NGROK_URL"

echo ""
echo "🔥 Starting Next.js dev server..."
echo "   Ctrl+C to stop both ngrok and Next.js"
echo ""

# Cleanup on exit
cleanup() {
  echo ""
  echo "🛑 Shutting down..."
  kill $NGROK_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

# Start Next.js with the webhook URL set
PLUGGY_WEBHOOK_URL="$NGROK_URL" npm run dev
