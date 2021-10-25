import { agent } from "italia-ts-commons";
import {
    AbortableFetch,
    setFetchTimeout,
    toFetch,
} from "italia-ts-commons/lib/fetch";
import {Millisecond} from "italia-ts-commons/lib/units";
import { createClient } from "../../generated/api/client";


const abortableFetch = AbortableFetch(agent.getHttpFetch(process.env));
const timeout = 5000;
const fetchWithTimeout = toFetch(
        setFetchTimeout(
                timeout as Millisecond,
                abortableFetch
        )
);
const fetchApi: typeof fetchWithTimeout = (fetch as any) as typeof fetchWithTimeout;

export const apiClient = createClient({
    baseUrl: "http://localhost:8080",
    basePath: "/apiconfig/api/v1",
    fetchApi
});

export type APIClient = typeof apiClient;
