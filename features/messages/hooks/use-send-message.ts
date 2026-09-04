"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { conversationKeys } from "../../conversations/hooks/use-conversations";
import { useAuth } from "../../../providers/auth-provider";
import { MAX_ATTACHMENTS_PER_MESSAGE } from "../api/message-attachments-api";
import { createMessage } from "../api/messages-api";
import type {
  MessageDto,
  SendMediaMessageInput,
  SendMessageInput,
} from "../types";
import {
  type MessageHistoryData,
  upsertMessageInHistory,
} from "./message-cache";
import { messageKeys } from "./use-message-history";

export const MAX_MESSAGE_LENGTH = 4_000;

function useApplySuccessfulMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return (message: MessageDto): void => {
    queryClient.setQueryData<MessageHistoryData>(
      messageKeys.history(conversationId),
      (current) => upsertMessageInHistory(current, message),
    );
    void queryClient.invalidateQueries({
      queryKey: conversationKeys.lists(),
    });
  };
}

export function useSendMessage(conversationId: string) {
  const { apiClient } = useAuth();
  const applySuccessfulMessage = useApplySuccessfulMessage(conversationId);

  return useMutation({
    mutationFn: (input: SendMessageInput) => {
      const text = input.text.trim();

      if (text.length === 0 || text.length > MAX_MESSAGE_LENGTH) {
        return Promise.reject(new Error("Invalid message content"));
      }

      return createMessage(apiClient, conversationId, {
        clientMessageId: input.clientMessageId ?? crypto.randomUUID(),
        content: { type: "text", text },
      });
    },
    onSuccess: applySuccessfulMessage,
  });
}

export function useSendMediaMessage(conversationId: string) {
  const { apiClient } = useAuth();
  const applySuccessfulMessage = useApplySuccessfulMessage(conversationId);

  return useMutation({
    mutationFn: (input: SendMediaMessageInput) => {
      const text = input.text?.trim() ?? "";
      const uniqueAttachmentIds = new Set(input.attachmentIds);

      if (
        input.attachmentIds.length === 0 ||
        input.attachmentIds.length > MAX_ATTACHMENTS_PER_MESSAGE ||
        uniqueAttachmentIds.size !== input.attachmentIds.length ||
        text.length > MAX_MESSAGE_LENGTH
      ) {
        return Promise.reject(new Error("Invalid media message content"));
      }

      return createMessage(apiClient, conversationId, {
        clientMessageId: input.clientMessageId ?? crypto.randomUUID(),
        content: {
          type: "media",
          attachmentIds: input.attachmentIds,
          ...(text.length === 0 ? {} : { text }),
        },
      });
    },
    onSuccess: applySuccessfulMessage,
  });
}
