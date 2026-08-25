import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ChatSocket } from "../../../lib/socket/create-socket";
import type { TypingUpdatedPayload } from "../../../lib/socket/socket-events";
import { SocketContext } from "../../../providers/socket-provider";
import { TYPING_IDLE_MS, useTyping } from "./use-typing";

describe("useTyping", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T10:00:00.000Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("emits throttled true/false and expires the remote indicator", () => {
    let typingHandler: ((payload: TypingUpdatedPayload) => void) | null = null;
    const emit = vi.fn();
    const on = vi.fn((event: string, handler: unknown) => {
      if (event === "typing:updated") {
        typingHandler = handler as (payload: TypingUpdatedPayload) => void;
      }
    });
    const off = vi.fn();
    const socket = { emit, on, off } as unknown as ChatSocket;
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <SocketContext.Provider value={{ socket, isConnected: true }}>
          {children}
        </SocketContext.Provider>
      );
    }
    const view = renderHook(
      () => useTyping("conversation-1", "user-2", true),
      { wrapper: Wrapper },
    );

    act(() => {
      view.result.current.updateTyping("m");
      view.result.current.updateTyping("me");
    });
    expect(emit.mock.calls.filter(([event]) => event === "typing:set")).toEqual([
      ["typing:set", { conversationId: "conversation-1", isTyping: true }],
    ]);

    act(() => vi.advanceTimersByTime(TYPING_IDLE_MS));
    expect(emit).toHaveBeenCalledWith("typing:set", {
      conversationId: "conversation-1",
      isTyping: false,
    });

    act(() => {
      typingHandler?.({
        conversationId: "conversation-1",
        userId: "user-2",
        isTyping: true,
        expiresAt: "2030-01-01T10:00:05.000Z",
      });
    });
    expect(view.result.current.isOtherUserTyping).toBe(true);
    act(() => vi.advanceTimersByTime(3_801));
    expect(view.result.current.isOtherUserTyping).toBe(false);

    view.unmount();
    expect(off).toHaveBeenCalledWith("typing:updated", expect.any(Function));
  });
});
