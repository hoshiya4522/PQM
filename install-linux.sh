#!/bin/bash
echo "========================================"
echo "   PQM - Linux Installation"
echo "========================================"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "📦 Installing Backend dependencies..."
cd server && npm install

echo ""
echo "📦 Installing Frontend dependencies..."
cd ../client && npm install

echo ""
echo "✅ Installation complete!"
echo "🚀 To start the app, run: ./start.sh"
echo "========================================"