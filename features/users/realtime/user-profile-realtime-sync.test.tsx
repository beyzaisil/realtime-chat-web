import {
  QueryClient,
  QueryClientProvider,
  type InfiniteData,
} from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { UserDto } from "../../../lib/auth/types";
import type { ApiClient } from "../../../lib/http/api-client";
import type { ChatSocket } from "../../../lib/socket/create-socket";
import type {
  ChatServerToClientEvents,
  UserUpdatedEventDto,
} from "../../../lib/socket/socket-events";
import {
  AuthContext,
  type AuthContextValue,
} from "../../../providers/auth-provider";
import {
  SocketContext,
  type SocketContextValue,
} from "../../../providers/socket-provider";
import { conversationKeys } from "../../conversations/hooks/use-conversations";
import type {
  Conversation,
  ConversationListItem,
  ConversationPage,
} from "../../conversations/types";
import { userSearchKeys } from "../hooks/use-user-search";
import type { UserSearchPage } from "../types";
import { UserProfileRealtimeSync } from "./user-profile-realtime-sync";

type UserUpdatedHandler = ChatServerToClientEvents["user:updated"];

class FakeSocket {
  readonly onCalls: UserUpdatedHandler[] = [];
  readonly offCalls: UserUpdatedHandler[] = [];
  private readonly handlers = new Set<UserUpdatedHandler>();

  on(event: string, handler: UserUpdatedHandler): this {
    if (event === "user:updated") {
      this.onCalls.push(handler);
      this.handlers.add(handler);
    }
    return this;
  }

  off(event: string, handler: UserUpdatedHandler): this {
    if (event === "user:updated") {
      this.offCalls.push(handler);
      this.handlers.delete(handler);
    }
    return this;
  }

  emitUserUpdated(user: UserUpdatedEventDto): void {
    for (const handler of this.handlers) {
      handler({ user });
    }
  }
}

const viewer: UserDto = {
  id: "viewer-1",
  email: "viewer@example.com",
  username: "viewer",
  displayName: "Viewer",
  avatarUrl: null,
  status: "ACTIVE",
  createdAt: "2030-01-01T00:00:00.000Z",
};

const alice = {
  id: "user-alice",
  username: "alice",
  displayName: "Alice",
  avatarUrl: null,
};

const bob = {
  id: "user-bob",
  username: "bob",
  displayName: "Bob",
  avatarUrl: null,
};

const directAlice = {
  id: "direct-alice",
  type: "DIRECT",
  title: null,
  createdAt: "2030-01-01T00:00:00.000Z",
  otherUser: alice,
  lastMessageAt: null,
  lastMessage: null,
  unreadCount: 0,
} satisfies ConversationListItem;

const directBob = {
  ...directAlice,
  id: "direct-bob",
  otherUser: bob,
} satisfies ConversationListItem;

const group = {
  id: "group-1",
  type: "GROUP",
  title: "Product team",
  createdAt: "2030-01-01T00:00:00.000Z",
  members: [
    {
      userId: alice.id,
      role: "MEMBER",
      joinedAt: "2030-01-01T00:00:00.000Z",
      user: alice,
    },
    {
      userId: bob.id,
      role: "OWNER",
      joinedAt: "2030-01-01T00:00:00.000Z",
      user: bob,
    },
  ],
  lastMessageAt: null,
  lastMessage: null,
  unreadCount: 0,
} satisfies ConversationListItem;

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createAuth(
  user: UserDto | null,
  setCurrentUser = vi.fn(),
): AuthContextValue {
  return {
    user,
    accessToken: "access-token",
    status: "authenticated",
    apiClient: {} as ApiClient,
    setCurrentUser,
    clearSession: vi.fn(),
    login: vi.fn(async () => undefined),
    register: vi.fn(async () => undefined),
    logout: vi.fn(async () => undefined),
    refresh: vi.fn(async () => true),
    bootstrap: vi.fn(async () => undefined),
  };
}

