import type {
  AuthSession,
  ListAuthSessionsOperationResponse,
} from "../../../lib/api/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isAuthSession(value: unknown): value is AuthSession {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (typeof value.userAgent === "string" || value.userAgent === null) &&
    typeof value.createdAt === "string" &&
    typeof value.lastUsedAt === "string" &&
    typeof value.expiresAt === "string" &&
    typeof value.isCurrent === "boolean"
  );
}

export function parseAuthSessionListResponse(
  value: unknown,
): ListAuthSessionsOperationResponse {
  if (
    isRecord(value) &&
    Array.isArray(value.items) &&
    value.items.every(isAuthSession)
  ) {
    return { items: value.items };
  }

  throw new TypeError("Invalid auth session list response");
}
