"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type {
  MessageEventDto,
  ReadUpdatedPayload,
} from "../../../lib/socket/socket-events";
import { useSocket } from "../../../providers/socket-provider";
import {
  type MessageHistoryData,
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

    const handleMessageCreated = ({
      message,
    }: {
      message: MessageEventDto;
    }): void => {
      if (message.conversationId !== conversationId) {
        return;
      }

      queryClient.setQueryData<MessageHistoryData>(
        messageKeys.history(conversationId),
        (current) => upsertMessageInHistory(current, message),
      );
    };

    const handleReadUpdated = (update: ReadUpdatedPayload): void => {
      if (update.conversationId === conversationId) {
        setLatestReadUpdate(update);
      }
    };

    socket.on("message:created", handleMessageCreated);
    socket.on("read:updated", handleReadUpdated);
    return () => {
      socket.off("message:created", handleMessageCreated);
      socket.off("read:updated", handleReadUpdated);
    };
  }, [conversationId, queryClient, socket]);

  return { latestReadUpdate };
}