function Harness({
  auth,
  queryClient,
  socketValue,
  children,
}: {
  auth: AuthContextValue;
  queryClient: QueryClient;
  socketValue: SocketContextValue;
  children?: ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <SocketContext.Provider value={socketValue}>
          <UserProfileRealtimeSync />
          {children}
        </SocketContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

function seedUserCaches(queryClient: QueryClient): {
  list: InfiniteData<ConversationPage>;
  search: InfiniteData<UserSearchPage>;
  directDetail: Conversation;
  groupDetail: Conversation;
} {
  const list: InfiniteData<ConversationPage> = {
    pages: [
      {
        items: [directAlice, directBob, group],
        nextCursor: null,
      },
    ],
    pageParams: [null],
  };
  const search: InfiniteData<UserSearchPage> = {
    pages: [{ items: [alice, bob], nextCursor: null }],
    pageParams: [null],
  };
  const directDetail: Conversation = {
    id: directAlice.id,
    type: "DIRECT",
    title: null,
    createdAt: directAlice.createdAt,
    otherUser: alice,
  };
  const groupDetail: Conversation = {
    id: group.id,
    type: "GROUP",
    title: group.title,
    createdAt: group.createdAt,
    members: group.members,
  };

  queryClient.setQueryData(conversationKeys.lists(), list);
  queryClient.setQueryData(
    conversationKeys.detail(directDetail.id),
    directDetail,
  );
  queryClient.setQueryData(
    conversationKeys.detail(groupDetail.id),
    groupDetail,
  );
  queryClient.setQueryData(userSearchKeys.search("al"), search);

  return { list, search, directDetail, groupDetail };
}

describe("UserProfileRealtimeSync", () => {
  it("updates matching direct, group, detail and user search cache references", () => {
    const queryClient = createQueryClient();
    seedUserCaches(queryClient);
    const fakeSocket = new FakeSocket();
    render(
      <Harness
        auth={createAuth(viewer)}
        queryClient={queryClient}
        socketValue={{
          socket: fakeSocket as unknown as ChatSocket,
          isConnected: true,
        }}
      />,
    );
    const updatedAlice = {
      ...alice,
      username: "alice-new",
      displayName: "Alice Cooper",
      avatarUrl: "https://cdn.test/alice.webp",
    };

    act(() => fakeSocket.emitUserUpdated(updatedAlice));

    const list = queryClient.getQueryData<InfiniteData<ConversationPage>>(
      conversationKeys.lists(),
    );
    expect(list?.pages[0]?.items[0]).toMatchObject({
      otherUser: updatedAlice,
    });
    expect(list?.pages[0]?.items[1]).toBe(directBob);
    expect(list?.pages[0]?.items[2]).toMatchObject({
      members: [
        expect.objectContaining({ user: updatedAlice }),
        expect.objectContaining({ user: bob }),
      ],
    });

    expect(
      queryClient.getQueryData<Conversation>(
        conversationKeys.detail(directAlice.id),
      ),
    ).toMatchObject({ otherUser: updatedAlice });
    expect(
      queryClient.getQueryData<Conversation>(conversationKeys.detail(group.id)),
    ).toMatchObject({
      members: [
        expect.objectContaining({ user: updatedAlice }),
        expect.objectContaining({ user: bob }),
      ],
    });

    const search = queryClient.getQueryData<InfiniteData<UserSearchPage>>(
      userSearchKeys.search("al"),
    );
    expect(search?.pages[0]?.items[0]).toEqual(updatedAlice);
    expect(search?.pages[0]?.items[1]).toBe(bob);
  });

  it("preserves every cache reference for an unrelated user event", () => {
    const queryClient = createQueryClient();
    const seeded = seedUserCaches(queryClient);
    const fakeSocket = new FakeSocket();
    const setCurrentUser = vi.fn();
    render(
      <Harness
        auth={createAuth(viewer, setCurrentUser)}
        queryClient={queryClient}
        socketValue={{
          socket: fakeSocket as unknown as ChatSocket,
          isConnected: true,
        }}
      />,
    );

    act(() =>
      fakeSocket.emitUserUpdated({
        id: "user-unrelated",
        username: "unrelated",
        displayName: "Unrelated",
        avatarUrl: null,
      }),
    );

    expect(queryClient.getQueryData(conversationKeys.lists())).toBe(
      seeded.list,
    );
    expect(
      queryClient.getQueryData(conversationKeys.detail(directAlice.id)),
    ).toBe(seeded.directDetail);
    expect(queryClient.getQueryData(conversationKeys.detail(group.id))).toBe(
      seeded.groupDetail,
    );
    expect(queryClient.getQueryData(userSearchKeys.search("al"))).toBe(
      seeded.search,
    );
    expect(setCurrentUser).not.toHaveBeenCalled();
  });

  it("merges its own public profile fields into the current auth user", () => {
    const queryClient = createQueryClient();
    const fakeSocket = new FakeSocket();
    const setCurrentUser = vi.fn();
    render(
      <Harness
        auth={createAuth(viewer, setCurrentUser)}
        queryClient={queryClient}
        socketValue={{
          socket: fakeSocket as unknown as ChatSocket,
          isConnected: true,
        }}
      />,
    );
    const updatedViewer = {
      id: viewer.id,
      username: "viewer-new",
      displayName: "Viewer New",
      avatarUrl: "https://cdn.test/viewer.webp",
    };

    act(() => fakeSocket.emitUserUpdated(updatedViewer));

    expect(setCurrentUser).toHaveBeenCalledWith({
      ...viewer,
      ...updatedViewer,
    });
  });

  it("removes the user listener with the same handler reference", () => {
    const queryClient = createQueryClient();
    const fakeSocket = new FakeSocket();
    const view = render(
      <Harness
        auth={createAuth(viewer)}
        queryClient={queryClient}
        socketValue={{
          socket: fakeSocket as unknown as ChatSocket,
          isConnected: true,
        }}
      />,
    );
    const registeredHandler = fakeSocket.onCalls[0];

    view.unmount();

    expect(registeredHandler).toBeDefined();
    expect(fakeSocket.offCalls).toEqual([registeredHandler]);
  });

  it("keeps processing profile events after a disconnect and reconnect", () => {
    const queryClient = createQueryClient();
    seedUserCaches(queryClient);
    const fakeSocket = new FakeSocket();
    const auth = createAuth(viewer);
    const connected = {
      socket: fakeSocket as unknown as ChatSocket,
      isConnected: true,
    };
    const view = render(
      <Harness
        auth={auth}
        queryClient={queryClient}
        socketValue={connected}
      />,
    );

    view.rerender(
      <Harness
        auth={auth}
        queryClient={queryClient}
        socketValue={{ ...connected, isConnected: false }}
      />,
    );
    view.rerender(
      <Harness
        auth={auth}
        queryClient={queryClient}
        socketValue={connected}
      />,
    );

    act(() =>
      fakeSocket.emitUserUpdated({
        ...alice,
        displayName: "Alice after reconnect",
      }),
    );

    expect(fakeSocket.onCalls).toHaveLength(1);
    expect(
      queryClient.getQueryData<Conversation>(
        conversationKeys.detail(directAlice.id),
      ),
    ).toMatchObject({
      otherUser: { displayName: "Alice after reconnect" },
    });
  });
});
