import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ChatSocket } from "../../../lib/socket/create-socket";
import type {
  PresenceSubscriptionAck,
  PresenceUpdatedPayload,
} from "../../../lib/socket/socket-events";
import { SocketContext } from "../../../providers/socket-provider";
import { useConversationPresence } from "./use-conversation-presence";

type PresenceHandler = (payload: PresenceUpdatedPayload) => void;

function createFakeSocket() {
  const handlers = new Set<PresenceHandler>();
  const on = vi.fn((event: string, handler: PresenceHandler) => {
    if (event === "presence:updated") handlers.add(handler);
  });
  const off = vi.fn((event: string, handler: PresenceHandler) => {
    if (event === "presence:updated") handlers.delete(handler);
  });
  const emit = vi.fn(
    (
      event: string,
      _payload: { userIds: string[] },
      acknowledge: (response: PresenceSubscriptionAck) => void,
    ) => {
      if (event === "presence:subscribe") {
        acknowledge({
          ok: true,
          data: {
            "user-2": { status: "online", lastSeenAt: null },
          },
        });
      }
    },
  );
  const socket = { on, off, emit } as unknown as ChatSocket;

  return {
    socket,
    on,
    off,
    emit,
    publish(update: PresenceUpdatedPayload) {
      for (const handler of handlers) handler(update);
    },
  };
}

function Probe() {
  const presence = useConversationPresence(["user-2"]);
  return <span>{presence["user-2"]?.status ?? "unknown"}</span>;
}

describe("useConversationPresence", () => {
  it("applies snapshots, handles updates and cleans up its listener", async () => {
    const fake = createFakeSocket();
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <SocketContext.Provider
          value={{ socket: fake.socket, isConnected: true }}
        >
          {children}
        </SocketContext.Provider>
      );
    }

    const view = render(<Probe />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByText("online")).toBeInTheDocument());
    expect(fake.emit).toHaveBeenCalledWith(
      "presence:subscribe",
      { userIds: ["user-2"] },
      expect.any(Function),
    );

    act(() => {
      fake.publish({
        userId: "user-2",
        status: "offline",
        lastSeenAt: "2030-01-01T00:00:00.000Z",
      });
    });
    expect(screen.getByText("offline")).toBeInTheDocument();

    const registration = fake.on.mock.calls.find(
      ([event]) => event === "presence:updated",
    );
    view.unmount();
    expect(fake.off).toHaveBeenCalledWith(
      "presence:updated",
      registration?.[1],
    );
  });
});
