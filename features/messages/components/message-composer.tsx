"use client";

import { useState, type KeyboardEvent } from "react";

import {
  MAX_MESSAGE_LENGTH,
  useSendMessage,
} from "../hooks/use-send-message";

export function MessageComposer({
  conversationId,
  onTypingChange,
  onStopTyping,
}: {
  conversationId: string;
  onTypingChange(text: string): void;
  onStopTyping(): void;
}) {
  const [text, setText] = useState("");
  const sendMessage = useSendMessage(conversationId);
  const trimmedText = text.trim();
  const isTooLong = text.length > MAX_MESSAGE_LENGTH;
  const canSend =
    trimmedText.length > 0 && !isTooLong && !sendMessage.isPending;

  const submit = async (): Promise<void> => {
    if (!canSend) {
      return;
    }

    const submittedText = text;
    onStopTyping();
    try {
      await sendMessage.mutateAsync({ text: submittedText });
      setText((current) => (current === submittedText ? "" : current));
    } catch {
      // Mutation state renders the retryable error without losing the draft.
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <footer className="border-t border-slate-200 bg-white px-3 py-3 md:px-6 md:py-4">
      <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
        <label htmlFor="message-composer" className="sr-only">Mesaj</label>
        <textarea
          id="message-composer"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            onTypingChange(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Bir mesaj yaz…"
          aria-describedby="message-length"
          className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!canSend}
          aria-label="Mesaj gönder"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <SendIcon />
        </button>
      </div>
      <div className="mx-auto mt-1 flex max-w-4xl justify-end px-2">
        <span id="message-length" className={`text-[10px] ${isTooLong ? "font-semibold text-red-600" : "text-slate-400"}`}>
          {text.length}/{MAX_MESSAGE_LENGTH}
        </span>
      </div>
      {sendMessage.isError ? (
        <p role="alert" className="mx-auto mt-1 max-w-4xl px-2 text-xs text-red-600">Mesaj gönderilemedi. Taslağın korundu; tekrar deneyebilirsin.</p>
      ) : null}
    </footer>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
      <path d="m3.5 3.5 13 6.5-13 6.5 2-6.5-2-6.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M5.5 10h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
