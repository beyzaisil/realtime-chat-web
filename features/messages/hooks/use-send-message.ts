"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { conversationKeys } from "../../conversations/hooks/use-conversations";
import { useAuth } from "../../../providers/auth-provider";
import { createMessage } from "../api/messages-api";
import type { SendMessageInput } from "../types";
import {
  type MessageHistoryData,
  upsertMessageInHistory,
} from "./message-cache";
import { messageKeys } from "./use-message-history";

export const MAX_MESSAGE_LENGTH = 4_000;

export function useSendMessage(conversationId: string) {
  const { apiClient } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMessageInput) => {
      const text = input.text.trim();

      if (text.length === 0 || text.length > MAX_MESSAGE_LENGTH) {
        return Promise.reject(new Error("Invalid message content"));
      }

      return createMessage(apiClient, conversationId, {
        text,
        clientMessageId: input.clientMessageId ?? crypto.randomUUID(),
      });
    },
    onSuccess: (message) => {
      queryClient.setQueryData<MessageHistoryData>(
        messageKeys.history(conversationId),
        (current) => upsertMessageInHistory(current, message),
      );
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
}
