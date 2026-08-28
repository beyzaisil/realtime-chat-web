"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { conversationKeys } from "../../conversations/hooks/use-conversations";
import { useAuth } from "../../../providers/auth-provider";
import { deleteMessage } from "../api/messages-api";
import type { DeleteMessageInput } from "../types";
import {
  type MessageHistoryData,
  replaceMessageInHistory,
} from "./message-cache";
import { messageKeys } from "./use-message-history";

export function useDeleteMessage(conversationId: string) {
  const { apiClient } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId }: DeleteMessageInput) =>
      deleteMessage(apiClient, conversationId, messageId),
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
