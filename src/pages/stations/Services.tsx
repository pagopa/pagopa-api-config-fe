import {loginRequest} from "../../authConfig";
import {apiClient} from "../../util/apiClient";

export const getStation = (context: any, code: string) => new Promise((resolve, reject) => {
        context.instance.acquireTokenSilent({
            ...loginRequest,
            account: context.accounts[0]
        })
        .then((response: any) => {
            void apiClient.getStation({
                Authorization: `Bearer ${response.idToken}`,
                ApiKey: "",
                stationcode: code
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
