import React from "react";
import {useIsAuthenticated, useMsal} from "@azure/msal-react";

// this is a workaround to use React Hooks in a React class
export function injectToken(Component: any) {
    return function (props: any) {
        const isAuthenticated = useIsAuthenticated();
        const {instance, accounts} = useMsal();
        return <Component {...props} isAuthenticated={isAuthenticated} instance={instance} accounts={accounts}/>;

    };
}
