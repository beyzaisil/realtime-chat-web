const ALLOWED_VARIANTS = new Set(["original", "thumbnail"]);

interface AttachmentProxyParams {
  attachmentId: string;
  conversationId: string;
  variant: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<AttachmentProxyParams> },
): Promise<Response> {
  const { attachmentId, conversationId, variant } = await params;

  if (!ALLOWED_VARIANTS.has(variant)) {
    return Response.json(
      { code: "VALIDATION_ERROR", message: "Invalid attachment variant" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const authorization = request.headers.get("authorization");
  if (authorization === null) {
    return Response.json(
      {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required",
      },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiBaseUrl === undefined || apiBaseUrl.length === 0) {
    return Response.json(
      {
        code: "ATTACHMENT_PROXY_UNAVAILABLE",
        message: "Attachment proxy is not configured",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const upstreamPath =
    `/api/v1/conversations/${encodeURIComponent(conversationId)}` +
    `/attachments/${encodeURIComponent(attachmentId)}/${encodeURIComponent(variant)}`;

  try {
    const upstream = await fetch(new URL(upstreamPath, apiBaseUrl), {
      method: "GET",
      headers: { Authorization: authorization },
      cache: "no-store",
      redirect: "follow",
    });
    const responseHeaders = attachmentResponseHeaders(upstream.headers);

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      {
        code: "ATTACHMENT_PROXY_UNAVAILABLE",
        message: "Attachment could not be retrieved",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

function attachmentResponseHeaders(upstreamHeaders: Headers): Headers {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });

  for (const name of [
    "accept-ranges",
    "content-disposition",
    "content-length",
    "content-type",
    "x-request-id",
  ]) {
    const value = upstreamHeaders.get(name);
    if (value !== null) {
      headers.set(name, value);
    }
  }

  return headers;
}
