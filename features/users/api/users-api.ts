import type {
  SearchUsersOperationResponse,
  SearchUsersQuery,
} from "../../../lib/api/types";
import type { ApiClient } from "../../../lib/http/api-client";

export type SearchUsersInput = SearchUsersQuery;

export async function searchUsers(
  apiClient: ApiClient,
  input: SearchUsersInput,
): Promise<SearchUsersOperationResponse> {
  const search = new URLSearchParams({
    query: input.query,
    limit: String(input.limit ?? 20),
  });

  if (input.cursor !== undefined) {
    search.set("cursor", input.cursor);
  }

  return apiClient.request<SearchUsersOperationResponse>(
    `/api/v1/users?${search.toString()}`,
  );
}
