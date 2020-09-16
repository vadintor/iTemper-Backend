import * as config from "./services/config";
import log from "./services/logger";

import express from "express";
import { Application } from "express";
import { initApp } from "./app";


import * as fs from "fs";
import * as https from "https";
import * as http from "http";
import * as WebSocket from "ws";

// DB Databases
import { userDBConnectionString, tenantDBConnectionString } from "./services/config";

import * as UserDatabase from "./features/user/user-database";
UserDatabase.initialize(userDBConnectionString);

import * as TenantDatabase from "./features/tenant/tenant-database";
TenantDatabase.initialize(tenantDBConnectionString);

// Create server

export const app = express();



function useHttps(app: Application) {
  const serverOptions: https.ServerOptions = {
    key: fs.readFileSync("./certs/server-cert.key"),
    cert: fs.readFileSync("./certs/server-cert.pem"),
  };
  log.info("server: Creating https web server");
  const server = https.createServer(serverOptions, app);
  return server;
}

function useHttp(app: Application) {
  log.info("server: Creating http web server");
  const server = http.createServer(app);
  return server;
}

// Use reverse proxy in production
// Need to run https in development to allow Web Bluetooth device requests
const server = config.PRODUCTION ? useHttp(app) : useHttps(app);

const wsOptions = { server, clientTracking: true, perMessageDeflate: false, path: "/ws" };
const wss = new WebSocket.Server(wsOptions);

initApp(wss, app);

server.listen(config.PORT, () => {
  log.info(
    "server: web server listening at port " + config.PORT +
    " in " + app.get("env") + " mode");
});
