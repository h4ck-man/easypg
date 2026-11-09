import { config } from "./config";
import { createHttp } from "./http";
import { ApiError } from "./errors";
import { decodeView } from "./transport";
import {
  operations,
  type Operation,
  type CommandInput,
  type CommandResult,
} from "./operations";
import type { AppData, PageDataMap } from "./contracts";
import { validateSession, validatePage } from "./validate";
const http = createHttp(config);
// The demo implementation is never selected as recovery for a live API error.
const demo =
  config.mode === "demo"
    ? import("./demo").then((module) => module.createDemoAdapter())
    : null;
/** The API owns image authorization; only use the resident-specific documented paths. */
export function residentImageUrl(
  id: string,
  kind: "portrait" | "identity",
  path?: string | null,
): string | undefined {
  const resource = `/residents/${encodeURIComponent(id)}/images/${kind}`;
  return config.mode === "live" && path === `/api/v1${resource}`
    ? `${config.baseUrl}${resource}`
    : undefined;
}
export const api = {
  async getSession(fetcher?: typeof fetch): Promise<AppData | null> {
    if (demo) return (await demo).getSession();
    try {
      const raw = await http.request("/session", { fetcher });
      if (raw === null) {
        http.setCsrfToken();
        return null;
      }
      validateSession(raw);
      const session = raw as AppData & { csrfToken: string };
      http.setCsrfToken(session.csrfToken);
      return session;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        http.setCsrfToken();
        return null;
      }
      throw cause;
    }
  },
  async readView<K extends keyof PageDataMap>(
    route: K,
    params: Record<string, string> = {},
    fetcher?: typeof fetch,
  ): Promise<PageDataMap[K]> {
    if (demo) return (await demo).readView(route, params);
    const path = route.replace(":id", encodeURIComponent(params.id ?? ""));
    const query = new URLSearchParams(
      Object.entries(params).filter(([key]) => key !== "id"),
    ).toString();
    const raw = await http.request(`/views${path}${query ? `?${query}` : ""}`, {
      fetcher,
    });
    validatePage(route, raw);
    return decodeView(raw) as PageDataMap[K];
  },
  async command(
    operation: Operation,
    input: CommandInput,
    idempotencyKey: string,
  ): Promise<CommandResult> {
    if (demo) return (await demo).command(operation, input, idempotencyKey);
    const descriptor = operations[operation];
    if (!descriptor)
      throw new ApiError("Unsupported action", 400, "UNSUPPORTED_OPERATION");
    const path = descriptor.path.replace(
      ":id",
      encodeURIComponent(input.residentId ?? ""),
    );
    const raw = await http.request(path, {
      method: descriptor.method,
      body: input,
      idempotencyKey,
      login: operation === "signIn",
    });
    if (
      !raw ||
      typeof raw !== "object" ||
      !("success" in raw) ||
      raw.success !== true ||
      !("message" in raw) ||
      typeof raw.message !== "string"
    )
      throw new ApiError(
        "Command response is invalid",
        502,
        "INVALID_RESPONSE",
      );
    if (operation === "signIn") {
      if (!(await api.getSession()))
        throw new ApiError(
          "Login did not establish a session",
          401,
          "SESSION_REQUIRED",
        );
    }
    if (operation === "signOut") http.setCsrfToken();
    const result = raw as CommandResult;
    if (operation === "registerResident") {
      if (typeof result.resourceId !== "string" || !result.resourceId.trim())
        throw new ApiError(
          "The API did not return the saved resident ID",
          502,
          "INVALID_RESPONSE",
        );
      return {
        ...result,
        redirectTo: `/residents/${encodeURIComponent(result.resourceId)}`,
      };
    }
    return result;
  },
};
