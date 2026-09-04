"use client";

import { useEffect, useRef, useState } from "react";

import { isMediaMessage, type MessageDto } from "../types";
import { useMessageHistory } from "../hooks/use-message-history";
import { MessageActions } from "./message-actions";
import { MessageAttachments } from "./message-attachments";

const BOTTOM_THRESHOLD_PX = 96;

export function MessageList({
  conversationId,
  currentUserId,
  onLatestVisible,
}: {
  conversationId: string;
  currentUserId: string;
  onLatestVisible(message: MessageDto): void;
}) {
  const history = useMessageHistory(conversationId);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const didInitialScrollRef = useRef(false);

  useEffect(() => {
    didInitialScrollRef.current = false;
    isAtBottomRef.current = true;
  }, [conversationId]);

  useEffect(() => {
    if (history.messages.length === 0) {
      return;
    }

    const shouldFollow =
      !didInitialScrollRef.current || isAtBottomRef.current;
    const frame = window.requestAnimationFrame(() => {
      const container = containerRef.current;
      if (container !== null && shouldFollow) {
        container.scrollTop = container.scrollHeight;
        isAtBottomRef.current = true;
      }

      if (shouldFollow) {
        const latestIncoming = [...history.messages]
          .reverse()
          .find((message) => message.senderId !== currentUserId);
        if (latestIncoming !== undefined) {
          onLatestVisible(latestIncoming);
        }
      }
      didInitialScrollRef.current = true;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [currentUserId, history.messages, onLatestVisible]);

  if (history.isPending) {
    return (
      <div className="grid min-h-0 flex-1 place-items-center text-sm text-slate-500" aria-label="Mesajlar yükleniyor">
        Mesajlar yükleniyor…
      </div>
    );
  }

  if (history.isError) {
    return (
      <div className="grid min-h-0 flex-1 place-items-center p-6 text-center">
        <div>
          <p className="font-semibold text-slate-800">Mesajlar yüklenemedi</p>
          <button type="button" onClick={() => void history.refetch()} className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Tekrar dene</button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={(event) => {
        const element = event.currentTarget;
        const wasAtBottom = isAtBottomRef.current;
        const isAtBottom =
          element.scrollHeight - element.scrollTop - element.clientHeight <=
          BOTTOM_THRESHOLD_PX;
        isAtBottomRef.current = isAtBottom;

        if (isAtBottom && !wasAtBottom) {
          const latestIncoming = [...history.messages]
            .reverse()
            .find((message) => message.senderId !== currentUserId);
          if (latestIncoming !== undefined) {
            onLatestVisible(latestIncoming);
          }
        }
      }}
      className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8"
      aria-label="Mesaj geçmişi"
    >
      {history.hasNextPage ? (
        <div className="mb-5 text-center">
          <button
            type="button"
            onClick={() => void history.fetchNextPage()}
            disabled={history.isFetchingNextPage}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            {history.isFetchingNextPage ? "Yükleniyor…" : "Daha eski mesajları yükle"}
          </button>
        </div>
      ) : null}

      {history.messages.length === 0 ? (
        <div className="grid h-full place-items-center text-center text-sm text-slate-500">
          Henüz mesaj yok. İlk mesajı sen gönder.
        </div>
      ) : (
        <ol className="space-y-2">
          {history.messages.map((message) => (
            <li
              key={message.id}
              className={`flex ${message.senderId === currentUserId ? "justify-end" : "justify-start"}`}
            >
              <MessageBubble
                message={message}
                currentUserId={currentUserId}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  currentUserId,
}: {
  message: MessageDto;
  currentUserId: string;
}) {
  const isOwn = message.senderId === currentUserId;
  const isDeleted = message.deletedAt !== null;
  const [isEditing, setIsEditing] = useState(false);

  return (
    <article
      className={`group relative rounded-2xl px-3.5 py-2.5 shadow-sm transition-[width,max-width] ${
        isEditing
          ? "w-full max-w-[420px]"
          : isMediaMessage(message)
            ? "max-w-[min(88%,560px)]"
            : "max-w-[min(78%,560px)]"
      } ${
        isOwn
          ? "rounded-br-md bg-emerald-700 text-white"
          : "rounded-bl-md border border-slate-200 bg-white text-slate-900"
      }`}
    >
      {!isEditing && !isDeleted && isMediaMessage(message) ? (
        <MessageAttachments
          attachments={message.attachments}
          conversationId={message.conversationId}
          isOwn={isOwn}
        />
      ) : null}
      {!isEditing && (isDeleted || message.body !== null) ? (
        <p
          className={`whitespace-pre-wrap break-words text-sm leading-6 ${
            isDeleted ? "italic opacity-75" : isOwn ? "pr-9" : ""
          }`}
        >
          {isDeleted ? "Bu mesaj silindi." : message.body}
        </p>
      ) : null}
      {!isEditing ? <span className="mt-1 flex items-center justify-end gap-1.5">
        {!isDeleted && message.editedAt !== null ? (
          <span
            className={`text-[10px] ${isOwn ? "text-emerald-100" : "text-slate-400"}`}
          >
            düzenlendi
          </span>
        ) : null}
        <time
          dateTime={message.createdAt}
          className={`text-[10px] ${isOwn ? "text-emerald-100" : "text-slate-400"}`}
        >
          {new Intl.DateTimeFormat("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(message.createdAt))}
        </time>
      </span> : null}
      <MessageActions
        message={message}
        currentUserId={currentUserId}
        onEditingChange={setIsEditing}
      />
    </article>
  );
}
