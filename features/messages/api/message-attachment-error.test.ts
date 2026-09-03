import { describe, expect, it } from "vitest";

import { ApiClientError } from "../../../lib/http/api-error";
import {
  AttachmentClientError,
  getAttachmentErrorMessage,
  isAttachmentApiError,
} from "./message-attachment-error";

function apiError(code: string): ApiClientError {
  return new ApiClientError({
    code,
    status: 409,
    message: code,
    requestId: "request-1",
  });
}

describe("message attachment errors", () => {
  it.each([
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
  ])("recognizes backend attachment error %s", (code) => {
    expect(isAttachmentApiError(apiError(code))).toBe(true);
    expect(getAttachmentErrorMessage(apiError(code))).not.toContain(
      "Lütfen tekrar dene",
    );
  });

  it("does not classify unrelated backend errors as attachment errors", () => {
    expect(isAttachmentApiError(apiError("UNRELATED_ERROR"))).toBe(false);
  });

  it("keeps a client validation error technically distinguishable", () => {
    const error = new AttachmentClientError(
      "ATTACHMENT_FILE_TOO_LARGE",
      "Dosya çok büyük.",
    );

    expect(error).toMatchObject({
      code: "ATTACHMENT_FILE_TOO_LARGE",
      message: "Dosya çok büyük.",
    });
    expect(getAttachmentErrorMessage(error)).toBe("Dosya çok büyük.");
  });
});
