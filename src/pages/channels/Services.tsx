import {loginRequest} from "../../authConfig";
import {apiClient} from "../../util/apiClient";

const thenResolve = (response: any, resolve: any, reject: any): void => {
    if (response.right.status === 200) {
        resolve(response.right.value);
    }
    else {
        reject();
    }
};

export const getChannel = (context: any, code: string) => new Promise((resolve, reject) => {
        context.instance.acquireTokenSilent({
            ...loginRequest,
            account: context.accounts[0]
        })
        .then((response: any) => {
            void apiClient.getChannel({
                Authorization: `Bearer ${response.idToken}`,
                ApiKey: "",
                channelcode: code
            })
            .then(r => thenResolve(r, resolve, reject))
            .catch(reject);
        })// eslint-disable-next-line sonarjs/no-identical-functions
                .catch(() => {
                    context.instance.logoutPopup({
                        postLogoutRedirectUri: "/",
                        mainWindowRedirectUri: "/"
                    }).then(() => window.sessionStorage.removeItem("secret"));
                });
    });

export const getPaymentTypeLegend = (context: any) => new Promise((resolve, reject) => {
        context.instance.acquireTokenSilent({
            ...loginRequest,
            account: context.accounts[0]
        })
        .then((response: any) => {
            apiClient.getPaymentTypes({
                Authorization: `Bearer ${response.idToken}`,
                ApiKey: ""
            })
            .then(r => thenResolve(r, resolve, reject))
            .catch(reject);
        });
    });

export const getPaymentTypeList = (context: any, code: string) => new Promise((resolve, reject) => {
        context.instance.acquireTokenSilent({
            ...loginRequest,
            account: context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getChannelPaymentTypes({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    channelcode: code
                })
                    .then(r => thenResolve(r, resolve, reject))
                    .catch(reject);
            });
    });

export const getPspList = (context: any, code: string, page: number) => new Promise((resolve, reject) => {
        context.instance.acquireTokenSilent({
            ...loginRequest,
            account: context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getChannelPaymentServiceProviders({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    page,
                    channelcode: code
                })
                    .then((response: any) => {
                        if (response.right.status === 200) {
                            resolve(response.right.value);
                        } else if (response.right.status === 404) {
                            resolve([]);
                        } else {
                            reject();
                        }
                    }).catch(reject);
            });
    });

