"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type {
  GroupConversationEventPayload,
  GroupMemberEventPayload,
  GroupMemberRemovedEventPayload,
  OwnershipTransferredEventPayload,
} from "../../../lib/socket/socket-events";
import { useAuth } from "../../../providers/auth-provider";
import { useSocket } from "../../../providers/socket-provider";
import { conversationKeys } from "../hooks/use-conversations";
import {
  cacheCreatedGroupConversation,
  cacheGroupMember,
  cacheTransferredOwnership,
  cacheUpdatedGroupConversation,
  hasCachedGroupConversation,
  removeGroupConversationCaches,
  removeGroupMemberFromCaches,
} from "./group-conversation-cache";

export function GroupConversationRealtimeSync() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const invalidateConversationLists = (): void => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    };

    const isRelevantPartialEvent = (
      conversationId: string,
      affectedUserId?: string,
    ): boolean =>
      hasCachedGroupConversation(queryClient, conversationId) ||
      affectedUserId === user?.id ||
      pathname === `/chat/${conversationId}`;

    const handleGroupCreated = ({
      conversation,
    }: GroupConversationEventPayload): void => {
      cacheCreatedGroupConversation(queryClient, conversation);
      invalidateConversationLists();
    };

    const handleGroupUpdated = ({
      conversation,
    }: GroupConversationEventPayload): void => {
      cacheUpdatedGroupConversation(queryClient, conversation);
      invalidateConversationLists();
    };

    const handleMemberAdded = ({
      conversationId,
      member,
    }: GroupMemberEventPayload): void => {
      if (!isRelevantPartialEvent(conversationId, member.userId)) {
        return;
      }
      cacheGroupMember(queryClient, conversationId, member);
      invalidateConversationLists();
    };

    const handleMemberRemoved = ({
      conversationId,
      userId,
    }: GroupMemberRemovedEventPayload): void => {
      if (!isRelevantPartialEvent(conversationId, userId)) {
        return;
      }

      if (userId === user?.id) {
        removeGroupConversationCaches(queryClient, conversationId);
        setNotice("Bu gruptan çıkarıldın.");
        if (pathname === `/chat/${conversationId}`) {
          router.replace("/chat");
        }
      } else {
        removeGroupMemberFromCaches(queryClient, conversationId, userId);
      }
      invalidateConversationLists();
    };

    const handleMemberLeft = ({
      conversationId,
      userId,
    }: GroupMemberRemovedEventPayload): void => {
      if (!isRelevantPartialEvent(conversationId, userId)) {
        return;
      }

      if (userId === user?.id) {
        removeGroupConversationCaches(queryClient, conversationId);
        setNotice("Gruptan ayrıldın.");
        if (pathname === `/chat/${conversationId}`) {
          router.replace("/chat");
        }
      } else {
        removeGroupMemberFromCaches(queryClient, conversationId, userId);
      }
      invalidateConversationLists();
    };

    const handleMemberRoleUpdated = ({
      conversationId,
      member,
    }: GroupMemberEventPayload): void => {
      if (!isRelevantPartialEvent(conversationId, member.userId)) {
        return;
      }
      cacheGroupMember(queryClient, conversationId, member);
      invalidateConversationLists();
    };

    const handleOwnershipTransferred = (
      payload: OwnershipTransferredEventPayload,
    ): void => {
      if (
        !isRelevantPartialEvent(
          payload.conversationId,
          payload.newOwnerId === user?.id
            ? payload.newOwnerId
            : payload.previousOwnerId,
        )
      ) {
        return;
      }
      cacheTransferredOwnership(queryClient, payload);
      invalidateConversationLists();
    };

    socket.on("group:created", handleGroupCreated);
    socket.on("group:updated", handleGroupUpdated);
    socket.on("member:added", handleMemberAdded);
    socket.on("member:removed", handleMemberRemoved);
    socket.on("member:left", handleMemberLeft);
    socket.on("member:role-updated", handleMemberRoleUpdated);
    socket.on("ownership:transferred", handleOwnershipTransferred);

    return () => {
      socket.off("group:created", handleGroupCreated);
      socket.off("group:updated", handleGroupUpdated);
      socket.off("member:added", handleMemberAdded);
      socket.off("member:removed", handleMemberRemoved);
      socket.off("member:left", handleMemberLeft);
      socket.off("member:role-updated", handleMemberRoleUpdated);
      socket.off("ownership:transferred", handleOwnershipTransferred);
    };
  }, [pathname, queryClient, router, socket, user?.id]);

  if (notice === null) {
    return null;
  }

  return (
    <div
      role="alert"
      className="fixed left-1/2 top-4 z-[100] flex w-[min(92vw,28rem)] -translate-x-1/2 items-center gap-3 rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-lg"
    >
      <span className="min-w-0 flex-1">{notice}</span>
      <button
        type="button"
        onClick={() => setNotice(null)}
        aria-label="Bildirimi kapat"
        className="shrink-0 rounded-lg px-2 py-1 font-semibold text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-700"
      >
        Kapat
      </button>
    </div>
  );
}
