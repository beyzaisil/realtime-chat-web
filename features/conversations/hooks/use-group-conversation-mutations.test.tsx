import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import { ApiClientError } from "../../../lib/http/api-error";
import {
  AuthContext,
  type AuthContextValue,
} from "../../../providers/auth-provider";
import type { GroupConversation, GroupMember } from "../types";
import { conversationKeys } from "./use-conversations";
import {
  useAddGroupMember,
  useCreateGroupConversation,
  useLeaveGroupConversation,
  useRemoveGroupMember,
  useTransferGroupOwnership,
  useUpdateGroupMemberRole,
  useUpdateGroupTitle,
} from "./use-group-conversation-mutations";

const owner: GroupMember = {
  userId: "user-1",
  role: "OWNER",
  joinedAt: "2030-01-01T00:00:00.000Z",
  user: {
    id: "user-1",
    username: "alice",
    displayName: "Alice",
    avatarUrl: null,
  },
};

const member: GroupMember = {
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

const group: GroupConversation = {
  id: "conversation-1",
  type: "GROUP",
  title: "Product team",
  createdAt: "2030-01-01T00:00:00.000Z",
  members: [owner],
};

function createHarness(request: ReturnType<typeof vi.fn>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const apiClient: ApiClient = {
    request: request as unknown as ApiClient["request"],
  };
  const auth = {
    user: null,
    accessToken: "token",
    status: "authenticated",
    apiClient,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    bootstrap: vi.fn(),
  } as unknown as AuthContextValue;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    );
  }

  return { queryClient, Wrapper };
}

function expectListInvalidated(invalidateQueries: ReturnType<typeof vi.spyOn>) {
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: conversationKeys.lists(),
  });
}

describe("group conversation mutation hooks", () => {
  it("stores a newly created group detail and invalidates conversation lists", async () => {
    const request = vi.fn().mockResolvedValue(group);
    const { queryClient, Wrapper } = createHarness(request);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateGroupConversation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        title: "Product team",
        userIds: ["user-2", "user-3"],
      });
    });

    expect(queryClient.getQueryData(conversationKeys.detail(group.id))).toEqual(
      group,
    );
    expectListInvalidated(invalidateQueries);
  });

  it("replaces the cached group after a title update", async () => {
    const updated = { ...group, title: "Renamed team" };
    const request = vi.fn().mockResolvedValue(updated);
    const { queryClient, Wrapper } = createHarness(request);
    queryClient.setQueryData(conversationKeys.detail(group.id), group);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateGroupTitle(group.id), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ title: "Renamed team" });
    });

    expect(queryClient.getQueryData(conversationKeys.detail(group.id))).toEqual(
      updated,
    );
    expectListInvalidated(invalidateQueries);
  });

  it("adds a member idempotently and invalidates conversation lists", async () => {
    const request = vi.fn().mockResolvedValue(member);
    const { queryClient, Wrapper } = createHarness(request);
    queryClient.setQueryData(conversationKeys.detail(group.id), group);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAddGroupMember(group.id), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ userId: member.userId });
      await result.current.mutateAsync({ userId: member.userId });
    });

    const cached = queryClient.getQueryData<GroupConversation>(
      conversationKeys.detail(group.id),
    );
    expect(cached?.members).toEqual([owner, member]);
    expect(cached?.members.filter(({ userId }) => userId === member.userId)).toHaveLength(1);
    expectListInvalidated(invalidateQueries);
  });

  it("removes a member from the cached group", async () => {
    const request = vi.fn().mockResolvedValue(undefined);
    const { queryClient, Wrapper } = createHarness(request);
    queryClient.setQueryData(conversationKeys.detail(group.id), {
      ...group,
      members: [owner, member],
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useRemoveGroupMember(group.id), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ userId: member.userId });
    });

    const cached = queryClient.getQueryData<GroupConversation>(
      conversationKeys.detail(group.id),
    );
    expect(cached?.members).toEqual([owner]);
    expectListInvalidated(invalidateQueries);
  });

  it("replaces a member role without duplicating the member", async () => {
    const admin = { ...member, role: "ADMIN" as const };
    const request = vi.fn().mockResolvedValue(admin);
    const { queryClient, Wrapper } = createHarness(request);
    queryClient.setQueryData(conversationKeys.detail(group.id), {
      ...group,
      members: [owner, member],
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useUpdateGroupMemberRole(group.id),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({
        userId: member.userId,
        role: "ADMIN",
      });
    });

    const cached = queryClient.getQueryData<GroupConversation>(
      conversationKeys.detail(group.id),
    );
    expect(cached?.members).toEqual([owner, admin]);
    expectListInvalidated(invalidateQueries);
  });

  it("replaces group detail after ownership transfer", async () => {
    const transferred: GroupConversation = {
      ...group,
      members: [
        { ...owner, role: "ADMIN" },
        { ...member, role: "OWNER" },
      ],
    };
    const request = vi.fn().mockResolvedValue(transferred);
    const { queryClient, Wrapper } = createHarness(request);
    queryClient.setQueryData(conversationKeys.detail(group.id), group);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useTransferGroupOwnership(group.id),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({ userId: member.userId });
    });

    expect(queryClient.getQueryData(conversationKeys.detail(group.id))).toEqual(
      transferred,
    );
    expectListInvalidated(invalidateQueries);
  });

  it("removes the exact group detail after leaving", async () => {
    const request = vi.fn().mockResolvedValue(undefined);
    const { queryClient, Wrapper } = createHarness(request);
    queryClient.setQueryData(conversationKeys.detail(group.id), group);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useLeaveGroupConversation(group.id), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(
      queryClient.getQueryData(conversationKeys.detail(group.id)),
    ).toBeUndefined();
    expectListInvalidated(invalidateQueries);
  });

  it("preserves technical mutation errors without changing cached data", async () => {
    const error = new ApiClientError({
      status: 403,
      code: "INSUFFICIENT_ROLE",
      message: "Your role does not permit this action",
      requestId: "request-1",
    });
    const request = vi.fn().mockRejectedValue(error);
    const { queryClient, Wrapper } = createHarness(request);
    queryClient.setQueryData(conversationKeys.detail(group.id), group);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAddGroupMember(group.id), {
      wrapper: Wrapper,
    });

    await expect(
      act(() => result.current.mutateAsync({ userId: member.userId })),
    ).rejects.toBe(error);

    expect(queryClient.getQueryData(conversationKeys.detail(group.id))).toEqual(
      group,
    );
    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});
