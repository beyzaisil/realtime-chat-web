"use client";

import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import type {
  AddGroupMemberOperationRequest,
  CreateGroupConversationOperationRequest,
  RemoveGroupMemberPath,
  TransferGroupOwnershipOperationRequest,
  UpdateGroupMemberRoleOperationRequest,
  UpdateGroupMemberRolePath,
  UpdateGroupTitleOperationRequest,
} from "../../../lib/api/types";
import { useAuth } from "../../../providers/auth-provider";
import {
  addGroupMember,
  createGroupConversation,
  leaveGroupConversation,
  removeGroupMember,
  transferGroupOwnership,
  updateGroupMemberRole,
  updateGroupTitle,
} from "../api/group-conversations-api";
import {
  isGroupConversation,
  type Conversation,
  type GroupConversation,
  type GroupMember,
} from "../types";
import { conversationKeys } from "./use-conversations";

export type RemoveGroupMemberInput = Pick<
  RemoveGroupMemberPath,
  "userId"
>;

export type UpdateGroupMemberRoleInput = Pick<
  UpdateGroupMemberRolePath,
  "userId"
> &
  UpdateGroupMemberRoleOperationRequest;

function invalidateConversationList(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({
    queryKey: conversationKeys.lists(),
  });
}

function setGroupDetail(
  queryClient: QueryClient,
  conversation: GroupConversation,
): void {
  queryClient.setQueryData(
    conversationKeys.detail(conversation.id),
    conversation,
  );
}

function updateCachedGroupMember(
  queryClient: QueryClient,
  conversationId: string,
  member: GroupMember,
): void {
  queryClient.setQueryData<Conversation>(
    conversationKeys.detail(conversationId),
    (current) => {
      if (current === undefined || !isGroupConversation(current)) {
        return current;
      }

      const memberExists = current.members.some(
        (currentMember) => currentMember.userId === member.userId,
      );
      return {
        ...current,
        members: memberExists
          ? current.members.map((currentMember) =>
              currentMember.userId === member.userId
                ? member
                : currentMember,
            )
          : [...current.members, member],
      };
    },
  );
}

function removeCachedGroupMember(
  queryClient: QueryClient,
  conversationId: string,
  userId: string,
): void {
  queryClient.setQueryData<Conversation>(
    conversationKeys.detail(conversationId),
    (current) =>
      current !== undefined && isGroupConversation(current)
        ? {
            ...current,
            members: current.members.filter(
              (member) => member.userId !== userId,
            ),
          }
        : current,
  );
}

export function useCreateGroupConversation() {
  const { apiClient } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGroupConversationOperationRequest) =>
      createGroupConversation(apiClient, input),
    onSuccess: (conversation) => {
      setGroupDetail(queryClient, conversation);
      invalidateConversationList(queryClient);
    },
  });
}

export function useUpdateGroupTitle(conversationId: string) {
  const { apiClient } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGroupTitleOperationRequest) =>
      updateGroupTitle(apiClient, conversationId, input),
    onSuccess: (conversation) => {
      setGroupDetail(queryClient, conversation);
      invalidateConversationList(queryClient);
    },
  });
}

export function useAddGroupMember(conversationId: string) {
  const { apiClient } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddGroupMemberOperationRequest) =>
      addGroupMember(apiClient, conversationId, input),
    onSuccess: (member) => {
      updateCachedGroupMember(queryClient, conversationId, member);
      invalidateConversationList(queryClient);
    },
  });
}

export function useLeaveGroupConversation(conversationId: string) {
  const { apiClient } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => leaveGroupConversation(apiClient, conversationId),
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: conversationKeys.detail(conversationId),
        exact: true,
      });
      invalidateConversationList(queryClient);
    },
  });
}

export function useRemoveGroupMember(conversationId: string) {
  const { apiClient } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId }: RemoveGroupMemberInput) =>
      removeGroupMember(apiClient, conversationId, userId),
    onSuccess: (_result, { userId }) => {
      removeCachedGroupMember(queryClient, conversationId, userId);
      invalidateConversationList(queryClient);
    },
  });
}

export function useUpdateGroupMemberRole(conversationId: string) {
  const { apiClient } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: UpdateGroupMemberRoleInput) =>
      updateGroupMemberRole(apiClient, conversationId, userId, { role }),
    onSuccess: (member) => {
      updateCachedGroupMember(queryClient, conversationId, member);
      invalidateConversationList(queryClient);
    },
  });
}

export function useTransferGroupOwnership(conversationId: string) {
  const { apiClient } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TransferGroupOwnershipOperationRequest) =>
      transferGroupOwnership(apiClient, conversationId, input),
    onSuccess: (conversation) => {
      setGroupDetail(queryClient, conversation);
      invalidateConversationList(queryClient);
    },
  });
}
