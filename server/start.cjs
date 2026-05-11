'use strict';
/**
 * Fast-boot entry point for production deployment.
 *
 * Opens port 5000 within milliseconds of process start so Replit's health
 * checker gets 200 OK immediately. The real Express app (index-server.cjs)
 * runs in a forked child process on MAIN_PORT+1. Once the child signals
 * "ready" via IPC, all traffic is proxied to it.
 *
 * If the child crashes, it is automatically restarted (up to MAX_RESTARTS).
 * Port 5000 stays open the entire time, returning 200 during restart gaps.
 *
 * Run: node ./dist/start.cjs
 * No --require flags needed.
 */

const http    = require('http');
const { fork }    = require('child_process');
const { connect } = require('net');
const { join }    = require('path');

const MAIN_PORT    = parseInt(process.env.PORT || '5000', 10);
const CHILD_PORT   = MAIN_PORT + 1;
const MAX_RESTARTS = 10;
const RESTART_DELAY_MS = 2000;

// Re-use the server that preload.cjs already opened on MAIN_PORT (if any).
// This avoids any gap where the port is closed between Node interpreter
// startup and `server.listen()` here.
const preloadServer = global.__PRELOAD_SERVER || null;

// Hop-by-hop headers must not be forwarded by a proxy
const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'transfer-encoding', 'te',
  'trailer', 'trailers', 'upgrade', 'proxy-authorization',
  'proxy-authenticate', 'proxy-connection',
]);

let appReady      = false;
let currentChild  = null;
let restartCount  = 0;
let shuttingDown  = false;
let restartTimer  = null;

