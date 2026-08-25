"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useCreateDirectConversation } from "../../conversations/hooks/use-conversations";
import { UserAvatar } from "./user-avatar";
import {
  MIN_USER_QUERY_LENGTH,
  useUserSearch,
} from "../hooks/use-user-search";

export function NewConversationDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose(): void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const search = useUserSearch(query);
  const createConversation = useCreateDirectConversation();
  const resetCreateConversation = createConversation.reset;

  useEffect(() => {
    if (!open) {
      setQuery("");
      resetCreateConversation();
      return;
    }

    inputRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open, resetCreateConversation]);

  if (!open) {
    return null;
  }

  const handleSelect = (userId: string): void => {
    createConversation.mutate(userId, {
      onSuccess: (conversation) => {
        onClose();
        router.push(`/chat/${conversation.id}`);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section role="dialog" aria-modal="true" aria-labelledby="new-chat-title" className="flex max-h-[min(680px,90vh)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="new-chat-title" className="font-bold text-slate-900">Yeni sohbet</h2>
            <p className="mt-0.5 text-sm text-slate-500">Konuşmak istediğin kişiyi bul.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Kapat" className="grid size-9 place-items-center rounded-full text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button>
        </header>

        <div className="p-4">
          <label htmlFor="user-search" className="sr-only">Kullanıcı ara</label>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
            <SearchIcon />
            <input
              ref={inputRef}
              id="user-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="İsim veya kullanıcı adı"
              autoComplete="off"
              className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="min-h-52 overflow-y-auto px-3 pb-4">
          {query.trim().length < MIN_USER_QUERY_LENGTH ? (
            <SearchState text={`Aramak için en az ${MIN_USER_QUERY_LENGTH} karakter yaz.`} />
          ) : search.isDebouncing || search.isPending ? (
            <SearchState text="Kullanıcılar aranıyor…" />
          ) : search.isError ? (
            <SearchState text="Arama tamamlanamadı. Tekrar deneyebilirsin." />
          ) : search.users.length === 0 ? (
            <SearchState text="Bu aramayla eşleşen kullanıcı bulunamadı." />
          ) : (
            <>
              <ul className="space-y-1">
                {search.users.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(user.id)}
                      disabled={createConversation.isPending}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                    >
                      <UserAvatar user={user} />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-slate-900">{user.displayName}</span>
                        <span className="block truncate text-sm text-slate-500">@{user.username}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {search.hasNextPage ? (
                <button type="button" onClick={() => void search.fetchNextPage()} disabled={search.isFetchingNextPage} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                  {search.isFetchingNextPage ? "Yükleniyor…" : "Daha fazla sonuç"}
                </button>
              ) : null}
            </>
          )}

          {createConversation.isError ? (
            <p role="alert" className="mx-3 mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">Sohbet başlatılamadı. Lütfen tekrar dene.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function SearchState({ text }: { text: string }) {
  return <p className="grid min-h-48 place-items-center px-6 text-center text-sm text-slate-500">{text}</p>;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5 shrink-0 text-slate-400" aria-hidden="true">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
