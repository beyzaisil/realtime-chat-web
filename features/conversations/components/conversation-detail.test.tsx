import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useParams } from "next/navigation";
import { useAuth } from "../../../providers/auth-provider";
import { useConversationRealtime } from "../../messages/hooks/use-conversation-realtime";
import { useConversationSubscription } from "../../messages/hooks/use-conversation-subscription";
import { useReadWatermark } from "../../messages/hooks/use-read-watermark";
import { useTyping } from "../../messages/hooks/use-typing";
import { useConversationPresence } from "../../presence/hooks/use-conversation-presence";
import { useConversation } from "../hooks/use-conversations";
import type { Conversation } from "../types";
import { ConversationDetail } from "./conversation-detail";

vi.mock("next/navigation", () => ({ useParams: vi.fn() }));
vi.mock("../../../providers/auth-provider");
vi.mock("../hooks/use-conversations");
vi.mock("../../presence/hooks/use-conversation-presence");
vi.mock("../../messages/hooks/use-conversation-realtime");
vi.mock("../../messages/hooks/use-conversation-subscription");
vi.mock("../../messages/hooks/use-read-watermark");
vi.mock("../../messages/hooks/use-typing");
vi.mock("../../messages/components/message-list", () => ({
  MessageList: ({ conversationId }: { conversationId: string }) => (
    <div>Mesajlar: {conversationId}</div>
  ),
}));
vi.mock("../../messages/components/message-composer", () => ({
  MessageComposer: ({ conversationId }: { conversationId: string }) => (
    <div>Mesaj yaz: {conversationId}</div>
  ),
}));

const bob = {
  id: "user-2",
  username: "bob",
  displayName: "Bob",
  avatarUrl: null,
};

const directConversation: Conversation = {
  id: "conversation-direct",
  type: "DIRECT",
  title: null,
  createdAt: "2030-01-01T00:00:00.000Z",
  otherUser: bob,
};

const groupConversation: Conversation = {
  id: "conversation-group",
  type: "GROUP",
  title: "Product team",
  createdAt: "2030-01-01T00:00:00.000Z",
  members: [
    {
      userId: "user-1",
      role: "OWNER",
      joinedAt: "2030-01-01T00:00:00.000Z",
      user: {
        id: "user-1",
        username: "alice",
        displayName: "Alice",
        avatarUrl: null,
      },
    },
    {
      userId: bob.id,
      role: "MEMBER",
      joinedAt: "2030-01-01T00:00:00.000Z",
      user: bob,
    },
  ],
};

function conversationQuery(data: Conversation) {
  return {
    data,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useConversation>;
}

describe("ConversationDetail", () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({
      conversationId: "conversation-direct",
    });
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-1" },
    } as ReturnType<typeof useAuth>);
    vi.mocked(useConversationPresence).mockReturnValue({});
    vi.mocked(useConversationSubscription).mockReturnValue(true);
    vi.mocked(useConversationRealtime).mockReturnValue({
      latestReadUpdate: null,
    });
    vi.mocked(useReadWatermark).mockReturnValue(undefined);
    vi.mocked(useTyping).mockReturnValue({
      isOtherUserTyping: false,
      updateTyping: vi.fn(),
      stopTyping: vi.fn(),
    });
  });

  it("preserves the direct conversation header and message area", () => {
    vi.mocked(useConversation).mockReturnValue(
      conversationQuery(directConversation),
    );

    render(<ConversationDetail />);

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText(/@bob/)).toBeInTheDocument();
    expect(screen.getByText("Mesajlar: conversation-direct")).toBeInTheDocument();
  });

  it("renders a group conversation with its title and member count", () => {
    vi.mocked(useParams).mockReturnValue({
      conversationId: "conversation-group",
    });
    vi.mocked(useConversation).mockReturnValue(
      conversationQuery(groupConversation),
    );

    render(<ConversationDetail />);

    expect(screen.getByText("Product team")).toBeInTheDocument();
    expect(screen.getByText("2 üyeli grup")).toBeInTheDocument();
    expect(screen.getByText("Mesajlar: conversation-group")).toBeInTheDocument();
  });
});
