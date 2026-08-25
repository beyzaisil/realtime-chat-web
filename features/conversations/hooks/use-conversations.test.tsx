import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import {
  AuthContext,
  type AuthContextValue,
} from "../../../providers/auth-provider";
import type { ConversationListItem } from "../types";
import { useConversations } from "./use-conversations";

const first: ConversationListItem = {
  id: "conversation-1",
  type: "DIRECT",
  title: null,
  createdAt: "2030-01-01T00:00:00.000Z",
  otherUser: { id: "user-1", username: "alice", displayName: "Alice", avatarUrl: null },
  lastMessageAt: null,
  lastMessage: null,
  unreadCount: 0,
};
const second: ConversationListItem = {
  ...first,
  id: "conversation-2",
  otherUser: { ...first.otherUser, id: "user-2", username: "bob", displayName: "Bob" },
};

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

describe("useConversations", () => {
  it("uses nextCursor and removes duplicate items while preserving order", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ items: [first], nextCursor: "opaque-cursor" })
      .mockResolvedValueOnce({ items: [first, second], nextCursor: null });
    const apiClient: ApiClient = {
      request: request as unknown as ApiClient["request"],
    };
    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(apiClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(request).toHaveBeenCalledTimes(2);
    expect(String(request.mock.calls[1]?.[0])).toContain(
      "cursor=opaque-cursor",
    );
    await waitFor(() => {
      expect(result.current.conversations.map((item) => item.id)).toEqual([
        "conversation-1",
        "conversation-2",
      ]);
    });
  });
});
