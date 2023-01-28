import { agent } from "italia-ts-commons";
import {
    AbortableFetch,
    setFetchTimeout,
    toFetch,
} from "italia-ts-commons/lib/fetch";
import {Millisecond} from "italia-ts-commons/lib/units";
import { createClient } from "../../generated/api/client";
import {getConfig} from "./config";


const abortableFetch = AbortableFetch(agent.getHttpFetch(process.env));
const timeout = 5000;
const fetchWithTimeout = toFetch(
        setFetchTimeout(
                timeout as Millisecond,
                abortableFetch
        )
);
const fetchApi: typeof fetchWithTimeout = (fetch as any) as typeof fetchWithTimeout;

const apiConfigHost = getConfig("APICONFIG_HOST");
const apiConfigBasePath = window.localStorage.getItem("ALT") === null ? getConfig("APICONFIG_BASEPATH") : getConfig("APICONFIG_BASEPATH_ALT");

export const apiClient = createClient({
    baseUrl: apiConfigHost as string,
    basePath: apiConfigBasePath as string,
    fetchApi
});


export type APIClient = typeof apiClient;
