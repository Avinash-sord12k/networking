#!/bin/bash
# Script to start the local components (run this on your local machine)

echo "Starting reverse tunnel setup on local machine..."

# Function to cleanup background processes
cleanup() {
    echo "Cleaning up..."
    kill $MOCK_SERVER_PID $TUNNEL_PID 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Start the mock server
echo "Starting mock server on port 3000..."
cd mock-server
npm install 2>/dev/null || echo "Dependencies already installed"
node main.js &
MOCK_SERVER_PID=$!
cd ..

# Wait a moment for mock server to start
sleep 2

# Start the tunnel client
echo "Starting tunnel client..."
node local-tunnel.js &
TUNNEL_PID=$!

echo ""
echo "Local setup complete!"
echo "- Mock server running on localhost:3000"
echo "- Tunnel client connecting to 3.108.237.5:4001"
echo ""
echo "Once the remote server is running, external clients can access:"
echo "http://3.108.237.5:4000 -> localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait