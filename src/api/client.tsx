import { createClient } from "../../generated/api/client";

export const apiClient = createClient({
    baseUrl: process.env.HOST as string,
    basePath: process.env.BASEPATH,
    fetchApi: fetch
})

export type APIClient = typeof apiClient;
