import type {
  AccessMessageAttachmentPath,
  CompleteMessageAttachmentUploadOperationResponse,
  CompleteMessageAttachmentUploadPath,
  CreateMessageAttachmentUploadOperationRequest,
  CreateMessageAttachmentUploadOperationResponse,
  CreateMessageAttachmentUploadPath,
  MessageAttachment,
  PresignedUpload,
} from "../../../lib/api/types";
import type { ApiClient } from "../../../lib/http/api-client";
import { isApiClientError } from "../../../lib/http/api-client";
import { AttachmentClientError } from "./message-attachment-error";

export const ATTACHMENT_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const satisfies readonly CreateMessageAttachmentUploadOperationRequest["contentType"][];

export type AttachmentContentType =
  CreateMessageAttachmentUploadOperationRequest["contentType"];

export const MAX_IMAGE_ATTACHMENT_BYTES = 10 * 1_024 * 1_024;
export const MAX_PDF_ATTACHMENT_BYTES = 25 * 1_024 * 1_024;
export const MAX_ATTACHMENTS_PER_MESSAGE = 4;
export const MAX_MESSAGE_ATTACHMENTS_TOTAL_BYTES = 50 * 1_024 * 1_024;

const MAX_BYTES_BY_CONTENT_TYPE: Record<AttachmentContentType, number> = {
  "image/jpeg": MAX_IMAGE_ATTACHMENT_BYTES,
  "image/png": MAX_IMAGE_ATTACHMENT_BYTES,
  "image/webp": MAX_IMAGE_ATTACHMENT_BYTES,
  "application/pdf": MAX_PDF_ATTACHMENT_BYTES,
};

const RETRYABLE_COMPLETE_ERROR_CODES = new Set([
  "ATTACHMENT_UPLOAD_INCOMPLETE",
  "ATTACHMENT_SCAN_UNAVAILABLE",
  "ATTACHMENT_STORAGE_UNAVAILABLE",
]);

export interface ValidatedAttachmentFile {
  contentLength: number;
  contentType: AttachmentContentType;
  file: File;
  originalFileName: string;
}

export interface AttachmentUploadOptions {
  fetchImplementation?: typeof fetch;
  maxCompleteAttempts?: number;
  retryDelayMs?: number;
  waitForRetry?(delayMs: number): Promise<void>;
}

export async function createMessageAttachmentUpload(
  apiClient: ApiClient,
  conversationId: CreateMessageAttachmentUploadPath["conversationId"],
  input: CreateMessageAttachmentUploadOperationRequest,
): Promise<CreateMessageAttachmentUploadOperationResponse> {
  return apiClient.request<CreateMessageAttachmentUploadOperationResponse>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/attachments/uploads`,
    { method: "POST", json: input },
  );
}

export async function uploadMessageAttachmentFile(
  upload: PresignedUpload,
  file: File,
  fetchImplementation: typeof fetch = globalThis.fetch,
): Promise<void> {
  try {
    const response = await fetchImplementation(upload.url, {
      method: upload.method,
      headers: upload.headers,
      body: file,
    });

    if (!response.ok) {
      throw new AttachmentClientError(
        "ATTACHMENT_STORAGE_UPLOAD_FAILED",
        "Dosya depolama servisine yüklenemedi.",
        response.status,
      );
    }
  } catch (error: unknown) {
    if (error instanceof AttachmentClientError) {
      throw error;
    }

    throw new AttachmentClientError(
      "ATTACHMENT_STORAGE_UPLOAD_FAILED",
      "Dosya depolama servisine yüklenemedi.",
    );
  }
}

export async function completeMessageAttachmentUpload(
  apiClient: ApiClient,
  conversationId: CompleteMessageAttachmentUploadPath["conversationId"],
  attachmentId: CompleteMessageAttachmentUploadPath["attachmentId"],
): Promise<CompleteMessageAttachmentUploadOperationResponse> {
  return apiClient.request<CompleteMessageAttachmentUploadOperationResponse>(
    attachmentCompletePath(conversationId, attachmentId),
    { method: "POST" },
  );
}

export async function accessMessageAttachment(
  apiClient: ApiClient,
  conversationId: AccessMessageAttachmentPath["conversationId"],
  attachmentId: AccessMessageAttachmentPath["attachmentId"],
  variant: AccessMessageAttachmentPath["variant"],
): Promise<Response> {
  return apiClient.request<Response>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}` +
      `/attachments/${encodeURIComponent(attachmentId)}/${encodeURIComponent(variant)}`,
    { method: "GET", responseType: "raw" },
  );
}

