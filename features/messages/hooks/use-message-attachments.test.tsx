import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import {
  AuthContext,
  type AuthContextValue,
} from "../../../providers/auth-provider";
import {
  useAttachmentAccess,
  useUploadAttachment,
  useUploadAttachments,
} from "./use-message-attachments";

const intent = {
  attachmentId: "attachment-1",
  upload: {
    url: "http://storage.test/upload",
    method: "PUT" as const,
    headers: { "Content-Type": "image/png" },
    expiresAt: "2030-01-01T00:10:00.000Z",
  },
};

const attachment = {
  id: "attachment-1",
  kind: "IMAGE" as const,
  originalFileName: "photo.png",
  contentType: "image/webp" as const,
  width: 640,
  height: 480,
  url: "/attachments/attachment-1/original",
  thumbnailUrl: "/attachments/attachment-1/thumbnail",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

function createHarness(request: ReturnType<typeof vi.fn>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  const auth = {
    user: null,
    accessToken: "token",
    status: "authenticated",
    apiClient: { request: request as unknown as ApiClient["request"] },
    setCurrentUser: vi.fn(),
    clearSession: vi.fn(),
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

  return { Wrapper };
}

describe("message attachment hooks", () => {
  it("uploads one attachment through the complete three-step flow", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(intent)
      .mockResolvedValueOnce({ attachment });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { Wrapper } = createHarness(request);
    const { result } = renderHook(
      () => useUploadAttachment("conversation-1"),
      { wrapper: Wrapper },
    );
    const file = new File(["photo"], "photo.png", { type: "image/png" });

    await act(async () => {
      await expect(result.current.mutateAsync(file)).resolves.toEqual(
        attachment,
      );
    });

    expect(request).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("validates an attachment collection before starting network work", async () => {
    const request = vi.fn();
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    const { Wrapper } = createHarness(request);
    const { result } = renderHook(
      () => useUploadAttachments("conversation-1"),
      { wrapper: Wrapper },
    );

    await expect(
      act(() => result.current.mutateAsync([])),
    ).rejects.toMatchObject({ code: "NO_ATTACHMENTS" });
    expect(request).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accesses an attachment on demand without storing its short-lived URL", async () => {
    const response = new Response("pdf", {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    });
    const request = vi.fn().mockResolvedValue(response);
    const { Wrapper } = createHarness(request);
    const { result } = renderHook(
      () => useAttachmentAccess("conversation-1"),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          attachmentId: "attachment-1",
          variant: "original",
        }),
      ).resolves.toBe(response);
    });

    expect(request).toHaveBeenCalledWith(
      new URL(
        "/api/attachments/conversation-1/attachment-1/original",
        window.location.origin,
      ).toString(),
      { method: "GET", responseType: "raw" },
    );
  });
});
