import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMessageHistory } from "../hooks/use-message-history";
import type { MessageDto } from "../types";
import { MessageList } from "./message-list";

vi.mock("../hooks/use-message-history");
vi.mock("./message-actions", () => ({ MessageActions: () => null }));

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

  it("renders the loading state", () => {
    vi.mocked(useMessageHistory).mockReturnValue(
      historyResult({ isPending: true }),
    );
    render(
      <MessageList conversationId="conversation-1" currentUserId="user-1" onLatestVisible={vi.fn()} />,
    );
    expect(screen.getByLabelText("Mesajlar yükleniyor")).toBeInTheDocument();
  });

  it("renders a normal message", () => {
    vi.mocked(useMessageHistory).mockReturnValue(
      historyResult({ messages: [incoming, own] }),
    );
    render(
      <MessageList conversationId="conversation-1" currentUserId="user-1" onLatestVisible={vi.fn()} />,
    );
    expect(screen.getByText("Merhaba")).toBeInTheDocument();
    expect(screen.getByText("Selam")).toBeInTheDocument();
  });

  it("renders edited information for a non-deleted message", () => {
    vi.mocked(useMessageHistory).mockReturnValue(
      historyResult({
        messages: [
          {
            ...incoming,
            body: "Düzenlenmiş mesaj",
            editedAt: "2030-01-01T10:05:00.000Z",
          },
        ],
      }),
    );
    render(
      <MessageList conversationId="conversation-1" currentUserId="user-1" onLatestVisible={vi.fn()} />,
    );

    expect(screen.getByText("Düzenlenmiş mesaj")).toBeInTheDocument();
    expect(screen.getByText("düzenlendi")).toBeInTheDocument();
  });

  it("renders a tombstone without exposing the deleted body", () => {
    vi.mocked(useMessageHistory).mockReturnValue(
      historyResult({
        messages: [
          {
            ...incoming,
            body: "Artık gösterilmemesi gereken içerik",
            deletedAt: "2030-01-01T10:10:00.000Z",
          },
        ],
      }),
    );
    render(
      <MessageList conversationId="conversation-1" currentUserId="user-1" onLatestVisible={vi.fn()} />,
    );

    expect(screen.getByText("Bu mesaj silindi.")).toBeInTheDocument();
    expect(
      screen.queryByText("Artık gösterilmemesi gereken içerik"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("düzenlendi")).not.toBeInTheDocument();
  });

  it("renders a tombstone when the message body is null", () => {
    vi.mocked(useMessageHistory).mockReturnValue(
      historyResult({ messages: [{ ...incoming, body: null }] }),
    );
    render(
      <MessageList conversationId="conversation-1" currentUserId="user-1" onLatestVisible={vi.fn()} />,
    );

    expect(screen.getByText("Bu mesaj silindi.")).toBeInTheDocument();
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
