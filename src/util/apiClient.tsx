import fetch from "node-fetch";
import { createClient } from "../../generated/api/client";


export const apiClient = createClient({
    baseUrl: "http://localhost:8080",
    basePath: "/apiconfig/api/v1",
    fetch
});

export type APIClient = typeof apiClient;
