import type {
  MediaMessage,
  Message,
  MessageAttachment,
  MessageHistoryResponse,
  ReadWatermarkResponse,
  TextMessage,
} from "../../lib/api/types";
import {
  type ApiClientError,
} from "../../lib/http/api-error";
import { isApiClientError } from "../../lib/http/api-client";

export type MessageDto = Message;
export type TextMessageDto = TextMessage;
export type MediaMessageDto = MediaMessage;
export type MessageAttachmentDto = MessageAttachment;
export type MessageHistoryPage = MessageHistoryResponse;

export function isTextMessage(
  message: MessageDto,
): message is TextMessageDto {
  return message.kind === "TEXT";
}

export function isMediaMessage(
  message: MessageDto,
): message is MediaMessageDto {
  return message.kind === "MEDIA";
}

export interface SendMessageInput {
  text: string;
  clientMessageId?: string;
}

export interface SendMediaMessageInput {
  attachmentIds: string[];
  text?: string;
  clientMessageId?: string;
}

export interface UpdateMessageInput {
  messageId: string;
  kind: MessageDto["kind"];
  text: string;
}

export interface DeleteMessageInput {
  messageId: string;
}

export type MessageMutationErrorCode =
  | "VALIDATION_ERROR"
  | "MESSAGE_NOT_FOUND"
  | "CONVERSATION_NOT_FOUND"
  | "AUTHENTICATION_REQUIRED"
  | "INVALID_TOKEN"
  | "PAYLOAD_TOO_LARGE"
  | "INTERNAL_SERVER_ERROR";

const MESSAGE_MUTATION_ERROR_CODES: ReadonlySet<string> = new Set<
  MessageMutationErrorCode
>([
  "VALIDATION_ERROR",
  "MESSAGE_NOT_FOUND",
  "CONVERSATION_NOT_FOUND",
  "AUTHENTICATION_REQUIRED",
  "INVALID_TOKEN",
  "PAYLOAD_TOO_LARGE",
  "INTERNAL_SERVER_ERROR",
]);

export function isMessageMutationError(
  error: unknown,
): error is ApiClientError & { readonly code: MessageMutationErrorCode } {
  return (
    isApiClientError(error) && MESSAGE_MUTATION_ERROR_CODES.has(error.code)
  );
}

export type ReadWatermarkDto = ReadWatermarkResponse;
