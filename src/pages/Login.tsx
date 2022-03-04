import React from 'react';
import {useIsAuthenticated} from "@azure/msal-react";
import ReactMarkdown from "react-markdown";
import raw from "raw.macro";
import Topbar from "../components/Topbar";

const Login = () => {
    const isAuthenticated = useIsAuthenticated();
    const content = raw("../assets/resources/login.md");
    return (
        <>
            <Topbar isAuthenticated={isAuthenticated}/>

            <div className="container-fluid mt-3">
                <ReactMarkdown>{content}</ReactMarkdown>
            </div>
        </>
    );
};

export default Login;
