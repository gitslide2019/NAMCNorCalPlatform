import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, copyFile, writeFile } from "fs/promises";

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

  console.log("building main app (dist/index-server.cjs)...");
  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index-server.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  console.log("copying fast-boot proxy (dist/start.cjs) + preload (dist/preload.cjs)...");
  await copyFile("server/start.cjs", "dist/start.cjs");
  await copyFile("server/preload.cjs", "dist/preload.cjs");

  // dist/index.cjs exists so "npm start" (node dist/index.cjs) still works.
  // It loads preload first to open port 5000 within ~20ms of process start,
  // then start.cjs takes over the same server and proxies to the forked child.
  await writeFile(
    "dist/index.cjs",
    "'use strict';\nrequire('./preload.cjs');\nrequire('./start.cjs');\n",
  );
  console.log("done — run command: node --require ./dist/preload.cjs ./dist/start.cjs  (or npm start)");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
