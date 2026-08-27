import { render, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ChatSocket } from "../../../lib/socket/create-socket";
import type { ConversationSubscriptionAck } from "../../../lib/socket/socket-events";
import { SocketContext } from "../../../providers/socket-provider";
import { ConversationSubscriptionProvider } from "../providers/conversation-subscription-provider";
import { useConversationSubscription } from "./use-conversation-subscription";

function createSocket() {
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
  return {
    emit,
    socket: { emit } as unknown as ChatSocket,
  };
}

describe("useConversationSubscription", () => {
  it("subscribes again after reconnect", async () => {
    const { emit, socket } = createSocket();
    let connected = true;
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <SocketContext.Provider value={{ socket, isConnected: connected }}>
          <ConversationSubscriptionProvider>
            {children}
          </ConversationSubscriptionProvider>
        </SocketContext.Provider>
      );
    }

    const view = renderHook(
      () => useConversationSubscription("conversation-1"),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(view.result.current).toBe(true));
    expect(
      emit.mock.calls.filter(([event]) => event === "conversation:subscribe"),
    ).toHaveLength(1);

    connected = false;
    view.rerender();
    await waitFor(() => expect(view.result.current).toBe(false));

    connected = true;
    view.rerender();
    await waitFor(() => {
      expect(
        emit.mock.calls.filter(
          ([event]) => event === "conversation:subscribe",
        ),
      ).toHaveLength(2);
    });

    view.unmount();
    expect(
      emit.mock.calls.filter(
        ([event]) => event === "conversation:unsubscribe",
      ),
    ).toHaveLength(1);
  });

  it("keeps a shared room until the last consumer releases it", async () => {
    const { emit, socket } = createSocket();
    function Subscriber() {
      useConversationSubscription("conversation-1");
      return null;
    }
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <SocketContext.Provider value={{ socket, isConnected: true }}>
          <ConversationSubscriptionProvider>
            {children}
          </ConversationSubscriptionProvider>
        </SocketContext.Provider>
      );
    }

    const view = render(
      <Wrapper>
        <Subscriber />
        <Subscriber />
      </Wrapper>,
    );
    await waitFor(() => {
      expect(
        emit.mock.calls.filter(
          ([event]) => event === "conversation:subscribe",
        ),
      ).toHaveLength(1);
    });

    view.rerender(
      <Wrapper>
        <Subscriber />
      </Wrapper>,
    );
    expect(
      emit.mock.calls.filter(
        ([event]) => event === "conversation:unsubscribe",
      ),
    ).toHaveLength(0);

    view.unmount();
    expect(
      emit.mock.calls.filter(
        ([event]) => event === "conversation:unsubscribe",
      ),
    ).toHaveLength(1);
  });
});
