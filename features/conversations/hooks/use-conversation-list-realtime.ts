"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import type { MessageEventDto } from "../../../lib/socket/socket-events";
import { useConversationSubscriptions } from "../../messages/providers/conversation-subscription-provider";
import { useSocket } from "../../../providers/socket-provider";
import { conversationKeys } from "./use-conversations";

export function useConversationListRealtime(
  conversationIds: readonly string[],
): void {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const conversationIdsKey = [...new Set(conversationIds)].sort().join("\u0000");
  const subscribedConversationIds = useMemo(
    () =>
      new Set(
        conversationIdsKey.length === 0
          ? []
          : conversationIdsKey.split("\u0000"),
      ),
    [conversationIdsKey],
  );

  useConversationSubscriptions(conversationIds);

  useEffect(() => {
    const handleMessageLifecycle = ({
      message,
    }: {
      message: MessageEventDto;
    }): void => {
      if (!subscribedConversationIds.has(message.conversationId)) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    };

    socket.on("message:created", handleMessageLifecycle);
    socket.on("message:updated", handleMessageLifecycle);
    socket.on("message:deleted", handleMessageLifecycle);
    return () => {
      socket.off("message:created", handleMessageLifecycle);
      socket.off("message:updated", handleMessageLifecycle);
      socket.off("message:deleted", handleMessageLifecycle);
    };
  }, [queryClient, socket, subscribedConversationIds]);
}
