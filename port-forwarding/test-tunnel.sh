#!/bin/bash
# Script to test the tunnel setup

echo "Testing reverse tunnel setup..."
echo ""

# Test local mock server directly
echo "1. Testing local mock server directly:"
curl -s http://localhost:3000/test 2>/dev/null && echo " ✓ Local server responding" || echo " ✗ Local server not responding"
echo ""

# Test through the tunnel (assuming remote server is running)
echo "2. Testing through tunnel (via remote VM):"
curl -s http://3.108.237.5:4000/test 2>/dev/null && echo " ✓ Tunnel working!" || echo " ✗ Tunnel not working (check if remote server is running)"
echo ""

echo "If the tunnel test fails, make sure:"
echo "- Remote server is running on 3.108.237.5"
echo "- Local tunnel client is connected"
echo "- Firewall allows connections to ports 4000 and 4001 on the VM"