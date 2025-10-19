#!/bin/bash

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Activate virtual environment
source ../venv/bin/activate

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo ""
    echo "Please create a .env file with your Azure OpenAI API key:"
    echo "  cp env_template.txt .env"
    echo "  nano .env  # Edit and add your API key"
    echo ""
    exit 1
fi

# Check if API key is set
if grep -q "your-api-key-here" .env; then
    echo "⚠️  Warning: It looks like you haven't set your Azure OpenAI API key yet!"
    echo "   Edit the .env file and replace 'your-api-key-here' with your actual key"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Start Flask server on port 5001
echo "🚀 Starting Flask backend on port 5001..."
python webapp.py --port 5001

