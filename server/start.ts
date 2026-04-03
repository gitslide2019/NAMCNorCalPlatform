import { createServer, request as httpRequest, IncomingMessage, ServerResponse } from "http";
import { fork } from "child_process";
import { connect } from "net";
import { join } from "path";

const MAIN_PORT = parseInt(process.env.PORT || "5000", 10);
const CHILD_PORT = 5001;

let appReady = false;

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
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
});

server.on("upgrade", (req, socket, head) => {
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
});

server.listen(MAIN_PORT, "0.0.0.0", () => {
  console.log(`[start] placeholder ready on port ${MAIN_PORT}`);
});

const child = fork(join(__dirname, "index-server.cjs"), [], {
  env: { ...process.env, PORT: String(CHILD_PORT) },
  stdio: "inherit",
});

child.on("message", (msg: unknown) => {
  if (msg === "ready") {
    appReady = true;
    console.log(`[start] main app ready, proxying to :${CHILD_PORT}`);
  }
});

child.on("exit", (code) => {
  console.error(`[start] child exited with code ${code}`);
  process.exit(code ?? 1);
});

process.on("SIGTERM", () => {
  child.kill("SIGTERM");
  server.close();
});
