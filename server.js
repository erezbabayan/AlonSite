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
// Defaults to loopback-only: this server has no auth and will happily hand
// out any file under ROOT (see the dotfile guard below), so it shouldn't be
// reachable from other devices on the network by default. Set HOST=0.0.0.0
// (e.g. to test from a phone on the same wifi) only on a network you trust.
var HOST = process.env.HOST || "127.0.0.1";
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

// Node runs this single-threaded, but the read-modify-write below spans an
// await-free tick boundary (readCandles/writeCandles are sync, but the
// caller reaches here from an async "end" event), so two POSTs whose events
// land back-to-back can still interleave and the second write can clobber
// the first. This chain forces every append to wait for the previous one,
// matching the flock()-based locking api/candles.php already does.
var candleWriteQueue = Promise.resolve();

function appendCandle(entry) {
  candleWriteQueue = candleWriteQueue.then(function () {
    var candles = readCandles();
    candles.push(entry);
    writeCandles(candles);
  });
  return candleWriteQueue;
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
    var entry = { name: name, message: message, date: new Date().toISOString() };
    appendCandle(entry).then(function () {
      sendJson(res, 201, entry);
    });
  });
}

function serveStaticFile(req, res) {
  var urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/AlonSite/index.html";
  var filePath = path.normalize(path.join(ROOT, urlPath));

  // Guard against path traversal outside the site root. Compared with the
  // separator appended so a sibling directory that merely starts with the
  // same characters as ROOT (e.g. "AlonSite-backup") can't slip through a
  // bare indexOf(ROOT) === 0 prefix check.
  if (filePath !== ROOT && filePath.indexOf(ROOT + path.sep) !== 0) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // Dotfiles/dot-directories (.git, .env, .claude, ...) are never meant to
  // be public, regardless of MIME type — this server has no other access
  // control, so it must not hand out repo internals to anyone who requests
  // them by path.
  var segments = urlPath.split("/");
  if (segments.some(function (seg) { return seg.length > 1 && seg[0] === "."; })) {
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
    var contentType = MIME_TYPES[ext] || "application/octet-stream";
    var range = req.headers.range;

    // Video/audio scrubbing relies on the browser being able to request
    // arbitrary byte ranges; without 206 support, seeking is limited to
    // whatever has already downloaded.
    if (range) {
      var match = /^bytes=(\d*)-(\d*)$/.exec(range);
      var start = match && match[1] ? parseInt(match[1], 10) : 0;
      var end = match && match[2] ? parseInt(match[2], 10) : stats.size - 1;
      if (!match || start > end || end >= stats.size) {
        res.writeHead(416, { "Content-Range": "bytes */" + stats.size });
        res.end();
        return;
      }
      res.writeHead(206, {
        "Content-Type": contentType,
        "Content-Length": end - start + 1,
        "Content-Range": "bytes " + start + "-" + end + "/" + stats.size,
        "Accept-Ranges": "bytes",
      });
      fs.createReadStream(filePath, { start: start, end: end }).pipe(res);
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stats.size,
      "Accept-Ranges": "bytes",
    });
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

server.listen(PORT, HOST, function () {
  console.log("Server running at http://" + HOST + ":" + PORT);
});
