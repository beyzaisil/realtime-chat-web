import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import { searchUsers } from "./users-api";

describe("users API", () => {
  it("passes query, cursor and limit according to searchUsers", async () => {
    const request = vi.fn().mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    const apiClient: ApiClient = {
      request: request as unknown as ApiClient["request"],
    };
    const cursor = "opaque+/cursor=value";

    await searchUsers(apiClient, {
      query: "bo b",
      cursor,
      limit: 37,
    });

    expect(request).toHaveBeenCalledOnce();
    const path = String(request.mock.calls[0]?.[0]);
    const url = new URL(path, "http://frontend.test");
    expect(url.pathname).toBe("/api/v1/users");
    expect(url.searchParams.get("query")).toBe("bo b");
    expect(url.searchParams.get("cursor")).toBe(cursor);
    expect(url.searchParams.get("limit")).toBe("37");
  });
});
