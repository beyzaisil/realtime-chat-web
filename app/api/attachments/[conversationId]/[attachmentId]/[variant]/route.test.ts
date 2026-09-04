import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

describe("attachment web proxy", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test:4000";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    }
  });

  it("forwards authorization, follows the storage redirect and streams the PDF", async () => {
    const upstreamResponse = new Response("pdf-content", {
      status: 200,
      headers: {
        "Content-Disposition": "attachment; filename=report.pdf",
        "Content-Type": "application/pdf",
      },
    });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(upstreamResponse);
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new Request("http://localhost:3000/api/attachments/path", {
        headers: { Authorization: "Bearer access-token" },
      }),
      {
        params: Promise.resolve({
          conversationId: "conversation/id",
          attachmentId: "attachment id",
          variant: "original",
        }),
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        "http://api.test:4000/api/v1/conversations/conversation%2Fid/attachments/attachment%20id/original",
      ),
      {
        method: "GET",
        headers: { Authorization: "Bearer access-token" },
        cache: "no-store",
        redirect: "follow",
      },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain(
      "report.pdf",
    );
    await expect(response.text()).resolves.toBe("pdf-content");
  });

  it("rejects invalid variants before making an upstream request", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new Request("http://localhost:3000/api/attachments/path", {
        headers: { Authorization: "Bearer access-token" },
      }),
      {
        params: Promise.resolve({
          conversationId: "conversation-1",
          attachmentId: "attachment-1",
          variant: "preview",
        }),
      },
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not call the backend without authorization", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new Request("http://localhost:3000/api/attachments/path"),
      {
        params: Promise.resolve({
          conversationId: "conversation-1",
          attachmentId: "attachment-1",
          variant: "original",
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
