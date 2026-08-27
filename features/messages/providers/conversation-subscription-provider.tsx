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

import { useSocket } from "../../../providers/socket-provider";

interface ConversationSubscriptionContextValue {
  retain(conversationId: string): void;
  release(conversationId: string): void;
  subscribedConversationIds: ReadonlySet<string>;
}

const ConversationSubscriptionContext =
  createContext<ConversationSubscriptionContextValue | null>(null);

export function ConversationSubscriptionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { socket, isConnected } = useSocket();
  const countsRef = useRef(new Map<string, number>());
  const pendingRef = useRef(new Set<string>());
  const isConnectedRef = useRef(isConnected);
  const subscribedRef = useRef(new Set<string>());
  const [subscribedConversationIds, setSubscribedConversationIds] = useState<
    ReadonlySet<string>
  >(() => new Set());

  isConnectedRef.current = isConnected;

  const setSubscribed = useCallback(
    (conversationId: string, subscribed: boolean): void => {
      const current = subscribedRef.current;
      if (current.has(conversationId) === subscribed) {
        return;
      }

      const next = new Set(current);
      if (subscribed) {
        next.add(conversationId);
      } else {
        next.delete(conversationId);
      }
      subscribedRef.current = next;
      setSubscribedConversationIds(next);
    },
    [],
  );

  const requestSubscription = useCallback(
    (conversationId: string): void => {
      if (
        !isConnectedRef.current ||
        (countsRef.current.get(conversationId) ?? 0) === 0 ||
        pendingRef.current.has(conversationId) ||
        subscribedRef.current.has(conversationId)
      ) {
        return;
      }

      pendingRef.current.add(conversationId);
      socket.emit(
        "conversation:subscribe",
        { conversationId },
        (response) => {
          pendingRef.current.delete(conversationId);

          if (!response.ok) {
            setSubscribed(conversationId, false);
            return;
          }

          if (
            !isConnectedRef.current ||
            (countsRef.current.get(conversationId) ?? 0) === 0
          ) {
            if (isConnectedRef.current) {
              socket.emit(
                "conversation:unsubscribe",
                { conversationId },
                () => undefined,
              );
            }
            return;
          }

          setSubscribed(conversationId, true);
        },
      );
    },
    [setSubscribed, socket],
  );

  const retain = useCallback(
    (conversationId: string): void => {
      if (conversationId.length === 0) {
        return;
      }

      const count = countsRef.current.get(conversationId) ?? 0;
      countsRef.current.set(conversationId, count + 1);
      if (count === 0) {
        requestSubscription(conversationId);
      }
    },
    [requestSubscription],
  );

  const release = useCallback(
    (conversationId: string): void => {
      const count = countsRef.current.get(conversationId) ?? 0;
      if (count > 1) {
        countsRef.current.set(conversationId, count - 1);
        return;
      }

      countsRef.current.delete(conversationId);
      setSubscribed(conversationId, false);
      if (count === 1 && isConnectedRef.current) {
        socket.emit(
          "conversation:unsubscribe",
          { conversationId },
          () => undefined,
        );
      }
    },
    [setSubscribed, socket],
  );

  useEffect(() => {
    if (!isConnected) {
      pendingRef.current.clear();
      subscribedRef.current = new Set();
      setSubscribedConversationIds(new Set());
      return;
    }

    for (const conversationId of countsRef.current.keys()) {
      requestSubscription(conversationId);
    }
  }, [isConnected, requestSubscription]);

  const value = useMemo(
    () => ({ retain, release, subscribedConversationIds }),
    [release, retain, subscribedConversationIds],
  );

  return (
    <ConversationSubscriptionContext.Provider value={value}>
      {children}
    </ConversationSubscriptionContext.Provider>
  );
}

export function useConversationSubscriptionManager(): ConversationSubscriptionContextValue {
  const context = useContext(ConversationSubscriptionContext);
  if (context === null) {
    throw new Error(
      "useConversationSubscriptionManager must be used inside ConversationSubscriptionProvider",
    );
  }
  return context;
}

export function useConversationSubscriptions(
  conversationIds: readonly string[],
): void {
  const { retain, release } = useConversationSubscriptionManager();
  const retainedRef = useRef(new Set<string>());
  const conversationIdsKey = [...new Set(conversationIds)]
    .filter((conversationId) => conversationId.length > 0)
    .sort()
    .join("\u0000");

  useEffect(() => {
    const next = new Set(
      conversationIdsKey.length === 0
        ? []
        : conversationIdsKey.split("\u0000"),
    );

    for (const conversationId of retainedRef.current) {
      if (!next.has(conversationId)) {
        release(conversationId);
      }
    }
    for (const conversationId of next) {
      if (!retainedRef.current.has(conversationId)) {
        retain(conversationId);
      }
    }
    retainedRef.current = next;
  }, [conversationIdsKey, release, retain]);

  useEffect(
    () => () => {
      for (const conversationId of retainedRef.current) {
        release(conversationId);
      }
      retainedRef.current.clear();
    },
    [release],
  );
}
