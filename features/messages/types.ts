import type { MessageEventDto } from "../../lib/socket/socket-events";

export type MessageDto = MessageEventDto;

export interface MessageHistoryPage {
  items: MessageDto[];
  nextCursor: string | null;
}

export interface SendMessageInput {
  text: string;
  clientMessageId?: string;
}

export interface ReadWatermarkDto {
  conversationId: string;
  throughMessageId: string;
  readAt: string;
  status: "created" | "advanced" | "unchanged";
}
