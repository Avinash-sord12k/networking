#!/bin/bash
# Script to start the remote server (run this on your VM at 3.108.237.5)

echo "Starting remote server on VM..."
echo "This will:"
echo "- Listen on port 4000 for external clients"
echo "- Listen on port 4001 for tunnel connections from local machine"
echo ""

node remote-server.js