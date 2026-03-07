import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, writeFile } from "fs/promises";

const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  console.log("writing start.cjs proxy...");
  const startScript = `"use strict";
var http = require("http");
var fork = require("child_process").fork;
var path = require("path");

var port = parseInt(process.env.PORT || "5000", 10);
var childReady = false;
var childPort = 5001;

var server = http.createServer(function(req, res) {
  if (!childReady) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }
  var opts = {
    hostname: "127.0.0.1",
    port: childPort,
    path: req.url,
    method: req.method,
    headers: req.headers
  };
  var proxy = http.request(opts, function(proxyRes) {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  proxy.on("error", function() {
    if (!res.headersSent) {
      res.writeHead(502);
      res.end("Bad Gateway");
    }
  });
  req.pipe(proxy, { end: true });
});

server.listen(port, "0.0.0.0", function() {
  console.log("Proxy server ready on port " + port);
  var child = fork(path.join(__dirname, "index.cjs"), [], {
    env: Object.assign({}, process.env, { PORT: String(port) }),
    stdio: ["inherit", "inherit", "inherit", "ipc"]
  });
  child.on("message", function(msg) {
    if (msg && msg.type === "ready") {
      childPort = msg.port || 5001;
      childReady = true;
      console.log("Main app ready on port " + childPort + ", proxying traffic");
    }
  });
  child.on("exit", function(code) {
    console.error("Child process exited with code " + code);
    process.exit(code || 1);
  });
});
`;
  await writeFile("dist/start.cjs", startScript);
  console.log("wrote dist/start.cjs");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
