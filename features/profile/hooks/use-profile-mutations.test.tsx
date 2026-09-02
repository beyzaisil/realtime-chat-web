import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import {
  AuthContext,
  type AuthContextValue,
} from "../../../providers/auth-provider";
import {
  useDeleteAvatar,
  useUpdateProfile,
  useUploadAvatar,
} from "./use-profile-mutations";

const user = {
  id: "user-1",
  email: "alice@example.com",
  username: "alice",
  displayName: "Alice",
  avatarUrl: null,
  status: "ACTIVE" as const,
  createdAt: "2030-01-01T00:00:00.000Z",
};

function createHarness(request: ReturnType<typeof vi.fn>) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const setCurrentUser = vi.fn();
  const auth = {
    user,
    accessToken: "token",
    status: "authenticated",
    apiClient: { request: request as unknown as ApiClient["request"] },
    setCurrentUser,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    bootstrap: vi.fn(),
  } satisfies AuthContextValue;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    );
  }

  return { setCurrentUser, Wrapper };
}

describe("profile mutation hooks", () => {
  it("updates auth user state after a profile update", async () => {
    const updated = { ...user, displayName: "Alice Cooper" };
    const request = vi.fn().mockResolvedValue({ user: updated });
    const { setCurrentUser, Wrapper } = createHarness(request);
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ displayName: "Alice Cooper" });
    });

    expect(setCurrentUser).toHaveBeenCalledWith(updated);
  });

  it("runs the three-step avatar flow and updates auth user state", async () => {
    const updated = { ...user, avatarUrl: "http://cdn.test/avatar.webp" };
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        uploadId: "upload-1",
        upload: {
          url: "http://storage.test/upload",
          method: "PUT",
          headers: { "Content-Type": "image/png" },
          expiresAt: "2030-01-01T00:10:00.000Z",
        },
      })
      .mockResolvedValueOnce({ user: updated });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { setCurrentUser, Wrapper } = createHarness(request);
    const { result } = renderHook(() => useUploadAvatar(), { wrapper: Wrapper });
    const stages = vi.fn();
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });

    await act(async () => {
      await result.current.mutateAsync({ file, onStageChange: stages });
    });

    expect(request).toHaveBeenNthCalledWith(
      1,
      "/api/v1/users/me/avatar/uploads",
      {
        method: "POST",
        json: { contentType: "image/png", contentLength: file.size },
      },
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://storage.test/upload",
      {
        method: "PUT",
        headers: { "Content-Type": "image/png" },
        body: file,
      },
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      "/api/v1/users/me/avatar/uploads/upload-1/complete",
      { method: "POST" },
    );
    expect(stages.mock.calls.map(([stage]) => stage)).toEqual([
      "preparing",
      "uploading",
      "processing",
    ]);
    expect(setCurrentUser).toHaveBeenCalledWith(updated);
  });

  it("rejects an invalid file before starting the API flow", async () => {
    const request = vi.fn();
    const { setCurrentUser, Wrapper } = createHarness(request);
    const { result } = renderHook(() => useUploadAvatar(), { wrapper: Wrapper });
    const file = new File(["not-an-image"], "avatar.txt", {
      type: "text/plain",
    });

    await expect(
      act(() => result.current.mutateAsync({ file })),
    ).rejects.toMatchObject({ code: "UNSUPPORTED_AVATAR_FORMAT" });
    expect(request).not.toHaveBeenCalled();
    expect(setCurrentUser).not.toHaveBeenCalled();
  });

  it("does not update auth state when storage upload fails", async () => {
    const request = vi.fn().mockResolvedValue({
      uploadId: "upload-1",
      upload: {
        url: "http://storage.test/upload",
        method: "PUT",
        headers: { "Content-Type": "image/png" },
        expiresAt: "2030-01-01T00:10:00.000Z",
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 500 })),
    );
    const { setCurrentUser, Wrapper } = createHarness(request);
    const { result } = renderHook(() => useUploadAvatar(), { wrapper: Wrapper });
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });

    await expect(
      act(() => result.current.mutateAsync({ file })),
    ).rejects.toMatchObject({ code: "AVATAR_STORAGE_UPLOAD_FAILED" });
    expect(request).toHaveBeenCalledTimes(1);
    expect(setCurrentUser).not.toHaveBeenCalled();
  });

  it("updates auth state after deleting the avatar", async () => {
    const updated = { ...user, avatarUrl: null };
    const request = vi.fn().mockResolvedValue({ user: updated });
    const { setCurrentUser, Wrapper } = createHarness(request);
    const { result } = renderHook(() => useDeleteAvatar(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(setCurrentUser).toHaveBeenCalledWith(updated);
  });
});
