import React from "react";
import { useMsal } from "@azure/msal-react";
import {Button} from "react-bootstrap";
import { loginRequest } from "../authConfig";

/**
 * Renders a drop down button with child buttons for logging in with a popup or redirect
 */
export const SignInButton = () => {
    const { instance } = useMsal();

    const handleLogin = () => {

            instance.loginPopup(loginRequest).catch(e => {
                console.log(e);
            });

    };
    return (
        <Button onClick={() => handleLogin()}>
            Login
        </Button>
    );
};
