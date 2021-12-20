import React from "react";
import {useMsal} from "@azure/msal-react";
import {Button} from "react-bootstrap";


export const SignOutButton = () => {
    const {instance} = useMsal();

    const handleLogout = () => {
        void instance.logoutPopup({
            postLogoutRedirectUri: "/",
            mainWindowRedirectUri: "/"
        }).then(() => window.sessionStorage.removeItem("secret"));
    };

    return (
        <Button onClick={() => handleLogout()}>
            Logout
        </Button>
    );
};
