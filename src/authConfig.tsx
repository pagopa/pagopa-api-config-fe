import { LogLevel } from "@azure/msal-browser";
import {getConfig} from "./util/config";

/**
 * Enter here the user flows and custom policies for your B2C application
 * To learn more about user flows, visit: https://docs.microsoft.com/en-us/azure/active-directory-b2c/user-flow-overview
 * To learn more about custom policies, visit: https://docs.microsoft.com/en-us/azure/active-directory-b2c/custom-policy-overview
 */

const tenant = getConfig("APICONFIG_TENANT") as string;
const redirectUri = getConfig("APICONFIG_REDIRECT_URI") as string;
const clientId = getConfig("APICONFIG_CLIENT_ID") as string;

export const b2cPolicies = {
    names: {
        signUpSignIn: "B2C_1_signup_signin",
        forgotPassword: "B2C_1_reset_password",
    },
    authorities: {
        signUpSignIn: {
            authority: `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/B2C_1_signup_signin`,
        },
        forgotPassword: {
            authority: `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/B2C_1_reset_password`,
        }
    },
    authorityDomain: `${tenant}.b2clogin.com`
};


/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL.js configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md
 */
export const msalConfig = {
    auth: {
        clientId, // This is the ONLY mandatory field that you need to supply.
        authority: b2cPolicies.authorities.signUpSignIn.authority, // Choose SUSI as your default authority.
        knownAuthorities: [b2cPolicies.authorityDomain], // Mark your B2C tenant's domain as trusted.
        // TODO parameterize
        redirectUri: `${redirectUri}`, // You must register this URI on Azure Portal/App Registration. Defaults to window.location.origin
        postLogoutRedirectUri: `${redirectUri}`, // Indicates the page to navigate after logout.
        navigateToLoginRequestUrl: false, // If "true", will navigate back to the original request location before processing the auth code response.
    },
    cache: {
        cacheLocation: "sessionStorage", // Configures cache location. "sessionStorage" is more secure, but "localStorage" gives you SSO between tabs.
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            loggerCallback: (level: LogLevel, message: any, containsPii: boolean) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            }
        }
    }
};

/**
 * Add here the endpoints and scopes when obtaining an access token for protected web APIs. For more information, see:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md
 */
export const protectedResources = {
    apiHello: {
        endpoint: `https://${tenant}.onmicrosoft.com/${clientId}/access_as_user`,
        scopes: [`https://${tenant}.onmicrosoft.com/${clientId}/access_as_user`], // e.g. api://xxxxxx/access_as_user
    },
};

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 * For more information about OIDC scopes, visit:
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
 */
export const loginRequest = {
    scopes: [...protectedResources.apiHello.scopes]
};
