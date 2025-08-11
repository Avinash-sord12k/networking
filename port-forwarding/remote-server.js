// remote-server.js - Runs on your VM (3.108.237.5)
import net from 'net';

const PUBLIC_PORT = 4000; // Port exposed publicly for external clients
const TUNNEL_PORT = 4001; // Port for tunnel connections from local machine

let tunnelSocket = null;
const pendingClients = [];

const activeClients = new Map();

// Server for tunnel connections from local machine
const tunnelServer = net.createServer(socket => {
  console.log('Tunnel client connected from local machine');
  tunnelSocket = socket;
  
  // Process any pending client connections
  while (pendingClients.length > 0) {
    const clientSocket = pendingClients.shift();
    forwardToTunnel(clientSocket);
  }
  
  // Handle responses from tunnel
  let buffer = Buffer.alloc(0);
  socket.on('data', (data) => {
    buffer = Buffer.concat([buffer, data]);
    
    while (buffer.length > 0) {
      const newlineIndex = buffer.indexOf('\n');
      if (newlineIndex === -1) break;
      
      const line = buffer.slice(0, newlineIndex).toString();
      buffer = buffer.slice(newlineIndex + 1);
      
      if (line.startsWith('RESPONSE:')) {
        const parts = line.split(':');
        const connectionId = parts[1];
        const dataLength = parseInt(parts[2]);
        
        if (buffer.length >= dataLength) {
          const responseData = buffer.slice(0, dataLength);
          buffer = buffer.slice(dataLength);
          
          // Find the client and send response
          for (const [clientSocket, id] of activeClients) {
            if (id === connectionId) {
              clientSocket.write(responseData);
              break;
            }
          }
        } else {
          // Put the line back and wait for more data
          buffer = Buffer.concat([Buffer.from(line + '\n'), buffer]);
          break;
        }
      } else if (line.startsWith('CLOSE:')) {
        const connectionId = line.substring(6);
        for (const [clientSocket, id] of activeClients) {
          if (id === connectionId) {
            clientSocket.end();
            activeClients.delete(clientSocket);
            break;
          }
        }
      }
    }
  });
  
  socket.on('close', () => {
    console.log('Tunnel connection closed');
    tunnelSocket = null;
    // Close all active clients
    for (const [clientSocket] of activeClients) {
      clientSocket.end();
    }
    activeClients.clear();
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
  
  // Create a unique connection ID for multiplexing
  const connectionId = Math.random().toString(36).substr(2, 9);
  
  // Send new connection signal
  const connectMsg = Buffer.concat([
    Buffer.from('CONNECT:'),
    Buffer.from(connectionId),
    Buffer.from('\n')
  ]);
  tunnelSocket.write(connectMsg);
  
  // Forward data from client to tunnel with connection ID
  clientSocket.on('data', (data) => {
    if (tunnelSocket && !tunnelSocket.destroyed) {
      const header = Buffer.concat([
        Buffer.from('DATA:'),
        Buffer.from(connectionId),
        Buffer.from(':'),
        Buffer.from(data.length.toString()),
        Buffer.from('\n')
      ]);
      tunnelSocket.write(Buffer.concat([header, data]));
    }
  });
  
  // Handle client disconnect
  clientSocket.on('close', () => {
    console.log(`Client ${connectionId} disconnected`);
    if (tunnelSocket && !tunnelSocket.destroyed) {
      tunnelSocket.write(`CLOSE:${connectionId}\n`);
    }
  });
  
  clientSocket.on('error', (err) => {
    console.error(`Client ${connectionId} error:`, err);
    if (tunnelSocket && !tunnelSocket.destroyed) {
      tunnelSocket.write(`CLOSE:${connectionId}\n`);
    }
  });
  
  // Store client for response handling
  clientSocket._connectionId = connectionId;
  activeClients.set(clientSocket, connectionId);
}

tunnelServer.listen(TUNNEL_PORT, () => {
  console.log(`Tunnel server listening on port ${TUNNEL_PORT}`);
});

publicServer.listen(PUBLIC_PORT, () => {
  console.log(`Public server listening on port ${PUBLIC_PORT}`);
  console.log(`External clients can connect to: http://3.108.237.5:${PUBLIC_PORT}`);
});
