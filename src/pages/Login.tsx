import React from 'react';
import {useIsAuthenticated} from "@azure/msal-react";
import ReactMarkdown from "react-markdown";
import Topbar from "../components/Topbar";
import content from "../assets/resources/login.md";

const Login = () => {
    const isAuthenticated = useIsAuthenticated();

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
