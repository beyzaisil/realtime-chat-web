import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ChatSocket } from "../../../lib/socket/create-socket";
import type { ConversationSubscriptionAck } from "../../../lib/socket/socket-events";
import { SocketContext } from "../../../providers/socket-provider";
import { useConversationSubscription } from "./use-conversation-subscription";

describe("useConversationSubscription", () => {
  it("subscribes, unsubscribes and subscribes again after reconnect", async () => {
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
    const socket = { emit } as unknown as ChatSocket;
    let connected = true;
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <SocketContext.Provider value={{ socket, isConnected: connected }}>
          {children}
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
      ).length,
    ).toBeGreaterThanOrEqual(2);
  });
});
