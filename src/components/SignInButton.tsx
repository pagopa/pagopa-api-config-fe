import React from "react";
import {useMsal} from "@azure/msal-react";
import {Button} from "react-bootstrap";
import {loginRequest} from "../authConfig";

export const SignInButton = () => {
    const {instance} = useMsal();

    const handleLogin = () => {
        void instance.loginPopup(loginRequest);

    };

    return (
        <Button onClick={() => handleLogin()}>
            Login
        </Button>
    );
};
