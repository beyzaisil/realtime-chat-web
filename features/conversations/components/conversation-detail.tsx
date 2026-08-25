"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";

import { isApiClientError } from "../../../lib/http/api-client";
import { useAuth } from "../../../providers/auth-provider";
import { MessageComposer } from "../../messages/components/message-composer";
import { MessageList } from "../../messages/components/message-list";
import { useConversationRealtime } from "../../messages/hooks/use-conversation-realtime";
import { useConversationSubscription } from "../../messages/hooks/use-conversation-subscription";
import { useReadWatermark } from "../../messages/hooks/use-read-watermark";
import { useTyping } from "../../messages/hooks/use-typing";
import type { MessageDto } from "../../messages/types";
import { useConversationPresence } from "../../presence/hooks/use-conversation-presence";
import { UserAvatar } from "../../users/components/user-avatar";
import { useConversation } from "../hooks/use-conversations";
import type { DirectConversation } from "../types";

export function ConversationDetail() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;
  const conversation = useConversation(conversationId);

  if (conversation.isPending) {
    return <div className="grid h-full place-items-center text-sm text-slate-500">Sohbet yükleniyor…</div>;
  }

  if (conversation.isError) {
    const notFound =
      isApiClientError(conversation.error) &&
      (conversation.error.status === 404 ||
        conversation.error.code === "CONVERSATION_NOT_FOUND");
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div>
          <p className="font-semibold text-slate-800">
            {notFound ? "Sohbet bulunamadı" : "Sohbet bilgileri yüklenemedi"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {notFound
              ? "Bu sohbet mevcut değil veya erişim iznin yok."
              : "Bağlantını kontrol edip tekrar deneyebilirsin."}
          </p>
          {notFound ? (
            <Link href="/chat" className="mt-4 inline-block rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Sohbetlere dön</Link>
          ) : (
            <button type="button" onClick={() => void conversation.refetch()} className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Tekrar dene</button>
          )}
        </div>
      </div>
    );
  }

  return <LoadedConversationDetail conversation={conversation.data} />;
}

function LoadedConversationDetail({
  conversation,
}: {
  conversation: DirectConversation;
}) {
  const { user } = useAuth();
  const [visibleMessage, setVisibleMessage] = useState<MessageDto | null>(null);
  const presence = useConversationPresence([conversation.otherUser.id]);
  const isSubscribed = useConversationSubscription(conversation.id);
  useConversationRealtime(conversation.id);
  const typing = useTyping(
    conversation.id,
    conversation.otherUser.id,
    isSubscribed,
  );
  const currentUserId = user?.id ?? "";
  useReadWatermark(conversation.id, currentUserId, visibleMessage);
  const handleLatestVisible = useCallback((message: MessageDto): void => {
    setVisibleMessage((current) =>
      current?.id === message.id ? current : message,
    );
  }, []);
  const isOnline =
    presence[conversation.otherUser.id]?.status === "online";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
        <Link href="/chat" aria-label="Sohbet listesine dön" className="grid size-10 place-items-center rounded-full text-slate-500 hover:bg-slate-100 md:hidden">
          <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
            <path d="m12.5 4.5-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="relative">
          <UserAvatar user={conversation.otherUser} size="sm" />
          <span className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white ${isOnline ? "bg-emerald-500" : "bg-slate-300"}`} />
        </span>
        <div className="min-w-0">
          <h2 className="truncate font-bold text-slate-900">{conversation.otherUser.displayName}</h2>
          <p className={`truncate text-xs ${typing.isOtherUserTyping ? "font-semibold text-emerald-700" : "text-slate-500"}`}>
            {typing.isOtherUserTyping
              ? "yazıyor..."
              : `@${conversation.otherUser.username} · ${isOnline ? "çevrimiçi" : "çevrimdışı"}`}
          </p>
        </div>
      </header>

      <MessageList
        conversationId={conversation.id}
        currentUserId={currentUserId}
        onLatestVisible={handleLatestVisible}
      />
      <MessageComposer
        conversationId={conversation.id}
        onTypingChange={typing.updateTyping}
        onStopTyping={typing.stopTyping}
      />
    </div>
  );
}
