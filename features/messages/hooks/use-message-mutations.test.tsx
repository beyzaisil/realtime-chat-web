import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import {
  AuthContext,
  type AuthContextValue,
} from "../../../providers/auth-provider";
import { conversationKeys } from "../../conversations/hooks/use-conversations";
import type { MessageDto } from "../types";
import {
  flattenMessageHistory,
  replaceMessageInHistory,
  type MessageHistoryData,
} from "./message-cache";
import { useDeleteMessage } from "./use-delete-message";
import { messageKeys } from "./use-message-history";
import { useUpdateMessage } from "./use-update-message";

const original: MessageDto = {
  id: "message-1",
  conversationId: "conversation-1",
  senderId: "user-1",
  clientMessageId: "client-1",
  kind: "TEXT",
  body: "İlk mesaj",
  createdAt: "2030-01-01T10:00:00.000Z",
  editedAt: null,
  deletedAt: null,
};

function history(message: MessageDto = original): MessageHistoryData {
  return {
    pages: [{ items: [message], nextCursor: null }],
    pageParams: [null],
  };
}

function createHarness(apiClient: ApiClient) {
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
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    );
  }
  return { queryClient, Wrapper };
}

describe("message mutation hooks", () => {
  it("trims update text, replaces the cached message and invalidates conversations", async () => {
    const updated: MessageDto = {
      ...original,
      body: "Güncellenmiş mesaj",
      editedAt: "2030-01-01T10:05:00.000Z",
    };
    const request = vi.fn().mockResolvedValue(updated);
    const { queryClient, Wrapper } = createHarness({
      request: request as unknown as ApiClient["request"],
    });
    queryClient.setQueryData(
      messageKeys.history("conversation-1"),
      history(),
    );
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useUpdateMessage("conversation-1"),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({
        messageId: "message-1",
        kind: "TEXT",
        text: "  Güncellenmiş mesaj  ",
      });
    });

    expect(request).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation-1/messages/message-1",
      {
        method: "PATCH",
        json: {
          content: { type: "text", text: "Güncellenmiş mesaj" },
        },
      },
    );
    expect(
      flattenMessageHistory(
        queryClient.getQueryData(messageKeys.history("conversation-1")),
      ),
    ).toEqual([updated]);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: conversationKeys.lists(),
    });
  });

  it("uses the media caption request shape for a MEDIA message", async () => {
    const media: MessageDto = {
      ...original,
      id: "message-media",
      clientMessageId: "client-media",
      kind: "MEDIA",
      body: null,
      attachments: [
        {
          id: "attachment-1",
          kind: "PDF",
          originalFileName: "document.pdf",
          contentType: "application/pdf",
          url: "/attachments/attachment-1/original",
        },
      ],
    };
    const request = vi.fn().mockResolvedValue({
      ...media,
      body: "Yeni başlık",
      editedAt: "2030-01-01T10:05:00.000Z",
    });
    const { Wrapper } = createHarness({
      request: request as unknown as ApiClient["request"],
    });
    const { result } = renderHook(
      () => useUpdateMessage("conversation-1"),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({
        messageId: media.id,
        kind: media.kind,
        text: "  Yeni başlık  ",
      });
    });

    expect(request).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation-1/messages/message-media",
      {
        method: "PATCH",
        json: {
          content: { type: "media", text: "Yeni başlık" },
        },
      },
    );
  });

  it("replaces a deleted message with its tombstone", async () => {
    const deleted: MessageDto = {
      ...original,
      body: null,
      deletedAt: "2030-01-01T10:06:00.000Z",
    };
    const request = vi.fn().mockResolvedValue(deleted);
    const { queryClient, Wrapper } = createHarness({
      request: request as unknown as ApiClient["request"],
    });
    queryClient.setQueryData(
      messageKeys.history("conversation-1"),
      history(),
    );
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useDeleteMessage("conversation-1"),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({ messageId: "message-1" });
    });

    expect(
      flattenMessageHistory(
        queryClient.getQueryData(messageKeys.history("conversation-1")),
      ),
    ).toEqual([deleted]);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: conversationKeys.lists(),
    });
  });

  it.each(["   ", "x".repeat(4_001)])(
    "rejects invalid update text before the request",
    async (text) => {
      const request = vi.fn();
      const { Wrapper } = createHarness({
        request: request as unknown as ApiClient["request"],
      });
      const { result } = renderHook(
        () => useUpdateMessage("conversation-1"),
        { wrapper: Wrapper },
      );

      await expect(
        act(() =>
          result.current.mutateAsync({
            messageId: "message-1",
            kind: "TEXT",
            text,
          }),
        ),
      ).rejects.toThrow("Invalid message content");
      expect(request).not.toHaveBeenCalled();
    },
  );

  it("applies the same response repeatedly without creating duplicates", () => {
    const updated: MessageDto = {
      ...original,
      body: "Tek sonuç",
      editedAt: "2030-01-01T10:05:00.000Z",
    };

    const once = replaceMessageInHistory(history(), updated);
    const twice = replaceMessageInHistory(once, updated);

    expect(flattenMessageHistory(twice)).toEqual([updated]);
    expect(flattenMessageHistory(twice)).toHaveLength(1);
  });
});
