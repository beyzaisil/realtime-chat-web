import { describe, expect, it, vi } from "vitest";

import { createApiClient, type ApiClientAuthAdapter } from "./api-client";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function unauthorizedResponse(): Response {
  return jsonResponse(
    {
      error: {
        code: "INVALID_TOKEN",
        message: "The token is invalid",
        requestId: "request-id",
      },
    },
    401,
  );
}

function readAuthorization(call: unknown[] | undefined): string | null {
  const init = call?.[1];

  if (typeof init !== "object" || init === null) {
    return null;
  }

  return new Headers(Reflect.get(init, "headers") as HeadersInit).get(
    "Authorization",
  );
}

describe("API client authentication", () => {
  it("adds the current bearer token and includes credentials", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({ ok: true }),
    );
    const client = createApiClient({
      baseUrl: "http://localhost:4000",
      fetch: fetchMock,
      auth: {
        getAccessToken: () => "access-token",
        refreshAccessToken: async () => null,
        onUnauthorized: () => undefined,
      },
    });

    await client.request("/api/v1/auth/me");

    expect(readAuthorization(fetchMock.mock.calls[0])).toBe(
      "Bearer access-token",
    );
    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe("include");
  });

  it("refreshes after 401 and retries once with the new token", async () => {
    let token = "expired-token";
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(unauthorizedResponse())
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const refreshAccessToken = vi.fn(async () => {
      token = "fresh-token";
      return token;
    });
    const client = createApiClient({
      baseUrl: "http://localhost:4000",
      fetch: fetchMock,
      auth: {
        getAccessToken: () => token,
        refreshAccessToken,
        onUnauthorized: () => undefined,
      },
    });

    await client.request("/api/v1/users?query=bo");

    expect(refreshAccessToken).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(readAuthorization(fetchMock.mock.calls[1])).toBe(
      "Bearer fresh-token",
    );
  });

  it("uses one refresh for concurrent 401 responses", async () => {
    let token = "expired-token";
    const fetchMock = vi.fn<typeof fetch>(async (_input, init) => {
      const authorization = new Headers(init?.headers).get("Authorization");
      return authorization === "Bearer fresh-token"
        ? jsonResponse({ ok: true })
        : unauthorizedResponse();
    });
    const refreshAccessToken = vi.fn(async () => {
      await Promise.resolve();
      token = "fresh-token";
      return token;
    });
    const client = createApiClient({
      baseUrl: "http://localhost:4000",
      fetch: fetchMock,
      auth: {
        getAccessToken: () => token,
        refreshAccessToken,
        onUnauthorized: () => undefined,
      },
    });

    await Promise.all([
      client.request("/api/v1/conversations"),
      client.request("/api/v1/users?query=bo"),
      client.request("/api/v1/auth/me"),
    ]);

    expect(refreshAccessToken).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("does not loop when the retry is also unauthorized", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(unauthorizedResponse());
    const refreshAccessToken = vi.fn(async () => "new-token");
    const onUnauthorized = vi.fn();
    const client = createApiClient({
      baseUrl: "http://localhost:4000",
      fetch: fetchMock,
      auth: {
        getAccessToken: () => "token",
        refreshAccessToken,
        onUnauthorized,
      },
    });

    await expect(client.request("/api/v1/auth/me")).rejects.toMatchObject({
      code: "INVALID_TOKEN",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(refreshAccessToken).toHaveBeenCalledOnce();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("marks auth unauthorized when refresh fails", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(unauthorizedResponse());
    const auth: ApiClientAuthAdapter = {
      getAccessToken: () => "expired-token",
      refreshAccessToken: vi.fn(async () => null),
      onUnauthorized: vi.fn(),
    };
    const client = createApiClient({
      baseUrl: "http://localhost:4000",
      fetch: fetchMock,
      auth,
    });

    await expect(
      client.request("/api/v1/conversations"),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN" });

    expect(auth.onUnauthorized).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("never intercepts auth endpoint 401 responses", async () => {
    const refreshAccessToken = vi.fn(async () => "token");
    const client = createApiClient({
      baseUrl: "http://localhost:4000",
      fetch: vi.fn<typeof fetch>().mockResolvedValue(unauthorizedResponse()),
      auth: {
        getAccessToken: () => null,
        refreshAccessToken,
        onUnauthorized: () => undefined,
      },
    });

    await expect(
      client.request("/api/v1/auth/login", {
        method: "POST",
        auth: "none",
      }),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it("returns a successful raw response without parsing its body", async () => {
    const response = new Response("binary attachment", {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    });
    const client = createApiClient({
      baseUrl: "http://localhost:4000",
      fetch: vi.fn<typeof fetch>().mockResolvedValue(response),
      auth: {
        getAccessToken: () => "token",
        refreshAccessToken: async () => null,
        onUnauthorized: () => undefined,
      },
    });

    await expect(
      client.request<Response>("/api/v1/attachments/file", {
        responseType: "raw",
      }),
    ).resolves.toBe(response);
  });
});
