import type {
  AuthResponse as ContractAuthResponse,
  CurrentUserOperationResponse,
  LoginOperationRequest,
  LoginOperationResponse,
  PublicUser,
  RefreshOperationResponse,
  RegisterOperationRequest,
  RegisterOperationResponse,
} from "../api/types";

export type UserDto = PublicUser;
export type LoginInput = LoginOperationRequest;
export type RegisterInput = RegisterOperationRequest;
export type AuthResponse = ContractAuthResponse;
export type LoginResponse = LoginOperationResponse;
export type RegisterResponse = RegisterOperationResponse;
export type RefreshResponse = RefreshOperationResponse;
export type CurrentUserResponse = CurrentUserOperationResponse;
