import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import {
  AuthContext,
  type AuthContextValue,
} from "../../../providers/auth-provider";
import { useUserSearch } from "./use-user-search";

function createWrapper(apiClient: ApiClient) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const auth = {
    user: null,
    accessToken: "token",
    status: "authenticated",
    apiClient,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    bootstrap: vi.fn(),
  } as unknown as AuthContextValue;

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    );
  };
}

describe("useUserSearch", () => {
  it("does not request for blank/short input and searches after debounce", async () => {
    const requestMock = vi.fn().mockResolvedValue({
      items: [
        {
          id: "user-2",
          username: "alice",
          displayName: "Alice",
          avatarUrl: null,
        },
      ],
      nextCursor: null,
    });
    const apiClient: ApiClient = {
      request: requestMock as unknown as ApiClient["request"],
    };
    const { result, rerender } = renderHook(
      ({ query }: { query: string }) => useUserSearch(query),
      { wrapper: createWrapper(apiClient), initialProps: { query: "" } },
    );

    rerender({ query: "a" });
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    expect(requestMock).not.toHaveBeenCalled();

    rerender({ query: "al" });
    expect(requestMock).not.toHaveBeenCalled();

    await waitFor(() => expect(requestMock).toHaveBeenCalledOnce());
    expect(String(requestMock.mock.calls[0]?.[0])).toContain("query=al");
    await waitFor(() => expect(result.current.users).toHaveLength(1));
  });
});
