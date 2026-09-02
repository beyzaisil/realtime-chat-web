import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import { ProfileClientError } from "./profile-error";
import {
  AVATAR_MAX_FILE_SIZE,
  completeAvatarUpload,
  createAvatarUpload,
  deleteCurrentUserAvatar,
  updateCurrentUser,
  uploadAvatarFile,
  validateAvatarFile,
} from "./profile-api";

const user = {
  id: "user-1",
  email: "alice@example.com",
  username: "alice",
  displayName: "Alice",
  avatarUrl: null,
  status: "ACTIVE" as const,
  createdAt: "2030-01-01T00:00:00.000Z",
};

const intent = {
  uploadId: "upload-1",
  upload: {
    url: "http://storage.test/incoming/avatar?signature=one",
    method: "PUT" as const,
    headers: { "Content-Type": "image/png", "x-amz-meta-test": "value" },
    expiresAt: "2030-01-01T00:10:00.000Z",
  },
};

function apiClient(request: ReturnType<typeof vi.fn>): ApiClient {
  return { request: request as unknown as ApiClient["request"] };
}

describe("profile API", () => {
  it("updates the current profile with the generated request and response", async () => {
    const response = { user: { ...user, displayName: "Alice Cooper" } };
    const request = vi.fn().mockResolvedValue(response);

    await expect(
      updateCurrentUser(apiClient(request), {
        username: "alice",
        displayName: "Alice Cooper",
      }),
    ).resolves.toEqual(response);
    expect(request).toHaveBeenCalledWith("/api/v1/users/me", {
      method: "PATCH",
      json: { username: "alice", displayName: "Alice Cooper" },
    });
  });

  it("creates an avatar upload intent using file metadata", async () => {
    const request = vi.fn().mockResolvedValue(intent);

    await expect(
      createAvatarUpload(apiClient(request), {
        contentType: "image/png",
        contentLength: 128,
      }),
    ).resolves.toEqual(intent);
    expect(request).toHaveBeenCalledWith(
      "/api/v1/users/me/avatar/uploads",
      {
        method: "POST",
        json: { contentType: "image/png", contentLength: 128 },
      },
    );
  });

  it("uploads the file to the presigned URL with the exact method and headers", async () => {
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    await uploadAvatarFile(intent.upload, file, fetchMock);

    expect(fetchMock).toHaveBeenCalledWith(intent.upload.url, {
      method: "PUT",
      headers: intent.upload.headers,
      body: file,
    });
  });

  it("completes the upload and safely encodes its id", async () => {
    const response = { user: { ...user, avatarUrl: "http://cdn.test/a.webp" } };
    const request = vi.fn().mockResolvedValue(response);

    await expect(
      completeAvatarUpload(apiClient(request), "upload/id ?"),
    ).resolves.toEqual(response);
    expect(request).toHaveBeenCalledWith(
      "/api/v1/users/me/avatar/uploads/upload%2Fid%20%3F/complete",
      { method: "POST" },
    );
  });

  it("deletes the current avatar", async () => {
    const response = { user };
    const request = vi.fn().mockResolvedValue(response);

    await expect(deleteCurrentUserAvatar(apiClient(request))).resolves.toEqual(
      response,
    );
    expect(request).toHaveBeenCalledWith("/api/v1/users/me/avatar", {
      method: "DELETE",
    });
  });

  it.each([
    ["text/plain", 100, "UNSUPPORTED_AVATAR_FORMAT"],
    ["image/png", 0, "AVATAR_FILE_EMPTY"],
    ["image/png", AVATAR_MAX_FILE_SIZE + 1, "AVATAR_FILE_TOO_LARGE"],
  ])("rejects invalid avatar metadata (%s, %s)", (type, size, code) => {
    const file = new File(["x"], "avatar", { type });
    Object.defineProperty(file, "size", { value: size });

    expect(() => validateAvatarFile(file)).toThrow(ProfileClientError);
    try {
      validateAvatarFile(file);
    } catch (error) {
      expect(error).toMatchObject({ code });
    }
  });

  it("reports a failed presigned storage upload", async () => {
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 503 }),
    );

    await expect(uploadAvatarFile(intent.upload, file, fetchMock)).rejects.toMatchObject({
      code: "AVATAR_STORAGE_UPLOAD_FAILED",
    });
  });
});
