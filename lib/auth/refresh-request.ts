import type { RefreshResponse } from "./types";

export async function requestRefreshedAccessToken(
  baseUrl: string,
  fetchImplementation: typeof fetch = globalThis.fetch,
): Promise<string | null> {
  try {
    const response = await fetchImplementation(
      new URL("/api/v1/auth/refresh", baseUrl),
      {
        method: "POST",
        credentials: "include",
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as RefreshResponse;
    return typeof payload.accessToken === "string"
      ? payload.accessToken
      : null;
  } catch {
    return null;
  }
}
