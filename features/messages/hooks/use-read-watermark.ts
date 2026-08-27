"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { conversationKeys } from "../../conversations/hooks/use-conversations";
import { useAuth } from "../../../providers/auth-provider";
import { updateReadWatermark } from "../api/messages-api";
import type { MessageDto } from "../types";

export function useReadWatermark(
  conversationId: string,
  currentUserId: string,
  visibleMessage: MessageDto | null,
): void {
  const { apiClient } = useAuth();
  const queryClient = useQueryClient();
  const requestedIdsRef = useRef(new Set<string>());

  useEffect(() => {
    requestedIdsRef.current = new Set<string>();
  }, [conversationId]);

  useEffect(() => {
    if (
      visibleMessage === null ||
      currentUserId.length === 0 ||
      visibleMessage.conversationId !== conversationId ||
      visibleMessage.senderId === currentUserId ||
      requestedIdsRef.current.has(visibleMessage.id)
    ) {
      return;
    }

    const messageId = visibleMessage.id;
    requestedIdsRef.current.add(messageId);
    void updateReadWatermark(apiClient, conversationId, {
      throughMessageId: messageId,
    })
      .then(() =>
        queryClient.invalidateQueries({
          queryKey: conversationKeys.lists(),
        }),
      )
      .catch(() => {
        requestedIdsRef.current.delete(messageId);
      });
  }, [
    apiClient,
    conversationId,
    currentUserId,
    queryClient,
    visibleMessage,
  ]);
}
