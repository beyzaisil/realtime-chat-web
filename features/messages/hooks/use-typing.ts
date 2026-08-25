"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { TypingUpdatedPayload } from "../../../lib/socket/socket-events";
import { useSocket } from "../../../providers/socket-provider";

export const TYPING_IDLE_MS = 1_200;

export function useTyping(
  conversationId: string,
  otherUserId: string,
  isSubscribed: boolean,
) {
  const { socket } = useSocket();
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const isSendingTypingRef = useRef(false);
  const currentTextRef = useRef("");
  const idleTimerRef = useRef<number | null>(null);
  const expiryTimerRef = useRef<number | null>(null);
  const subscribedRef = useRef(isSubscribed);

  subscribedRef.current = isSubscribed;

  const clearIdleTimer = useCallback((): void => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const emitTypingFalse = useCallback((): void => {
    clearIdleTimer();
    if (isSendingTypingRef.current && subscribedRef.current) {
      socket.emit("typing:set", { conversationId, isTyping: false });
    }
    isSendingTypingRef.current = false;
  }, [clearIdleTimer, conversationId, socket]);

  const updateTyping = useCallback(
    (text: string): void => {
      currentTextRef.current = text;
      clearIdleTimer();

      if (text.trim().length === 0) {
        emitTypingFalse();
        return;
      }

      if (isSubscribed && !isSendingTypingRef.current) {
        socket.emit("typing:set", { conversationId, isTyping: true });
        isSendingTypingRef.current = true;
      }

      idleTimerRef.current = window.setTimeout(
        emitTypingFalse,
        TYPING_IDLE_MS,
      );
    },
    [clearIdleTimer, conversationId, emitTypingFalse, isSubscribed, socket],
  );

  useEffect(() => {
    if (!isSubscribed) {
      isSendingTypingRef.current = false;
      return;
    }

    if (
      currentTextRef.current.trim().length > 0 &&
      !isSendingTypingRef.current
    ) {
      socket.emit("typing:set", { conversationId, isTyping: true });
      isSendingTypingRef.current = true;
    }
  }, [conversationId, isSubscribed, socket]);

  useEffect(() => {
    const handleTypingUpdated = (update: TypingUpdatedPayload): void => {
      if (
        update.conversationId !== conversationId ||
        update.userId !== otherUserId
      ) {
        return;
      }

      if (expiryTimerRef.current !== null) {
        window.clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }

      const remaining = Date.parse(update.expiresAt) - Date.now();
      if (!update.isTyping || remaining <= 0) {
        setIsOtherUserTyping(false);
        return;
      }

      setIsOtherUserTyping(true);
      expiryTimerRef.current = window.setTimeout(() => {
        setIsOtherUserTyping(false);
        expiryTimerRef.current = null;
      }, remaining);
    };

    socket.on("typing:updated", handleTypingUpdated);
    return () => {
      socket.off("typing:updated", handleTypingUpdated);
      if (expiryTimerRef.current !== null) {
        window.clearTimeout(expiryTimerRef.current);
      }
    };
  }, [conversationId, otherUserId, socket]);

  useEffect(
    () => () => {
      emitTypingFalse();
    },
    [emitTypingFalse],
  );

  return { isOtherUserTyping, updateTyping, stopTyping: emitTypingFalse };
}
