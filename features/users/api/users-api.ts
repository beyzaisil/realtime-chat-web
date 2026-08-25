import type { ApiClient } from "../../../lib/http/api-client";
import type { UserSearchPage } from "../types";

export interface SearchUsersInput {
  query: string;
  cursor?: string;
  limit?: number;
}

export async function searchUsers(
  apiClient: ApiClient,
  input: SearchUsersInput,
): Promise<UserSearchPage> {
  const search = new URLSearchParams({
    query: input.query,
    limit: String(input.limit ?? 20),
  });

  if (input.cursor !== undefined) {
    search.set("cursor", input.cursor);
  }

  return apiClient.request<UserSearchPage>(
    `/api/v1/users?${search.toString()}`,
  );
}
