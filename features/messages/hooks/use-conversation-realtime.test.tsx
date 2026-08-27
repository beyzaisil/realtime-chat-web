import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ChatSocket } from "../../../lib/socket/create-socket";
import type {
  MessageEventDto,
  ReadUpdatedPayload,
} from "../../../lib/socket/socket-events";
import { SocketContext } from "../../../providers/socket-provider";
import type { MessageHistoryPage } from "../types";
import { flattenMessageHistory, type MessageHistoryData } from "./message-cache";
import { useConversationRealtime } from "./use-conversation-realtime";
import { messageKeys } from "./use-message-history";

describe("useConversationRealtime", () => {
  it("adds only active-conversation messages and deduplicates REST/socket delivery", () => {
    let messageHandler: ((payload: { message: MessageEventDto }) => void) | null = null;
    let readHandler: ((payload: ReadUpdatedPayload) => void) | null = null;
    const on = vi.fn((event: string, handler: unknown) => {
      if (event === "message:created") {
        messageHandler = handler as (payload: { message: MessageEventDto }) => void;
      }
      if (event === "read:updated") {
        readHandler = handler as (payload: ReadUpdatedPayload) => void;
      }
    });
    const off = vi.fn();
    const socket = { on, off } as unknown as ChatSocket;
    const queryClient = new QueryClient();
    const existing: MessageEventDto = {
      id: "message-1",
      conversationId: "conversation-1",
      senderId: "user-1",
      clientMessageId: "client-1",
      kind: "TEXT",
      body: "REST response",
      createdAt: "2030-01-01T10:00:00.000Z",
      editedAt: null,
      deletedAt: null,
    };
    const initial: MessageHistoryData = {
      pages: [
        { items: [existing], nextCursor: null } satisfies MessageHistoryPage,
      ],
      pageParams: [null],
    };
    queryClient.setQueryData(messageKeys.history("conversation-1"), initial);

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <SocketContext.Provider value={{ socket, isConnected: true }}>
            {children}
          </SocketContext.Provider>
        </QueryClientProvider>
      );
    }
    const view = renderHook(
      () => useConversationRealtime("conversation-1"),
      { wrapper: Wrapper },
    );

    act(() => {
      messageHandler?.({ message: existing });
      messageHandler?.({
        message: {
          ...existing,
          id: "message-other",
          clientMessageId: "client-other",
          conversationId: "conversation-2",
        },
      });
      messageHandler?.({
        message: {
          ...existing,
          id: "message-2",
          clientMessageId: "client-2",
          senderId: "user-2",
          body: "Realtime message",
          createdAt: "2030-01-01T10:01:00.000Z",
        },
      });
      readHandler?.({
        conversationId: "conversation-1",
        readerId: "user-2",
        throughMessageId: "message-2",
        readAt: "2030-01-01T10:02:00.000Z",
      });
    });

    const cached = queryClient.getQueryData<MessageHistoryData>(
      messageKeys.history("conversation-1"),
    );
    expect(flattenMessageHistory(cached).map((message) => message.id)).toEqual([
      "message-1",
      "message-2",
    ]);
    expect(view.result.current.latestReadUpdate?.throughMessageId).toBe(
      "message-2",
    );
    view.unmount();
    expect(off).toHaveBeenCalledWith("message:created", expect.any(Function));
    expect(off).toHaveBeenCalledWith("read:updated", expect.any(Function));
  });
});
