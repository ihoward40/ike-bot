#!/bin/bash

# IKE BOT Setup Script
# This script helps you set up the IKE BOT Trust Navigator API

set -e

echo "========================================="
echo "  IKE BOT - Trust Navigator Setup"
echo "========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit the .env file and add your Supabase credentials:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Build the project
echo "🔨 Building the project..."
npm run build
echo "✅ Project built successfully"
echo ""

echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Edit .env with your Supabase credentials"
echo "2. Set up the database using the migration files in supabase/migrations/"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Run 'npm test' to run the test suite"
echo ""
echo "For more information, see README.md"
echo ""
