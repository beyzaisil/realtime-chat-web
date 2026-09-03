"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useConversationPresence } from "../../presence/hooks/use-conversation-presence";
import { UserAvatar } from "../../users/components/user-avatar";
import { useConversationListRealtime } from "../hooks/use-conversation-list-realtime";
import { useConversations } from "../hooks/use-conversations";
import {
  isListedDirectConversation,
  type ConversationListItem,
} from "../types";

export function ConversationList() {
  const query = useConversations();
  const userIds = query.conversations
    .filter(isListedDirectConversation)
    .map((conversation) => conversation.otherUser.id);
  const conversationIds = query.conversations.map(
    (conversation) => conversation.id,
  );
  const presence = useConversationPresence(userIds);
  useConversationListRealtime(conversationIds);

  if (query.isPending) {
    return <ConversationListSkeleton />;
  }

  if (query.isError) {
    return (
      <div className="grid flex-1 place-items-center px-6 text-center">
        <div>
          <p className="font-semibold text-slate-800">Sohbetler yüklenemedi</p>
          <p className="mt-1 text-sm text-slate-500">Bağlantını kontrol edip tekrar dene.</p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Tekrar dene
          </button>
        </div>
      </div>
    );
  }

  if (query.conversations.length === 0) {
    return (
      <div className="grid flex-1 place-items-center px-8 text-center">
        <div>
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <ChatIcon />
          </span>
          <p className="mt-4 font-semibold text-slate-800">Henüz bir sohbetin yok</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">Yeni sohbet düğmesiyle birini bulup konuşma başlatabilirsin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" aria-label="Sohbetler">
      <ul className="space-y-1">
        {query.conversations.map((conversation) => (
          <li key={conversation.id}>
            <ConversationRow
              conversation={conversation}
              isOnline={
                isListedDirectConversation(conversation) &&
                presence[conversation.otherUser.id]?.status === "online"
              }
            />
          </li>
        ))}
      </ul>

      {query.hasNextPage ? (
        <button
          type="button"
          onClick={() => void query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
        >
          {query.isFetchingNextPage ? "Yükleniyor…" : "Daha fazla yükle"}
        </button>
      ) : null}
    </div>
  );
}

function ConversationRow({
  conversation,
  isOnline,
}: {
  conversation: ConversationListItem;
  isOnline: boolean;
}) {
  const pathname = usePathname();
  const href = `/chat/${conversation.id}`;
  const isActive = pathname === href;
  const isDirect = isListedDirectConversation(conversation);
  const title = isDirect
    ? conversation.otherUser.displayName
    : conversation.title;
  const subtitle = isDirect
    ? `@${conversation.otherUser.username}`
    : `${conversation.members.length} üyeli grup`;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`flex gap-3 rounded-2xl px-3 py-3 transition-colors ${
        isActive ? "bg-emerald-50" : "hover:bg-slate-50"
      }`}
    >
      {isDirect ? (
        <span className="relative">
          <UserAvatar user={conversation.otherUser} />
          <span
            className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${
              isOnline ? "bg-emerald-500" : "bg-slate-300"
            }`}
            aria-label={isOnline ? "Çevrimiçi" : "Çevrimdışı"}
          />
        </span>
      ) : (
        <GroupAvatar />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate font-semibold text-slate-900">
            {title}
          </span>
          {conversation.lastMessage?.createdAt ? (
            <time
              dateTime={conversation.lastMessage.createdAt}
              className="shrink-0 text-[11px] text-slate-400"
            >
              {formatConversationTime(conversation.lastMessage.createdAt)}
            </time>
          ) : null}
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-xs text-slate-400">
            {subtitle}
          </span>
          {conversation.unreadCount > 0 ? (
            <span className="grid min-w-5 place-items-center rounded-full bg-emerald-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </span>
          ) : null}
        </span>
        <span className="mt-1 block truncate text-sm text-slate-500">
          {getConversationPreview(conversation.lastMessage)}
        </span>
      </span>
    </Link>
  );
}

function GroupAvatar() {
  return (
    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800" aria-hidden="true">
      <svg viewBox="0 0 20 20" fill="none" className="size-6">
        <path d="M6.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM13.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.5 16.5c.3-3 2-4.5 5-4.5s4.7 1.5 5 4.5M11 11.5c.7-.4 1.5-.5 2.5-.5 2.8 0 4.4 1.4 4.7 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function ConversationListSkeleton() {
  return (
    <div className="space-y-2 px-3" aria-label="Sohbetler yükleniyor">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex animate-pulse gap-3 px-3 py-3">
          <span className="size-12 rounded-full bg-slate-200" />
          <span className="flex-1 space-y-2 pt-1">
            <span className="block h-3 w-2/3 rounded bg-slate-200" />
            <span className="block h-3 w-full rounded bg-slate-100" />
          </span>
        </div>
      ))}
    </div>
  );
}

function getConversationPreview(
  lastMessage: ConversationListItem["lastMessage"],
): string {
  if (lastMessage === null) {
    return "Henüz mesaj yok";
  }

  if (lastMessage.deletedAt !== null) {
    return "Mesaj silindi.";
  }

  return lastMessage.body ?? "Medya mesajı";
}

function formatConversationTime(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  return new Intl.DateTimeFormat("tr-TR", isToday
    ? { hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "2-digit" }
  ).format(date);
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden="true">
      <path d="M7.5 18.5 4 20v-4.25A8 8 0 1 1 7.5 18.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
