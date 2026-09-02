import { describe, expect, it } from "vitest";

import { ApiClientError } from "../../../lib/http/api-error";
import { getProfileErrorMessage } from "./profile-error";

describe("profile error messages", () => {
  it("maps a username conflict to an understandable message", () => {
    const error = new ApiClientError({
      status: 409,
      code: "USERNAME_ALREADY_IN_USE",
      message: "The username is already in use",
    });

    expect(getProfileErrorMessage(error)).toBe(
      "Bu kullanıcı adı zaten kullanılıyor.",
    );
  });

  it("maps an expired upload to a retryable message", () => {
    const error = new ApiClientError({
      status: 409,
      code: "AVATAR_UPLOAD_EXPIRED",
      message: "The avatar upload has expired",
    });

    expect(getProfileErrorMessage(error)).toBe(
      "Yükleme bağlantısının süresi doldu. Lütfen yeniden dene.",
    );
  });
});
