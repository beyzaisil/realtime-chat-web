import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import {
  createDirectConversation,
  listConversations,
} from "./conversations-api";

describe("conversations API", () => {
  it("passes the opaque cursor and limit according to listConversations", async () => {
    const request = vi.fn().mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    const apiClient: ApiClient = {
      request: request as unknown as ApiClient["request"],
    };
    const cursor = "opaque+/conversation=cursor";

    await listConversations(apiClient, { cursor, limit: 41 });

    const path = String(request.mock.calls[0]?.[0]);
    const url = new URL(path, "http://frontend.test");
    expect(url.pathname).toBe("/api/v1/conversations");
    expect(url.searchParams.get("cursor")).toBe(cursor);
    expect(url.searchParams.get("limit")).toBe("41");
  });

  it("posts the generated createDirectConversation request body", async () => {
    const response = {
      id: "conversation-1",
      type: "DIRECT" as const,
      title: null,
      createdAt: "2030-01-01T00:00:00.000Z",
      otherUser: {
        id: "user-2",
        username: "bob",
        displayName: "Bob",
        avatarUrl: null,
      },
    };
    const request = vi.fn().mockResolvedValue(response);
    const apiClient: ApiClient = {
      request: request as unknown as ApiClient["request"],
    };

    await createDirectConversation(apiClient, { userId: "user-2" });

    expect(request).toHaveBeenCalledWith("/api/v1/conversations/direct", {
      method: "POST",
      json: { userId: "user-2" },
    });
  });
});
