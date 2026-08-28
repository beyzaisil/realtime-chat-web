"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type {
  MessageEventDto,
  ReadUpdatedPayload,
} from "../../../lib/socket/socket-events";
import { useSocket } from "../../../providers/socket-provider";
import { conversationKeys } from "../../conversations/hooks/use-conversations";
import {
  type MessageHistoryData,
  replaceMessageInHistory,
  upsertMessageInHistory,
} from "./message-cache";
import { messageKeys } from "./use-message-history";

export function useConversationRealtime(conversationId: string) {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [latestReadUpdate, setLatestReadUpdate] =
    useState<ReadUpdatedPayload | null>(null);

  useEffect(() => {
    setLatestReadUpdate(null);

    const applyMessageLifecycleEvent = (
      message: MessageEventDto,
      mode: "create" | "replace",
    ): void => {
      if (message.conversationId !== conversationId) {
        return;
      }

      queryClient.setQueryData<MessageHistoryData>(
        messageKeys.history(conversationId),
        (current) =>
          mode === "create"
            ? upsertMessageInHistory(current, message)
            : replaceMessageInHistory(current, message),
      );

      void queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    };

    const handleMessageCreated = ({
      message,
    }: {
      message: MessageEventDto;
    }): void => {
      applyMessageLifecycleEvent(message, "create");
    };

    const handleMessageChanged = ({
      message,
    }: {
      message: MessageEventDto;
    }): void => {
      applyMessageLifecycleEvent(message, "replace");
    };

    const handleReadUpdated = (update: ReadUpdatedPayload): void => {
      if (update.conversationId === conversationId) {
        setLatestReadUpdate(update);
      }
    };

    socket.on("message:created", handleMessageCreated);
    socket.on("message:updated", handleMessageChanged);
    socket.on("message:deleted", handleMessageChanged);
    socket.on("read:updated", handleReadUpdated);
    return () => {
      socket.off("message:created", handleMessageCreated);
      socket.off("message:updated", handleMessageChanged);
      socket.off("message:deleted", handleMessageChanged);
      socket.off("read:updated", handleReadUpdated);
    };
  }, [conversationId, queryClient, socket]);

  return { latestReadUpdate };
}
