import type { ApiConfig } from "./config";
import { ApiError } from "./errors";
export function createHttp(config: ApiConfig, fetcher: typeof fetch = fetch) {
  let csrfToken: string | undefined;
  return {
    setCsrfToken(token?: string) {
      csrfToken = token;
    },
    async request(
      path: string,
      options: {
        method?: string;
        body?: unknown;
        idempotencyKey?: string;
        login?: boolean;
        fetcher?: typeof fetch;
      } = {},
    ): Promise<unknown> {
      const method = options.method ?? "GET";
      const headers: Record<string, string> = { Accept: "application/json" };
      if (method !== "GET") {
        if (!options.login && !csrfToken)
          throw new ApiError(
            "Your session needs refreshing before this action. Reload and sign in again.",
            401,
            "SESSION_REQUIRED",
          );
        headers["Content-Type"] = "application/json";
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
        if (options.idempotencyKey)
          headers["Idempotency-Key"] = options.idempotencyKey;
      }
      let response: Response;
      try {
        response = await (options.fetcher ?? fetcher)(
          `${config.baseUrl}${path}`,
          {
            method,
            headers,
            credentials: "include",
            body:
              options.body === undefined
                ? undefined
                : JSON.stringify(options.body),
            signal: AbortSignal.timeout(15000),
            redirect: "error",
          },
        );
      } catch {
        throw new ApiError(
          "The configured API could not be reached. No demo data has been substituted. Retry when the connection is restored.",
        );
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json"))
        throw new ApiError(
          "The API returned a non-JSON response. Check the API URL and static-host routing.",
          response.status,
          "INVALID_RESPONSE",
        );
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new ApiError(
          "The API returned invalid JSON",
          502,
          "INVALID_RESPONSE",
        );
      }
      if (!response.ok) {
        const failure = payload as {
          error?: {
            message?: string;
            code?: string;
            fields?: Record<string, string>;
            requestId?: string;
          };
        };
        throw new ApiError(
          failure?.error?.message ?? `API request failed (${response.status})`,
          response.status,
          failure?.error?.code ?? "REQUEST_FAILED",
          failure?.error?.fields,
          failure?.error?.requestId,
        );
      }
      if (!payload || typeof payload !== "object" || !("data" in payload))
        throw new ApiError(
          "API response must contain a data field",
          502,
          "INVALID_RESPONSE",
        );
      return (payload as { data: unknown }).data;
    },
  };
}
