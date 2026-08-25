export interface SearchUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface UserSearchPage {
  items: SearchUser[];
  nextCursor: string | null;
}
