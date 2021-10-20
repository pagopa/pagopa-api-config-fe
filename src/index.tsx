import React from "react";
import ReactDOM from "react-dom";
import "./assets/styles/custom.scss";
import "bootstrap/dist/js/bootstrap.min";
import "jquery";
import Routes from "./util/routes";

ReactDOM.render(
        <Routes/>,
        document.getElementById('app')
);
