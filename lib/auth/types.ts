export interface UserDto {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  displayName: string;
  password: string;
}

export interface AuthResponse {
  user: UserDto;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface CurrentUserResponse {
  user: UserDto;
}
