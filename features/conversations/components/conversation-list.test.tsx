import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useConversationPresence } from "../../presence/hooks/use-conversation-presence";
import { useConversations } from "../hooks/use-conversations";
import type { ConversationListItem } from "../types";
import { ConversationList } from "./conversation-list";

vi.mock("next/navigation", () => ({ usePathname: () => "/chat" }));
vi.mock("../../presence/hooks/use-conversation-presence");
vi.mock("../hooks/use-conversation-list-realtime");
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

const groupConversation: ConversationListItem = {
  id: "conversation-2",
  type: "GROUP",
  title: "Product team",
  createdAt: "2030-01-01T10:00:00.000Z",
  members: [
    {
      userId: "user-1",
      role: "OWNER",
      joinedAt: "2030-01-01T10:00:00.000Z",
      user: {
        id: "user-1",
        username: "alice",
        displayName: "Alice",
        avatarUrl: null,
      },
    },
    {
      userId: "user-2",
      role: "MEMBER",
      joinedAt: "2030-01-01T10:00:00.000Z",
      user: conversation.otherUser,
    },
  ],
  lastMessageAt: "2030-01-02T10:00:00.000Z",
  lastMessage: {
    id: "message-2",
    body: "Toplantı saat 10'da",
    senderId: "user-1",
    createdAt: "2030-01-02T10:00:00.000Z",
    deletedAt: null,
  },
  unreadCount: 1,
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

  it("renders a group conversation with a safe basic presentation", () => {
    vi.mocked(useConversations).mockReturnValue(
      queryResult({ conversations: [conversation, groupConversation] }),
    );

    render(<ConversationList />);

    expect(screen.getByText("Product team")).toBeInTheDocument();
    expect(screen.getByText("2 üyeli grup")).toBeInTheDocument();
    expect(screen.getByText("Toplantı saat 10'da")).toBeInTheDocument();
    expect(useConversationPresence).toHaveBeenCalledWith(["user-2"]);
  });

  it("renders a distinct preview for a deleted last message", () => {
    vi.mocked(useConversations).mockReturnValue(
      queryResult({
        conversations: [
          {
            ...conversation,
            lastMessage: {
              ...conversation.lastMessage!,
              body: "Silinen eski önizleme",
              deletedAt: "2030-01-02T10:05:00.000Z",
            },
          },
        ],
      }),
    );

    render(<ConversationList />);

    expect(screen.getByText("Mesaj silindi.")).toBeInTheDocument();
    expect(screen.queryByText("Silinen eski önizleme")).not.toBeInTheDocument();
    expect(screen.queryByText("Henüz mesaj yok")).not.toBeInTheDocument();
  });

  it("renders no-message preview only when lastMessage is null", () => {
    vi.mocked(useConversations).mockReturnValue(
      queryResult({
        conversations: [
          {
            ...conversation,
            lastMessageAt: null,
            lastMessage: null,
          },
        ],
      }),
    );

    render(<ConversationList />);

    expect(screen.getByText("Henüz mesaj yok")).toBeInTheDocument();
    expect(screen.queryByText("Mesaj silindi.")).not.toBeInTheDocument();
  });

  it("renders a media preview when the last message has no caption", () => {
    vi.mocked(useConversations).mockReturnValue(
      queryResult({
        conversations: [
          {
            ...conversation,
            lastMessage: {
              ...conversation.lastMessage!,
              body: null,
              deletedAt: null,
            },
          },
        ],
      }),
    );

    render(<ConversationList />);

    expect(screen.getByText("Medya mesajı")).toBeInTheDocument();
    expect(screen.queryByText("Mesaj silindi.")).not.toBeInTheDocument();
    expect(screen.queryByText("Henüz mesaj yok")).not.toBeInTheDocument();
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
