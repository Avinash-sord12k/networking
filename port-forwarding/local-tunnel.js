// local-tunnel.js
import net from 'net';

const REMOTE_HOST = 'your.remote.ip';
const REMOTE_PORT = 4000;  // remote port from above

const LOCAL_HOST = 'localhost';
const LOCAL_PORT = 3000;   // your React app port

// Connect to remote server
const remoteSocket = net.createConnection(REMOTE_PORT, REMOTE_HOST, () => {
  console.log('Connected to remote server');

  // Connect to local React app
  const localSocket = net.createConnection(LOCAL_PORT, LOCAL_HOST);

  // Pipe data both ways
  remoteSocket.pipe(localSocket);
  localSocket.pipe(remoteSocket);
});

remoteSocket.on('error', err => console.error('Remote socket error:', err));