"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";

import { useAuth } from "../../../providers/auth-provider";
import {
  createDirectConversation,
  getConversation,
  listConversations,
} from "../api/conversations-api";
import type { ConversationListItem } from "../types";

export const conversationKeys = {
  all: ["conversations"] as const,
  lists: () => [...conversationKeys.all, "list"] as const,
  details: () => [...conversationKeys.all, "detail"] as const,
  detail: (conversationId: string) =>
    [...conversationKeys.details(), conversationId] as const,
};

export function useConversations() {
  const { apiClient } = useAuth();
  const query = useInfiniteQuery({
    queryKey: conversationKeys.lists(),
    queryFn: ({ pageParam }) =>
      listConversations(apiClient, {
        limit: 20,
        ...(pageParam === null ? {} : { cursor: pageParam }),
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const conversations = useMemo(() => {
    const unique = new Map<string, ConversationListItem>();

    for (const page of query.data?.pages ?? []) {
      for (const conversation of page.items) {
        if (!unique.has(conversation.id)) {
          unique.set(conversation.id, conversation);
        }
      }
    }

    return [...unique.values()];
  }, [query.data]);

  return { ...query, conversations };
}

export function useConversation(conversationId: string) {
  const { apiClient } = useAuth();

  return useQuery({
    queryKey: conversationKeys.detail(conversationId),
    queryFn: () => getConversation(apiClient, conversationId),
    enabled: conversationId.length > 0,
  });
}

export function useCreateDirectConversation() {
  const { apiClient } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      createDirectConversation(apiClient, { userId }),
    onSuccess: (conversation) => {
      queryClient.setQueryData(
        conversationKeys.detail(conversation.id),
        conversation,
      );
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
}
