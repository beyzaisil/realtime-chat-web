import type {
  Message,
  MessageHistoryResponse,
  ReadWatermarkResponse,
} from "../../lib/api/types";

export type MessageDto = Message;
export type MessageHistoryPage = MessageHistoryResponse;

export interface SendMessageInput {
  text: string;
  clientMessageId?: string;
}

export type ReadWatermarkDto = ReadWatermarkResponse;
