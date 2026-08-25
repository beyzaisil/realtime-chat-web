"use client";

import { useEffect, useState } from "react";

import { useSocket } from "../../../providers/socket-provider";

export function useConversationSubscription(
  conversationId: string,
): boolean {
  const { socket, isConnected } = useSocket();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setIsSubscribed(false);

    if (!isConnected || conversationId.length === 0) {
      return;
    }

    let active = true;
    socket.emit(
      "conversation:subscribe",
      { conversationId },
      (response) => {
        if (active) {
          setIsSubscribed(response.ok);
        }
      },
    );

    return () => {
      active = false;
      socket.emit(
        "conversation:unsubscribe",
        { conversationId },
        () => undefined,
      );
    };
  }, [conversationId, isConnected, socket]);

  return isSubscribed;
}
