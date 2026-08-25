import { isApiClientError } from "../http/api-client";

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  INVALID_CREDENTIALS: "E-posta veya şifre hatalı.",
  EMAIL_ALREADY_IN_USE: "Bu e-posta adresi zaten kullanılıyor.",
  USERNAME_ALREADY_IN_USE: "Bu kullanıcı adı zaten kullanılıyor.",
  USER_ALREADY_EXISTS: "Bu bilgilerle oluşturulmuş bir hesap zaten var.",
  VALIDATION_ERROR: "Lütfen girdiğiniz bilgileri kontrol edin.",
  AUTHENTICATION_REQUIRED: "Oturumunuz sona erdi. Lütfen tekrar giriş yapın.",
};

export function toUserFacingAuthError(error: unknown): string {
  if (isApiClientError(error)) {
    return (
      ERROR_MESSAGES[error.code] ??
      "İşlem tamamlanamadı. Lütfen daha sonra tekrar deneyin."
    );
  }

  return "Bağlantı kurulamadı. Lütfen tekrar deneyin.";
}
