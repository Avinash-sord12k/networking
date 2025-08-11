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
  
  // Simple approach: Just pipe the sockets directly
  // This avoids all the complex protocol issues
  clientSocket.pipe(tunnelSocket, { end: false });
  tunnelSocket.pipe(clientSocket, { end: false });
  
  // Handle client disconnect
  clientSocket.on('close', () => {
    console.log('Client disconnected');
    clientSocket.unpipe(tunnelSocket);
    tunnelSocket.unpipe(clientSocket);
  });
  
  clientSocket.on('error', (err) => {
    console.error('Client socket error:', err);
    clientSocket.unpipe(tunnelSocket);
    tunnelSocket.unpipe(clientSocket);
  });
}

tunnelServer.listen(TUNNEL_PORT, () => {
  console.log(`Tunnel server listening on port ${TUNNEL_PORT}`);
});

publicServer.listen(PUBLIC_PORT, () => {
  console.log(`Public server listening on port ${PUBLIC_PORT}`);
  console.log(`External clients can connect to: http://3.108.237.5:${PUBLIC_PORT}`);
});
