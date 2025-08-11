// local-tunnel.js - Runs on your local machine
import net from 'net';

const REMOTE_HOST = '3.108.237.5';
const TUNNEL_PORT = 4001;  // Port for tunnel connection to remote server

const LOCAL_HOST = 'localhost';
const LOCAL_PORT = 3000;   // Vite dev server port

const activeConnections = new Map();

function connectToRemote() {
  console.log(`Connecting to remote tunnel server at ${REMOTE_HOST}:${TUNNEL_PORT}`);
  
  const tunnelSocket = net.createConnection(TUNNEL_PORT, REMOTE_HOST, () => {
    console.log('Connected to remote tunnel server');
    console.log(`Tunneling ${REMOTE_HOST}:4000 -> localhost:${LOCAL_PORT}`);
  });

  // Handle multiplexed data from tunnel
  let buffer = Buffer.alloc(0);
  tunnelSocket.on('data', (data) => {
    buffer = Buffer.concat([buffer, data]);
    
    while (buffer.length > 0) {
      const newlineIndex = buffer.indexOf('\n');
      if (newlineIndex === -1) break;
      
      const line = buffer.slice(0, newlineIndex).toString();
      buffer = buffer.slice(newlineIndex + 1);
      
      if (line.startsWith('CONNECT:')) {
        const connectionId = line.substring(8);
        handleNewConnection(connectionId, tunnelSocket);
      } else if (line.startsWith('DATA:')) {
        const parts = line.split(':');
        const connectionId = parts[1];
        const dataLength = parseInt(parts[2]);
        
        if (buffer.length >= dataLength) {
          const requestData = buffer.slice(0, dataLength);
          buffer = buffer.slice(dataLength);
          
          const connection = activeConnections.get(connectionId);
          if (connection && connection.localSocket && !connection.localSocket.destroyed) {
            connection.localSocket.write(requestData);
          }
        } else {
          // Put the line back and wait for more data
          buffer = Buffer.concat([Buffer.from(line + '\n'), buffer]);
          break;
        }
      } else if (line.startsWith('CLOSE:')) {
        const connectionId = line.substring(6);
        closeConnection(connectionId);
      }
    }
  });

  tunnelSocket.on('close', () => {
    console.log('Tunnel connection closed. Reconnecting in 5 seconds...');
    // Close all active connections
    for (const [connectionId, connection] of activeConnections) {
      if (connection.localSocket) {
        connection.localSocket.end();
      }
    }
    activeConnections.clear();
    setTimeout(connectToRemote, 5000);
  });

  tunnelSocket.on('error', (err) => {
    console.error('Tunnel socket error:', err);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectToRemote, 5000);
  });
}

function handleNewConnection(connectionId, tunnelSocket) {
  console.log(`New connection: ${connectionId}`);
  
  // Connect to local service
  const localSocket = net.createConnection(LOCAL_PORT, LOCAL_HOST, () => {
    console.log(`Connected to local service for ${connectionId}`);
  });
  
  activeConnections.set(connectionId, { localSocket, tunnelSocket });
  
  // Forward responses from local service back to tunnel
  localSocket.on('data', (data) => {
    if (tunnelSocket && !tunnelSocket.destroyed) {
      const header = Buffer.concat([
        Buffer.from('RESPONSE:'),
        Buffer.from(connectionId),
        Buffer.from(':'),
        Buffer.from(data.length.toString()),
        Buffer.from('\n')
      ]);
      tunnelSocket.write(Buffer.concat([header, data]));
    }
  });
  
  localSocket.on('close', () => {
    console.log(`Local connection closed for ${connectionId}`);
    if (tunnelSocket && !tunnelSocket.destroyed) {
      tunnelSocket.write(`CLOSE:${connectionId}\n`);
    }
    activeConnections.delete(connectionId);
  });
  
  localSocket.on('error', (err) => {
    console.error(`Local socket error for ${connectionId}:`, err);
    if (tunnelSocket && !tunnelSocket.destroyed) {
      tunnelSocket.write(`CLOSE:${connectionId}\n`);
    }
    activeConnections.delete(connectionId);
  });
}

function closeConnection(connectionId) {
  const connection = activeConnections.get(connectionId);
  if (connection && connection.localSocket) {
    connection.localSocket.end();
  }
  activeConnections.delete(connectionId);
}

// Start the tunnel
connectToRemote();