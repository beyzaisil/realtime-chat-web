import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import { ApiClientError } from "../../../lib/http/api-error";
import {
  AuthContext,
  type AuthContextValue,
} from "../../../providers/auth-provider";
import { AccountSecurity } from "./account-security";

const sessions = {
  items: [
    {
      id: "session-current",
      userAgent: "Mozilla Chrome/130 Windows",
      createdAt: "2030-01-01T10:00:00.000Z",
      lastUsedAt: "2030-01-02T10:00:00.000Z",
      expiresAt: "2030-02-01T10:00:00.000Z",
      isCurrent: true,
    },
    {
      id: "session-other",
      userAgent: "Mozilla Safari/18 iPhone",
      createdAt: "2030-01-01T10:00:00.000Z",
      lastUsedAt: "2030-01-02T09:00:00.000Z",
      expiresAt: "2030-02-01T10:00:00.000Z",
      isCurrent: false,
    },
  ],
};

function renderSecurity(request: ReturnType<typeof vi.fn>) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const clearSession = vi.fn();
  const auth = {
    user: null,
    accessToken: "token",
    status: "authenticated",
    apiClient: { request: request as unknown as ApiClient["request"] },
    setCurrentUser: vi.fn(),
    clearSession,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    bootstrap: vi.fn(),
  } satisfies AuthContextValue;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    );
  }

  return { clearSession, ...render(<AccountSecurity />, { wrapper: Wrapper }) };
}

function requestWithSessions() {
  return vi.fn(async (path: string, _options?: { method?: string }) => {
    if (path === "/api/v1/auth/sessions") {
      return sessions;
    }
    return undefined;
  });
}

async function fillPasswordForm(): Promise<void> {
  const browserUser = userEvent.setup();
  await browserUser.type(
    screen.getByLabelText("Mevcut parola"),
    "current-password",
  );
  await browserUser.type(
    screen.getByLabelText("Yeni parola"),
    "new-password-123",
  );
  await browserUser.type(
    screen.getByLabelText("Yeni parola tekrar"),
    "new-password-123",
  );
}

describe("AccountSecurity", () => {
  it("marks the current session separately", async () => {
    renderSecurity(requestWithSessions());

    expect(await screen.findByText("Bu cihaz")).toBeInTheDocument();
    expect(screen.getByText("Chrome · Windows")).toBeInTheDocument();
    expect(screen.getByText("Safari · iOS")).toBeInTheDocument();
  });

  it("does not change the password before explicit confirmation", async () => {
    const request = requestWithSessions();
    renderSecurity(request);
    await screen.findByText("Bu cihaz");
    await fillPasswordForm();
    const browserUser = userEvent.setup();

    await browserUser.click(screen.getByRole("button", { name: "Devam et" }));

    expect(
      request.mock.calls.filter(([path]) => path === "/api/v1/auth/password"),
    ).toHaveLength(0);
    const confirmation = screen.getByRole("alertdialog", {
      name: "Parola değiştirilsin mi?",
    });
    await browserUser.click(
      within(confirmation).getByRole("button", {
        name: "Parolayı değiştir",
      }),
    );

    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("/api/v1/auth/password", {
        method: "PATCH",
        json: {
          currentPassword: "current-password",
          newPassword: "new-password-123",
        },
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Mevcut oturumun açık kaldı; diğer tüm oturumlar sonlandırıldı.",
    );
  });

  it("shows password validation errors without a request", async () => {
    const request = requestWithSessions();
    renderSecurity(request);
    await screen.findByText("Bu cihaz");
    const browserUser = userEvent.setup();
    await browserUser.type(
      screen.getByLabelText("Yeni parola"),
      "new-password-123",
    );
    await browserUser.type(
      screen.getByLabelText("Yeni parola tekrar"),
      "new-password-123",
    );

    await browserUser.click(screen.getByRole("button", { name: "Devam et" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Mevcut parolanı girmelisin.",
    );
    expect(
      request.mock.calls.filter(([path]) => path === "/api/v1/auth/password"),
    ).toHaveLength(0);
  });

  it("does not revoke a session before explicit confirmation", async () => {
    const request = requestWithSessions();
    renderSecurity(request);
    await screen.findByText("Safari · iOS");
    const browserUser = userEvent.setup();

    await browserUser.click(
      screen.getByRole("button", { name: "Oturumu sonlandır" }),
    );

    expect(
      request.mock.calls.filter(([path]) =>
        String(path).includes("session-other"),
      ),
    ).toHaveLength(0);
    const confirmation = screen.getByRole("alertdialog", {
      name: "Bu oturum sonlandırılsın mı?",
    });
    await browserUser.click(
      within(confirmation).getByRole("button", {
        name: "Oturumu sonlandır",
      }),
    );

    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        "/api/v1/auth/sessions/session-other",
        { method: "DELETE" },
      ),
    );
  });

  it("does not revoke other sessions before explicit confirmation", async () => {
    const request = requestWithSessions();
    renderSecurity(request);
    await screen.findByText("Safari · iOS");
    const browserUser = userEvent.setup();

    await browserUser.click(
      screen.getByRole("button", {
        name: "Diğer tüm oturumları sonlandır",
      }),
    );

    expect(
      request.mock.calls.filter(
        ([path, options]) =>
          path === "/api/v1/auth/sessions" &&
          options?.method === "DELETE",
      ),
    ).toHaveLength(0);
    const confirmation = screen.getByRole("alertdialog", {
      name: "Diğer tüm oturumlar sonlandırılsın mı?",
    });
    await browserUser.click(
      within(confirmation).getByRole("button", {
        name: "Tümünü sonlandır",
      }),
    );

    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("/api/v1/auth/sessions", {
        method: "DELETE",
      }),
    );
  });

  it("shows a clear API error after confirmed password change", async () => {
    const request = vi.fn(async (path: string) => {
      if (path === "/api/v1/auth/sessions") {
        return sessions;
      }
      if (path === "/api/v1/auth/password") {
        throw new ApiClientError({
          status: 401,
          code: "INVALID_CREDENTIALS",
          message: "The email or password is incorrect",
        });
      }
      return undefined;
    });
    renderSecurity(request);
    await screen.findByText("Bu cihaz");
    await fillPasswordForm();
    const browserUser = userEvent.setup();
    await browserUser.click(screen.getByRole("button", { name: "Devam et" }));
    const confirmation = screen.getByRole("alertdialog", {
      name: "Parola değiştirilsin mi?",
    });

    await browserUser.click(
      within(confirmation).getByRole("button", {
        name: "Parolayı değiştir",
      }),
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Mevcut parolan yanlış.",
      ),
    );
  });
});
