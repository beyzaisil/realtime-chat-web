"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { conversationKeys } from "../../conversations/hooks/use-conversations";
import { useAuth } from "../../../providers/auth-provider";
import { updateMessage } from "../api/messages-api";
import type { UpdateMessageInput } from "../types";
import {
  type MessageHistoryData,
  replaceMessageInHistory,
} from "./message-cache";
import { messageKeys } from "./use-message-history";
import { MAX_MESSAGE_LENGTH } from "./use-send-message";

export function useUpdateMessage(conversationId: string) {
  const { apiClient } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, text: rawText }: UpdateMessageInput) => {
      const text = rawText.trim();
      if (text.length === 0 || text.length > MAX_MESSAGE_LENGTH) {
        return Promise.reject(new Error("Invalid message content"));
      }

      return updateMessage(apiClient, conversationId, messageId, {
        content: { type: "text", text },
      });
    },
    onSuccess: (message) => {
      queryClient.setQueryData<MessageHistoryData>(
        messageKeys.history(conversationId),
        (current) => replaceMessageInHistory(current, message),
      );
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
}
