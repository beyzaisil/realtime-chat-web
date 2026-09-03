import { ApiClientError, parseBackendError } from "./api-error";

const AUTH_REFRESH_EXEMPT_PATHS = new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
]);

export interface ApiClientAuthAdapter {
  getAccessToken(): string | null;
  refreshAccessToken(): Promise<string | null>;
  onUnauthorized(): Promise<void> | void;
}

export interface ApiRequestOptions
  extends Omit<RequestInit, "body" | "credentials" | "headers"> {
  auth?: "required" | "none";
  headers?: HeadersInit;
  json?: unknown;
  responseType?: "json" | "raw";
}

export interface ApiClientOptions {
  baseUrl: string;
  auth: ApiClientAuthAdapter;
  fetch?: typeof fetch;
}

export interface ApiClient {
  request<T>(path: string, options?: ApiRequestOptions): Promise<T>;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const fetchImplementation = options.fetch ?? globalThis.fetch;
  let refreshPromise: Promise<string | null> | null = null;
  let unauthorizedPromise: Promise<void> | null = null;

  async function notifyUnauthorized(): Promise<void> {
    unauthorizedPromise ??= Promise.resolve(options.auth.onUnauthorized())
      .catch(() => undefined)
      .finally(() => {
        unauthorizedPromise = null;
      });
    await unauthorizedPromise;
  }

  async function refreshSingleFlight(): Promise<string | null> {
    if (refreshPromise === null) {
      refreshPromise = options.auth
        .refreshAccessToken()
        .catch(() => null)
        .then(async (token) => {
          if (token === null) {
            await notifyUnauthorized();
          }
          return token;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    return refreshPromise;
  }

  async function execute(
    path: string,
    requestOptions: ApiRequestOptions,
  ): Promise<Response> {
    const {
      auth: _authMode,
      json,
      headers: requestHeaders,
      responseType: _responseType,
      ...nativeOptions
    } = requestOptions;
    const headers = new Headers(requestHeaders);
    const token = options.auth.getAccessToken();

    if (requestOptions.auth !== "none" && token !== null) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let body: BodyInit | undefined;

    if (json !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(json);
    }

    return fetchImplementation(new URL(path, options.baseUrl), {
      ...nativeOptions,
      headers,
      credentials: "include",
      ...(body === undefined ? {} : { body }),
    });
  }

  async function readResponse<T>(
    response: Response,
    responseType: ApiRequestOptions["responseType"],
  ): Promise<T> {
    if (!response.ok) {
      const payload = await readJsonSafely(response);
      throw parseBackendError(response.status, payload);
    }

    if (responseType === "raw") {
      return response as T;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  return {
    async request<T>(
      path: string,
      requestOptions: ApiRequestOptions = {},
    ): Promise<T> {
      const authMode = requestOptions.auth ?? "required";
      const normalizedOptions: ApiRequestOptions = {
        ...requestOptions,
        auth: authMode,
      };
      const response = await execute(path, normalizedOptions);
      const canRefresh =
        authMode === "required" &&
        !AUTH_REFRESH_EXEMPT_PATHS.has(new URL(path, options.baseUrl).pathname);

      if (response.status !== 401 || !canRefresh) {
        return readResponse<T>(response, normalizedOptions.responseType);
      }

      const refreshedToken = await refreshSingleFlight();

      if (refreshedToken === null) {
        return readResponse<T>(response, normalizedOptions.responseType);
      }

      const retryResponse = await execute(path, normalizedOptions);

      if (retryResponse.status === 401) {
        await notifyUnauthorized();
      }

      return readResponse<T>(retryResponse, normalizedOptions.responseType);
    },
  };
}

async function readJsonSafely(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}
