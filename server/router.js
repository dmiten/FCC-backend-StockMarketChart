"use strict";

import { model } from "./model";

export default function router(app) {

  app.post("/api/add", (req, res, next) => { // ◄-------------------------------

    model.addSymbol(req.body.symbol)
    .then(result => {
      let message = "ok";
      if (!result) {
        message = "symbol not resolved";
      }
      res.json({ message: message });
    });
  });

  app.post("/api/remove", (req, res, next) => { // ◄----------------------------
    model.removeSymbol(req.body.symbol);
    res.json({ message: "ok" });
  });

};