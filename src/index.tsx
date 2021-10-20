import React from "react";
import ReactDOM from "react-dom";
import "./assets/styles/custom.scss";
import "bootstrap/dist/js/bootstrap.min";
import "jquery";
import Layout from "./components/Layout";
import Routes from "./util/routes";

// ReactDOM.render(
//         <React.StrictMode>
//             <Layout />
//         </React.StrictMode>,
//         document.getElementById("app")
// );

ReactDOM.render(<Routes/>, document.getElementById('app'));
