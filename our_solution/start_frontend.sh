#!/bin/bash

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start Vite dev server
echo "🚀 Starting Vite dev server on port 5173..."
npm run dev

