import type {
  CompleteAvatarUploadOperationResponse,
  CompleteAvatarUploadPath,
  CreateAvatarUploadOperationRequest,
  CreateAvatarUploadOperationResponse,
  DeleteCurrentUserAvatarOperationResponse,
  UpdateCurrentUserOperationRequest,
  UpdateCurrentUserOperationResponse,
} from "../../../lib/api/types";
import type { ApiClient } from "../../../lib/http/api-client";
import { ProfileClientError } from "./profile-error";
import {
  parseAvatarUploadIntent,
  parseCurrentUserResponse,
} from "./profile-response";

export const AVATAR_MAX_FILE_SIZE = 5 * 1024 * 1024;
export const AVATAR_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AvatarContentType = (typeof AVATAR_ACCEPTED_TYPES)[number];

export interface ValidatedAvatarFile {
  contentLength: number;
  contentType: AvatarContentType;
  file: File;
}

export function validateAvatarFile(file: File): ValidatedAvatarFile {
  if (file.size < 1) {
    throw new ProfileClientError(
      "AVATAR_FILE_EMPTY",
      "Boş bir dosya avatar olarak yüklenemez.",
    );
  }

  if (file.size > AVATAR_MAX_FILE_SIZE) {
    throw new ProfileClientError(
      "AVATAR_FILE_TOO_LARGE",
      "Avatar dosyası en fazla 5 MiB olabilir.",
    );
  }

  if (!AVATAR_ACCEPTED_TYPES.some((type) => type === file.type)) {
    throw new ProfileClientError(
      "UNSUPPORTED_AVATAR_FORMAT",
      "Yalnızca JPEG, PNG veya WebP görseller yüklenebilir.",
    );
  }

  return {
    file,
    contentLength: file.size,
    contentType: file.type as AvatarContentType,
  };
}

export async function updateCurrentUser(
  apiClient: ApiClient,
  input: UpdateCurrentUserOperationRequest,
): Promise<UpdateCurrentUserOperationResponse> {
  const response = await apiClient.request<unknown>("/api/v1/users/me", {
    method: "PATCH",
    json: input,
  });

  return parseCurrentUserResponse(response);
}

export async function createAvatarUpload(
  apiClient: ApiClient,
  input: CreateAvatarUploadOperationRequest,
): Promise<CreateAvatarUploadOperationResponse> {
  const response = await apiClient.request<unknown>(
    "/api/v1/users/me/avatar/uploads",
    { method: "POST", json: input },
  );

  return parseAvatarUploadIntent(response);
}

export async function uploadAvatarFile(
  intent: CreateAvatarUploadOperationResponse["upload"],
  file: File,
  fetchImplementation: typeof fetch = globalThis.fetch,
): Promise<void> {
  const response = await fetchImplementation(intent.url, {
    method: intent.method,
    headers: intent.headers,
    body: file,
  });

  if (!response.ok) {
    throw new ProfileClientError(
      "AVATAR_STORAGE_UPLOAD_FAILED",
      "Dosya depolama servisine yüklenemedi. Lütfen yeniden dene.",
    );
  }
}

export async function completeAvatarUpload(
  apiClient: ApiClient,
  uploadId: CompleteAvatarUploadPath["uploadId"],
): Promise<CompleteAvatarUploadOperationResponse> {
  const response = await apiClient.request<unknown>(
    `/api/v1/users/me/avatar/uploads/${encodeURIComponent(uploadId)}/complete`,
    { method: "POST" },
  );

  return parseCurrentUserResponse(response);
}

export async function deleteCurrentUserAvatar(
  apiClient: ApiClient,
): Promise<DeleteCurrentUserAvatarOperationResponse> {
  const response = await apiClient.request<unknown>(
    "/api/v1/users/me/avatar",
    { method: "DELETE" },
  );

  return parseCurrentUserResponse(response);
}
