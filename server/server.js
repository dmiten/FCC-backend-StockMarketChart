"use strict";

import bodyParser from "body-parser";
import compression from "compression";
import express from "express";
import expressWinston from "express-winston";
import helmet from "helmet";
import http from "http";
import https from "https";
import winston from "winston";

// ▼--------------- { cert: cert.pem, key: key.pem } for HTTPS or falsy for HTTP
import { getCredentials } from "./.data/credentials";
import { createSocketServer } from "./socketserver";

import router from "./router";

import { model } from "./model";

function getWinston() {
  let winstonOptions = {
        colorize: true,
        json: false,
        timestamp: () => {
          let date = new Date(Date.now());
          return date.toLocaleString() + "." + date.getUTCMilliseconds();
        }
      };
  return new winston.Logger({
    transports: [new winston.transports.Console(winstonOptions)]
  });
}

export function serverLog(type, message) { // ◄---------------------------------
  getWinston()[type](message);
}

export function serverStart() {
  model.init();
  getCredentials()
  .then(result => serverApp(result));
}

export function serverApp(credentials) { // ◄-----------------------------------

  let app = express(),
      httpApp,
      server;

  app.use(helmet());
  app.use(expressWinston.logger({
    expressFormat: true,
    meta: false,
    msg: "HTTP(s) {{ req.method }} {{ req.url }}",
    transports: [getWinston()]
  }));
  app.use(compression());

  app.use("/", express.static("./public/"));

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  router(app);

  if (credentials) {

    httpApp = express();
    app.set("port", process.env.PORT || 8443);
    httpApp.set("port", process.env.PORT || 8080);
    httpApp.set(helmet());

    httpApp.get("*", (req, res, next) => {
      res.redirect("https://" + req.hostname +":" + app.get("port") + req.url);
      serverLog("info", "serverApp - redirected to HTTPS");
    });

    http.createServer(httpApp)
    .listen(httpApp.get("port"), () => {
      serverLog("info", "serverApp - express HTTP server listening on port " +
          httpApp.get("port"));
    });

    server = https.createServer(credentials, app);

    server.listen(app.get("port"), () => {
      serverLog("info", "serverApp - express HTTPS server listening on port " +
          app.get("port"));
    });

  } else {

    app.set("port", process.env.PORT || 8080);

    server = http.createServer(app);

    server.listen(app.get("port"), () => {
      serverLog("info", "serverApp - express HTTP server listening on port " +
          app.get("port"));
    });
  }

  createSocketServer(server);

  app.use(expressWinston.errorLogger({
    transports: [
      new winston.transports.Console({
        json: true,
        colorize: true
      })
    ]
  }));

  app.use((req, res, next) => {
    res.status(404).send("Wrong address used.");
  });

  app.use((err, req, res, next) => {
    res.status(500).send("Internal server error.");
  });

}