export function validateAttachmentFile(file: File): ValidatedAttachmentFile {
  if (file.size < 1) {
    throw new AttachmentClientError(
      "ATTACHMENT_FILE_EMPTY",
      "Boş bir dosya yüklenemez.",
    );
  }

  if (file.name.trim().length === 0) {
    throw new AttachmentClientError(
      "ATTACHMENT_FILE_NAME_REQUIRED",
      "Dosya adı boş olamaz.",
    );
  }

  if (!isAttachmentContentType(file.type)) {
    throw new AttachmentClientError(
      "UNSUPPORTED_ATTACHMENT_FORMAT",
      "Yalnızca JPEG, PNG, WebP veya PDF dosyaları yüklenebilir.",
    );
  }

  if (file.size > MAX_BYTES_BY_CONTENT_TYPE[file.type]) {
    const limit = file.type === "application/pdf" ? "25 MiB" : "10 MiB";
    throw new AttachmentClientError(
      "ATTACHMENT_FILE_TOO_LARGE",
      `Bu dosya türü en fazla ${limit} olabilir.`,
    );
  }

  return {
    file,
    contentLength: file.size,
    contentType: file.type,
    originalFileName: file.name,
  };
}

export function validateAttachmentFiles(
  files: readonly File[],
): ValidatedAttachmentFile[] {
  if (files.length === 0) {
    throw new AttachmentClientError(
      "NO_ATTACHMENTS",
      "Yüklenecek en az bir dosya seçilmelidir.",
    );
  }

  if (files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    throw new AttachmentClientError(
      "TOO_MANY_ATTACHMENTS",
      `Bir mesaja en fazla ${String(MAX_ATTACHMENTS_PER_MESSAGE)} dosya eklenebilir.`,
    );
  }

  const validated = files.map(validateAttachmentFile);
  const totalBytes = validated.reduce(
    (total, file) => total + file.contentLength,
    0,
  );

  if (totalBytes > MAX_MESSAGE_ATTACHMENTS_TOTAL_BYTES) {
    throw new AttachmentClientError(
      "ATTACHMENT_TOTAL_SIZE_EXCEEDED",
      "Mesaj eklerinin toplam boyutu en fazla 50 MiB olabilir.",
    );
  }

  return validated;
}

export async function uploadMessageAttachment(
  apiClient: ApiClient,
  conversationId: CreateMessageAttachmentUploadPath["conversationId"],
  file: File,
  options: AttachmentUploadOptions = {},
): Promise<MessageAttachment> {
  const validated = validateAttachmentFile(file);
  return uploadValidatedAttachment(apiClient, conversationId, validated, options);
}

export async function uploadMessageAttachments(
  apiClient: ApiClient,
  conversationId: CreateMessageAttachmentUploadPath["conversationId"],
  files: readonly File[],
  options: AttachmentUploadOptions = {},
): Promise<MessageAttachment[]> {
  const validatedFiles = validateAttachmentFiles(files);
  const attachments: MessageAttachment[] = [];

  for (const file of validatedFiles) {
    attachments.push(
      await uploadValidatedAttachment(apiClient, conversationId, file, options),
    );
  }

  return attachments;
}

async function uploadValidatedAttachment(
  apiClient: ApiClient,
  conversationId: CreateMessageAttachmentUploadPath["conversationId"],
  validated: ValidatedAttachmentFile,
  options: AttachmentUploadOptions,
): Promise<MessageAttachment> {
  const intent = await createMessageAttachmentUpload(apiClient, conversationId, {
    contentType: validated.contentType,
    contentLength: validated.contentLength,
    originalFileName: validated.originalFileName,
  });

  await uploadMessageAttachmentFile(
    intent.upload,
    validated.file,
    options.fetchImplementation,
  );

  const completed = await completeWithRetry(
    apiClient,
    conversationId,
    intent.attachmentId,
    options,
  );
  return completed.attachment;
}

async function completeWithRetry(
  apiClient: ApiClient,
  conversationId: CompleteMessageAttachmentUploadPath["conversationId"],
  attachmentId: CompleteMessageAttachmentUploadPath["attachmentId"],
  options: AttachmentUploadOptions,
): Promise<CompleteMessageAttachmentUploadOperationResponse> {
  const maxAttempts = Math.max(1, options.maxCompleteAttempts ?? 2);
  const retryDelayMs = Math.max(0, options.retryDelayMs ?? 250);
  const waitForRetry = options.waitForRetry ?? defaultWaitForRetry;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await completeMessageAttachmentUpload(
        apiClient,
        conversationId,
        attachmentId,
      );
    } catch (error: unknown) {
      if (attempt === maxAttempts || !isRetryableCompleteError(error)) {
        throw error;
      }
      await waitForRetry(retryDelayMs);
    }
  }

  throw new Error("Attachment completion attempts were exhausted");
}

function isAttachmentContentType(
  value: string,
): value is AttachmentContentType {
  return (ATTACHMENT_ACCEPTED_TYPES as readonly string[]).includes(value);
}

function isRetryableCompleteError(error: unknown): boolean {
  return (
    !isApiClientError(error) || RETRYABLE_COMPLETE_ERROR_CODES.has(error.code)
  );
}

function defaultWaitForRetry(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, delayMs);
  });
}

function attachmentCompletePath(
  conversationId: string,
  attachmentId: string,
): string {
  return (
    `/api/v1/conversations/${encodeURIComponent(conversationId)}` +
    `/attachments/uploads/${encodeURIComponent(attachmentId)}/complete`
  );
}
