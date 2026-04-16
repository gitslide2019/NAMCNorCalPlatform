import { request as httpRequest, IncomingMessage, ServerResponse, Server } from "http";
import { fork } from "child_process";
import { connect } from "net";
import { join } from "path";

const MAIN_PORT = parseInt(process.env.PORT || "5000", 10);
const CHILD_PORT = MAIN_PORT + 1; // e.g. 5001

let appReady = false;

// -------------------------------------------------------------------
// Re-use the server that preload.cjs already opened on MAIN_PORT.
// This avoids any gap where the port is closed between preload and here.
// -------------------------------------------------------------------
const preloadServer: Server | undefined = (global as any).__PRELOAD_SERVER;

function handleRequest(req: IncomingMessage, res: ServerResponse) {
  if (!appReady) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }

  const proxy = httpRequest(
    {
      hostname: "127.0.0.1",
      port: CHILD_PORT,
      path: req.url || "/",
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode!, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxy.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(502);
      res.end("Bad Gateway");
    }
  });

  req.pipe(proxy, { end: true });
}

function handleUpgrade(req: IncomingMessage, socket: any, head: Buffer) {
  if (!appReady) {
    socket.destroy();
    return;
  }
  const proxySocket = connect(CHILD_PORT, "127.0.0.1", () => {
    const headers =
      `${req.method} ${req.url} HTTP/1.1\r\n` +
      Object.entries(req.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\r\n") +
      "\r\n\r\n";
    proxySocket.write(headers);
    proxySocket.write(head);
    socket.pipe(proxySocket);
    proxySocket.pipe(socket);
  });
  proxySocket.on("error", () => socket.destroy());
  socket.on("error", () => proxySocket.destroy());
}

if (preloadServer) {
  // Take over the server that preload.cjs already opened — port stays open continuously
  preloadServer.removeAllListeners("request");
  preloadServer.on("request", handleRequest);
  preloadServer.removeAllListeners("upgrade");
  preloadServer.on("upgrade", handleUpgrade);
  console.log(`[start] took over preload server on port ${MAIN_PORT}`);
} else {
  // Fallback: preload.cjs wasn't used, create and bind fresh
  const { createServer } = require("http");
  const server = createServer(handleRequest);
  server.on("upgrade", handleUpgrade);
  server.listen(MAIN_PORT, "0.0.0.0", () => {
    console.log(`[start] placeholder ready on port ${MAIN_PORT}`);
  });
}

// Fork the real app into a child process so the event loop here stays free
const child = fork(join(__dirname, "index-server.cjs"), [], {
  env: { ...process.env, PORT: String(CHILD_PORT) },
  stdio: "inherit",
});

child.on("message", (msg: unknown) => {
  if (msg === "ready") {
    appReady = true;
    console.log(`[start] main app ready — proxying :${MAIN_PORT} → :${CHILD_PORT}`);
  }
});

child.on("exit", (code, signal) => {
  if (signal === "SIGTERM" || signal === "SIGINT") {
    process.exit(0);
  }
  console.error(`[start] child exited with code ${code} signal ${signal}`);
  process.exit(code ?? 1);
});

process.on("SIGTERM", () => {
  child.kill("SIGTERM");
  if (preloadServer) preloadServer.close();
});

process.on("SIGINT", () => {
  child.kill("SIGINT");
  if (preloadServer) preloadServer.close();
});
