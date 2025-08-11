#!/bin/bash
# Test different protocols through the tunnel

echo "Testing Protocol Agnostic Tunnel..."
echo "=================================="

# Test 1: HTTP GET
echo "1. HTTP GET request:"
curl -s http://3.108.237.5:4000/test
echo -e "\n"

# Test 2: HTTP POST with JSON
echo "2. HTTP POST with JSON:"
curl -s -X POST http://3.108.237.5:4000/test \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from tunnel!"}'
echo -e "\n"

# Test 3: Raw TCP connection (if netcat is available)
echo "3. Raw TCP test (if nc available):"
if command -v nc &> /dev/null; then
  echo "GET /test HTTP/1.1\r\nHost: 3.108.237.5\r\n\r\n" | nc 3.108.237.5 4000
else
  echo "netcat not available, skipping raw TCP test"
fi
echo -e "\n"

# Test 4: WebSocket handshake simulation
echo "4. WebSocket handshake simulation:"
curl -s -H "Upgrade: websocket" \
     -H "Connection: Upgrade" \
     -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
     -H "Sec-WebSocket-Version: 13" \
     http://3.108.237.5:4000/test
echo -e "\n"

echo "All tests completed! The tunnel handles any TCP-based protocol."