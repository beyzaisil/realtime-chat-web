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
import { conversationKeys } from "../../conversations/hooks/use-conversations";
import type { MessageHistoryPage } from "../types";
import {
  flattenMessageHistory,
  type MessageHistoryData,
} from "./message-cache";
import { useConversationRealtime } from "./use-conversation-realtime";
import { messageKeys } from "./use-message-history";

type MessageEventName =
  | "message:created"
  | "message:updated"
  | "message:deleted";
type MessageHandler = (payload: { message: MessageEventDto }) => void;

function createMessage(
  overrides: Partial<MessageEventDto> = {},
): MessageEventDto {
  return {
    id: "message-1",
    conversationId: "conversation-1",
    senderId: "user-1",
    clientMessageId: "client-1",
    kind: "TEXT",
    body: "Original message",
    createdAt: "2030-01-01T10:00:00.000Z",
    editedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

function createHistory(messages: MessageEventDto[]): MessageHistoryData {
  return {
    pages: [
      { items: messages, nextCursor: null } satisfies MessageHistoryPage,
    ],
    pageParams: [null],
  };
}

function createHarness(initialMessages: MessageEventDto[] = []) {
  const listeners = new Map<string, unknown>();
  const on = vi.fn((event: string, handler: unknown) => {
    listeners.set(event, handler);
  });
  const off = vi.fn();
  const socket = { on, off } as unknown as ChatSocket;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

  queryClient.setQueryData(
    messageKeys.history("conversation-1"),
    createHistory(initialMessages),
  );

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

  const emitMessage = (
    event: MessageEventName,
    message: MessageEventDto,
  ): void => {
    const handler = listeners.get(event) as MessageHandler | undefined;
    expect(handler).toBeTypeOf("function");
    act(() => handler?.({ message }));
  };

  const emitRead = (payload: ReadUpdatedPayload): void => {
    const handler = listeners.get("read:updated") as
      | ((update: ReadUpdatedPayload) => void)
      | undefined;
    expect(handler).toBeTypeOf("function");
    act(() => handler?.(payload));
  };

  const messages = (): MessageEventDto[] =>
    flattenMessageHistory(
      queryClient.getQueryData<MessageHistoryData>(
        messageKeys.history("conversation-1"),
      ),
    );

  return {
    emitMessage,
    emitRead,
    invalidateQueries,
    listeners,
    messages,
    off,
    queryClient,
    view,
  };
}

describe("useConversationRealtime", () => {
  it("keeps message:created behavior and the read update regression covered", () => {
    const existing = createMessage();
    const realtime = createMessage({
      id: "message-2",
      clientMessageId: "client-2",
      senderId: "user-2",
      body: "Realtime message",
      createdAt: "2030-01-01T10:01:00.000Z",
    });
    const harness = createHarness([existing]);

    harness.emitMessage("message:created", realtime);
    harness.emitRead({
      conversationId: "conversation-1",
      readerId: "user-2",
      throughMessageId: "message-2",
      readAt: "2030-01-01T10:02:00.000Z",
    });

    expect(harness.messages().map((message) => message.id)).toEqual([
      "message-1",
      "message-2",
    ]);
    expect(harness.view.result.current.latestReadUpdate?.throughMessageId).toBe(
      "message-2",
    );
  });

  it("replaces an updated message in place", () => {
    const first = createMessage();
    const second = createMessage({
      id: "message-2",
      clientMessageId: "client-2",
      body: "Second message",
      createdAt: "2030-01-01T10:01:00.000Z",
    });
    const harness = createHarness([first, second]);

    harness.emitMessage("message:updated", {
      ...first,
      body: "Edited message",
      editedAt: "2030-01-01T10:03:00.000Z",
    });

    expect(harness.messages().map((message) => message.id)).toEqual([
      "message-1",
      "message-2",
    ]);
    expect(harness.messages()[0]).toMatchObject({
      id: "message-1",
      body: "Edited message",
      editedAt: "2030-01-01T10:03:00.000Z",
    });
  });

  it("turns a deleted message into a tombstone without removing it", () => {
    const original = createMessage({ body: "Sensitive old body" });
    const harness = createHarness([original]);

    harness.emitMessage("message:deleted", {
      ...original,
      body: null,
      deletedAt: "2030-01-01T10:05:00.000Z",
    });

    expect(harness.messages()).toHaveLength(1);
    expect(harness.messages()[0]).toMatchObject({
      id: "message-1",
      body: null,
      deletedAt: "2030-01-01T10:05:00.000Z",
    });
  });

  it("ignores lifecycle events from another conversation", () => {
    const original = createMessage();
    const harness = createHarness([original]);

    harness.emitMessage("message:updated", {
      ...original,
      conversationId: "conversation-2",
      body: "Wrong conversation",
      editedAt: "2030-01-01T10:03:00.000Z",
    });

    expect(harness.messages()).toEqual([original]);
    expect(harness.invalidateQueries).not.toHaveBeenCalled();
  });

  it("does not duplicate a message delivered first by REST and then by socket", () => {
    const restResponse = createMessage({ body: "REST response" });
    const harness = createHarness([restResponse]);

    harness.emitMessage("message:created", restResponse);
    harness.emitMessage("message:updated", {
      ...restResponse,
      body: "Updated REST response",
      editedAt: "2030-01-01T10:03:00.000Z",
    });

    expect(harness.messages()).toHaveLength(1);
    expect(harness.messages()[0]?.body).toBe("Updated REST response");
  });

  it("invalidates the conversation list after every active lifecycle event", () => {
    const original = createMessage();
    const created = createMessage({
      id: "message-2",
      clientMessageId: "client-2",
    });
    const harness = createHarness([original]);

    harness.emitMessage("message:created", created);
    harness.emitMessage("message:updated", {
      ...original,
      body: "Edited message",
      editedAt: "2030-01-01T10:03:00.000Z",
    });
    harness.emitMessage("message:deleted", {
      ...original,
      body: null,
      deletedAt: "2030-01-01T10:05:00.000Z",
    });

    expect(harness.invalidateQueries).toHaveBeenCalledTimes(3);
    expect(harness.invalidateQueries).toHaveBeenCalledWith({
      queryKey: conversationKeys.lists(),
    });
  });

  it("removes every listener with the same handler reference", () => {
    const harness = createHarness();
    const eventNames = [
      "message:created",
      "message:updated",
      "message:deleted",
      "read:updated",
    ] as const;
    const registeredHandlers = new Map(
      eventNames.map((event) => [event, harness.listeners.get(event)]),
    );

    expect(registeredHandlers.get("message:updated")).toBe(
      registeredHandlers.get("message:deleted"),
    );
    harness.view.unmount();

    for (const event of eventNames) {
      expect(harness.off).toHaveBeenCalledWith(
        event,
        registeredHandlers.get(event),
      );
    }
  });
});
