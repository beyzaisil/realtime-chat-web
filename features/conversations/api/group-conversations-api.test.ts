import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import { ApiClientError } from "../../../lib/http/api-error";
import { isGroupConversationApiError } from "./group-conversation-error";
import {
  addGroupMember,
  createGroupConversation,
  leaveGroupConversation,
  removeGroupMember,
  transferGroupOwnership,
  updateGroupMemberRole,
  updateGroupTitle,
} from "./group-conversations-api";

const member = {
  userId: "user-1",
  role: "OWNER" as const,
  joinedAt: "2030-01-01T00:00:00.000Z",
  user: {
    id: "user-1",
    username: "alice",
    displayName: "Alice",
    avatarUrl: null,
  },
};

const group = {
  id: "conversation-1",
  type: "GROUP" as const,
  title: "Product team",
  createdAt: "2030-01-01T00:00:00.000Z",
  members: [member],
};

function apiClient(request: ReturnType<typeof vi.fn>): ApiClient {
  return { request: request as unknown as ApiClient["request"] };
}

describe("group conversation API", () => {
  it("creates a group using the generated request body", async () => {
    const request = vi.fn().mockResolvedValue(group);

    await createGroupConversation(apiClient(request), {
      title: "Product team",
      userIds: ["user-2", "user-3"],
    });

    expect(request).toHaveBeenCalledWith("/api/v1/conversations/group", {
      method: "POST",
      json: {
        title: "Product team",
        userIds: ["user-2", "user-3"],
      },
    });
  });

  it("updates a group title and safely encodes the conversation path", async () => {
    const request = vi.fn().mockResolvedValue({
      ...group,
      title: "Renamed team",
    });

    await updateGroupTitle(
      apiClient(request),
      "conversation/id ?",
      { title: "Renamed team" },
    );

    expect(request).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation%2Fid%20%3F",
      { method: "PATCH", json: { title: "Renamed team" } },
    );
  });

  it("adds a member with the generated UserIdRequest body", async () => {
    const request = vi.fn().mockResolvedValue(member);

    await addGroupMember(apiClient(request), "conversation-1", {
      userId: "user-1",
    });

    expect(request).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation-1/members",
      { method: "POST", json: { userId: "user-1" } },
    );
  });

  it("leaves a group through the current-member endpoint", async () => {
    const request = vi.fn().mockResolvedValue(undefined);

    await leaveGroupConversation(apiClient(request), "conversation-1");

    expect(request).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation-1/members/me",
      { method: "DELETE" },
    );
  });

  it("removes a member and safely encodes both path parameters", async () => {
    const request = vi.fn().mockResolvedValue(undefined);

    await removeGroupMember(
      apiClient(request),
      "conversation/id",
      "user/id ?",
    );

    expect(request).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation%2Fid/members/user%2Fid%20%3F",
      { method: "DELETE" },
    );
  });

  it("updates a member role with the generated role request", async () => {
    const updatedMember = { ...member, role: "ADMIN" as const };
    const request = vi.fn().mockResolvedValue(updatedMember);

    await updateGroupMemberRole(
      apiClient(request),
      "conversation-1",
      "user-1",
      { role: "ADMIN" },
    );

    expect(request).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation-1/members/user-1",
      { method: "PATCH", json: { role: "ADMIN" } },
    );
  });

  it("transfers ownership with PUT and the generated UserIdRequest body", async () => {
    const request = vi.fn().mockResolvedValue(group);

    await transferGroupOwnership(
      apiClient(request),
      "conversation-1",
      { userId: "user-1" },
    );

    expect(request).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation-1/owner",
      { method: "PUT", json: { userId: "user-1" } },
    );
  });

  it("preserves a technical insufficient-role error", async () => {
    const error = new ApiClientError({
      status: 403,
      code: "INSUFFICIENT_ROLE",
      message: "Your role does not permit this action",
      requestId: "request-1",
    });
    const request = vi.fn().mockRejectedValue(error);

    await expect(
      addGroupMember(apiClient(request), "conversation-1", {
        userId: "user-2",
      }),
    ).rejects.toBe(error);
    expect(isGroupConversationApiError(error)).toBe(true);
    expect(error.code).toBe("INSUFFICIENT_ROLE");
  });

  it("preserves not-found errors for invalid member operations", async () => {
    const error = new ApiClientError({
      status: 404,
      code: "CONVERSATION_NOT_FOUND",
      message: "Conversation not found",
      requestId: "request-2",
    });
    const request = vi.fn().mockRejectedValue(error);

    await expect(
      removeGroupMember(
        apiClient(request),
        "conversation-1",
        "missing-user",
      ),
    ).rejects.toBe(error);
    expect(isGroupConversationApiError(error)).toBe(true);
    expect(error.code).toBe("CONVERSATION_NOT_FOUND");
  });
});
