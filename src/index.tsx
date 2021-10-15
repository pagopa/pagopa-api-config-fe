import React from "react";
import ReactDOM from "react-dom";
import "./assets/styles/custom.scss";
import "bootstrap/dist/js/bootstrap.min";
import "jquery";
import App from "./pages/App";

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("app")
);
