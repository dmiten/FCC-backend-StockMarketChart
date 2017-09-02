"use strict";

import axios from "axios";

import { serverLog } from "./server";
import { emitStockData } from "./socketserver";

export const model = {};

let now, year, month, date;

model.init = () => { // ◄-------------------------------------------------------

  now = new Date();
  year = now.getFullYear();
  month = now.getMonth() + 1;
  date = now.getDate();

  model.chartData = [["DATE"],[now]];
};

model.getStockData = symbol => { // ◄-------------------------------------------

  return (

      axios.get("https://www.quandl.com/api/v3/datasets/WIKI/" +
                symbol + ".json" +
                "?api_key=" + process.env.QUANDL_API_KEY +
                "&start_date=" + (year - 1) + "-" + month + "-" + date +
                "&end_date=" + year + "-" + month + "-" + date)

      .then(response => {
        if (response.data) {
          return response.data;
        }
      })

      .catch(err => {
        serverLog("error", "model.getStockData - " + err.message);
      })
  );
};

model.addSymbol = symbol => { // ◄----------------------------------------------

  symbol = symbol.toUpperCase();

  if (model.chartData[0].indexOf(symbol) === -1) {

    return (

        model.getStockData(symbol)

        .then(result => {

          if (result && result.dataset) {

            model.chartData[0].push(symbol);

            for (let i = 0; i < result.dataset.data.length; i++) {
              if (!model.chartData[i + 1]) {
                model.chartData[i + 1] = [result.dataset.data[i][0]];
              }
              model.chartData[i + 1].push(result.dataset.data[i][1]);
            }
            if (model.chartData[model.chartData.length - 2].length >
                model.chartData[model.chartData.length - 1].length) {
                    model.chartData[model.chartData.length - 1].push(null);
               }
            serverLog("info", "model.addSymbol - " + symbol + " added");
            emitStockData();
            return symbol;
          }
        })
        .catch(err => serverLog("error", "model.addSymbol - " + err.message))
    );
  } else {
    return new Promise(() => false);
  }
};

model.removeSymbol = symbol => { // ◄-------------------------------------------

  let index = model.chartData[0].indexOf(symbol.toUpperCase());

  if (index !== -1) {
    for (let i = 0; i < model.chartData.length; i++) {
      model.chartData[i].splice(index, 1);
    }
    serverLog("info", "model.addSymbol - " + symbol + " removed");
    emitStockData();
  }
};