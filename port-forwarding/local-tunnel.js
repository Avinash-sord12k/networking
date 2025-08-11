// local-tunnel.js - Runs on your local machine
import net from 'net';

const REMOTE_HOST = '3.108.237.5';
const TUNNEL_PORT = 4001;  // Port for tunnel connection to remote server

const LOCAL_HOST = 'localhost';
const LOCAL_PORT = 3000;   // Your local service port (mock-server)

function connectToRemote() {
  console.log(`Connecting to remote tunnel server at ${REMOTE_HOST}:${TUNNEL_PORT}`);
  
  const tunnelSocket = net.createConnection(TUNNEL_PORT, REMOTE_HOST, () => {
    console.log('Connected to remote tunnel server');
    console.log(`Tunneling ${REMOTE_HOST}:4000 -> localhost:${LOCAL_PORT}`);
    
    // Connect to local service immediately
    const localSocket = net.createConnection(LOCAL_PORT, LOCAL_HOST, () => {
      console.log('Connected to local service');
      
      // Simple bidirectional pipe - much more reliable
      tunnelSocket.pipe(localSocket);
      localSocket.pipe(tunnelSocket);
    });
    
    localSocket.on('error', (err) => {
      console.error('Local socket error:', err);
      tunnelSocket.end();
    });
    
    localSocket.on('close', () => {
      console.log('Local socket closed');
      tunnelSocket.end();
    });
  });

  tunnelSocket.on('close', () => {
    console.log('Tunnel connection closed. Reconnecting in 5 seconds...');
    setTimeout(connectToRemote, 5000);
  });

  tunnelSocket.on('error', (err) => {
    console.error('Tunnel socket error:', err);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectToRemote, 5000);
  });
}

// Start the tunnel
connectToRemote();