import {readableReport} from "@pagopa/ts-commons/lib/reporters";
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
                if (response.right === undefined) {
                    // io-ts decoding failure: the response does not match the generated codec
                    console.error("Invalid API response:\n" + readableReport(response.left));
                    reject(response.left);
                } else if (response.right.status === 200) {
                    resolve(response.right.value);
                }
                else {
                    console.error("Unexpected API status", response.right.status, response.right.value);
                    reject(response.right);
                }
            }).catch(reject);
        });
    });
