import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../lib/http/api-client";
import { ApiClientError } from "../../../lib/http/api-error";
import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_IMAGE_ATTACHMENT_BYTES,
  MAX_MESSAGE_ATTACHMENTS_TOTAL_BYTES,
  MAX_PDF_ATTACHMENT_BYTES,
  accessMessageAttachment,
  accessMessageAttachmentThroughWebProxy,
  completeMessageAttachmentUpload,
  createMessageAttachmentUpload,
  uploadMessageAttachment,
  uploadMessageAttachmentFile,
  validateAttachmentFile,
  validateAttachmentFiles,
} from "./message-attachments-api";

const intent = {
  attachmentId: "attachment-1",
  upload: {
    url: "http://storage.test/private-upload?signature=one",
    method: "PUT" as const,
    headers: {
      "Content-Type": "image/png",
      "x-amz-meta-checksum": "signed-value",
    },
    expiresAt: "2030-01-01T00:10:00.000Z",
  },
};

const attachment = {
  id: "attachment-1",
  kind: "IMAGE" as const,
  originalFileName: "holiday.png",
  contentType: "image/webp" as const,
  width: 1200,
  height: 800,
  url: "/api/v1/conversations/conversation-1/attachments/attachment-1/original",
  thumbnailUrl:
    "/api/v1/conversations/conversation-1/attachments/attachment-1/thumbnail",
};

function apiClient(request: ReturnType<typeof vi.fn>): ApiClient {
  return { request: request as unknown as ApiClient["request"] };
}

