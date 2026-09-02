import type {
  CreateAvatarUploadOperationResponse,
  CurrentUserResponse,
  PublicUser,
} from "../../../lib/api/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPublicUser(value: unknown): value is PublicUser {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.email === "string" &&
    typeof value.username === "string" &&
    typeof value.displayName === "string" &&
    (typeof value.avatarUrl === "string" || value.avatarUrl === null) &&
    (value.status === "ACTIVE" || value.status === "DISABLED") &&
    typeof value.createdAt === "string"
  );
}

export function parseCurrentUserResponse(value: unknown): CurrentUserResponse {
  if (isRecord(value) && isPublicUser(value.user)) {
    return { user: value.user };
  }

  throw new TypeError("Invalid current user response");
}

export function parseAvatarUploadIntent(
  value: unknown,
): CreateAvatarUploadOperationResponse {
  if (
    isRecord(value) &&
    typeof value.uploadId === "string" &&
    isRecord(value.upload) &&
    typeof value.upload.url === "string" &&
    value.upload.method === "PUT" &&
    isRecord(value.upload.headers) &&
    Object.values(value.upload.headers).every(
      (header) => typeof header === "string",
    ) &&
    typeof value.upload.expiresAt === "string"
  ) {
    return value as CreateAvatarUploadOperationResponse;
  }

  throw new TypeError("Invalid avatar upload intent response");
}
