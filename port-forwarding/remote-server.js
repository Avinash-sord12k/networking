// remote-server.js - Runs on your VM (3.108.237.5)
import net from 'net';

const PUBLIC_PORT = 4000; // Port exposed publicly for external clients
const TUNNEL_PORT = 4001; // Port for tunnel connections from local machine

let tunnelSocket = null;
const pendingClients = [];

// Server for tunnel connections from local machine
const tunnelServer = net.createServer(socket => {
  console.log('Tunnel client connected from local machine');
  tunnelSocket = socket;
  
  // Process any pending client connections
  while (pendingClients.length > 0) {
    const clientSocket = pendingClients.shift();
    forwardToTunnel(clientSocket);
  }
  
  socket.on('close', () => {
    console.log('Tunnel connection closed');
    tunnelSocket = null;
  });
  
  socket.on('error', (err) => {
    console.error('Tunnel socket error:', err);
    tunnelSocket = null;
  });
});

// Server for external client connections
const publicServer = net.createServer(clientSocket => {
  console.log('External client connected');
  
  if (tunnelSocket) {
    forwardToTunnel(clientSocket);
  } else {
    console.log('No tunnel available, queuing client');
    pendingClients.push(clientSocket);
    
    // Timeout after 30 seconds if no tunnel
    setTimeout(() => {
      const index = pendingClients.indexOf(clientSocket);
      if (index > -1) {
        pendingClients.splice(index, 1);
        clientSocket.end();
      }
    }, 30000);
  }
});

function forwardToTunnel(clientSocket) {
  if (!tunnelSocket) {
    clientSocket.end();
    return;
  }
  
  console.log('Forwarding client to tunnel');
  
  // Create a unique connection ID
  const connectionId = Math.random().toString(36).substr(2, 9);
  
  // Send connection start signal
  tunnelSocket.write(`CONNECT:${connectionId}\n`);
  
  // Forward data from client to tunnel
  clientSocket.on('data', (data) => {
    if (tunnelSocket) {
      tunnelSocket.write(`DATA:${connectionId}:${data.length}\n`);
      tunnelSocket.write(data);
    }
  });
  
  // Handle client disconnect
  clientSocket.on('close', () => {
    console.log('Client disconnected');
    if (tunnelSocket) {
      tunnelSocket.write(`CLOSE:${connectionId}\n`);
    }
  });
  
  clientSocket.on('error', (err) => {
    console.error('Client socket error:', err);
    if (tunnelSocket) {
      tunnelSocket.write(`CLOSE:${connectionId}\n`);
    }
  });
  
  // Handle responses from tunnel back to client
  const handleTunnelData = (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.startsWith(`RESPONSE:${connectionId}:`)) {
        const responseData = line.substring(`RESPONSE:${connectionId}:`.length);
        clientSocket.write(responseData);
      } else if (line === `CLOSE:${connectionId}`) {
        clientSocket.end();
      }
    }
  };
  
  tunnelSocket.on('data', handleTunnelData);
  
  // Clean up listener when client disconnects
  clientSocket.on('close', () => {
    if (tunnelSocket) {
      tunnelSocket.removeListener('data', handleTunnelData);
    }
  });
}

tunnelServer.listen(TUNNEL_PORT, () => {
  console.log(`Tunnel server listening on port ${TUNNEL_PORT}`);
});

publicServer.listen(PUBLIC_PORT, () => {
  console.log(`Public server listening on port ${PUBLIC_PORT}`);
  console.log(`External clients can connect to: http://3.108.237.5:${PUBLIC_PORT}`);
});
