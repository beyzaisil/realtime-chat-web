import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import type { PublicPeerUser } from "../../../lib/api/types";
import { conversationKeys } from "../../conversations/hooks/use-conversations";
import type {
  Conversation,
  ConversationListItem,
  ConversationPage,
  GroupMember,
} from "../../conversations/types";
import { userSearchKeys } from "../hooks/use-user-search";
import type { UserSearchPage } from "../types";

export function updateUserProfileCaches(
  queryClient: QueryClient,
  updatedUser: PublicPeerUser,
): void {
  queryClient.setQueriesData<InfiniteData<ConversationPage>>(
    { queryKey: conversationKeys.lists() },
    (current) => updateConversationPages(current, updatedUser),
  );
  queryClient.setQueriesData<Conversation>(
    { queryKey: conversationKeys.details() },
    (current) =>
      current === undefined
        ? current
        : updateConversation(current, updatedUser),
  );
  queryClient.setQueriesData<InfiniteData<UserSearchPage>>(
    { queryKey: userSearchKeys.searches() },
    (current) => updateUserSearchPages(current, updatedUser),
  );
}

export function hasPublicUserProfileChanged(
  current: PublicPeerUser,
  updated: PublicPeerUser,
): boolean {
  return (
    current.id === updated.id &&
    (current.username !== updated.username ||
      current.displayName !== updated.displayName ||
      current.avatarUrl !== updated.avatarUrl)
  );
}

function updateConversationPages(
  current: InfiniteData<ConversationPage> | undefined,
  updatedUser: PublicPeerUser,
): InfiniteData<ConversationPage> | undefined {
  if (current === undefined) {
    return current;
  }

  let pagesChanged = false;
  const pages = current.pages.map((page) => {
    let itemsChanged = false;
    const items = page.items.map((conversation) => {
      const updated = updateListedConversation(conversation, updatedUser);
      itemsChanged ||= updated !== conversation;
      return updated;
    });

    if (!itemsChanged) {
      return page;
    }

    pagesChanged = true;
    return { ...page, items };
  });

  return pagesChanged ? { ...current, pages } : current;
}

function updateUserSearchPages(
  current: InfiniteData<UserSearchPage> | undefined,
  updatedUser: PublicPeerUser,
): InfiniteData<UserSearchPage> | undefined {
  if (current === undefined) {
    return current;
  }

  let pagesChanged = false;
  const pages = current.pages.map((page) => {
    let itemsChanged = false;
    const items = page.items.map((user) => {
      if (!hasPublicUserProfileChanged(user, updatedUser)) {
        return user;
      }

      itemsChanged = true;
      return { ...user, ...updatedUser };
    });

    if (!itemsChanged) {
      return page;
    }

    pagesChanged = true;
    return { ...page, items };
  });

  return pagesChanged ? { ...current, pages } : current;
}

function updateConversation(
  conversation: Conversation,
  updatedUser: PublicPeerUser,
): Conversation {
  if (conversation.type === "DIRECT") {
    return hasPublicUserProfileChanged(conversation.otherUser, updatedUser)
      ? {
          ...conversation,
          otherUser: { ...conversation.otherUser, ...updatedUser },
        }
      : conversation;
  }

  const members = updateGroupMembers(conversation.members, updatedUser);
  return members === conversation.members
    ? conversation
    : { ...conversation, members };
}

function updateListedConversation(
  conversation: ConversationListItem,
  updatedUser: PublicPeerUser,
): ConversationListItem {
  if (conversation.type === "DIRECT") {
    return hasPublicUserProfileChanged(conversation.otherUser, updatedUser)
      ? {
          ...conversation,
          otherUser: { ...conversation.otherUser, ...updatedUser },
        }
      : conversation;
  }

  const members = updateGroupMembers(conversation.members, updatedUser);
  return members === conversation.members
    ? conversation
    : { ...conversation, members };
}

function updateGroupMembers(
  members: GroupMember[],
  updatedUser: PublicPeerUser,
): GroupMember[] {
  let membersChanged = false;
  const updatedMembers = members.map((member) => {
    if (!hasPublicUserProfileChanged(member.user, updatedUser)) {
      return member;
    }

    membersChanged = true;
    return {
      ...member,
      user: { ...member.user, ...updatedUser },
    };
  });

  return membersChanged ? updatedMembers : members;
}
