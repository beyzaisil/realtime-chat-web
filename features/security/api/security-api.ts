import type {
  ChangePasswordOperationRequest,
  ListAuthSessionsOperationResponse,
  RevokeAuthSessionPath,
} from "../../../lib/api/types";
import type { ApiClient } from "../../../lib/http/api-client";
import { validatePasswordChange } from "./security-error";
import { parseAuthSessionListResponse } from "./security-response";

export async function changePassword(
  apiClient: ApiClient,
  input: ChangePasswordOperationRequest,
): Promise<void> {
  await apiClient.request<void>("/api/v1/auth/password", {
    method: "PATCH",
    json: validatePasswordChange(input),
  });
}

export async function listAuthSessions(
  apiClient: ApiClient,
): Promise<ListAuthSessionsOperationResponse> {
  const response = await apiClient.request<unknown>("/api/v1/auth/sessions");
  return parseAuthSessionListResponse(response);
}

export async function revokeOtherAuthSessions(
  apiClient: ApiClient,
): Promise<void> {
  await apiClient.request<void>("/api/v1/auth/sessions", {
    method: "DELETE",
  });
}

export async function revokeAuthSession(
  apiClient: ApiClient,
  sessionId: RevokeAuthSessionPath["sessionId"],
): Promise<void> {
  await apiClient.request<void>(
    `/api/v1/auth/sessions/${encodeURIComponent(sessionId)}`,
    { method: "DELETE" },
  );
}
