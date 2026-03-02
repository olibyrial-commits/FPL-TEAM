#!/bin/bash

# Kill any existing processes on ports 8000 and 3000
echo "🧹 Cleaning up any existing processes..."
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
sleep 1

# Function to handle cleanup
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    jobs -p | xargs -r kill 2>/dev/null || true
    pkill -f "uvicorn app.main" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    exit 0
}

# Set trap for cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

echo "🚀 Starting FPL Optimizer development environment..."
echo ""

# Start backend in background
cd backend
echo "🔵 Starting backend on http://localhost:8000..."
python3 -m uvicorn app.main:app --reload --port 8000 2>&1 | while read line; do
    echo "🔵 BACKEND | $line"
done &
BACKEND_PID=$!

# Start frontend in background
cd ../frontend
echo "🟢 Starting frontend on http://localhost:3000..."
npm run dev 2>&1 | while read line; do
    echo "🟢 FRONTEND | $line"
done &
FRONTEND_PID=$!

cd ..

echo ""
echo "✅ Both services started!"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for both background processes
wait $BACKEND_PID $FRONTEND_PID
