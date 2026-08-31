import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ChatSocket } from "../../../lib/socket/create-socket";
import type {
  ConversationSubscriptionAck,
  MessageEventDto,
} from "../../../lib/socket/socket-events";
import { SocketContext } from "../../../providers/socket-provider";
import { ConversationSubscriptionProvider } from "../../messages/providers/conversation-subscription-provider";
import { conversationKeys } from "./use-conversations";
import { useConversationListRealtime } from "./use-conversation-list-realtime";

const message: MessageEventDto = {
  id: "message-1",
  conversationId: "conversation-1",
  senderId: "user-1",
  clientMessageId: "client-1",
  kind: "TEXT",
  body: "Yeni mesaj",
  createdAt: "2030-01-01T10:00:00.000Z",
  editedAt: null,
  deletedAt: null,
};

describe("useConversationListRealtime", () => {
  it("invalidates subscribed conversation rows for every message lifecycle event", async () => {
    const messageHandlers = new Map<
      string,
      (payload: { message: MessageEventDto }) => void
    >();
    const on = vi.fn((event: string, handler: unknown) => {
      if (event.startsWith("message:")) {
        messageHandlers.set(
          event,
          handler as (payload: { message: MessageEventDto }) => void,
        );
      }
    });
    const off = vi.fn();
    const emit = vi.fn(
      (
        event: string,
        _payload: { conversationId: string },
        acknowledge: (response: ConversationSubscriptionAck) => void,
      ) => {
        acknowledge({ ok: true });
        return event;
      },
    );
    const socket = { emit, off, on } as unknown as ChatSocket;
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <SocketContext.Provider value={{ socket, isConnected: true }}>
            <ConversationSubscriptionProvider>
              {children}
            </ConversationSubscriptionProvider>
          </SocketContext.Provider>
        </QueryClientProvider>
      );
    }

    const view = renderHook(
      () => useConversationListRealtime(["conversation-1"]),
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(emit).toHaveBeenCalledWith(
        "conversation:subscribe",
        { conversationId: "conversation-1" },
        expect.any(Function),
      );
    });

    for (const event of [
      "message:created",
      "message:updated",
      "message:deleted",
    ]) {
      act(() => {
        messageHandlers.get(event)?.({ message });
      });
    }
    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    expect(invalidateQueries).toHaveBeenLastCalledWith({
      queryKey: conversationKeys.lists(),
    });

    act(() => {
      messageHandlers.get("message:deleted")?.({
        message: { ...message, conversationId: "conversation-other" },
      });
    });
    expect(invalidateQueries).toHaveBeenCalledTimes(3);

    view.unmount();
    for (const event of [
      "message:created",
      "message:updated",
      "message:deleted",
    ]) {
      expect(off).toHaveBeenCalledWith(event, messageHandlers.get(event));
    }
    expect(messageHandlers.get("message:created")).toBe(
      messageHandlers.get("message:updated"),
    );
    expect(messageHandlers.get("message:updated")).toBe(
      messageHandlers.get("message:deleted"),
    );
  });
});
