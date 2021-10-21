import { createClient } from "../../generated/api/client";

export const apiClient = createClient({
    baseUrl: "http://localhost:8080",
    basePath: "/apiconfig/api/v1",
    fetchApi: fetch
});

export type APIClient = typeof apiClient;
