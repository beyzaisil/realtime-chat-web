import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import { createApiClient } from "../../../lib/http/api-client";
import { isMessageMutationError } from "../types";
import {
  createMessage,
  deleteMessage,
  listMessages,
  updateMessage,
  updateReadWatermark,
} from "./messages-api";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function apiErrorResponse(status: number, code: string): Response {
  return jsonResponse(
    {
      error: {
        code,
        message: code,
        requestId: `request-${status}`,
      },
    },
    status,
  );
}

function createFetchClient(fetchImplementation: typeof fetch): ApiClient {
  return createApiClient({
    baseUrl: "http://localhost:4000",
    fetch: fetchImplementation,
    auth: {
      getAccessToken: () => "token",
      refreshAccessToken: async () => null,
      onUnauthorized: () => undefined,
    },
  });
}

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

  it("patches a message with the OpenAPI request body", async () => {
    const request = vi.fn().mockResolvedValue({});
    const apiClient: ApiClient = {
      request: request as unknown as ApiClient["request"],
    };
    const body = {
      content: { type: "text" as const, text: "Güncellenmiş mesaj" },
    };

    await updateMessage(
      apiClient,
      "conversation-1",
      "message-1",
      body,
    );

    expect(request).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation-1/messages/message-1",
      { method: "PATCH", json: body },
    );
  });

  it("deletes a message using the OpenAPI path", async () => {
    const request = vi.fn().mockResolvedValue({});
    const apiClient: ApiClient = {
      request: request as unknown as ApiClient["request"],
    };

    await deleteMessage(apiClient, "conversation-1", "message-1");

    expect(request).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation-1/messages/message-1",
      { method: "DELETE" },
    );
  });

  it("encodes conversation and message path segments independently", async () => {
    const request = vi.fn().mockResolvedValue({});
    const apiClient: ApiClient = {
      request: request as unknown as ApiClient["request"],
    };

    await deleteMessage(
      apiClient,
      "conversation/with space",
      "message/with?query",
    );

    expect(request).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation%2Fwith%20space/messages/message%2Fwith%3Fquery",
      { method: "DELETE" },
    );
  });

  it.each([
    [404, "MESSAGE_NOT_FOUND"],
    [400, "VALIDATION_ERROR"],
  ])("preserves the %s mutation error code %s", async (status, code) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(apiErrorResponse(status, code));
    const apiClient = createFetchClient(fetchMock);

    let caught: unknown;
    try {
      await updateMessage(apiClient, "conversation-1", "message-1", {
        content: { type: "text", text: "Güncel" },
      });
    } catch (error) {
      caught = error;
    }

    expect(isMessageMutationError(caught)).toBe(true);
    expect(caught).toMatchObject({ status, code });
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
