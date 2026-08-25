"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  createChatSocket,
  type ChatSocket,
} from "../lib/socket/create-socket";
import type { SessionReadyPayload } from "../lib/socket/socket-events";
import { useAuth } from "./auth-provider";

export interface SocketContextValue {
  socket: ChatSocket;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextValue | null>(null);

export interface SocketProviderProps {
  children: ReactNode;
  createSocket?: () => ChatSocket;
}

export function SocketProvider({
  children,
  createSocket = createChatSocket,
}: SocketProviderProps) {
  const { status, accessToken, refresh, logout } = useAuth();
  const socketRef = useRef<ChatSocket | null>(null);
  const connectedTokenRef = useRef<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  if (socketRef.current === null) {
    socketRef.current = createSocket();
  }

  const socket = socketRef.current;

  useEffect(() => {
    const handleConnect = (): void => setIsConnected(false);
    const handleDisconnect = (): void => setIsConnected(false);
    const handleSessionReady = (_payload: SessionReadyPayload): void => {
      setIsConnected(true);
    };
    const handleAuthExpiring = (): void => {
      void refresh();
    };
    const handleAuthRevoked = (): void => {
      void logout();
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("session:ready", handleSessionReady);
    socket.on("auth:expiring", handleAuthExpiring);
    socket.on("auth:revoked", handleAuthRevoked);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("session:ready", handleSessionReady);
      socket.off("auth:expiring", handleAuthExpiring);
      socket.off("auth:revoked", handleAuthRevoked);
      socket.disconnect();
      connectedTokenRef.current = null;
    };
  }, [logout, refresh, socket]);

  useEffect(() => {
    if (status !== "authenticated" || accessToken === null) {
      connectedTokenRef.current = null;
      setIsConnected(false);
      socket.disconnect();
      return;
    }

    const tokenChanged =
      connectedTokenRef.current !== null &&
      connectedTokenRef.current !== accessToken;
    socket.auth = { token: accessToken };
    connectedTokenRef.current = accessToken;

    if (tokenChanged) {
      socket.disconnect();
      socket.connect();
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }
  }, [accessToken, socket, status]);

  const value = useMemo(
    () => ({ socket, isConnected }),
    [socket, isConnected],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);

  if (context === null) {
    throw new Error("useSocket must be used inside SocketProvider");
  }

  return context;
}
