import { render, screen } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../lib/http/api-client";
import type { ChatSocket } from "../lib/socket/create-socket";
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from "./auth-provider";
import { SocketProvider, useSocket } from "./socket-provider";

type EventHandler = (...arguments_: never[]) => void;

class FakeSocket {
  auth: Record<string, unknown> = {};
  connected = false;
  readonly onCalls: { event: string; handler: EventHandler }[] = [];
  readonly offCalls: { event: string; handler: EventHandler }[] = [];
  connectCount = 0;
  disconnectCount = 0;

  on(event: string, handler: EventHandler): this {
    this.onCalls.push({ event, handler });
    return this;
  }

  off(event: string, handler: EventHandler): this {
    this.offCalls.push({ event, handler });
    return this;
  }

  connect(): this {
    this.connectCount += 1;
    this.connected = true;
    return this;
  }

  disconnect(): this {
    this.disconnectCount += 1;
    this.connected = false;
    return this;
  }
}

const apiClient = {} as ApiClient;
const login = vi.fn(async () => undefined);
const register = vi.fn(async () => undefined);
const logout = vi.fn(async () => undefined);
const refresh = vi.fn(async () => true);
const bootstrap = vi.fn(async () => undefined);

function authValue(
  status: AuthStatus,
  accessToken: string | null,
): AuthContextValue {
  return {
    user: null,
    accessToken,
    status,
    apiClient,
    login,
    register,
    logout,
    refresh,
    bootstrap,
  };
}

function SocketProbe() {
  const { isConnected } = useSocket();
  return <span>{isConnected ? "connected" : "disconnected"}</span>;
}

function Harness({
  auth,
  fakeSocket,
  children = <SocketProbe />,
}: {
  auth: AuthContextValue;
  fakeSocket: FakeSocket;
  children?: ReactNode;
}) {
  return (
    <AuthContext.Provider value={auth}>
      <SocketProvider
        createSocket={() => fakeSocket as unknown as ChatSocket}
      >
        {children}
      </SocketProvider>
    </AuthContext.Provider>
  );
}

describe("SocketProvider", () => {
  it("does not connect while unauthenticated", () => {
    const fakeSocket = new FakeSocket();
    render(
      <Harness
        auth={authValue("unauthenticated", null)}
        fakeSocket={fakeSocket}
      />,
    );

    expect(fakeSocket.connectCount).toBe(0);
    expect(fakeSocket.disconnectCount).toBeGreaterThan(0);
  });

  it("connects with the authenticated access token", () => {
    const fakeSocket = new FakeSocket();
    render(
      <Harness
        auth={authValue("authenticated", "access-token")}
        fakeSocket={fakeSocket}
      />,
    );

    expect(fakeSocket.auth).toEqual({ token: "access-token" });
    expect(fakeSocket.connectCount).toBe(1);
  });

  it("disconnects when the token is removed", () => {
    const fakeSocket = new FakeSocket();
    const view = render(
      <Harness
        auth={authValue("authenticated", "access-token")}
        fakeSocket={fakeSocket}
      />,
    );

    view.rerender(
      <Harness
        auth={authValue("unauthenticated", null)}
        fakeSocket={fakeSocket}
      />,
    );

    expect(fakeSocket.connected).toBe(false);
    expect(fakeSocket.disconnectCount).toBeGreaterThan(0);
  });

  it("updates socket auth and reconnects when the token changes", () => {
    const fakeSocket = new FakeSocket();
    const view = render(
      <Harness
        auth={authValue("authenticated", "token-one")}
        fakeSocket={fakeSocket}
      />,
    );

    view.rerender(
      <Harness
        auth={authValue("authenticated", "token-two")}
        fakeSocket={fakeSocket}
      />,
    );

    expect(fakeSocket.auth).toEqual({ token: "token-two" });
    expect(fakeSocket.connectCount).toBe(2);
    expect(fakeSocket.disconnectCount).toBeGreaterThan(0);
  });

  it("removes every listener with the same handler reference", () => {
    const fakeSocket = new FakeSocket();
    const view = render(
      <StrictMode>
        <Harness
          auth={authValue("authenticated", "access-token")}
          fakeSocket={fakeSocket}
        />
      </StrictMode>,
    );

    view.unmount();

    expect(fakeSocket.onCalls.length).toBeGreaterThan(0);
    for (const registration of fakeSocket.onCalls) {
      expect(fakeSocket.offCalls).toContainEqual(registration);
    }
    expect(screen.queryByText("connected")).not.toBeInTheDocument();
  });
});
