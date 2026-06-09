#!/usr/bin/env bash
# Local dev server with clean shutdown on Ctrl+C

trap 'echo ""; echo "Shutting down..."; kill $DEV_PID 2>/dev/null; wait $DEV_PID 2>/dev/null; echo "Server stopped."; exit 0' INT TERM

# Delete Next.js cache for a clean start
rm -rf .next
echo "Cleared .next cache."

npx next dev &
DEV_PID=$!

echo ""
echo "Dev server running (PID $DEV_PID). Press Ctrl+C to stop."
echo ""

wait $DEV_PID
