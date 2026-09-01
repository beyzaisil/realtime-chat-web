import { describe, expect, expectTypeOf, it } from "vitest";

import {
  isDirectConversation,
  isGroupConversation,
  type Conversation,
  type DirectConversation,
  type GroupConversation,
} from "../types";
import {
  parseConversationListResponse,
  parseConversationResponse,
} from "./conversation-response";

const user = {
  id: "user-1",
  username: "alice",
  displayName: "Alice",
  avatarUrl: null,
};

const directConversation = {
  id: "conversation-direct",
  type: "DIRECT",
  title: null,
  createdAt: "2030-01-01T00:00:00.000Z",
  otherUser: user,
} satisfies DirectConversation;

const groupConversation = {
  id: "conversation-group",
  type: "GROUP",
  title: "Product team",
  createdAt: "2030-01-01T00:00:00.000Z",
  members: [
    {
      userId: user.id,
      role: "OWNER",
      joinedAt: "2030-01-01T00:00:00.000Z",
      user,
    },
  ],
} satisfies GroupConversation;

function readConversationLabel(conversation: Conversation): string {
  if (isDirectConversation(conversation)) {
    expectTypeOf(conversation).toEqualTypeOf<DirectConversation>();
    return conversation.otherUser.displayName;
  }

  if (isGroupConversation(conversation)) {
    expectTypeOf(conversation).toEqualTypeOf<GroupConversation>();
    return conversation.title;
  }

  throw new TypeError("Unsupported conversation variant");
}

describe("conversation response parsing", () => {
  it("parses and narrows direct and group conversation variants", () => {
    const direct = parseConversationResponse(directConversation);
    const group = parseConversationResponse(groupConversation);

    expect(readConversationLabel(direct)).toBe("Alice");
    expect(readConversationLabel(group)).toBe("Product team");
  });

  it("parses a mixed direct/group conversation list", () => {
    const page = parseConversationListResponse({
      items: [
        {
          ...directConversation,
          lastMessageAt: null,
          lastMessage: null,
          unreadCount: 0,
        },
        {
          ...groupConversation,
          lastMessageAt: null,
          lastMessage: null,
          unreadCount: 2,
        },
      ],
      nextCursor: "opaque-cursor",
    });

    expect(page.items.map((conversation) => conversation.type)).toEqual([
      "DIRECT",
      "GROUP",
    ]);
    expect(page.nextCursor).toBe("opaque-cursor");
  });

  it("rejects an unknown discriminator instead of casting it", () => {
    expect(() =>
      parseConversationResponse({
        ...directConversation,
        type: "CHANNEL",
      }),
    ).toThrowError("Invalid conversation response");
  });
});
