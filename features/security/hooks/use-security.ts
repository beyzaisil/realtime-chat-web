"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  AuthSession,
  AuthSessionListResponse,
  ChangePasswordOperationRequest,
} from "../../../lib/api/types";
import { useAuth } from "../../../providers/auth-provider";
import {
  changePassword,
  listAuthSessions,
  revokeAuthSession,
  revokeOtherAuthSessions,
} from "../api/security-api";

export const authSessionKeys = {
  all: ["auth", "sessions"] as const,
  list: () => [...authSessionKeys.all, "list"] as const,
};

function keepCurrentSession(
  current: AuthSessionListResponse | undefined,
): AuthSessionListResponse | undefined {
  return current === undefined
    ? current
    : { items: current.items.filter((session) => session.isCurrent) };
}

export function useActiveSessions() {
  const { apiClient } = useAuth();

  return useQuery({
    queryKey: authSessionKeys.list(),
    queryFn: () => listAuthSessions(apiClient),
  });
}

export function useChangePassword() {
  const { apiClient } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ChangePasswordOperationRequest) =>
      changePassword(apiClient, input),
    onSuccess: () => {
      queryClient.setQueryData<AuthSessionListResponse>(
        authSessionKeys.list(),
        keepCurrentSession,
      );
    },
  });
}

export function useRevokeOtherSessions() {
  const { apiClient } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => revokeOtherAuthSessions(apiClient),
    onSuccess: () => {
      queryClient.setQueryData<AuthSessionListResponse>(
        authSessionKeys.list(),
        keepCurrentSession,
      );
    },
  });
}

export function useRevokeSession() {
  const { apiClient, clearSession } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (session: Pick<AuthSession, "id" | "isCurrent">) =>
      revokeAuthSession(apiClient, session.id),
    onSuccess: (_result, session) => {
      if (session.isCurrent) {
        queryClient.removeQueries({
          queryKey: authSessionKeys.all,
        });
        clearSession();
        return;
      }

      queryClient.setQueryData<AuthSessionListResponse>(
        authSessionKeys.list(),
        (current) =>
          current === undefined
            ? current
            : {
                items: current.items.filter(
                  (cachedSession) => cachedSession.id !== session.id,
                ),
              },
      );
    },
  });
}
