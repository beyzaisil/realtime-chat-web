"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { requestRefreshedAccessToken } from "../lib/auth/refresh-request";
import type {
  CurrentUserResponse,
  LoginInput,
  LoginResponse,
  RegisterInput,
  RegisterResponse,
  UserDto,
} from "../lib/auth/types";
import { publicEnv } from "../lib/env";
import {
  createApiClient,
  type ApiClient,
  type ApiClientAuthAdapter,
} from "../lib/http/api-client";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated";

export interface AuthContextValue {
  user: UserDto | null;
  accessToken: string | null;
  status: AuthStatus;
  apiClient: ApiClient;
  setCurrentUser(user: UserDto): void;
  login(input: LoginInput): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  logout(): Promise<void>;
  refresh(): Promise<boolean>;
  bootstrap(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const accessTokenRef = useRef<string | null>(null);
  const refreshImplementationRef = useRef<
    () => Promise<string | null>
  >(async () => null);
  const unauthorizedImplementationRef = useRef<() => void>(() => undefined);
  const bootstrapPromiseRef = useRef<Promise<void> | null>(null);

  const clearAuth = useCallback((): void => {
    accessTokenRef.current = null;
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const applyAccessToken = useCallback((token: string): void => {
    accessTokenRef.current = token;
    setAccessToken(token);
  }, []);

  const setCurrentUser = useCallback((nextUser: UserDto): void => {
    setUser(nextUser);
  }, []);

  const performRefresh = useCallback(async (): Promise<string | null> => {
    const token = await requestRefreshedAccessToken(publicEnv.apiUrl);

    if (token === null) {
      clearAuth();
      return null;
    }

    applyAccessToken(token);
    return token;
  }, [applyAccessToken, clearAuth]);

  refreshImplementationRef.current = performRefresh;
  unauthorizedImplementationRef.current = clearAuth;

  const apiClientRef = useRef<ApiClient | null>(null);

  if (apiClientRef.current === null) {
    const authAdapter: ApiClientAuthAdapter = {
      getAccessToken: () => accessTokenRef.current,
      refreshAccessToken: () => refreshImplementationRef.current(),
      onUnauthorized: () => unauthorizedImplementationRef.current(),
    };
    apiClientRef.current = createApiClient({
      baseUrl: publicEnv.apiUrl,
      auth: authAdapter,
    });
  }

  const apiClient = apiClientRef.current;

  const login = useCallback(
    async (input: LoginInput): Promise<void> => {
      const result = await apiClient.request<LoginResponse>(
        "/api/v1/auth/login",
        { method: "POST", auth: "none", json: input },
      );
      applyAccessToken(result.accessToken);
      setUser(result.user);
      setStatus("authenticated");
    },
    [apiClient, applyAccessToken],
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<void> => {
      const result = await apiClient.request<RegisterResponse>(
        "/api/v1/auth/register",
        { method: "POST", auth: "none", json: input },
      );
      applyAccessToken(result.accessToken);
      setUser(result.user);
      setStatus("authenticated");
    },
    [apiClient, applyAccessToken],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiClient.request<void>("/api/v1/auth/logout", {
        method: "POST",
      });
    } catch {
      // Local auth state must still be cleared when the network is unavailable.
    } finally {
      clearAuth();
    }
  }, [apiClient, clearAuth]);

  const refresh = useCallback(async (): Promise<boolean> => {
    return (await performRefresh()) !== null;
  }, [performRefresh]);

  const bootstrap = useCallback(async (): Promise<void> => {
    if (bootstrapPromiseRef.current !== null) {
      return bootstrapPromiseRef.current;
    }

    const promise = (async () => {
      setStatus("loading");
      const token = await performRefresh();

      if (token === null) {
        return;
      }

      try {
        const result = await apiClient.request<CurrentUserResponse>(
          "/api/v1/auth/me",
        );
        setUser(result.user);
        setStatus("authenticated");
      } catch {
        clearAuth();
      }
    })().finally(() => {
      bootstrapPromiseRef.current = null;
    });

    bootstrapPromiseRef.current = promise;
    return promise;
  }, [apiClient, clearAuth, performRefresh]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      status,
      apiClient,
      setCurrentUser,
      login,
      register,
      logout,
      refresh,
      bootstrap,
    }),
    [
      user,
      accessToken,
      status,
      apiClient,
      setCurrentUser,
      login,
      register,
      logout,
      refresh,
      bootstrap,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
