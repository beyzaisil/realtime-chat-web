import type {
  CreateDirectConversationOperationRequest,
  CreateDirectConversationOperationResponse,
  GetConversationOperationResponse,
  GetConversationPath,
  ListConversationsOperationResponse,
  ListConversationsQuery,
} from "../../../lib/api/types";
import type { ApiClient } from "../../../lib/http/api-client";
import {
  parseConversationListResponse,
  parseConversationResponse,
  parseDirectConversationResponse,
} from "./conversation-response";

export type ListConversationsInput = ListConversationsQuery;

export async function listConversations(
  apiClient: ApiClient,
  input: ListConversationsInput = {},
): Promise<ListConversationsOperationResponse> {
  const search = new URLSearchParams();

  if (input.cursor !== undefined) {
    search.set("cursor", input.cursor);
  }
  search.set("limit", String(input.limit ?? 20));

  const response = await apiClient.request<unknown>(
    `/api/v1/conversations?${search.toString()}`,
  );

  return parseConversationListResponse(response);
}

export async function getConversation(
  apiClient: ApiClient,
  conversationId: GetConversationPath["conversationId"],
): Promise<GetConversationOperationResponse> {
  const response = await apiClient.request<unknown>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}`,
  );

  return parseConversationResponse(response);
}

export async function createDirectConversation(
  apiClient: ApiClient,
  input: CreateDirectConversationOperationRequest,
): Promise<CreateDirectConversationOperationResponse> {
  const response = await apiClient.request<unknown>(
    "/api/v1/conversations/direct",
    { method: "POST", json: input },
  );

  return parseDirectConversationResponse(response);
}
