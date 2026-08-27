import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "./auth-provider";

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "alice@example.com",
  username: "alice",
  displayName: "Alice",
  avatarUrl: null,
  status: "ACTIVE" as const,
  createdAt: "2030-01-01T00:00:00.000Z",
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function AuthProbe() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="user">{auth.user?.username ?? "none"}</span>
      <span data-testid="token">{auth.accessToken ?? "none"}</span>
      <button
        onClick={() =>
          void auth.login({
            email: "alice@example.com",
            password: "correct-password",
          })
        }
      >
        login
      </button>
      <button
        onClick={() =>
          void auth.register({
            email: "new@example.com",
            username: "new-user",
            displayName: "New User",
            password: "correct-password",
          })
        }
      >
        register
      </button>
      <button onClick={() => void auth.logout()}>logout</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );
}

describe("AuthProvider", () => {
  it("bootstraps refresh then me into authenticated state", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ accessToken: "fresh-token" }))
      .mockResolvedValueOnce(jsonResponse({ user }));
    vi.stubGlobal("fetch", fetchMock);

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );
    expect(screen.getByTestId("user")).toHaveTextContent("alice");
    expect(screen.getByTestId("token")).toHaveTextContent("fresh-token");
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "/api/v1/auth/refresh",
    );
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("/api/v1/auth/me");
  });

  it("becomes unauthenticated when bootstrap refresh fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 401 })),
    );

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent(
        "unauthenticated",
      ),
    );
    expect(screen.getByTestId("token")).toHaveTextContent("none");
  });

  it("updates memory state after login without a second login request", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        jsonResponse({ user, accessToken: "login-access-token" }),
      );
    vi.stubGlobal("fetch", fetchMock);
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent(
        "unauthenticated",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );
    expect(screen.getByTestId("token")).toHaveTextContent(
      "login-access-token",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const loginRequest = fetchMock.mock.calls[1];
    expect(String(loginRequest?.[0])).toContain("/api/v1/auth/login");
    expect(loginRequest?.[1]).toMatchObject({
      method: "POST",
      credentials: "include",
    });
    expect(JSON.parse(String(loginRequest?.[1]?.body))).toEqual({
      email: "alice@example.com",
      password: "correct-password",
    });
  });

  it("posts the generated register request and stores its response", async () => {
    const registeredUser = {
      ...user,
      email: "new@example.com",
      username: "new-user",
      displayName: "New User",
    };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        jsonResponse(
          { user: registeredUser, accessToken: "register-access-token" },
          201,
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent(
        "unauthenticated",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "register" }));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );
    expect(screen.getByTestId("token")).toHaveTextContent(
      "register-access-token",
    );
    const registerRequest = fetchMock.mock.calls[1];
    expect(String(registerRequest?.[0])).toContain("/api/v1/auth/register");
    expect(registerRequest?.[1]).toMatchObject({
      method: "POST",
      credentials: "include",
    });
    expect(JSON.parse(String(registerRequest?.[1]?.body))).toEqual({
      email: "new@example.com",
      username: "new-user",
      displayName: "New User",
      password: "correct-password",
    });
  });

  it("clears memory state even when logout request fails", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ accessToken: "fresh-token" }))
      .mockResolvedValueOnce(jsonResponse({ user }))
      .mockRejectedValueOnce(new Error("network unavailable"));
    vi.stubGlobal("fetch", fetchMock);
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );

    fireEvent.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent(
        "unauthenticated",
      ),
    );
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(screen.getByTestId("token")).toHaveTextContent("none");
  });
});
