"use client";

import { usePathname } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";

import { NewConversationDialog } from "../../users/components/new-conversation-dialog";
import { ConversationSubscriptionProvider } from "../../messages/providers/conversation-subscription-provider";
import { ConversationList } from "./conversation-list";

export function ChatShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const hasSelectedConversation = pathname !== "/chat";
  const closeNewConversation = useCallback(
    () => setIsNewConversationOpen(false),
    [],
  );

  return (
    <ConversationSubscriptionProvider>
      <main className="flex h-dvh min-h-[540px] overflow-hidden bg-slate-100 p-0 md:p-4">
        <div className="mx-auto flex h-full w-full max-w-[1500px] overflow-hidden bg-white md:rounded-3xl md:border md:border-slate-200 md:shadow-xl md:shadow-slate-900/5">
        <aside
          className={`${hasSelectedConversation ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r border-slate-200 bg-white md:w-[380px]`}
        >
          <header className="flex items-center justify-between gap-4 px-5 pb-4 pt-5 md:pt-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Chat</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Sohbetler</h1>
            </div>
            <button
              type="button"
              onClick={() => setIsNewConversationOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3.5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-700/15"
            >
              <PlusIcon />
              <span className="hidden min-[340px]:inline">Yeni sohbet</span>
            </button>
          </header>
          <div className="mx-5 mb-3 h-px bg-slate-100" />
          <ConversationList />
        </aside>

        <section
          className={`${hasSelectedConversation ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col bg-slate-50`}
        >
          {children}
        </section>
        </div>

        <NewConversationDialog
          open={isNewConversationOpen}
          onClose={closeNewConversation}
        />
      </main>
    </ConversationSubscriptionProvider>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
