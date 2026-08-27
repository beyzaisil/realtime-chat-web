import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useConversationPresence } from "../../presence/hooks/use-conversation-presence";
import { useConversations } from "../hooks/use-conversations";
import type { ConversationListItem } from "../types";
import { ConversationList } from "./conversation-list";

vi.mock("next/navigation", () => ({ usePathname: () => "/chat" }));
vi.mock("../../presence/hooks/use-conversation-presence");
vi.mock("../hooks/use-conversations");

const conversation: ConversationListItem = {
  id: "conversation-1",
  type: "DIRECT",
  title: null,
  createdAt: "2030-01-01T10:00:00.000Z",
  otherUser: {
    id: "user-2",
    username: "bob",
    displayName: "Bob Yılmaz",
    avatarUrl: null,
  },
  lastMessageAt: "2030-01-02T10:00:00.000Z",
  lastMessage: {
    id: "message-1",
    body: "Merhaba Alice",
    senderId: "user-2",
    createdAt: "2030-01-02T10:00:00.000Z",
    deletedAt: null,
  },
  unreadCount: 4,
};

function queryResult(overrides: Record<string, unknown> = {}) {
  return {
    conversations: [],
    isPending: false,
    isError: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    refetch: vi.fn(),
    fetchNextPage: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useConversations>;
}

describe("ConversationList", () => {
  beforeEach(() => {
    vi.mocked(useConversationPresence).mockReturnValue({});
  });

  it("renders a loading state", () => {
    vi.mocked(useConversations).mockReturnValue(
      queryResult({ isPending: true }),
    );
    render(<ConversationList />);
    expect(screen.getByLabelText("Sohbetler yükleniyor")).toBeInTheDocument();
  });

  it("renders an empty state", () => {
    vi.mocked(useConversations).mockReturnValue(queryResult());
    render(<ConversationList />);
    expect(screen.getByText("Henüz bir sohbetin yok")).toBeInTheDocument();
  });

  it("renders conversation content, unread count and presence", () => {
    vi.mocked(useConversations).mockReturnValue(
      queryResult({ conversations: [conversation] }),
    );
    vi.mocked(useConversationPresence).mockReturnValue({
      "user-2": { status: "online", lastSeenAt: null },
    });

    render(<ConversationList />);

    expect(screen.getByText("Bob Yılmaz")).toBeInTheDocument();
    expect(screen.getByText("@bob")).toBeInTheDocument();
    expect(screen.getByText("Merhaba Alice")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByLabelText("Çevrimiçi")).toBeInTheDocument();
  });

  it("loads the next page from the list action", () => {
    const fetchNextPage = vi.fn();
    vi.mocked(useConversations).mockReturnValue(
      queryResult({
        conversations: [conversation],
        hasNextPage: true,
        fetchNextPage,
      }),
    );
    render(<ConversationList />);
    fireEvent.click(screen.getByRole("button", { name: "Daha fazla yükle" }));
    expect(fetchNextPage).toHaveBeenCalledOnce();
  });
});
