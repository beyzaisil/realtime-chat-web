import type { ApiClient } from "../../../lib/http/api-client";
import type {
  MessageDto,
  MessageHistoryPage,
  ReadWatermarkDto,
} from "../types";

export async function listMessages(
  apiClient: ApiClient,
  conversationId: string,
  input: { before?: string; limit?: number } = {},
): Promise<MessageHistoryPage> {
  const search = new URLSearchParams({
    limit: String(input.limit ?? 50),
  });

  if (input.before !== undefined) {
    search.set("before", input.before);
  }

  return apiClient.request<MessageHistoryPage>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages?${search.toString()}`,
  );
}

export async function createMessage(
  apiClient: ApiClient,
  conversationId: string,
  input: { clientMessageId: string; text: string },
): Promise<MessageDto> {
  return apiClient.request<MessageDto>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      json: {
        clientMessageId: input.clientMessageId,
        content: { type: "text", text: input.text },
      },
    },
  );
}

export async function updateReadWatermark(
  apiClient: ApiClient,
  conversationId: string,
  throughMessageId: string,
): Promise<ReadWatermarkDto> {
  return apiClient.request<ReadWatermarkDto>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/read`,
    { method: "PUT", json: { throughMessageId } },
  );
}
