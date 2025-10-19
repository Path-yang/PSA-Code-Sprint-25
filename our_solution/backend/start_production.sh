#!/bin/bash
# Production server startup script with Gunicorn
# Supports multiple concurrent requests with better performance

set -e

echo "🚀 Starting Production Flask Server with Gunicorn"
echo "=================================================="

# Check if gunicorn is installed
if ! command -v gunicorn &> /dev/null; then
    echo "⚠️  Gunicorn not found. Installing..."
    pip install gunicorn
fi

# Configuration
HOST="${FLASK_HOST:-0.0.0.0}"
PORT="${FLASK_PORT:-5000}"
WORKERS="${WORKERS:-4}"  # Number of worker processes
THREADS="${THREADS:-2}"  # Threads per worker
TIMEOUT="${TIMEOUT:-120}"  # Request timeout (120s for GPT calls)

echo "Configuration:"
echo "  Host: $HOST"
echo "  Port: $PORT"
echo "  Workers: $WORKERS (processes)"
echo "  Threads per worker: $THREADS"
echo "  Timeout: ${TIMEOUT}s"
echo "  Total concurrent requests: $((WORKERS * THREADS))"
echo ""
echo "Starting server..."

# Start Gunicorn
gunicorn \
    --bind "$HOST:$PORT" \
    --workers "$WORKERS" \
    --threads "$THREADS" \
    --timeout "$TIMEOUT" \
    --worker-class gthread \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    "webapp:app"

echo ""
echo "Server stopped."

