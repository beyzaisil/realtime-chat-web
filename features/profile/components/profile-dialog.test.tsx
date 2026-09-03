import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import {
  AuthContext,
  type AuthContextValue,
} from "../../../providers/auth-provider";
import { ProfileDialog } from "./profile-dialog";

const currentUser = {
  id: "user-1",
  email: "alice@example.com",
  username: "alice",
  displayName: "Alice",
  avatarUrl: null,
  status: "ACTIVE" as const,
  createdAt: "2030-01-01T00:00:00.000Z",
};

function renderDialog(
  request: (path: string, options?: unknown) => unknown,
) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const setCurrentUser = vi.fn();
  const routedRequest = vi.fn((path: string, options?: unknown) => {
    if (path === "/api/v1/auth/sessions") {
      return Promise.resolve({ items: [] });
    }

    return request(path, options);
  });
  const auth = {
    user: currentUser,
    accessToken: "token",
    status: "authenticated",
    apiClient: {
      request: routedRequest as unknown as ApiClient["request"],
    },
    setCurrentUser,
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

  return {
    setCurrentUser,
    ...render(<ProfileDialog open onClose={vi.fn()} />, { wrapper: Wrapper }),
  };
}

describe("ProfileDialog", () => {
  it("submits changed profile fields and presents success feedback", async () => {
    const updated = { ...currentUser, displayName: "Alice Cooper" };
    const request = vi.fn().mockResolvedValue({ user: updated });
    const { setCurrentUser } = renderDialog(request);
    const browserUser = userEvent.setup();
    const displayName = screen.getByLabelText("Görünen ad");

    await browserUser.clear(displayName);
    await browserUser.type(displayName, "Alice Cooper");
    await browserUser.click(
      screen.getByRole("button", { name: "Profili kaydet" }),
    );

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Profil bilgilerin güncellendi.",
      ),
    );
    expect(request).toHaveBeenCalledWith("/api/v1/users/me", {
      method: "PATCH",
      json: { displayName: "Alice Cooper" },
    });
    expect(setCurrentUser).toHaveBeenCalledWith(updated);
  });

  it("shows a client-side error for an unsupported avatar type", () => {
    const request = vi.fn();
    renderDialog(request);
    const file = new File(["plain text"], "avatar.txt", {
      type: "text/plain",
    });

    fireEvent.change(screen.getByLabelText("Avatar görseli seç"), {
      target: { files: [file] },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Yalnızca JPEG, PNG veya WebP görseller yüklenebilir.",
    );
    expect(request).not.toHaveBeenCalled();
  });

  it("shows an understandable error when the storage upload fails", async () => {
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
    renderDialog(request);
    const browserUser = userEvent.setup();
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Avatar görseli seç"), {
      target: { files: [file] },
    });

    await browserUser.click(
      screen.getByRole("button", { name: "Avatarı yükle" }),
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Dosya depolama servisine yüklenemedi. Lütfen yeniden dene.",
      ),
    );
  });
});
