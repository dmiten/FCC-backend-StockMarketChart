"use strict";

import axios from "axios";
import React from "react";
import { Chart } from "react-google-charts";
import {
  Button,
  FormControl,
  InputGroup
} from "react-bootstrap";

import "./app.css";

import header from "./header.jsx";

export default class App extends React.Component {

  constructor(props) { // ◄-----------------------------------------------------
    super(props);
    this.chartOptions = {
      animation: {
        duration: 1000,
        easing: "out",
        startup: true
      },
      explorer: {
        keepInBounds: true,
        maxZoomOut: 1
      },
      focusTarget: "category",
      title: "EOD prices for selected stock symbols",
    };
    this.socket = io(window.location.origin);
    this.state = {
      addSymbolInput: "",
      chartData: [[],[]],
      chartWidth: "100%"
    };
  }

  componentDidMount() { // ◄----------------------------------------------------
    this.socket.on("chartData", data => {
      this.setState({ chartData: this.parseDateForChart(data) });
    });
    window.addEventListener("resize", this.handleResize);
  }

  componentWillUnmount() { // ◄-------------------------------------------------
    window.removeEventListener("resize", this.handleResize);
  }

  parseDateForChart = (data) => { // ◄------------------------------------------
    for (let i = 1; i < data.length; i++) {
      data[i][0] = new Date(data[i][0]);
    }
    return data;
  };

  handleResize = () => { // ◄---------------------------------------------------
    this.setState({ chartWidth: "100%" });
  };

  renderChart = () => { // ◄----------------------------------------------------
    if (this.state.chartData[0].length > 1) {
      return (
          <div id="chart">
            <Chart
                key="chart"
                chartType="LineChart"
                data={this.state.chartData}
                options={this.chartOptions}
                graph_id="LineChart"
                width={this.state.chartWidth}
                height="450px"
                legend_toggle
            />
          </div>
      )
    } else {
      return (
          <div id="emptychart">
            emptychart
          </div>
      )
    }
  };

  renderForm = () => { // ◄-----------------------------------------------------

    let resetInput = () => {
          document.getElementById("symbolinput").value = "";
          document.getElementById("addsymbolmessage").innerHTML = ""
        },

        addInput = () => {

          let message = "",
              symbol = document.getElementById("symbolinput").value.toUpperCase();

          if (this.state.chartData[0].indexOf(symbol) === -1) {
            axios.post("/api/add", {
              symbol: symbol
            })

            .then(res => {
              if (res.data.message !== "ok") {
                message = res.data.message;
              }
              document.getElementById("addsymbolmessage").innerHTML = message
            })
          }
        },

        removeInput = () => {

          let symbol = document.getElementById("symbolinput").value.toUpperCase();

          document.getElementById("addsymbolmessage").innerHTML = "";

          if (this.state.chartData[0].indexOf(symbol) !== -1) {
            axios.post("/api/remove", {
              symbol: symbol
            })
          }
        };

    return (

        <div id="addsymboldiv">
          <InputGroup>
            <FormControl
                className="text-center"
                id="symbolinput"
                type="text"
                placeholder="symbol to add/remove"
            />
            <InputGroup.Button>
              <Button
                  bsStyle="warning"
                  onClick={resetInput}
              >
                <span className="fa fa-stop"/>
              </Button>
            </InputGroup.Button>
            <InputGroup.Button>
              <Button
                  bsStyle="success"
                  onClick={addInput}
              >
                <span className="fa fa-plus-square"/>
              </Button>
            </InputGroup.Button>
            <InputGroup.Button>
              <Button
                  bsStyle="info"
                  onClick={removeInput}
              >
                <span className="fa fa-minus-square"/>
              </Button>
            </InputGroup.Button>
          </InputGroup>
          <div className="text-center">
            <span id="addsymbolmessage"> </span>
          </div>
        </div>
    )
  };

  render() { // ◄---------------------------------------------------------------
    return (
        <div id="main">
          {header()}
          {this.renderChart()}
          {this.renderForm()}
        </div>
    )
  }
}
