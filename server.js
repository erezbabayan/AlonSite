// Minimal dependency-free static file server + JSON API for candle-lighting
// data. Replaces the old localStorage-only candle list (which only the
// lighting visitor's own browser could see) with a server-side JSON file
// shared by every visitor. Run with: node server.js
"use strict";

var http = require("http");
var fs = require("fs");
var path = require("path");

var DEFAULT_PORT = 8420;
var PORT = process.env.PORT || DEFAULT_PORT;
var ROOT = __dirname;
var CANDLES_FILE = path.join(ROOT, "data", "candles.json");

var MAX_CANDLE_BODY_BYTES = 10000; // guards the POST /api/candles request body
var CANDLE_NAME_MAX_LENGTH = 200;
var CANDLE_MESSAGE_MAX_LENGTH = 2000;

var MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function readCandles() {
  try {
    var raw = JSON.parse(fs.readFileSync(CANDLES_FILE, "utf8"));
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    return [];
  }
}

function writeCandles(candles) {
  fs.mkdirSync(path.dirname(CANDLES_FILE), { recursive: true });
  fs.writeFileSync(CANDLES_FILE, JSON.stringify(candles, null, 2));
}

function sendJson(res, status, body) {
  var data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(data),
  });
  res.end(data);
}

function handleGetCandles(req, res) {
  sendJson(res, 200, readCandles());
}

function handlePostCandle(req, res) {
  var chunks = [];
  var size = 0;
  req.on("data", function (chunk) {
    size += chunk.length;
    if (size > MAX_CANDLE_BODY_BYTES) {
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on("end", function () {
    var body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch (e) {
      sendJson(res, 400, { error: "invalid json" });
      return;
    }
    var name = typeof body.name === "string" ? body.name.trim().slice(0, CANDLE_NAME_MAX_LENGTH) : "";
    var message = typeof body.message === "string" ? body.message.trim().slice(0, CANDLE_MESSAGE_MAX_LENGTH) : "";
    if (!name) {
      sendJson(res, 400, { error: "name is required" });
      return;
    }
    var candles = readCandles();
    var entry = { name: name, message: message, date: new Date().toISOString() };
    candles.push(entry);
    writeCandles(candles);
    sendJson(res, 201, entry);
  });
}

function serveStaticFile(req, res) {
  var urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/AlonSite/index.html";
  var filePath = path.normalize(path.join(ROOT, urlPath));

  // Guard against path traversal outside the site root.
  if (filePath.indexOf(ROOT) !== 0) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, function (err, stats) {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    var ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });
}

var server = http.createServer(function (req, res) {
  if (req.url.split("?")[0] === "/api/candles") {
    if (req.method === "GET") return handleGetCandles(req, res);
    if (req.method === "POST") return handlePostCandle(req, res);
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method not allowed");
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method not allowed");
    return;
  }
  serveStaticFile(req, res);
});

server.listen(PORT, function () {
  console.log("Server running at http://localhost:" + PORT);
});
