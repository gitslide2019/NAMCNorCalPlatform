const { Worker, isMainThread, parentPort } = require("worker_threads");

if (isMainThread) {
  const worker = new Worker(__filename);
  global.__bootWorker = worker;
  worker.on("message", (msg) => {
    if (msg === "listening") {
      console.log("Health worker ready on port " + (process.env.PORT || "5000"));
    }
  });
} else {
  const http = require("http");
  const port = parseInt(process.env.PORT || "5000", 10);
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  });
  server.listen(port, "0.0.0.0", () => {
    parentPort.postMessage("listening");
  });
  parentPort.on("message", (msg) => {
    if (msg === "shutdown") {
      server.close(() => {
        parentPort.postMessage("closed");
        process.exit(0);
      });
    }
  });
}
