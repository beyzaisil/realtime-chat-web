import { isApiClientError } from "../../../lib/http/api-client";

export type ProfileClientErrorCode =
  | "AVATAR_FILE_EMPTY"
  | "AVATAR_FILE_TOO_LARGE"
  | "UNSUPPORTED_AVATAR_FORMAT"
  | "AVATAR_STORAGE_UPLOAD_FAILED";

export class ProfileClientError extends Error {
  readonly code: ProfileClientErrorCode;

  constructor(code: ProfileClientErrorCode, message: string) {
    super(message);
    this.name = "ProfileClientError";
    this.code = code;
  }
}

const PROFILE_ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "Girdiğin profil bilgilerini kontrol et.",
  INVALID_JSON: "Gönderilen profil bilgileri geçersiz.",
  USERNAME_ALREADY_IN_USE: "Bu kullanıcı adı zaten kullanılıyor.",
  UNSUPPORTED_AVATAR_FORMAT: "Yalnızca JPEG, PNG veya WebP görseller yüklenebilir.",
  AVATAR_UPLOAD_NOT_FOUND: "Avatar yükleme kaydı bulunamadı. Lütfen yeniden dene.",
  AVATAR_UPLOAD_INCOMPLETE: "Dosya yüklemesi tamamlanamadı. Lütfen yeniden dene.",
  AVATAR_UPLOAD_EXPIRED: "Yükleme bağlantısının süresi doldu. Lütfen yeniden dene.",
  AVATAR_UPLOAD_CONFLICT: "Bu avatar yüklemesi tamamlanamıyor. Lütfen yeniden dene.",
  INVALID_AVATAR_FILE: "Seçilen dosya geçerli bir avatar görseli değil.",
  AVATAR_STORAGE_UNAVAILABLE: "Avatar servisi şu anda kullanılamıyor. Daha sonra tekrar dene.",
  RATE_LIMIT_EXCEEDED: "Çok fazla yükleme denemesi yaptın. Bir süre sonra tekrar dene.",
  AUTHENTICATION_REQUIRED: "Oturumun sona ermiş. Lütfen yeniden giriş yap.",
  INVALID_TOKEN: "Oturumun geçersiz. Lütfen yeniden giriş yap.",
  INTERNAL_SERVER_ERROR: "İşlem tamamlanamadı. Lütfen tekrar dene.",
};

export function getProfileErrorMessage(error: unknown): string {
  if (error instanceof ProfileClientError) {
    return error.message;
  }

  if (isApiClientError(error)) {
    return (
      PROFILE_ERROR_MESSAGES[error.code] ??
      "Profil işlemi tamamlanamadı. Lütfen tekrar dene."
    );
  }

  return "Profil işlemi tamamlanamadı. Lütfen tekrar dene.";
}