/* ------------------------------------------------------------------ */
/* Strip hop-by-hop headers from a headers object                      */
/* ------------------------------------------------------------------ */
function stripHopByHop(headers) {
  const result = {};
  for (const key of Object.keys(headers)) {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      result[key] = headers[key];
    }
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Proxy handlers                                                       */
/* ------------------------------------------------------------------ */
function handleRequest(req, res) {
  if (!appReady) {
    // Health-check endpoints get a tiny 200 so Replit's checker stays happy.
    // Browser requests get a self-refreshing splash so users don't sit on
    // a dead "Starting..." page during cold starts.
    const accept = String(req.headers['accept'] || '');
    const isBrowser = accept.includes('text/html');
    const body = isBrowser
      ? '<!DOCTYPE html><html><head><title>Starting NAMC NorCal Member Portal</title>'
        + '<meta http-equiv="refresh" content="3">'
        + '<style>body{font-family:system-ui,-apple-system,sans-serif;background:#0e1628;color:#f5f9fc;'
        + 'display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}'
        + '.box{max-width:420px;padding:2rem}h1{font-size:1.25rem;font-weight:500;margin:0 0 .75rem}'
        + 'p{color:#9aa5b1;margin:0;font-size:.9rem}.dot{display:inline-block;width:8px;height:8px;border-radius:50%;'
        + 'background:#FFD700;margin:0 3px;animation:pulse 1.4s infinite ease-in-out}'
        + '.dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}'
        + '@keyframes pulse{0%,80%,100%{opacity:.3}40%{opacity:1}}</style></head>'
        + '<body><div class="box"><h1>Waking up the portal'
        + '<span class="dot"></span><span class="dot"></span><span class="dot"></span></h1>'
        + '<p>This usually takes 10–20 seconds. The page will reload automatically.</p></div></body></html>'
      : '{"status":"starting"}';
    res.writeHead(200, {
      'Content-Type': isBrowser ? 'text/html' : 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'Cache-Control': 'no-store',
    });
    res.end(body);
    return;
  }

  const originalHost = req.headers['host'] || '';
  const forwardHeaders = Object.assign(stripHopByHop(req.headers), {
    'host': '127.0.0.1:' + CHILD_PORT,
    'x-forwarded-for': req.socket.remoteAddress || '',
    'x-forwarded-proto': 'https',
    'x-forwarded-host': req.headers['x-forwarded-host'] || originalHost,
  });

  const proxy = http.request(
    {
      hostname: '127.0.0.1',
      port: CHILD_PORT,
      path: req.url || '/',
      method: req.method,
      headers: forwardHeaders,
    },
    (proxyRes) => {
      const responseHeaders = stripHopByHop(proxyRes.headers);
      res.writeHead(proxyRes.statusCode || 200, responseHeaders);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxy.on('error', (err) => {
    console.error('[start] proxy error:', err.message);
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
    const requestLine = req.method + ' ' + req.url + ' HTTP/1.1\r\n';
    const headerLines = Object.entries(req.headers)
      .map(function(e) { return e[0] + ': ' + e[1]; })
      .join('\r\n');
    proxySocket.write(requestLine + headerLines + '\r\n\r\n');
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
let server;
if (preloadServer) {
  // Take over the server that preload.cjs already opened — port stays open continuously
  preloadServer.removeAllListeners('request');
  preloadServer.on('request', handleRequest);
  preloadServer.removeAllListeners('upgrade');
  preloadServer.on('upgrade', handleUpgrade);
  preloadServer.on('error', function(err) {
    console.error('[start] server error:', err.message);
  });
  server = preloadServer;
  console.log('[start] took over preload server on port ' + MAIN_PORT);
} else {
  server = http.createServer(handleRequest);
  server.on('upgrade', handleUpgrade);
  server.on('error', function(err) {
    console.error('[start] server error:', err.message);
  });
  server.listen(MAIN_PORT, '0.0.0.0', function() {
    console.log('[start] placeholder ready on port ' + MAIN_PORT);
  });
}

/* ------------------------------------------------------------------ */
/* Fork / restart the real Express app                                  */
/* ------------------------------------------------------------------ */
function startChild() {
  if (shuttingDown) return;
  appReady = false;

  const child = fork(join(__dirname, 'index-server.cjs'), [], {
    env: Object.assign({}, process.env, { PORT: String(CHILD_PORT), NAMC_IS_CHILD: '1' }),
    stdio: 'inherit',
    // Drop parent's --require ./preload.cjs so the child does NOT try to
    // re-open the placeholder port (which would EADDRINUSE on CHILD_PORT).
    execArgv: [],
  });

  currentChild = child;

  child.on('message', function(msg) {
    if (msg === 'ready') {
      appReady = true;
      restartCount = 0;
      console.log('[start] main app ready, proxying to :' + CHILD_PORT);
    }
  });

  child.on('error', function(err) {
    console.error('[start] child error:', err.message);
  });

  child.on('exit', function(code, signal) {
    if (shuttingDown || signal === 'SIGTERM' || signal === 'SIGINT') {
      process.exit(0);
    }

    console.error('[start] child exited code=' + code + ' signal=' + signal);
    appReady = false;

    if (restartCount >= MAX_RESTARTS) {
      console.error('[start] too many restarts (' + MAX_RESTARTS + '), giving up');
      process.exit(1);
    }

    restartCount++;
    console.log('[start] restarting child in ' + RESTART_DELAY_MS + 'ms (attempt ' + restartCount + '/' + MAX_RESTARTS + ')');
    if (restartTimer) clearTimeout(restartTimer);
    restartTimer = setTimeout(function() { restartTimer = null; startChild(); }, RESTART_DELAY_MS);
  });
}

startChild();

/* ------------------------------------------------------------------ */
/* Graceful shutdown                                                    */
/* ------------------------------------------------------------------ */
function shutdown(signal) {
  shuttingDown = true;
  if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; }
  if (currentChild) currentChild.kill(signal);
  if (server) server.close();
}
process.on('SIGTERM', function() { shutdown('SIGTERM'); });
process.on('SIGINT',  function() { shutdown('SIGINT');  });
