import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ApiClient,
  ApiRequestOptions,
} from "../../../lib/http/api-client";
import {
  AuthContext,
  type AuthContextValue,
} from "../../../providers/auth-provider";
import { NewConversationDialog } from "./new-conversation-dialog";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
}));

function renderDialog(apiClient: ApiClient, onClose = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const auth = {
    user: null,
    accessToken: "token",
    status: "authenticated",
    apiClient,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    bootstrap: vi.fn(),
  } as unknown as AuthContextValue;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    );
  }

  render(<NewConversationDialog open onClose={onClose} />, { wrapper: Wrapper });
  return { onClose };
}

describe("NewConversationDialog", () => {
  beforeEach(() => navigation.push.mockReset());

  it("renders debounced search results", async () => {
    const requestMock = vi.fn().mockResolvedValue({
      items: [
        {
          id: "user-2",
          username: "bob",
          displayName: "Bob Yılmaz",
          avatarUrl: null,
        },
      ],
      nextCursor: null,
    });
    renderDialog({
      request: requestMock as unknown as ApiClient["request"],
    });

    fireEvent.change(screen.getByLabelText("Kullanıcı ara"), {
      target: { value: "bo" },
    });

    expect(requestMock).not.toHaveBeenCalled();
    expect(await screen.findByText("Bob Yılmaz")).toBeInTheDocument();
    expect(screen.getByText("@bob")).toBeInTheDocument();
  });

  it("posts the selected user, closes and routes to the conversation", async () => {
    const requestMock = vi.fn((path: string, _options?: ApiRequestOptions) => {
      if (path.startsWith("/api/v1/users?")) {
        return Promise.resolve({
          items: [
            {
              id: "user-2",
              username: "bob",
              displayName: "Bob Yılmaz",
              avatarUrl: null,
            },
          ],
          nextCursor: null,
        });
      }

      return Promise.resolve({
        id: "conversation-9",
        type: "DIRECT",
        title: null,
        createdAt: "2030-01-01T00:00:00.000Z",
        otherUser: {
          id: "user-2",
          username: "bob",
          displayName: "Bob Yılmaz",
          avatarUrl: null,
        },
      });
    });
    const { onClose } = renderDialog({
      request: requestMock as unknown as ApiClient["request"],
    });
    fireEvent.change(screen.getByLabelText("Kullanıcı ara"), {
      target: { value: "bo" },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Bob Yılmaz/ }));

    await waitFor(() => {
      expect(navigation.push).toHaveBeenCalledWith("/chat/conversation-9");
    });
    expect(onClose).toHaveBeenCalledOnce();
    const directCall = requestMock.mock.calls.find(
      ([path]) => path === "/api/v1/conversations/direct",
    );
    expect(directCall?.[1]).toMatchObject({
      method: "POST",
      json: { userId: "user-2" },
    });
  });
});
