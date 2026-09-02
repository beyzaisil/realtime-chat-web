import type {
  AddGroupMemberOperationRequest,
  AddGroupMemberOperationResponse,
  AddGroupMemberPath,
  CreateGroupConversationOperationRequest,
  CreateGroupConversationOperationResponse,
  LeaveGroupConversationPath,
  RemoveGroupMemberPath,
  TransferGroupOwnershipOperationRequest,
  TransferGroupOwnershipOperationResponse,
  TransferGroupOwnershipPath,
  UpdateGroupMemberRoleOperationRequest,
  UpdateGroupMemberRoleOperationResponse,
  UpdateGroupMemberRolePath,
  UpdateGroupTitleOperationRequest,
  UpdateGroupTitleOperationResponse,
  UpdateGroupTitlePath,
} from "../../../lib/api/types";
import type { ApiClient } from "../../../lib/http/api-client";
import {
  parseGroupConversationResponse,
  parseGroupMemberResponse,
} from "./conversation-response";

export async function createGroupConversation(
  apiClient: ApiClient,
  input: CreateGroupConversationOperationRequest,
): Promise<CreateGroupConversationOperationResponse> {
  const response = await apiClient.request<unknown>(
    "/api/v1/conversations/group",
    { method: "POST", json: input },
  );

  return parseGroupConversationResponse(response);
}

export async function updateGroupTitle(
  apiClient: ApiClient,
  conversationId: UpdateGroupTitlePath["conversationId"],
  input: UpdateGroupTitleOperationRequest,
): Promise<UpdateGroupTitleOperationResponse> {
  const response = await apiClient.request<unknown>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}`,
    { method: "PATCH", json: input },
  );

  return parseGroupConversationResponse(response);
}

export async function addGroupMember(
  apiClient: ApiClient,
  conversationId: AddGroupMemberPath["conversationId"],
  input: AddGroupMemberOperationRequest,
): Promise<AddGroupMemberOperationResponse> {
  const response = await apiClient.request<unknown>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/members`,
    { method: "POST", json: input },
  );

  return parseGroupMemberResponse(response);
}

export async function leaveGroupConversation(
  apiClient: ApiClient,
  conversationId: LeaveGroupConversationPath["conversationId"],
): Promise<void> {
  await apiClient.request<void>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/members/me`,
    { method: "DELETE" },
  );
}

export async function removeGroupMember(
  apiClient: ApiClient,
  conversationId: RemoveGroupMemberPath["conversationId"],
  userId: RemoveGroupMemberPath["userId"],
): Promise<void> {
  await apiClient.request<void>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/members/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
}

export async function updateGroupMemberRole(
  apiClient: ApiClient,
  conversationId: UpdateGroupMemberRolePath["conversationId"],
  userId: UpdateGroupMemberRolePath["userId"],
  input: UpdateGroupMemberRoleOperationRequest,
): Promise<UpdateGroupMemberRoleOperationResponse> {
  const response = await apiClient.request<unknown>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/members/${encodeURIComponent(userId)}`,
    { method: "PATCH", json: input },
  );

  return parseGroupMemberResponse(response);
}

export async function transferGroupOwnership(
  apiClient: ApiClient,
  conversationId: TransferGroupOwnershipPath["conversationId"],
  input: TransferGroupOwnershipOperationRequest,
): Promise<TransferGroupOwnershipOperationResponse> {
  const response = await apiClient.request<unknown>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/owner`,
    { method: "PUT", json: input },
  );

  return parseGroupConversationResponse(response);
}
