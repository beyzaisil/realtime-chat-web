import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import {
  AuthContext,
  type AuthContextValue,
} from "../../../providers/auth-provider";
import type { MessageDto } from "../types";
import { useReadWatermark } from "./use-read-watermark";

const incoming: MessageDto = {
  id: "message-1",
  conversationId: "conversation-1",
  senderId: "user-2",
  clientMessageId: "client-1",
  kind: "TEXT",
  body: "Incoming",
  createdAt: "2030-01-01T10:00:00.000Z",
  editedAt: null,
  deletedAt: null,
};

describe("useReadWatermark", () => {
  it("reads new incoming messages once and never triggers from own messages", async () => {
    const requestMock = vi.fn().mockResolvedValue({
      conversationId: "conversation-1",
      throughMessageId: "message-1",
      readAt: "2030-01-01T10:00:00.000Z",
      status: "advanced",
    });
    const apiClient: ApiClient = {
      request: requestMock as unknown as ApiClient["request"],
    };
    const queryClient = new QueryClient();
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
    const view = renderHook(
      ({ visible }: { visible: MessageDto | null }) =>
        useReadWatermark("conversation-1", "user-1", visible),
      {
        wrapper: Wrapper,
        initialProps: { visible: null as MessageDto | null },
      },
    );

    view.rerender({ visible: incoming });
    await waitFor(() => expect(requestMock).toHaveBeenCalledOnce());
    view.rerender({ visible: { ...incoming } });
    await Promise.resolve();
    expect(requestMock).toHaveBeenCalledOnce();

    view.rerender({
      visible: {
        ...incoming,
        id: "message-own",
        clientMessageId: "client-own",
        senderId: "user-1",
      },
    });
    expect(requestMock).toHaveBeenCalledOnce();

    view.rerender({
      visible: {
        ...incoming,
        id: "message-2",
        clientMessageId: "client-2",
      },
    });
    await waitFor(() => expect(requestMock).toHaveBeenCalledTimes(2));
    expect(requestMock.mock.calls[1]?.[1]).toMatchObject({
      method: "PUT",
      json: { throughMessageId: "message-2" },
    });
  });
});
