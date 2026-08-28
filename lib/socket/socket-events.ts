import type { Message } from "../api/types";

export interface SessionReadyPayload {
  userId: string;
  socketId: string;
  serverTime: string;
}

export interface PresenceState {
  status: "online" | "offline";
  lastSeenAt: string | null;
}

export interface PresenceUpdatedPayload extends PresenceState {
  userId: string;
}

export type PresenceSubscriptionAck =
  | { ok: true; data: Record<string, PresenceState> }
  | { ok: false; error: { code: "VALIDATION_ERROR" } };

export type MessageEventDto = Message;

export interface ReadUpdatedPayload {
  conversationId: string;
  readerId: string;
  throughMessageId: string;
  readAt: string;
}

export interface TypingUpdatedPayload {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  expiresAt: string;
}

export interface ConversationEventPayload {
  conversationId: string;
}

export type ConversationSubscriptionAck =
  | { ok: true }
  | {
      ok: false;
      error: { code: "FORBIDDEN" | "VALIDATION_ERROR" };
    };

export interface ChatServerToClientEvents {
  "session:ready": (payload: SessionReadyPayload) => void;
  "auth:expiring": () => void;
  "auth:revoked": () => void;
  "presence:updated": (payload: PresenceUpdatedPayload) => void;
  "message:created": (payload: { message: MessageEventDto }) => void;
  "message:updated": (payload: { message: MessageEventDto }) => void;
  "message:deleted": (payload: { message: MessageEventDto }) => void;
  "read:updated": (payload: ReadUpdatedPayload) => void;
  "typing:updated": (payload: TypingUpdatedPayload) => void;
}

export interface ChatClientToServerEvents {
  "presence:subscribe": (
    payload: { userIds: string[] },
    acknowledge: (response: PresenceSubscriptionAck) => void,
  ) => void;
  "conversation:subscribe": (
    payload: ConversationEventPayload,
    acknowledge: (response: ConversationSubscriptionAck) => void,
  ) => void;
  "conversation:unsubscribe": (
    payload: ConversationEventPayload,
    acknowledge: (response: ConversationSubscriptionAck) => void,
  ) => void;
  "typing:set": (payload: {
    conversationId: string;
    isTyping: boolean;
  }) => void;
}
