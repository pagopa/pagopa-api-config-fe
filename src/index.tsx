import React from "react";
import ReactDOM from "react-dom";
import "./assets/styles/custom.scss";
import "bootstrap/dist/js/bootstrap.min";
import "jquery";
import "react-toastify/dist/ReactToastify.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import {PublicClientApplication} from "@azure/msal-browser";
import {MsalProvider} from "@azure/msal-react";
import {msalConfig} from "./authConfig";
import App from "./App";

const msalInstance = new PublicClientApplication(msalConfig);

ReactDOM.render(
    <MsalProvider instance={msalInstance}>
        <App/>
    </MsalProvider>,
    document.getElementById('app')
);
