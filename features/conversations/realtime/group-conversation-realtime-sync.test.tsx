import {
  QueryClient,
  QueryClientProvider,
  type InfiniteData,
} from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserDto } from "../../../lib/auth/types";
import type { ApiClient } from "../../../lib/http/api-client";
import type { ChatSocket } from "../../../lib/socket/create-socket";
import type {
  ChatServerToClientEvents,
  GroupConversationEventDto,
  GroupMemberEventDto,
} from "../../../lib/socket/socket-events";
import {
  AuthContext,
  type AuthContextValue,
} from "../../../providers/auth-provider";
import {
  SocketContext,
  type SocketContextValue,
} from "../../../providers/socket-provider";
import { messageKeys } from "../../messages/hooks/use-message-history";
import { conversationKeys } from "../hooks/use-conversations";
import type {
  Conversation,
  ConversationPage,
  ListedGroupConversation,
} from "../types";
import { GroupConversationRealtimeSync } from "./group-conversation-realtime-sync";

const navigation = vi.hoisted(() => ({
  pathname: "/chat",
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => navigation,
}));

type GroupEventName =
  | "group:created"
  | "group:updated"
  | "member:added"
  | "member:removed"
  | "member:left"
  | "member:role-updated"
  | "ownership:transferred";

type EventHandler = (payload: unknown) => void;

class FakeSocket {
  readonly onCalls: Array<{ event: GroupEventName; handler: EventHandler }> = [];
  readonly offCalls: Array<{ event: GroupEventName; handler: EventHandler }> = [];
  private readonly handlers = new Map<GroupEventName, Set<EventHandler>>();

  on(event: GroupEventName, handler: EventHandler): this {
    this.onCalls.push({ event, handler });
    const handlers = this.handlers.get(event) ?? new Set<EventHandler>();
    handlers.add(handler);
    this.handlers.set(event, handlers);
    return this;
  }

  off(event: GroupEventName, handler: EventHandler): this {
    this.offCalls.push({ event, handler });
    this.handlers.get(event)?.delete(handler);
    return this;
  }

  emit<K extends GroupEventName>(
    event: K,
    payload: Parameters<ChatServerToClientEvents[K]>[0],
  ): void {
    for (const handler of this.handlers.get(event) ?? []) {
      handler(payload);
    }
  }
}

const viewer: UserDto = {
  id: "user-1",
  email: "alice@example.com",
  username: "alice",
  displayName: "Alice",
  avatarUrl: null,
  status: "ACTIVE",
  createdAt: "2030-01-01T00:00:00.000Z",
};

const owner: GroupMemberEventDto = {
  userId: viewer.id,
  role: "OWNER",
  joinedAt: "2030-01-01T00:00:00.000Z",
  user: {
    id: viewer.id,
    username: viewer.username,
    displayName: viewer.displayName,
    avatarUrl: viewer.avatarUrl,
  },
};

const bob: GroupMemberEventDto = {
  userId: "user-2",
  role: "MEMBER",
  joinedAt: "2030-01-01T00:01:00.000Z",
  user: {
    id: "user-2",
    username: "bob",
    displayName: "Bob",
    avatarUrl: null,
  },
};

const carol: GroupMemberEventDto = {
  userId: "user-3",
  role: "MEMBER",
  joinedAt: "2030-01-01T00:02:00.000Z",
  user: {
    id: "user-3",
    username: "carol",
    displayName: "Carol",
    avatarUrl: null,
  },
};

const group: GroupConversationEventDto = {
  id: "conversation-1",
  type: "GROUP",
  title: "Product team",
  createdAt: "2030-01-01T00:00:00.000Z",
  members: [owner, bob],
};

const listedGroup: ListedGroupConversation = {
  ...group,
  lastMessageAt: "2030-01-01T00:03:00.000Z",
  lastMessage: {
    id: "message-1",
    body: "Hello",
    senderId: bob.userId,
    createdAt: "2030-01-01T00:03:00.000Z",
    deletedAt: null,
  },
  unreadCount: 2,
};

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createAuth(): AuthContextValue {
  return {
    user: viewer,
    accessToken: "access-token",
    status: "authenticated",
    apiClient: {} as ApiClient,
    setCurrentUser: vi.fn(),
    clearSession: vi.fn(),
    login: vi.fn(async () => undefined),
    register: vi.fn(async () => undefined),
    logout: vi.fn(async () => undefined),
    refresh: vi.fn(async () => true),
    bootstrap: vi.fn(async () => undefined),
  };
}

