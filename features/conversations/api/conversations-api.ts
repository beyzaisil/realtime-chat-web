import type { ApiClient } from "../../../lib/http/api-client";
import type {
  ConversationPage,
  DirectConversation,
} from "../types";

export interface ListConversationsInput {
  cursor?: string;
  limit?: number;
}

export async function listConversations(
  apiClient: ApiClient,
  input: ListConversationsInput = {},
): Promise<ConversationPage> {
  const search = new URLSearchParams();

  if (input.cursor !== undefined) {
    search.set("cursor", input.cursor);
  }
  search.set("limit", String(input.limit ?? 20));

  return apiClient.request<ConversationPage>(
    `/api/v1/conversations?${search.toString()}`,
  );
}

export async function getConversation(
  apiClient: ApiClient,
  conversationId: string,
): Promise<DirectConversation> {
  return apiClient.request<DirectConversation>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}`,
  );
}

export async function createDirectConversation(
  apiClient: ApiClient,
  userId: string,
): Promise<DirectConversation> {
  return apiClient.request<DirectConversation>(
    "/api/v1/conversations/direct",
    { method: "POST", json: { userId } },
  );
}
