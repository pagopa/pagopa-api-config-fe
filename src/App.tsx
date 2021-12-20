import React from "react";
import {AuthenticatedTemplate, UnauthenticatedTemplate} from "@azure/msal-react";
import Routes from "./util/routes";
import Login from "./pages/Login";


export default function App() {
    return (
        <div>
            <AuthenticatedTemplate>
                <Routes/>
            </AuthenticatedTemplate>

            <UnauthenticatedTemplate>
                <Login/>
            </UnauthenticatedTemplate>
        </div>
    );
}
