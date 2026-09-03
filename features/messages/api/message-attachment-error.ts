import { isApiClientError } from "../../../lib/http/api-client";
import type { ApiClientError } from "../../../lib/http/api-error";

export const ATTACHMENT_API_ERROR_CODES = [
  "VALIDATION_ERROR",
  "INVALID_JSON",
  "AUTHENTICATION_REQUIRED",
  "INVALID_TOKEN",
  "CONVERSATION_NOT_FOUND",
  "UNSUPPORTED_ATTACHMENT_FORMAT",
  "ATTACHMENT_UPLOAD_NOT_FOUND",
  "ATTACHMENT_NOT_FOUND",
  "ATTACHMENT_UPLOAD_EXPIRED",
  "ATTACHMENT_UPLOAD_INCOMPLETE",
  "ATTACHMENT_UPLOAD_CONFLICT",
  "INVALID_ATTACHMENT_FILE",
  "KIND_MISMATCH",
  "ATTACHMENT_STORAGE_UNAVAILABLE",
  "ATTACHMENT_SCAN_UNAVAILABLE",
  "ATTACHMENT_BINDING_CONFLICT",
  "MESSAGE_ATTACHMENTS_TOTAL_SIZE_EXCEEDED",
  "RATE_LIMIT_EXCEEDED",
  "PAYLOAD_TOO_LARGE",
  "INTERNAL_SERVER_ERROR",
] as const;

export type AttachmentApiErrorCode =
  (typeof ATTACHMENT_API_ERROR_CODES)[number];

export type AttachmentClientErrorCode =
  | "ATTACHMENT_FILE_EMPTY"
  | "ATTACHMENT_FILE_NAME_REQUIRED"
  | "ATTACHMENT_FILE_TOO_LARGE"
  | "ATTACHMENT_STORAGE_UPLOAD_FAILED"
  | "ATTACHMENT_TOTAL_SIZE_EXCEEDED"
  | "NO_ATTACHMENTS"
  | "TOO_MANY_ATTACHMENTS"
  | "UNSUPPORTED_ATTACHMENT_FORMAT";

export class AttachmentClientError extends Error {
  readonly code: AttachmentClientErrorCode;
  readonly status: number | null;

  constructor(
    code: AttachmentClientErrorCode,
    message: string,
    status: number | null = null,
  ) {
    super(message);
    this.name = "AttachmentClientError";
    this.code = code;
    this.status = status;
  }
}

const attachmentApiErrorCodes = new Set<string>(ATTACHMENT_API_ERROR_CODES);

export function isAttachmentApiError(
  error: unknown,
): error is ApiClientError & { code: AttachmentApiErrorCode } {
  return (
    isApiClientError(error) && attachmentApiErrorCodes.has(error.code)
  );
}

const ATTACHMENT_ERROR_MESSAGES: Record<AttachmentApiErrorCode, string> = {
  VALIDATION_ERROR: "Dosya bilgileri geçersiz.",
  INVALID_JSON: "Gönderilen dosya bilgileri geçersiz.",
  AUTHENTICATION_REQUIRED: "Oturumun sona ermiş. Lütfen yeniden giriş yap.",
  INVALID_TOKEN: "Oturumun geçersiz. Lütfen yeniden giriş yap.",
  CONVERSATION_NOT_FOUND: "Konuşma bulunamadı veya artık erişilemiyor.",
  UNSUPPORTED_ATTACHMENT_FORMAT: "Bu dosya türü desteklenmiyor.",
  ATTACHMENT_UPLOAD_NOT_FOUND: "Dosya yükleme kaydı bulunamadı.",
  ATTACHMENT_NOT_FOUND: "Dosya bulunamadı veya artık erişilemiyor.",
  ATTACHMENT_UPLOAD_EXPIRED: "Dosya yükleme bağlantısının süresi doldu.",
  ATTACHMENT_UPLOAD_INCOMPLETE: "Dosya yüklemesi henüz tamamlanmadı.",
  ATTACHMENT_UPLOAD_CONFLICT: "Dosya yüklemesi bu durumda tamamlanamıyor.",
  INVALID_ATTACHMENT_FILE: "Yüklenen dosya geçerli değil.",
  KIND_MISMATCH: "Dosyanın gerçek türü seçilen türle eşleşmiyor.",
  ATTACHMENT_STORAGE_UNAVAILABLE:
    "Dosya depolama servisi şu anda kullanılamıyor.",
  ATTACHMENT_SCAN_UNAVAILABLE:
    "Dosyanın güvenlik taraması şu anda tamamlanamıyor.",
  ATTACHMENT_BINDING_CONFLICT: "Dosya mesaja bağlanamıyor.",
  MESSAGE_ATTACHMENTS_TOTAL_SIZE_EXCEEDED:
    "Mesaj eklerinin toplam boyutu sınırı aşıyor.",
  RATE_LIMIT_EXCEEDED: "Çok fazla yükleme denemesi yapıldı.",
  PAYLOAD_TOO_LARGE: "Dosya izin verilen boyuttan büyük.",
  INTERNAL_SERVER_ERROR: "Dosya işlemi tamamlanamadı.",
};

export function getAttachmentErrorMessage(error: unknown): string {
  if (error instanceof AttachmentClientError) {
    return error.message;
  }

  if (isAttachmentApiError(error)) {
    return ATTACHMENT_ERROR_MESSAGES[error.code];
  }

  return "Dosya işlemi tamamlanamadı. Lütfen tekrar dene.";
}
