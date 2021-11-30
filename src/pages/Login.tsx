import React from 'react';
import {useIsAuthenticated} from "@azure/msal-react";
import Topbar from "../components/Topbar";

const Login = () => {
    const isAuthenticated = useIsAuthenticated();


    return (
        <div>
            <Topbar isAuthenticated={isAuthenticated}/>
            <br/>
            <h5 className={"text-center m-3"}>
                Effettua il Login
            </h5>
        </div>
    );
};

export default Login;
