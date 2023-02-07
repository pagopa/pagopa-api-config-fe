import {loginRequest} from "../../authConfig";
import {apiClient} from "../../util/apiClient";

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
            }).then((response: any) => {
                if (response.right.status === 200) {
                    resolve(response.right.value);
                }
                else {
                    reject();
                }
            }).catch(reject);
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
            }).then((response: any) => {
                if (response.right.status === 200) {
                    resolve(response.right.value);
                }
                else {
                    reject();
                }
            }).catch(reject);
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
                    .then((response: any) => {
                        if (response.right.status === 200) {
                            resolve(response.right.value);
                        } else {
                            reject();
                        }
                    }).catch(reject)
            });
    });

export const getPspList = (context: any, code: string) => new Promise((resolve, reject) => {
        context.instance.acquireTokenSilent({
            ...loginRequest,
            account: context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getChannelPaymentServiceProviders({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
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
                    }).catch(reject)
            });
    });

    