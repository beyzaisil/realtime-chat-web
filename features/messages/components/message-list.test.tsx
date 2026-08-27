import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMessageHistory } from "../hooks/use-message-history";
import type { MessageDto } from "../types";
import { MessageList } from "./message-list";

vi.mock("../hooks/use-message-history");

const incoming: MessageDto = {
  id: "message-1",
  conversationId: "conversation-1",
  senderId: "user-2",
  clientMessageId: "client-1",
  kind: "TEXT",
  body: "Merhaba",
  createdAt: "2030-01-01T10:00:00.000Z",
  editedAt: null,
  deletedAt: null,
};
const own: MessageDto = {
  ...incoming,
  id: "message-2",
  clientMessageId: "client-2",
  senderId: "user-1",
  body: "Selam",
};

function historyResult(overrides: Record<string, unknown> = {}) {
  return {
    messages: [],
    isPending: false,
    isError: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useMessageHistory>;
}

describe("MessageList", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
  });

  it("renders loading and message history states", () => {
    vi.mocked(useMessageHistory).mockReturnValue(
      historyResult({ isPending: true }),
    );
    const view = render(
      <MessageList conversationId="conversation-1" currentUserId="user-1" onLatestVisible={vi.fn()} />,
    );
    expect(screen.getByLabelText("Mesajlar yükleniyor")).toBeInTheDocument();

    vi.mocked(useMessageHistory).mockReturnValue(
      historyResult({ messages: [incoming, own] }),
    );
    view.rerender(
      <MessageList conversationId="conversation-1" currentUserId="user-1" onLatestVisible={vi.fn()} />,
    );
    expect(screen.getByText("Merhaba")).toBeInTheDocument();
    expect(screen.getByText("Selam")).toBeInTheDocument();
  });

  it("requests the next history cursor page", () => {
    const fetchNextPage = vi.fn();
    vi.mocked(useMessageHistory).mockReturnValue(
      historyResult({
        messages: [incoming],
        hasNextPage: true,
        fetchNextPage,
      }),
    );
    render(
      <MessageList conversationId="conversation-1" currentUserId="user-1" onLatestVisible={vi.fn()} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Daha eski mesajları yükle" }),
    );
    expect(fetchNextPage).toHaveBeenCalledOnce();
  });
});