function Harness({
  queryClient,
  socketValue,
  children,
}: {
  queryClient: QueryClient;
  socketValue: SocketContextValue;
  children?: ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={createAuth()}>
        <SocketContext.Provider value={socketValue}>
          <GroupConversationRealtimeSync />
          {children}
        </SocketContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

function renderSync(queryClient = createQueryClient()) {
  const fakeSocket = new FakeSocket();
  const socketValue: SocketContextValue = {
    socket: fakeSocket as unknown as ChatSocket,
    isConnected: true,
  };
  const view = render(
    <Harness queryClient={queryClient} socketValue={socketValue} />,
  );
  return { fakeSocket, queryClient, socketValue, view };
}

function seedGroup(queryClient: QueryClient): InfiniteData<ConversationPage> {
  const list: InfiniteData<ConversationPage> = {
    pages: [{ items: [listedGroup], nextCursor: null }],
    pageParams: [null],
  };
  queryClient.setQueryData(conversationKeys.lists(), list);
  queryClient.setQueryData<Conversation>(
    conversationKeys.detail(group.id),
    group,
  );
  return list;
}

function cachedGroupDetail(queryClient: QueryClient) {
  return queryClient.getQueryData<Conversation>(
    conversationKeys.detail(group.id),
  );
}

function cachedListedGroup(queryClient: QueryClient) {
  return queryClient.getQueryData<InfiniteData<ConversationPage>>(
    conversationKeys.lists(),
  )?.pages[0]?.items[0];
}

describe("GroupConversationRealtimeSync", () => {
  beforeEach(() => {
    navigation.pathname = "/chat";
    navigation.replace.mockReset();
  });

  it("adds a group:created conversation to detail and list caches", () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData<InfiniteData<ConversationPage>>(
      conversationKeys.lists(),
      { pages: [{ items: [], nextCursor: null }], pageParams: [null] },
    );
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { fakeSocket } = renderSync(queryClient);

    act(() => fakeSocket.emit("group:created", { conversation: group }));

    expect(cachedGroupDetail(queryClient)).toEqual(group);
    expect(cachedListedGroup(queryClient)).toEqual({
      ...group,
      lastMessageAt: null,
      lastMessage: null,
      unreadCount: 0,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: conversationKeys.lists(),
    });
  });

  it("applies group:updated in place while preserving list metadata", () => {
    const queryClient = createQueryClient();
    seedGroup(queryClient);
    const { fakeSocket } = renderSync(queryClient);
    const updated = { ...group, title: "Renamed product team" };

    act(() =>
      fakeSocket.emit("group:updated", { conversation: updated }),
    );

    expect(cachedGroupDetail(queryClient)).toEqual(updated);
    expect(cachedListedGroup(queryClient)).toEqual({
      ...listedGroup,
      title: updated.title,
    });
  });

  it("adds member:added to detail and list caches", () => {
    const queryClient = createQueryClient();
    seedGroup(queryClient);
    const { fakeSocket } = renderSync(queryClient);

    act(() =>
      fakeSocket.emit("member:added", {
        conversationId: group.id,
        member: carol,
      }),
    );

    expect(cachedGroupDetail(queryClient)).toMatchObject({
      members: [owner, bob, carol],
    });
    expect(cachedListedGroup(queryClient)).toMatchObject({
      members: [owner, bob, carol],
    });
  });

  it("removes another user for member:removed", () => {
    const queryClient = createQueryClient();
    seedGroup(queryClient);
    const { fakeSocket } = renderSync(queryClient);

    act(() =>
      fakeSocket.emit("member:removed", {
        conversationId: group.id,
        userId: bob.userId,
      }),
    );

    expect(cachedGroupDetail(queryClient)).toMatchObject({ members: [owner] });
    expect(cachedListedGroup(queryClient)).toMatchObject({ members: [owner] });
  });

  it("removes another user for member:left", () => {
    const queryClient = createQueryClient();
    seedGroup(queryClient);
    const { fakeSocket } = renderSync(queryClient);

    act(() =>
      fakeSocket.emit("member:left", {
        conversationId: group.id,
        userId: bob.userId,
      }),
    );

    expect(cachedGroupDetail(queryClient)).toMatchObject({ members: [owner] });
    expect(cachedListedGroup(queryClient)).toMatchObject({ members: [owner] });
  });

  it("replaces the matching member for member:role-updated", () => {
    const queryClient = createQueryClient();
    seedGroup(queryClient);
    const { fakeSocket } = renderSync(queryClient);
    const admin = { ...bob, role: "ADMIN" as const };

    act(() =>
      fakeSocket.emit("member:role-updated", {
        conversationId: group.id,
        member: admin,
      }),
    );

    expect(cachedGroupDetail(queryClient)).toMatchObject({
      members: [owner, admin],
    });
    expect(cachedListedGroup(queryClient)).toMatchObject({
      members: [owner, admin],
    });
  });

  it("updates both roles for ownership:transferred without refetching", () => {
    const queryClient = createQueryClient();
    seedGroup(queryClient);
    const { fakeSocket } = renderSync(queryClient);

    act(() =>
      fakeSocket.emit("ownership:transferred", {
        conversationId: group.id,
        previousOwnerId: owner.userId,
        newOwnerId: bob.userId,
      }),
    );

    expect(cachedGroupDetail(queryClient)).toMatchObject({
      members: [
        expect.objectContaining({ userId: owner.userId, role: "ADMIN" }),
        expect.objectContaining({ userId: bob.userId, role: "OWNER" }),
      ],
    });
    expect(cachedListedGroup(queryClient)).toMatchObject({
      members: [
        expect.objectContaining({ userId: owner.userId, role: "ADMIN" }),
        expect.objectContaining({ userId: bob.userId, role: "OWNER" }),
      ],
    });
  });

  it("ignores a partial lifecycle event for an unrelated group", () => {
    const queryClient = createQueryClient();
    const originalList = seedGroup(queryClient);
    const originalDetail = cachedGroupDetail(queryClient);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { fakeSocket } = renderSync(queryClient);

    act(() =>
      fakeSocket.emit("member:added", {
        conversationId: "unrelated-group",
        member: carol,
      }),
    );

    expect(queryClient.getQueryData(conversationKeys.lists())).toBe(
      originalList,
    );
    expect(cachedGroupDetail(queryClient)).toBe(originalDetail);
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it("closes the active group, clears caches and informs a removed user", () => {
    navigation.pathname = `/chat/${group.id}`;
    const queryClient = createQueryClient();
    seedGroup(queryClient);
    queryClient.setQueryData(messageKeys.history(group.id), {
      pages: [],
      pageParams: [],
    });
    const { fakeSocket } = renderSync(queryClient);

    act(() =>
      fakeSocket.emit("member:removed", {
        conversationId: group.id,
        userId: viewer.id,
      }),
    );

    expect(navigation.replace).toHaveBeenCalledWith("/chat");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Bu gruptan çıkarıldın.",
    );
    expect(cachedGroupDetail(queryClient)).toBeUndefined();
    expect(queryClient.getQueryData(messageKeys.history(group.id))).toBeUndefined();
    expect(
      queryClient.getQueryData<InfiniteData<ConversationPage>>(
        conversationKeys.lists(),
      )?.pages[0]?.items,
    ).toEqual([]);
  });

  it("clears the group caches when the current user leaves", () => {
    const queryClient = createQueryClient();
    seedGroup(queryClient);
    const { fakeSocket } = renderSync(queryClient);

    act(() =>
      fakeSocket.emit("member:left", {
        conversationId: group.id,
        userId: viewer.id,
      }),
    );

    expect(cachedGroupDetail(queryClient)).toBeUndefined();
    expect(screen.getByRole("alert")).toHaveTextContent("Gruptan ayrıldın.");
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(
      queryClient.getQueryData<InfiniteData<ConversationPage>>(
        conversationKeys.lists(),
      )?.pages[0]?.items,
    ).toEqual([]);
  });

  it("removes every listener with its original handler reference", () => {
    const { fakeSocket, view } = renderSync();
    const registered = [...fakeSocket.onCalls];

    view.unmount();

    expect(fakeSocket.offCalls).toEqual(registered);
  });

  it("continues handling events after disconnect and reconnect", () => {
    const queryClient = createQueryClient();
    seedGroup(queryClient);
    const { fakeSocket, socketValue, view } = renderSync(queryClient);

    view.rerender(
      <Harness
        queryClient={queryClient}
        socketValue={{ ...socketValue, isConnected: false }}
      />,
    );
    view.rerender(
      <Harness queryClient={queryClient} socketValue={socketValue} />,
    );

    act(() =>
      fakeSocket.emit("group:updated", {
        conversation: { ...group, title: "After reconnect" },
      }),
    );

    expect(cachedGroupDetail(queryClient)).toMatchObject({
      title: "After reconnect",
    });
    expect(
      fakeSocket.onCalls.filter(({ event }) => event === "group:updated"),
    ).toHaveLength(1);
  });
});
