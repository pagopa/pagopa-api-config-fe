/**
 * Extracts a human readable error message from an API response.
 *
 * Some backend error responses (e.g. 404 on create/update endpoints) are not
 * always declared in the OpenAPI spec used to generate the client, so the
 * io-ts decoder has no matching type for that status and `res.right` ends up
 * undefined even though the HTTP call succeeded and returned a JSON body
 * with error details. In that case we fall back to reading the raw
 * Response (available in `res.left`) to try to recover the "detail" field.
 */
export async function extractErrorMessage(res: any, fallbackMessage: string): Promise<string> {
    if (res?.right?.value?.detail) {
        return res.right.value.detail;
    }

    const rawResponse = res?.left?.[0]?.value;
    if (rawResponse && typeof rawResponse.json === "function") {
        try {
            const body = await rawResponse.json();
            if (body?.detail) {
                return body.detail;
            }
        } catch {
            // response body is not JSON or already consumed, ignore
        }
    }

    return fallbackMessage;
}
