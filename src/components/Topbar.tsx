import React from "react";
import {SignOutButton} from "./SignOutButton";
import {useIsAuthenticated} from "@azure/msal-react";
import {SignInButton} from "./SignInButton";

export const Topbar = () => {
    const isAuthenticated = useIsAuthenticated();

    return (

        <nav className="navbar navbar-light sticky-top bg-white flex-md-nowrap p-0 shadow">
            <a className="navbar-brand col-md-3 col-lg-2 mr-0 px-3" href="#">
                <img src={require('../assets/images/logo-pagopa-spa_resize.png')} title="logo"/>
            </a>
            <button className="navbar-toggler position-absolute d-md-none collapsed" type="button"
                    data-toggle="collapse" data-target="#sidebarMenu" aria-controls="sidebarMenu"
                    aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>
            <div className={"m-2"}>
                {isAuthenticated ? <SignOutButton/> : <SignInButton/>}
            </div>
        </nav>
    );
};
