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
  it("subscribes list rooms and invalidates the list for an incoming message", async () => {
    let messageHandler:
      | ((payload: { message: MessageEventDto }) => void)
      | null = null;
    const on = vi.fn((event: string, handler: unknown) => {
      if (event === "message:created") {
        messageHandler = handler as (payload: {
          message: MessageEventDto;
        }) => void;
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

    act(() => {
      messageHandler?.({ message });
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: conversationKeys.lists(),
    });

    act(() => {
      messageHandler?.({
        message: { ...message, conversationId: "conversation-other" },
      });
    });
    expect(invalidateQueries).toHaveBeenCalledTimes(1);

    view.unmount();
    expect(off).toHaveBeenCalledWith("message:created", expect.any(Function));
  });
});
