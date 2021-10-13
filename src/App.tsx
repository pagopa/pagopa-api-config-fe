import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';

import React from "react";
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";
import Landing from "./Landing";
import Page1 from "./Page1";
import NavigationBar from "./Navbar";


export default function App() {

    return (
        <div className="App">
            <Router>
                <div>
                    <NavigationBar/>
                    <Switch>
                        <Route path="/landing">
                            <Landing/>
                        </Route>
                        <Route path="/page1">
                            <Page1/>
                        </Route>
                    </Switch>
                </div>
            </Router>
        </div>

    );
}

