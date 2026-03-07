const http = require("http");
const { fork } = require("child_process");
const path = require("path");

const PORT = parseInt(process.env.PORT || "5000", 10);
const CHILD_PORT = PORT + 1;

let childReady = false;

const placeholder = http.createServer((req, res) => {
  if (!childReady) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }
  const opts = {
    hostname: "127.0.0.1",
    port: CHILD_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  const proxy = http.request(opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  proxy.on("error", () => {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end("Bad Gateway");
  });
  req.pipe(proxy, { end: true });
});

placeholder.listen(PORT, "0.0.0.0", () => {
  console.log(`Boot proxy listening on port ${PORT}`);

  const child = fork(path.join(__dirname, "index.cjs"), [], {
    env: { ...process.env, CHILD_PORT: String(CHILD_PORT), PORT: String(CHILD_PORT) },
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  });

  child.on("message", (msg) => {
    if (msg && msg.type === "ready") {
      childReady = true;
      console.log(`Child app ready on port ${msg.port}, proxying traffic`);
    }
  });

  child.on("exit", (code) => {
    console.error(`Child process exited with code ${code}`);
    process.exit(code || 1);
  });
});
