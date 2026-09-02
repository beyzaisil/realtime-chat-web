import {
  isApiClientError,
} from "../../../lib/http/api-client";
import type { ApiClientError } from "../../../lib/http/api-error";

export const GROUP_CONVERSATION_ERROR_CODES = [
  "VALIDATION_ERROR",
  "INVALID_JSON",
  "AUTHENTICATION_REQUIRED",
  "INVALID_TOKEN",
  "INSUFFICIENT_ROLE",
  "CONVERSATION_NOT_FOUND",
  "CONFLICT",
  "INTERNAL_SERVER_ERROR",
] as const;

export type GroupConversationErrorCode =
  (typeof GROUP_CONVERSATION_ERROR_CODES)[number];

const groupConversationErrorCodes = new Set<string>(
  GROUP_CONVERSATION_ERROR_CODES,
);

export function isGroupConversationApiError(
  error: unknown,
): error is ApiClientError & { code: GroupConversationErrorCode } {
  return (
    isApiClientError(error) && groupConversationErrorCodes.has(error.code)
  );
}
