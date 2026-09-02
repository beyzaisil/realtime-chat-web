import type {
  Conversation,
  ConversationPage,
  DirectConversation,
  GroupConversation,
  GroupMember,
  ListedDirectConversation,
  ListedGroupConversation,
} from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isConversationUser(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.username) &&
    isString(value.displayName) &&
    isNullableString(value.avatarUrl)
  );
}

export function isGroupMemberResponse(
  value: unknown,
): value is GroupMember {
  return (
    isRecord(value) &&
    isString(value.userId) &&
    (value.role === "MEMBER" ||
      value.role === "ADMIN" ||
      value.role === "OWNER") &&
    isString(value.joinedAt) &&
    isConversationUser(value.user)
  );
}

function isGroupMembers(value: unknown): boolean {
  return Array.isArray(value) && value.every(isGroupMemberResponse);
}

function isLastMessage(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isNullableString(value.body) &&
    isString(value.senderId) &&
    isString(value.createdAt) &&
    isNullableString(value.deletedAt)
  );
}

function hasConversationBase(value: Record<string, unknown>): boolean {
  return (
    isString(value.id) &&
    isString(value.createdAt) &&
    isNullableString(value.title)
  );
}

function hasListedConversationBase(value: Record<string, unknown>): boolean {
  return (
    hasConversationBase(value) &&
    isNullableString(value.lastMessageAt) &&
    (value.lastMessage === null || isLastMessage(value.lastMessage)) &&
    typeof value.unreadCount === "number" &&
    Number.isInteger(value.unreadCount) &&
    value.unreadCount >= 0
  );
}

export function isDirectConversationResponse(
  value: unknown,
): value is DirectConversation {
  return (
    isRecord(value) &&
    value.type === "DIRECT" &&
    hasConversationBase(value) &&
    isConversationUser(value.otherUser)
  );
}

export function isGroupConversationResponse(
  value: unknown,
): value is GroupConversation {
  return (
    isRecord(value) &&
    value.type === "GROUP" &&
    hasConversationBase(value) &&
    isString(value.title) &&
    isGroupMembers(value.members)
  );
}

export function isListedDirectConversationResponse(
  value: unknown,
): value is ListedDirectConversation {
  return (
    isRecord(value) &&
    value.type === "DIRECT" &&
    hasListedConversationBase(value) &&
    isConversationUser(value.otherUser)
  );
}

export function isListedGroupConversationResponse(
  value: unknown,
): value is ListedGroupConversation {
  return (
    isRecord(value) &&
    value.type === "GROUP" &&
    hasListedConversationBase(value) &&
    isString(value.title) &&
    isGroupMembers(value.members)
  );
}

export function parseConversationResponse(value: unknown): Conversation {
  if (
    isDirectConversationResponse(value) ||
    isGroupConversationResponse(value)
  ) {
    return value;
  }

  throw new TypeError("Invalid conversation response");
}

export function parseDirectConversationResponse(
  value: unknown,
): DirectConversation {
  if (isDirectConversationResponse(value)) {
    return value;
  }

  throw new TypeError("Invalid direct conversation response");
}

export function parseGroupConversationResponse(
  value: unknown,
): GroupConversation {
  if (isGroupConversationResponse(value)) {
    return value;
  }

  throw new TypeError("Invalid group conversation response");
}

export function parseGroupMemberResponse(value: unknown): GroupMember {
  if (isGroupMemberResponse(value)) {
    return value;
  }

  throw new TypeError("Invalid group member response");
}

function isConversationListPage(value: unknown): value is ConversationPage {
  return (
    isRecord(value) &&
    Array.isArray(value.items) &&
    value.items.every(
      (item) =>
        isListedDirectConversationResponse(item) ||
        isListedGroupConversationResponse(item),
    ) &&
    isNullableString(value.nextCursor)
  );
}

export function parseConversationListResponse(
  value: unknown,
): ConversationPage {
  if (isConversationListPage(value)) {
    return value;
  }

  throw new TypeError("Invalid conversation list response");
}
