#!/bin/bash

echo "🔍 Testing PSA Diagnostic Setup..."
echo ""

# Test 1: Check if venv exists
echo "1️⃣  Checking virtual environment..."
if [ -d "../venv" ] || [ -d "venv" ]; then
    echo "   ✅ Virtual environment found"
else
    echo "   ❌ Virtual environment not found"
    exit 1
fi

# Test 2: Check if dependencies are installed
echo ""
echo "2️⃣  Checking Python dependencies..."
cd "$(dirname "$0")/backend"
source ../venv/bin/activate

if python -c "import flask" 2>/dev/null; then
    echo "   ✅ Flask installed"
else
    echo "   ❌ Flask not installed"
fi

if python -c "import flask_cors" 2>/dev/null; then
    echo "   ✅ Flask-CORS installed"
else
    echo "   ❌ Flask-CORS not installed (run: pip install -r requirements.txt)"
fi

if python -c "import openai" 2>/dev/null; then
    echo "   ✅ OpenAI SDK installed"
else
    echo "   ❌ OpenAI SDK not installed"
fi

if python -c "import dotenv" 2>/dev/null; then
    echo "   ✅ python-dotenv installed"
else
    echo "   ❌ python-dotenv not installed"
fi

# Test 3: Check .env file
echo ""
echo "3️⃣  Checking environment configuration..."
if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
    if grep -q "your-api-key-here" .env; then
        echo "   ⚠️  Warning: API key not set (still has placeholder)"
    else
        echo "   ✅ API key appears to be set"
    fi
else
    echo "   ❌ .env file not found"
    echo "   💡 Create one: cp env_template.txt .env"
fi

# Test 4: Check if port 5001 is free
echo ""
echo "4️⃣  Checking if port 5001 is available..."
if lsof -ti:5001 >/dev/null 2>&1; then
    PID=$(lsof -ti:5001)
    echo "   ⚠️  Port 5001 is already in use (PID: $PID)"
    echo "   💡 Run: kill -9 $PID"
else
    echo "   ✅ Port 5001 is available"
fi

# Test 5: Check frontend setup
echo ""
echo "5️⃣  Checking frontend..."
cd ../frontend
if [ -d "node_modules" ]; then
    echo "   ✅ Frontend dependencies installed"
else
    echo "   ⚠️  Frontend dependencies not installed"
    echo "   💡 Run: npm install"
fi

if [ -f "vite.config.js" ]; then
    if grep -q "localhost:5001" vite.config.js; then
        echo "   ✅ Vite proxy configured correctly (port 5001)"
    else
        echo "   ⚠️  Vite proxy might be misconfigured"
    fi
fi

# Test 6: Check data files
echo ""
echo "6️⃣  Checking data files..."
DATA_DIR="../../Problem Statement 3 - Redefining Level 2 Product Ops copy"
if [ -f "$DATA_DIR/Knowledge Base.txt" ]; then
    echo "   ✅ Knowledge Base found"
else
    echo "   ❌ Knowledge Base not found"
fi

if [ -f "$DATA_DIR/Case Log.xlsx" ]; then
    echo "   ✅ Case Log found"
else
    echo "   ❌ Case Log not found"
fi

if [ -d "$DATA_DIR/Application Logs" ]; then
    LOG_COUNT=$(ls -1 "$DATA_DIR/Application Logs"/*.log 2>/dev/null | wc -l)
    echo "   ✅ Application logs found ($LOG_COUNT files)"
else
    echo "   ❌ Application logs directory not found"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Setup Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "If all checks passed, you can start the application:"
echo ""
echo "  Terminal 1: ./start_backend.sh"
echo "  Terminal 2: ./start_frontend.sh"
echo ""
echo "Then open: http://localhost:5173"
echo ""

