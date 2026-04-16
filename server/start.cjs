'use strict';
/**
 * Fast-boot entry point for production deployment.
 *
 * Opens port 5000 within milliseconds of process start so Replit's health
 * checker gets 200 OK immediately. The real Express app (index-server.cjs)
 * runs in a forked child process on MAIN_PORT+1. Once the child signals
 * "ready" via IPC, all traffic is proxied to it.
 *
 * Run: node ./dist/start.cjs
 * No --require flags needed.
 */

const http    = require('http');
const { fork }    = require('child_process');
const { connect } = require('net');
const { join }    = require('path');

const MAIN_PORT  = parseInt(process.env.PORT || '5000', 10);
const CHILD_PORT = MAIN_PORT + 1;

let appReady = false;

/* ------------------------------------------------------------------ */
/* Proxy handlers                                                       */
/* ------------------------------------------------------------------ */
function handleRequest(req, res) {
  if (!appReady) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  const proxy = http.request(
    {
      hostname: '127.0.0.1',
      port: CHILD_PORT,
      path: req.url || '/',
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxy.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(502);
      res.end('Bad Gateway');
    }
  });

  req.pipe(proxy, { end: true });
}

function handleUpgrade(req, socket, head) {
  if (!appReady) {
    socket.destroy();
    return;
  }
  const proxySocket = connect(CHILD_PORT, '127.0.0.1', () => {
    const headers =
      req.method + ' ' + req.url + ' HTTP/1.1\r\n' +
      Object.entries(req.headers).map(function(e) { return e[0] + ': ' + e[1]; }).join('\r\n') +
      '\r\n\r\n';
    proxySocket.write(headers);
    proxySocket.write(head);
    socket.pipe(proxySocket);
    proxySocket.pipe(socket);
  });
  proxySocket.on('error', function() { socket.destroy(); });
  socket.on('error', function() { proxySocket.destroy(); });
}

/* ------------------------------------------------------------------ */
/* Open public port IMMEDIATELY — event loop never blocked             */
/* ------------------------------------------------------------------ */
const server = http.createServer(handleRequest);
server.on('upgrade', handleUpgrade);

server.listen(MAIN_PORT, '0.0.0.0', function() {
  console.log('[start] placeholder ready on port ' + MAIN_PORT);
});

/* ------------------------------------------------------------------ */
/* Fork the real Express app in its own process                        */
/* ------------------------------------------------------------------ */
const child = fork(join(__dirname, 'index-server.cjs'), [], {
  env: Object.assign({}, process.env, { PORT: String(CHILD_PORT) }),
  stdio: 'inherit',
});

child.on('message', function(msg) {
  if (msg === 'ready') {
    appReady = true;
    console.log('[start] main app ready — proxying :' + MAIN_PORT + ' → :' + CHILD_PORT);
  }
});

child.on('exit', function(code, signal) {
  if (signal === 'SIGTERM' || signal === 'SIGINT') {
    process.exit(0);
  }
  console.error('[start] child exited code=' + code + ' signal=' + signal);
  process.exit(code != null ? code : 1);
});

/* ------------------------------------------------------------------ */
/* Graceful shutdown                                                    */
/* ------------------------------------------------------------------ */
process.on('SIGTERM', function() { child.kill('SIGTERM'); server.close(); });
process.on('SIGINT',  function() { child.kill('SIGINT');  server.close(); });
