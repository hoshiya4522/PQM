#!/bin/bash

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "Stopping Past Question Manager..."
    kill $(jobs -p) 2>/dev/null
}

trap cleanup SIGINT SIGTERM EXIT

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Robust IP Detection
IP_ADDR="localhost"
if command -v python3 &>/dev/null; then
    IP_ADDR=$(python3 -c 'import socket; s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(("8.8.8.8", 80)); print(s.getsockname()[0]); s.close()' 2>/dev/null)
elif command -v hostname &>/dev/null && hostname -I &>/dev/null; then
    IP_ADDR=$(hostname -I | awk '{print $1}')
fi

[ -z "$IP_ADDR" ] && IP_ADDR="localhost"

echo "========================================"
echo "   Past Question Manager - Starting...  "
echo "========================================"

# Start Backend
echo "Starting Backend Server..."
cd "$DIR/server"
npm start &
SERVER_PID=$!

sleep 3

# Start Frontend
echo "Starting Frontend Client..."
cd "$DIR/client"
npm run dev -- --host & 
CLIENT_PID=$!

echo ""
echo "✅ App is running!"
echo "----------------------------------------"
echo "💻 Local:   http://localhost:5173"
echo "📱 LAN:     http://$IP_ADDR:5173"
echo "----------------------------------------"
echo "To access from your mobile:"
echo "1. Connect to the same WiFi."
echo "2. Open the 'LAN' link above in your phone's browser."
echo ""
echo "Press Ctrl+C to stop."

wait $SERVER_PID $CLIENT_PID
