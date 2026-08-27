import type {
  CreateDirectConversationOperationRequest,
  CreateDirectConversationOperationResponse,
  GetConversationOperationResponse,
  GetConversationPath,
  ListConversationsOperationResponse,
  ListConversationsQuery,
} from "../../../lib/api/types";
import type { ApiClient } from "../../../lib/http/api-client";

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

  return apiClient.request<ListConversationsOperationResponse>(
    `/api/v1/conversations?${search.toString()}`,
  );
}

export async function getConversation(
  apiClient: ApiClient,
  conversationId: GetConversationPath["conversationId"],
): Promise<GetConversationOperationResponse> {
  return apiClient.request<GetConversationOperationResponse>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}`,
  );
}

export async function createDirectConversation(
  apiClient: ApiClient,
  input: CreateDirectConversationOperationRequest,
): Promise<CreateDirectConversationOperationResponse> {
  return apiClient.request<CreateDirectConversationOperationResponse>(
    "/api/v1/conversations/direct",
    { method: "POST", json: input },
  );
}
