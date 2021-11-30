import React from "react";
import {useMsal} from "@azure/msal-react";
import {Button} from "react-bootstrap";
import {loginRequest} from "../authConfig";

export const SignInButton = () => {
    const {instance} = useMsal();

    const handleLogin = () => {
        instance.loginPopup(loginRequest)
            .then(response => window.sessionStorage.setItem("secret", response.idToken))
            .catch(e => {
                console.log(e);
            });
    };

    return (
        <Button onClick={() => handleLogin()}>
            Login
        </Button>
    );
};
