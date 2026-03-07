const http = require("http");
const port = parseInt(process.env.PORT || "5000", 10);

const server = http.createServer((req, res) => {
  if (global.__expressApp) {
    global.__expressApp(req, res);
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Preload server listening on port ${port}`);
});

global.__httpServer = server;
