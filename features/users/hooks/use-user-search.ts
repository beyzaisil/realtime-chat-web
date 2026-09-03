"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../../providers/auth-provider";
import { searchUsers } from "../api/users-api";
import type { SearchUser } from "../types";

export const MIN_USER_QUERY_LENGTH = 2;
export const USER_SEARCH_DEBOUNCE_MS = 300;
export const userSearchKeys = {
  all: ["users"] as const,
  searches: () => [...userSearchKeys.all, "search"] as const,
  search: (query: string) => [...userSearchKeys.searches(), query] as const,
};

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}

export function useUserSearch(query: string) {
  const { apiClient } = useAuth();
  const normalizedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(
    normalizedQuery,
    USER_SEARCH_DEBOUNCE_MS,
  );
  const canSearch = debouncedQuery.length >= MIN_USER_QUERY_LENGTH;
  const searchQuery = useInfiniteQuery({
    queryKey: userSearchKeys.search(debouncedQuery),
    queryFn: ({ pageParam }) =>
      searchUsers(apiClient, {
        query: debouncedQuery,
        limit: 20,
        ...(pageParam === null ? {} : { cursor: pageParam }),
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: canSearch,
  });

  const users = useMemo(() => {
    if (!canSearch) {
      return [];
    }

    const unique = new Map<string, SearchUser>();
    for (const page of searchQuery.data?.pages ?? []) {
      for (const user of page.items) {
        if (!unique.has(user.id)) {
          unique.set(user.id, user);
        }
      }
    }
    return [...unique.values()];
  }, [canSearch, searchQuery.data]);

  return {
    ...searchQuery,
    users,
    debouncedQuery,
    canSearch,
    isDebouncing: normalizedQuery !== debouncedQuery,
  };
}
