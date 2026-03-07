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

  console.log("writing preload.cjs (worker thread health server)...");
  const preloadScript = `"use strict";
var workerThreads = require("worker_threads");
if (workerThreads.isMainThread) {
  var w = new workerThreads.Worker(__filename);
  w.unref();
  globalThis.__healthWorker = w;
} else {
  var http = require("http");
  var port = parseInt(process.env.PORT || "5000", 10);
  var server = http.createServer(function(req, res) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  });
  server.listen(port, "0.0.0.0", function() {
    console.log("Health worker ready on port " + port);
  });
  workerThreads.parentPort.on("message", function(msg) {
    if (msg === "stop") {
      server.close(function() {
        console.log("Health worker stopped");
        process.exit(0);
      });
    }
  });
}
`;
  await writeFile("dist/preload.cjs", preloadScript);
  console.log("wrote dist/preload.cjs");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
