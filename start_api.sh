#!/bin/bash
# Startup script for IKE Bot API servers

set -e

echo "🚀 Starting IKE Bot API Servers"
echo "================================"

# Create output directory if it doesn't exist
mkdir -p output

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Using .env.example as reference."
    if [ -f .env.example ]; then
        echo "📝 You can copy .env.example to .env and configure it."
    fi
fi

# Default to FastAPI server
SERVER_TYPE="${1:-fastapi}"

case "$SERVER_TYPE" in
    "fastapi")
        echo "🟢 Starting FastAPI server on port 8000..."
        python3 api_server.py
        ;;
    "flask")
        echo "🔵 Starting Flask server on port 5000..."
        python3 main.py
        ;;
    "both")
        echo "🟢 Starting FastAPI server on port 8000..."
        echo "🔵 Starting Flask server on port 5000..."
        echo ""
        echo "⚠️  Running both servers requires two terminals:"
        echo "   Terminal 1: ./start_api.sh fastapi"
        echo "   Terminal 2: ./start_api.sh flask"
        echo ""
        echo "Or use a process manager like supervisor or pm2."
        exit 1
        ;;
    *)
        echo "❌ Unknown server type: $SERVER_TYPE"
        echo "Usage: ./start_api.sh [fastapi|flask|both]"
        exit 1
        ;;
esac
