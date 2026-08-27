import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import {
  AuthContext,
  type AuthContextValue,
} from "../../../providers/auth-provider";
import type { MessageDto } from "../types";
import { useMessageHistory } from "./use-message-history";

function message(
  id: string,
  createdAt: string,
  overrides: Partial<MessageDto> = {},
): MessageDto {
  return {
    id,
    conversationId: "conversation-1",
    senderId: "user-2",
    clientMessageId: `client-${id}`,
    kind: "TEXT",
    body: id,
    createdAt,
    editedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

function createWrapper(apiClient: ApiClient) {
  const client = new QueryClient({
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
      <QueryClientProvider client={client}>
        <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    );
  };
}

describe("useMessageHistory", () => {
  it("loads older pages in chronological order, removes duplicates and keeps deleted messages", async () => {
    const third = message("message-3", "2030-01-03T10:00:00.000Z", {
      body: null,
      deletedAt: "2030-01-03T11:00:00.000Z",
    });
    const fourth = message("message-4", "2030-01-04T10:00:00.000Z");
    const requestMock = vi
      .fn()
      .mockResolvedValueOnce({ items: [third, fourth], nextCursor: "older-cursor" })
      .mockResolvedValueOnce({
        items: [
          message("message-1", "2030-01-01T10:00:00.000Z"),
          message("message-2", "2030-01-02T10:00:00.000Z"),
          third,
        ],
        nextCursor: null,
      });
    const apiClient: ApiClient = {
      request: requestMock as unknown as ApiClient["request"],
    };
    const { result } = renderHook(
      () => useMessageHistory("conversation-1"),
      { wrapper: createWrapper(apiClient) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.messages.map((item) => item.id)).toEqual([
      "message-3",
      "message-4",
    ]);

    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() =>
      expect(result.current.messages.map((item) => item.id)).toEqual([
        "message-1",
        "message-2",
        "message-3",
        "message-4",
      ]),
    );
    expect(result.current.messages[2]).toMatchObject({
      id: "message-3",
      body: null,
      deletedAt: "2030-01-03T11:00:00.000Z",
    });
    expect(String(requestMock.mock.calls[1]?.[0])).toContain(
      "before=older-cursor",
    );
  });
});
