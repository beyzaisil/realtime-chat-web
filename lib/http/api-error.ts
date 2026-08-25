export interface BackendValidationIssue {
  path: string;
  message: string;
}

export interface BackendErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
  };
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;
  readonly details?: unknown;

  constructor(options: {
    status: number;
    code: string;
    message: string;
    requestId?: string | null;
    details?: unknown;
  }) {
    super(options.message);
    this.name = "ApiClientError";
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId ?? null;
    this.details = options.details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseBackendError(
  status: number,
  payload: unknown,
): ApiClientError {
  if (isRecord(payload) && isRecord(payload.error)) {
    const { code, message, requestId, details } = payload.error;

    if (
      typeof code === "string" &&
      typeof message === "string" &&
      typeof requestId === "string"
    ) {
      return new ApiClientError({
        status,
        code,
        message,
        requestId,
        ...(details === undefined ? {} : { details }),
      });
    }
  }

  return new ApiClientError({
    status,
    code: "UNKNOWN_API_ERROR",
    message: "The server returned an unexpected error",
  });
}
