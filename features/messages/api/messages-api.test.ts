import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import {
  createMessage,
  listMessages,
  updateReadWatermark,
} from "./messages-api";

describe("messages API", () => {
  it("passes the opaque before cursor and limit according to listMessages", async () => {
    const request = vi.fn().mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    const apiClient: ApiClient = {
      request: request as unknown as ApiClient["request"],
    };
    const before = "opaque+/message=cursor";

    await listMessages(apiClient, "conversation-1", {
      before,
      limit: 73,
    });

    const path = String(request.mock.calls[0]?.[0]);
    const url = new URL(path, "http://frontend.test");
    expect(url.pathname).toBe(
      "/api/v1/conversations/conversation-1/messages",
    );
    expect(url.searchParams.get("before")).toBe(before);
    expect(url.searchParams.get("limit")).toBe("73");
  });

  it("posts the generated createMessage request body", async () => {
    const request = vi.fn().mockResolvedValue({});
    const apiClient: ApiClient = {
      request: request as unknown as ApiClient["request"],
    };
    const body = {
      clientMessageId: "client-message-1",
      content: { type: "text" as const, text: "Merhaba" },
    };

    await createMessage(apiClient, "conversation-1", body);

    expect(request).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation-1/messages",
      { method: "POST", json: body },
    );
  });

  it("puts the generated updateReadWatermark request body", async () => {
    const request = vi.fn().mockResolvedValue({
      conversationId: "conversation-1",
      throughMessageId: "message-1",
      readAt: "2030-01-01T00:00:00.000Z",
      status: "advanced",
    });
    const apiClient: ApiClient = {
      request: request as unknown as ApiClient["request"],
    };
    const body = { throughMessageId: "message-1" };

    await updateReadWatermark(apiClient, "conversation-1", body);

    expect(request).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation-1/read",
      { method: "PUT", json: body },
    );
  });
});
