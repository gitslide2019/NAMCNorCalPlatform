'use strict';
// This file runs via --require BEFORE dist/start.cjs is parsed.
// Opening the port here means it is ready within ~20ms of process start,
// well before Replit's health checker fires its first probe.
//
// Defense-in-depth: skip if running inside a forked child (start.cjs sets
// NAMC_IS_CHILD=1 and clears execArgv on fork, but if --require leaks
// through some other path, this guard prevents an EADDRINUSE on the
// child's own port).
if (process.env.NAMC_IS_CHILD === '1') return;
const http = require('http');
const PORT = parseInt(process.env.PORT || '5000', 10);

const server = http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

server.listen(PORT, '0.0.0.0', function () {
  console.log('[preload] port ' + PORT + ' open (pre-boot placeholder)');
});

// Expose so dist/index.cjs (start proxy) can take over the same server
global.__PRELOAD_SERVER = server;
