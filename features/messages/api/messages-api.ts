import type {
  CreateMessageOperationRequest,
  CreateMessageOperationResponse,
  CreateMessagePath,
  ListMessagesOperationResponse,
  ListMessagesPath,
  ListMessagesQuery,
  UpdateReadWatermarkOperationRequest,
  UpdateReadWatermarkOperationResponse,
  UpdateReadWatermarkPath,
} from "../../../lib/api/types";
import type { ApiClient } from "../../../lib/http/api-client";

export async function listMessages(
  apiClient: ApiClient,
  conversationId: ListMessagesPath["conversationId"],
  input: ListMessagesQuery = {},
): Promise<ListMessagesOperationResponse> {
  const search = new URLSearchParams({
    limit: String(input.limit ?? 50),
  });

  if (input.before !== undefined) {
    search.set("before", input.before);
  }

  return apiClient.request<ListMessagesOperationResponse>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages?${search.toString()}`,
  );
}

export async function createMessage(
  apiClient: ApiClient,
  conversationId: CreateMessagePath["conversationId"],
  input: CreateMessageOperationRequest,
): Promise<CreateMessageOperationResponse> {
  return apiClient.request<CreateMessageOperationResponse>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      json: input,
    },
  );
}

export async function updateReadWatermark(
  apiClient: ApiClient,
  conversationId: UpdateReadWatermarkPath["conversationId"],
  input: UpdateReadWatermarkOperationRequest,
): Promise<UpdateReadWatermarkOperationResponse> {
  return apiClient.request<UpdateReadWatermarkOperationResponse>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/read`,
    { method: "PUT", json: input },
  );
}