function fileWithSize(
  name: string,
  type: string,
  size: number,
): File {
  const file = new File(["content"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function apiError(code: string, status: number): ApiClientError {
  return new ApiClientError({
    code,
    status,
    message: code,
    requestId: "request-1",
  });
}

describe("message attachment API", () => {
  it("creates an upload intent with the generated method, path and body", async () => {
    const request = vi.fn().mockResolvedValue(intent);
    const input = {
      contentType: "image/png" as const,
      contentLength: 245_760,
      originalFileName: "holiday.png",
    };

    await expect(
      createMessageAttachmentUpload(apiClient(request), "conversation/id ?", input),
    ).resolves.toEqual(intent);

    expect(request).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation%2Fid%20%3F/attachments/uploads",
      { method: "POST", json: input },
    );
  });

  it("uploads to storage with the exact signed method and headers", async () => {
    const file = new File(["image"], "holiday.png", { type: "image/png" });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    await uploadMessageAttachmentFile(intent.upload, file, fetchMock);

    expect(fetchMock).toHaveBeenCalledWith(intent.upload.url, {
      method: "PUT",
      headers: intent.upload.headers,
      body: file,
    });
  });

  it("completes an upload with encoded conversation and attachment ids", async () => {
    const response = { attachment };
    const request = vi.fn().mockResolvedValue(response);

    await expect(
      completeMessageAttachmentUpload(
        apiClient(request),
        "conversation/id ?",
        "attachment/id #",
      ),
    ).resolves.toEqual(response);

    expect(request).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation%2Fid%20%3F/attachments/uploads/attachment%2Fid%20%23/complete",
      { method: "POST" },
    );
  });

  it("accesses a variant through the authenticated endpoint without caching a URL", async () => {
    const response = new Response("image", { status: 200 });
    const request = vi.fn().mockResolvedValue(response);

    await expect(
      accessMessageAttachment(
        apiClient(request),
        "conversation/id",
        "attachment/id",
        "thumbnail",
      ),
    ).resolves.toBe(response);

    expect(request).toHaveBeenCalledWith(
      "/api/v1/conversations/conversation%2Fid/attachments/attachment%2Fid/thumbnail",
      { method: "GET", responseType: "raw" },
    );
  });

  it("uses the same-origin web proxy for browser attachment access", async () => {
    const response = new Response("pdf", { status: 200 });
    const request = vi.fn().mockResolvedValue(response);

    await expect(
      accessMessageAttachmentThroughWebProxy(
        apiClient(request),
        "conversation/id",
        "attachment id",
        "original",
        "http://chat.test:3000",
      ),
    ).resolves.toBe(response);

    expect(request).toHaveBeenCalledWith(
      "http://chat.test:3000/api/attachments/conversation%2Fid/attachment%20id/original",
      { method: "GET", responseType: "raw" },
    );
  });

  it("runs intent, storage PUT and complete in order", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(intent)
      .mockResolvedValueOnce({ attachment });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 200 }),
    );
    const file = new File(["image"], "holiday.png", { type: "image/png" });

    await expect(
      uploadMessageAttachment(apiClient(request), "conversation-1", file, {
        fetchImplementation: fetchMock,
      }),
    ).resolves.toEqual(attachment);

    expect(request).toHaveBeenNthCalledWith(
      1,
      "/api/v1/conversations/conversation-1/attachments/uploads",
      {
        method: "POST",
        json: {
          contentType: "image/png",
          contentLength: file.size,
          originalFileName: "holiday.png",
        },
      },
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      "/api/v1/conversations/conversation-1/attachments/uploads/attachment-1/complete",
      { method: "POST" },
    );
    expect(request.mock.invocationCallOrder[0]).toBeLessThan(
      fetchMock.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
    );
    expect(fetchMock.mock.invocationCallOrder[0]).toBeLessThan(
      request.mock.invocationCallOrder[1] ?? Number.POSITIVE_INFINITY,
    );
  });

  it("retries only complete with the same attachment id after a transient failure", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(intent)
      .mockRejectedValueOnce(apiError("ATTACHMENT_SCAN_UNAVAILABLE", 503))
      .mockResolvedValueOnce({ attachment });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 200 }),
    );
    const waitForRetry = vi.fn(async () => undefined);
    const file = new File(["pdf"], "document.pdf", {
      type: "application/pdf",
    });

    await expect(
      uploadMessageAttachment(apiClient(request), "conversation-1", file, {
        fetchImplementation: fetchMock,
        maxCompleteAttempts: 2,
        retryDelayMs: 10,
        waitForRetry,
      }),
    ).resolves.toEqual(attachment);

    expect(request).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(request.mock.calls.slice(1)).toEqual([
      [
        "/api/v1/conversations/conversation-1/attachments/uploads/attachment-1/complete",
        { method: "POST" },
      ],
      [
        "/api/v1/conversations/conversation-1/attachments/uploads/attachment-1/complete",
        { method: "POST" },
      ],
    ]);
    expect(waitForRetry).toHaveBeenCalledWith(10);
  });

  it("does not restart or retry the flow for a permanent complete error", async () => {
    const failure = apiError("INVALID_ATTACHMENT_FILE", 422);
    const request = vi
      .fn()
      .mockResolvedValueOnce(intent)
      .mockRejectedValueOnce(failure);
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    await expect(
      uploadMessageAttachment(
        apiClient(request),
        "conversation-1",
        new File(["bad"], "bad.pdf", { type: "application/pdf" }),
        { fetchImplementation: fetchMock },
      ),
    ).rejects.toBe(failure);

    expect(request).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it.each([
    [fileWithSize("empty.png", "image/png", 0), "ATTACHMENT_FILE_EMPTY"],
    [fileWithSize("file.txt", "text/plain", 100), "UNSUPPORTED_ATTACHMENT_FORMAT"],
    [
      fileWithSize(
        "large.png",
        "image/png",
        MAX_IMAGE_ATTACHMENT_BYTES + 1,
      ),
      "ATTACHMENT_FILE_TOO_LARGE",
    ],
    [
      fileWithSize(
        "large.pdf",
        "application/pdf",
        MAX_PDF_ATTACHMENT_BYTES + 1,
      ),
      "ATTACHMENT_FILE_TOO_LARGE",
    ],
  ])("rejects invalid file metadata with a technical code", (file, code) => {
    expect(() => validateAttachmentFile(file)).toThrow(
      expect.objectContaining({ code }),
    );
  });

  it("rejects an empty selection and more than four files", () => {
    expect(() => validateAttachmentFiles([])).toThrow(
      expect.objectContaining({ code: "NO_ATTACHMENTS" }),
    );

    const files = Array.from(
      { length: MAX_ATTACHMENTS_PER_MESSAGE + 1 },
      (_, index) =>
        fileWithSize(`image-${String(index)}.png`, "image/png", 100),
    );
    expect(() => validateAttachmentFiles(files)).toThrow(
      expect.objectContaining({ code: "TOO_MANY_ATTACHMENTS" }),
    );
  });

  it("rejects a collection above the 50 MiB message limit", () => {
    const files = Array.from({ length: 3 }, (_, index) =>
      fileWithSize(
        `document-${String(index)}.pdf`,
        "application/pdf",
        20 * 1_024 * 1_024,
      ),
    );

    expect(
      files.reduce((total, file) => total + file.size, 0),
    ).toBeGreaterThan(MAX_MESSAGE_ATTACHMENTS_TOTAL_BYTES);
    expect(() => validateAttachmentFiles(files)).toThrow(
      expect.objectContaining({ code: "ATTACHMENT_TOTAL_SIZE_EXCEEDED" }),
    );
  });

  it("stops before complete when the direct storage PUT fails", async () => {
    const request = vi.fn().mockResolvedValue(intent);
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 403 }),
    );

    await expect(
      uploadMessageAttachment(
        apiClient(request),
        "conversation-1",
        new File(["image"], "holiday.png", { type: "image/png" }),
        { fetchImplementation: fetchMock },
      ),
    ).rejects.toMatchObject({
      code: "ATTACHMENT_STORAGE_UPLOAD_FAILED",
      status: 403,
    });
    expect(request).toHaveBeenCalledOnce();
  });
});
