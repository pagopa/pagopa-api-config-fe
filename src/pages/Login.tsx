import React from 'react';
import {useIsAuthenticated} from "@azure/msal-react";
import ReactMarkdown from "react-markdown";
import raw from "raw.macro";
import Topbar from "../components/Topbar";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import packageJson from "../../package.json";

const Login = () => {
    const isAuthenticated = useIsAuthenticated();
    const content = raw("../assets/resources/login.md");
    return (
        <>
            <Topbar isAuthenticated={isAuthenticated}/>

            <div className="container-fluid mt-3">
                <ReactMarkdown>{content}</ReactMarkdown>
                <div className={"info-box"}>
                    <div>versione FE {packageJson.version} </div>
                    Made with ❤️ by PagoPA S.p.A.
                </div>
            </div>
        </>
    );
};

export default Login;
