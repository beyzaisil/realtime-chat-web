import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import type {
  GroupConversationEventDto,
  GroupMemberEventDto,
  OwnershipTransferredEventPayload,
} from "../../../lib/socket/socket-events";
import { messageKeys } from "../../messages/hooks/use-message-history";
import {
  isGroupConversation,
  isListedGroupConversation,
  type Conversation,
  type ConversationListItem,
  type ConversationPage,
  type GroupConversation,
  type GroupMember,
  type ListedGroupConversation,
} from "../types";
import { conversationKeys } from "../hooks/use-conversations";

export function cacheCreatedGroupConversation(
  queryClient: QueryClient,
  conversation: GroupConversationEventDto,
): void {
  queryClient.setQueryData(
    conversationKeys.detail(conversation.id),
    conversation,
  );
  updateConversationLists(queryClient, conversation.id, (current) =>
    current === undefined
      ? toListedGroupConversation(conversation)
      : mergeListedGroupConversation(current, conversation),
  );
}

export function cacheUpdatedGroupConversation(
  queryClient: QueryClient,
  conversation: GroupConversationEventDto,
): void {
  queryClient.setQueryData<Conversation>(
    conversationKeys.detail(conversation.id),
    (current) =>
      current === undefined || isGroupConversation(current)
        ? conversation
        : current,
  );
  updateConversationLists(queryClient, conversation.id, (current) =>
    current === undefined
      ? undefined
      : mergeListedGroupConversation(current, conversation),
  );
}

export function cacheGroupMember(
  queryClient: QueryClient,
  conversationId: string,
  member: GroupMemberEventDto,
): void {
  updateGroupConversationCaches(queryClient, conversationId, (members) => {
    const existingIndex = members.findIndex(
      (currentMember) => currentMember.userId === member.userId,
    );

    if (existingIndex === -1) {
      return [...members, member];
    }

    if (members[existingIndex] === member) {
      return members;
    }

    return members.map((currentMember, index) =>
      index === existingIndex ? member : currentMember,
    );
  });
}

export function removeGroupMemberFromCaches(
  queryClient: QueryClient,
  conversationId: string,
  userId: string,
): void {
  updateGroupConversationCaches(queryClient, conversationId, (members) => {
    if (!members.some((member) => member.userId === userId)) {
      return members;
    }

    return members.filter((member) => member.userId !== userId);
  });
}

export function cacheTransferredOwnership(
  queryClient: QueryClient,
  payload: OwnershipTransferredEventPayload,
): void {
  updateGroupConversationCaches(
    queryClient,
    payload.conversationId,
    (currentMembers) => {
      let changed = false;
      const members = currentMembers.map((member) => {
        if (
          member.userId === payload.previousOwnerId &&
          member.role !== "ADMIN"
        ) {
          changed = true;
          return { ...member, role: "ADMIN" as const };
        }
        if (
          member.userId === payload.newOwnerId &&
          member.role !== "OWNER"
        ) {
          changed = true;
          return { ...member, role: "OWNER" as const };
        }
        return member;
      });

      return changed ? members : currentMembers;
    },
  );
}

export function removeGroupConversationCaches(
  queryClient: QueryClient,
  conversationId: string,
): void {
  queryClient.removeQueries({
    queryKey: conversationKeys.detail(conversationId),
    exact: true,
  });
  queryClient.removeQueries({
    queryKey: messageKeys.history(conversationId),
    exact: true,
  });
  removeConversationFromLists(queryClient, conversationId);
}

export function hasCachedGroupConversation(
  queryClient: QueryClient,
  conversationId: string,
): boolean {
  const detail = queryClient.getQueryData<Conversation>(
    conversationKeys.detail(conversationId),
  );
  if (detail !== undefined && isGroupConversation(detail)) {
    return true;
  }

  return queryClient
    .getQueriesData<InfiniteData<ConversationPage>>({
      queryKey: conversationKeys.lists(),
    })
    .some(([, data]) =>
      data?.pages.some((page) =>
        page.items.some(
          (conversation) =>
            conversation.id === conversationId &&
            isListedGroupConversation(conversation),
        ),
      ),
    );
}

function updateGroupConversationCaches(
  queryClient: QueryClient,
  conversationId: string,
  updateMembers: (members: GroupMember[]) => GroupMember[],
): void {
  queryClient.setQueryData<Conversation>(
    conversationKeys.detail(conversationId),
    (current) =>
      current !== undefined && isGroupConversation(current)
        ? updateConversationMembers(current, updateMembers)
        : current,
  );
  updateConversationLists(queryClient, conversationId, (current) =>
    current === undefined
      ? undefined
      : updateConversationMembers(current, updateMembers),
  );
}

function updateConversationMembers<T extends GroupConversation>(
  conversation: T,
  update: (members: GroupMember[]) => GroupMember[],
): T {
  const members = update(conversation.members);
  return members === conversation.members
    ? conversation
    : { ...conversation, members };
}

function updateConversationLists(
  queryClient: QueryClient,
  conversationId: string,
  update: (
    conversation: ListedGroupConversation | undefined,
  ) => ListedGroupConversation | undefined,
): void {
  queryClient.setQueriesData<InfiniteData<ConversationPage>>(
    { queryKey: conversationKeys.lists() },
    (current) => {
      if (current === undefined || current.pages.length === 0) {
        return current;
      }

      let found = false;
      let changed = false;
      const pages = current.pages.map((page) => {
        let pageChanged = false;
        const items = page.items.map((conversation) => {
          if (conversation.id !== conversationId) {
            return conversation;
          }

          found = true;
          if (!isListedGroupConversation(conversation)) {
            return conversation;
          }

          const next = update(conversation);
          pageChanged ||= next !== conversation;
          return next ?? conversation;
        });

        changed ||= pageChanged;
        return pageChanged ? { ...page, items } : page;
      });

      if (!found) {
        const inserted = update(undefined);
        const firstPage = pages[0];
        if (inserted !== undefined && firstPage !== undefined) {
          pages[0] = {
            ...firstPage,
            items: [inserted, ...firstPage.items],
          };
          changed = true;
        }
      }

      return changed ? { ...current, pages } : current;
    },
  );
}

function removeConversationFromLists(
  queryClient: QueryClient,
  conversationId: string,
): void {
  queryClient.setQueriesData<InfiniteData<ConversationPage>>(
    { queryKey: conversationKeys.lists() },
    (current) => {
      if (current === undefined) {
        return current;
      }

      let changed = false;
      const pages = current.pages.map((page) => {
        const items = page.items.filter((conversation) => {
          const keep = conversation.id !== conversationId;
          changed ||= !keep;
          return keep;
        });
        return items.length === page.items.length ? page : { ...page, items };
      });

      return changed ? { ...current, pages } : current;
    },
  );
}

function mergeListedGroupConversation(
  current: ListedGroupConversation,
  conversation: GroupConversationEventDto,
): ListedGroupConversation {
  return {
    ...current,
    createdAt: conversation.createdAt,
    members: conversation.members,
    title: conversation.title,
    type: conversation.type,
  };
}

function toListedGroupConversation(
  conversation: GroupConversationEventDto,
): ListedGroupConversation {
  return {
    ...conversation,
    lastMessageAt: null,
    lastMessage: null,
    unreadCount: 0,
  };
}
