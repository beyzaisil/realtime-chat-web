import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import {
  changePassword,
  listAuthSessions,
  revokeAuthSession,
  revokeOtherAuthSessions,
} from "./security-api";

const currentSession = {
  id: "session-1",
  userAgent: "Chrome on Windows",
  createdAt: "2030-01-01T10:00:00.000Z",
  lastUsedAt: "2030-01-02T10:00:00.000Z",
  expiresAt: "2030-02-01T10:00:00.000Z",
  isCurrent: true,
};

function apiClient(request: ReturnType<typeof vi.fn>): ApiClient {
  return { request: request as unknown as ApiClient["request"] };
}

describe("security API", () => {
  it("changes the password with the exact method, path and body", async () => {
    const request = vi.fn().mockResolvedValue(undefined);

    await changePassword(apiClient(request), {
      currentPassword: "current-password",
      newPassword: "new-password-123",
    });

    expect(request).toHaveBeenCalledWith("/api/v1/auth/password", {
      method: "PATCH",
      json: {
        currentPassword: "current-password",
        newPassword: "new-password-123",
      },
    });
  });

  it("lists active sessions and validates the response", async () => {
    const response = { items: [currentSession] };
    const request = vi.fn().mockResolvedValue(response);

    await expect(listAuthSessions(apiClient(request))).resolves.toEqual(
      response,
    );
    expect(request).toHaveBeenCalledWith("/api/v1/auth/sessions");
  });

  it("revokes all sessions except the current one", async () => {
    const request = vi.fn().mockResolvedValue(undefined);

    await revokeOtherAuthSessions(apiClient(request));

    expect(request).toHaveBeenCalledWith("/api/v1/auth/sessions", {
      method: "DELETE",
    });
  });

  it("revokes one session and safely encodes its id", async () => {
    const request = vi.fn().mockResolvedValue(undefined);

    await revokeAuthSession(apiClient(request), "session/id ?");

    expect(request).toHaveBeenCalledWith(
      "/api/v1/auth/sessions/session%2Fid%20%3F",
      { method: "DELETE" },
    );
  });

  it.each([
    ["", "new-password-123", "CURRENT_PASSWORD_REQUIRED"],
    ["current", "short", "NEW_PASSWORD_TOO_SHORT"],
    ["same-password", "same-password", "PASSWORDS_MUST_DIFFER"],
  ])(
    "rejects invalid password input before sending a request",
    async (currentPassword, newPassword, code) => {
      const request = vi.fn();

      await expect(
        changePassword(apiClient(request), { currentPassword, newPassword }),
      ).rejects.toMatchObject({ code });
      expect(request).not.toHaveBeenCalled();
    },
  );
});
