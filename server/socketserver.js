"use strict";

import Server from "socket.io";

import { serverLog } from "./server";
import { model } from "./model";

let io;

export function createSocketServer(server) { // ◄-------------------------------

  io = Server(server);

  serverLog("info", "createSocketServer - ok");

  io.on("connection", socket => {
    socket.emit("chartData", model.chartData);
    serverLog("info", "createSocketServer - emit on connection");
  });

}

export function emitStockData() { // ◄------------------------------------------
  io.emit("chartData", model.chartData);
  serverLog("info", "createSocketServer - emit new chartData");
}
