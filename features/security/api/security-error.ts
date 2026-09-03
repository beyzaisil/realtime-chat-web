import type { ChangePasswordOperationRequest } from "../../../lib/api/types";
import { isApiClientError } from "../../../lib/http/api-client";

export type SecurityClientErrorCode =
  | "CURRENT_PASSWORD_REQUIRED"
  | "CURRENT_PASSWORD_TOO_LONG"
  | "NEW_PASSWORD_TOO_SHORT"
  | "NEW_PASSWORD_TOO_LONG"
  | "PASSWORDS_MUST_DIFFER"
  | "PASSWORD_CONFIRMATION_MISMATCH";

export class SecurityClientError extends Error {
  readonly code: SecurityClientErrorCode;

  constructor(code: SecurityClientErrorCode, message: string) {
    super(message);
    this.name = "SecurityClientError";
    this.code = code;
  }
}

export function validatePasswordChange(
  input: ChangePasswordOperationRequest,
): ChangePasswordOperationRequest {
  if (input.currentPassword.length < 1) {
    throw new SecurityClientError(
      "CURRENT_PASSWORD_REQUIRED",
      "Mevcut parolanı girmelisin.",
    );
  }
  if (input.currentPassword.length > 128) {
    throw new SecurityClientError(
      "CURRENT_PASSWORD_TOO_LONG",
      "Mevcut parola en fazla 128 karakter olabilir.",
    );
  }
  if (input.newPassword.length < 12) {
    throw new SecurityClientError(
      "NEW_PASSWORD_TOO_SHORT",
      "Yeni parola en az 12 karakter olmalı.",
    );
  }
  if (input.newPassword.length > 128) {
    throw new SecurityClientError(
      "NEW_PASSWORD_TOO_LONG",
      "Yeni parola en fazla 128 karakter olabilir.",
    );
  }
  if (input.currentPassword === input.newPassword) {
    throw new SecurityClientError(
      "PASSWORDS_MUST_DIFFER",
      "Yeni parola mevcut paroladan farklı olmalı.",
    );
  }

  return input;
}

const SECURITY_ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "Gönderilen güvenlik bilgilerini kontrol et.",
  INVALID_JSON: "Gönderilen güvenlik bilgileri geçersiz.",
  INVALID_CREDENTIALS: "Mevcut parolan yanlış.",
  AUTHENTICATION_REQUIRED: "Oturumun sona ermiş. Lütfen yeniden giriş yap.",
  INVALID_TOKEN: "Oturumun geçersiz. Lütfen yeniden giriş yap.",
  SESSION_REVOKED: "Bu oturum daha önce sonlandırılmış.",
  SESSION_EXPIRED: "Bu oturumun süresi dolmuş.",
  CSRF_VALIDATION_FAILED: "Güvenlik doğrulaması başarısız oldu. Sayfayı yenileyip tekrar dene.",
  RATE_LIMIT_EXCEEDED: "Çok fazla deneme yaptın. Bir süre sonra tekrar dene.",
  INTERNAL_SERVER_ERROR: "Güvenlik işlemi tamamlanamadı. Lütfen tekrar dene.",
};

export function getSecurityErrorMessage(error: unknown): string {
  if (error instanceof SecurityClientError) {
    return error.message;
  }

  if (isApiClientError(error)) {
    return (
      SECURITY_ERROR_MESSAGES[error.code] ??
      "Güvenlik işlemi tamamlanamadı. Lütfen tekrar dene."
    );
  }

  return "Güvenlik işlemi tamamlanamadı. Lütfen tekrar dene.";
}
