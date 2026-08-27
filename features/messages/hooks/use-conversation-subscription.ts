"use client";

import { useEffect } from "react";

import { useConversationSubscriptionManager } from "../providers/conversation-subscription-provider";

export function useConversationSubscription(
  conversationId: string,
): boolean {
  const { retain, release, subscribedConversationIds } =
    useConversationSubscriptionManager();

  useEffect(() => {
    if (conversationId.length === 0) {
      return;
    }

    retain(conversationId);

    return () => {
      release(conversationId);
    };
  }, [conversationId, release, retain]);

  return subscribedConversationIds.has(conversationId);
}
