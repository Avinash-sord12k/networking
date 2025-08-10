import net from 'net';

const LOCAL_PORT = 8080;
const REMOTE_HOST = '3.108.237.5';
const REMOTE_PORT = 8080;

net.createServer(localSocket => {
  console.log(`Client connected from ${localSocket.remoteAddress}`);

  // Connect to the remote server
  const remoteSocket = net.createConnection(REMOTE_PORT, REMOTE_HOST);

  // Pipe data both ways
  localSocket.pipe(remoteSocket);
  remoteSocket.pipe(localSocket);

  localSocket.on('error', err => console.error('Local error:', err));
  remoteSocket.on('error', err => console.error('Remote error:', err));

}).listen(LOCAL_PORT, () => {
  console.log(`TCP forwarder listening on port ${LOCAL_PORT}`);
});
