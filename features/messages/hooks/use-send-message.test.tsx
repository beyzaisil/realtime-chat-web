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
import { flattenMessageHistory, type MessageHistoryData } from "./message-cache";
import { messageKeys } from "./use-message-history";
import { useSendMediaMessage, useSendMessage } from "./use-send-message";

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

describe("useSendMessage", () => {
  it("does not send blank content", async () => {
    const requestMock = vi.fn();
    const { Wrapper } = createHarness({
      request: requestMock as unknown as ApiClient["request"],
    });
    const { result } = renderHook(
      () => useSendMessage("conversation-1"),
      { wrapper: Wrapper },
    );

    await expect(
      act(() => result.current.mutateAsync({ text: "   " })),
    ).rejects.toThrow("Invalid message content");
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("posts a UUID body and upserts the successful response into cache", async () => {
    const clientMessageId = "11111111-1111-4111-8111-111111111111";
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(clientMessageId);
    const response: MessageDto = {
      id: "message-1",
      conversationId: "conversation-1",
      senderId: "user-1",
      clientMessageId,
      kind: "TEXT",
      body: "Merhaba",
      createdAt: "2030-01-01T10:00:00.000Z",
      editedAt: null,
      deletedAt: null,
    };
    const requestMock = vi.fn().mockResolvedValue(response);
    const { queryClient, Wrapper } = createHarness({
      request: requestMock as unknown as ApiClient["request"],
    });
    const { result } = renderHook(
      () => useSendMessage("conversation-1"),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({ text: "  Merhaba  " });
    });

    expect(requestMock).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation-1/messages",
      {
        method: "POST",
        json: {
          clientMessageId,
          content: { type: "text", text: "Merhaba" },
        },
      },
    );
    await waitFor(() => {
      const cached = queryClient.getQueryData<MessageHistoryData>(
        messageKeys.history("conversation-1"),
      );
      expect(flattenMessageHistory(cached)).toEqual([response]);
    });
  });

  it("creates a MEDIA message and upserts it into the same history cache", async () => {
    const clientMessageId = "22222222-2222-4222-8222-222222222222";
    const response: MessageDto = {
      id: "message-media",
      conversationId: "conversation-1",
      senderId: "user-1",
      clientMessageId,
      kind: "MEDIA",
      body: "Tatil",
      attachments: [
        {
          id: "attachment-1",
          kind: "PDF",
          originalFileName: "report.pdf",
          contentType: "application/pdf",
          url: "/attachments/attachment-1/original",
        },
      ],
      createdAt: "2030-01-01T10:00:00.000Z",
      editedAt: null,
      deletedAt: null,
    };
    const requestMock = vi.fn().mockResolvedValue(response);
    const { queryClient, Wrapper } = createHarness({
      request: requestMock as unknown as ApiClient["request"],
    });
    const { result } = renderHook(
      () => useSendMediaMessage("conversation-1"),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({
        attachmentIds: ["attachment-1"],
        clientMessageId,
        text: "  Tatil  ",
      });
    });

    expect(requestMock).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation-1/messages",
      {
        method: "POST",
        json: {
          clientMessageId,
          content: {
            type: "media",
            attachmentIds: ["attachment-1"],
            text: "Tatil",
          },
        },
      },
    );
    expect(
      flattenMessageHistory(
        queryClient.getQueryData(messageKeys.history("conversation-1")),
      ),
    ).toEqual([response]);
  });
});
