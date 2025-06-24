const functions = require("firebase-functions");
const express = require("express");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, conf: { distDir: ".next" } });
const handle = app.getRequestHandler();

const server = express();

server.all("*", (req, res) => {
  return handle(req, res);
});

exports.nextApp = functions.https.onRequest(server);
