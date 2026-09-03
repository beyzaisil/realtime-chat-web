import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { AuthSession } from "../../../lib/api/types";
import type { ApiClient } from "../../../lib/http/api-client";
import {
  AuthContext,
  type AuthContextValue,
} from "../../../providers/auth-provider";
import {
  authSessionKeys,
  useActiveSessions,
  useChangePassword,
  useRevokeOtherSessions,
  useRevokeSession,
} from "./use-security";

const currentSession: AuthSession = {
  id: "session-current",
  userAgent: "Chrome on Windows",
  createdAt: "2030-01-01T10:00:00.000Z",
  lastUsedAt: "2030-01-02T10:00:00.000Z",
  expiresAt: "2030-02-01T10:00:00.000Z",
  isCurrent: true,
};

const otherSession: AuthSession = {
  ...currentSession,
  id: "session-other",
  userAgent: "Safari on iPhone",
  isCurrent: false,
};

function createHarness(request: ReturnType<typeof vi.fn>) {
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

  return { clearSession, queryClient, Wrapper };
}

function seedSessions(queryClient: QueryClient): void {
  queryClient.setQueryData(authSessionKeys.list(), {
    items: [currentSession, otherSession],
  });
}

describe("security hooks", () => {
  it("loads active sessions through the query", async () => {
    const response = { items: [currentSession, otherSession] };
    const request = vi.fn().mockResolvedValue(response);
    const { Wrapper } = createHarness(request);
    const { result } = renderHook(() => useActiveSessions(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
  });

  it("keeps only the current session after changing the password", async () => {
    const request = vi.fn().mockResolvedValue(undefined);
    const { queryClient, Wrapper } = createHarness(request);
    seedSessions(queryClient);
    const { result } = renderHook(() => useChangePassword(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        currentPassword: "current-password",
        newPassword: "new-password-123",
      });
    });

    expect(queryClient.getQueryData(authSessionKeys.list())).toEqual({
      items: [currentSession],
    });
  });

  it("keeps only the current session after revoking all others", async () => {
    const request = vi.fn().mockResolvedValue(undefined);
    const { queryClient, Wrapper } = createHarness(request);
    seedSessions(queryClient);
    const { result } = renderHook(() => useRevokeOtherSessions(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(queryClient.getQueryData(authSessionKeys.list())).toEqual({
      items: [currentSession],
    });
  });

  it("removes a revoked non-current session from cache", async () => {
    const request = vi.fn().mockResolvedValue(undefined);
    const { clearSession, queryClient, Wrapper } = createHarness(request);
    seedSessions(queryClient);
    const { result } = renderHook(() => useRevokeSession(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(otherSession);
    });

    expect(queryClient.getQueryData(authSessionKeys.list())).toEqual({
      items: [currentSession],
    });
    expect(clearSession).not.toHaveBeenCalled();
  });

  it("clears local auth state after revoking the current session", async () => {
    const request = vi.fn().mockResolvedValue(undefined);
    const { clearSession, queryClient, Wrapper } = createHarness(request);
    seedSessions(queryClient);
    const { result } = renderHook(() => useRevokeSession(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(currentSession);
    });

    expect(clearSession).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(authSessionKeys.list())).toBeUndefined();
  });

  it("does not alter cache when revocation fails", async () => {
    const error = new Error("request failed");
    const request = vi.fn().mockRejectedValue(error);
    const { clearSession, queryClient, Wrapper } = createHarness(request);
    seedSessions(queryClient);
    const { result } = renderHook(() => useRevokeSession(), {
      wrapper: Wrapper,
    });

    await expect(
      act(() => result.current.mutateAsync(otherSession)),
    ).rejects.toBe(error);
    expect(queryClient.getQueryData(authSessionKeys.list())).toEqual({
      items: [currentSession, otherSession],
    });
    expect(clearSession).not.toHaveBeenCalled();
  });
});
