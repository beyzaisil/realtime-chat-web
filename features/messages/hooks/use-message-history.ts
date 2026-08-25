"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useAuth } from "../../../providers/auth-provider";
import { listMessages } from "../api/messages-api";
import { flattenMessageHistory } from "./message-cache";

export const messageKeys = {
  all: ["messages"] as const,
  history: (conversationId: string) =>
    [...messageKeys.all, "history", conversationId] as const,
};

export function useMessageHistory(conversationId: string) {
  const { apiClient } = useAuth();
  const query = useInfiniteQuery({
    queryKey: messageKeys.history(conversationId),
    queryFn: ({ pageParam }) =>
      listMessages(apiClient, conversationId, {
        limit: 50,
        ...(pageParam === null ? {} : { before: pageParam }),
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: conversationId.length > 0,
  });
  const messages = useMemo(
    () => flattenMessageHistory(query.data),
    [query.data],
  );

  return { ...query, messages };
}
