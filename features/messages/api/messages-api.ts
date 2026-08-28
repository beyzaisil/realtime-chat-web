import type {
  CreateMessageOperationRequest,
  CreateMessageOperationResponse,
  CreateMessagePath,
  DeleteMessageOperationResponse,
  DeleteMessagePath,
  ListMessagesOperationResponse,
  ListMessagesPath,
  ListMessagesQuery,
  UpdateMessageOperationRequest,
  UpdateMessageOperationResponse,
  UpdateMessagePath,
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

export async function updateMessage(
  apiClient: ApiClient,
  conversationId: UpdateMessagePath["conversationId"],
  messageId: UpdateMessagePath["messageId"],
  input: UpdateMessageOperationRequest,
): Promise<UpdateMessageOperationResponse> {
  return apiClient.request<UpdateMessageOperationResponse>(
    messageMutationPath(conversationId, messageId),
    { method: "PATCH", json: input },
  );
}

export async function deleteMessage(
  apiClient: ApiClient,
  conversationId: DeleteMessagePath["conversationId"],
  messageId: DeleteMessagePath["messageId"],
): Promise<DeleteMessageOperationResponse> {
  return apiClient.request<DeleteMessageOperationResponse>(
    messageMutationPath(conversationId, messageId),
    { method: "DELETE" },
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

function messageMutationPath(
  conversationId: string,
  messageId: string,
): string {
  return `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`;
}
