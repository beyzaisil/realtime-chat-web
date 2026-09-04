"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { useDeleteMessage } from "../hooks/use-delete-message";
import { MAX_MESSAGE_LENGTH } from "../hooks/use-send-message";
import { useUpdateMessage } from "../hooks/use-update-message";
import { isMessageMutationError, type MessageDto } from "../types";

type ActionMode = "idle" | "edit";
type MenuView = "actions" | "confirmDelete";

interface MenuPosition {
  left: number;
  placement: "top" | "bottom";
  top: number;
}

const MENU_GAP_PX = 6;
const VIEWPORT_MARGIN_PX = 8;

export function MessageActions({
  message,
  currentUserId,
  onEditingChange,
}: {
  message: MessageDto;
  currentUserId: string;
  onEditingChange?(isEditing: boolean): void;
}) {
  const isDeleted = message.deletedAt !== null;

  if (message.senderId !== currentUserId || isDeleted) {
    return null;
  }

  return (
    <OwnedMessageActions
      message={message}
      {...(onEditingChange === undefined ? {} : { onEditingChange })}
    />
  );
}

function OwnedMessageActions({
  message,
  onEditingChange,
}: {
  message: MessageDto;
  onEditingChange?(isEditing: boolean): void;
}) {
  const updateMessage = useUpdateMessage(message.conversationId);
  const deleteMessage = useDeleteMessage(message.conversationId);
  const [mode, setMode] = useState<ActionMode>("idle");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<MenuView>("actions");
  const [draft, setDraft] = useState(message.body ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreFocusRef = useRef(false);

  const trimmedDraft = draft.trim();
  const validationMessage =
    message.kind === "TEXT" && trimmedDraft.length === 0
      ? "Mesaj boş olamaz."
      : draft.length > MAX_MESSAGE_LENGTH
        ? `Mesaj en fazla ${MAX_MESSAGE_LENGTH} karakter olabilir.`
        : null;

  useEffect(() => {
    if (isMenuOpen) {
      if (menuView === "actions") {
        editButtonRef.current?.focus();
      } else {
        deleteCancelRef.current?.focus();
      }
    }
  }, [isMenuOpen, menuView]);

  useLayoutEffect(() => {
    if (!isMenuOpen) {
      setMenuPosition(null);
      return;
    }

    const updateMenuPosition = (): void => {
      const trigger = menuButtonRef.current;
      const menu = menuRef.current;
      if (trigger === null || menu === null) {
        return;
      }

      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const availableBelow = window.innerHeight - triggerRect.bottom;
      const availableAbove = triggerRect.top;
      const opensUpward =
        availableBelow < menuRect.height + MENU_GAP_PX &&
        availableAbove > availableBelow;
      const desiredTop = opensUpward
        ? triggerRect.top - menuRect.height - MENU_GAP_PX
        : triggerRect.bottom + MENU_GAP_PX;
      const maximumTop = Math.max(
        VIEWPORT_MARGIN_PX,
        window.innerHeight - menuRect.height - VIEWPORT_MARGIN_PX,
      );
      const maximumLeft = Math.max(
        VIEWPORT_MARGIN_PX,
        window.innerWidth - menuRect.width - VIEWPORT_MARGIN_PX,
      );

      setMenuPosition({
        left: Math.min(
          Math.max(triggerRect.right - menuRect.width, VIEWPORT_MARGIN_PX),
          maximumLeft,
        ),
        placement: opensUpward ? "top" : "bottom",
        top: Math.min(Math.max(desiredTop, VIEWPORT_MARGIN_PX), maximumTop),
      });
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isMenuOpen, menuView]);

  useEffect(() => {
    if (mode === "idle" && shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false;
      menuButtonRef.current?.focus();
    }
  }, [mode]);

  useEffect(
    () => () => onEditingChange?.(false),
    [onEditingChange],
  );

  const restoreMenuFocus = (): void => {
    shouldRestoreFocusRef.current = true;
    onEditingChange?.(false);
    setErrorMessage(null);
    setMenuView("actions");
    setMode("idle");
    setIsMenuOpen(false);
  };

  const handleEscape = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== "Escape") {
      return;
    }

    if (isMenuOpen) {
      if (deleteMessage.isPending) {
        return;
      }
      event.preventDefault();
      setErrorMessage(null);
      setMenuView("actions");
      setIsMenuOpen(false);
      menuButtonRef.current?.focus();
      return;
    }

    if (
      mode !== "idle" &&
      !updateMessage.isPending &&
      !deleteMessage.isPending
    ) {
      event.preventDefault();
      restoreMenuFocus();
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationMessage !== null || updateMessage.isPending) {
      return;
    }

    setErrorMessage(null);
    try {
      await updateMessage.mutateAsync({
        messageId: message.id,
        kind: message.kind,
        text: trimmedDraft,
      });
      restoreMenuFocus();
    } catch (error: unknown) {
      setErrorMessage(getMutationErrorMessage(error, "update"));
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (deleteMessage.isPending) {
      return;
    }

    setErrorMessage(null);
    try {
      await deleteMessage.mutateAsync({ messageId: message.id });
      restoreMenuFocus();
    } catch (error: unknown) {
      setErrorMessage(getMutationErrorMessage(error, "delete"));
    }
  };

  return (
    <div
      className={
        mode === "idle"
          ? "absolute right-2 top-1.5 z-20 flex flex-col items-end"
          : "mt-1.5 flex w-full min-w-0 flex-col items-end"
      }
      onKeyDown={handleEscape}
    >
      {mode === "idle" ? (
        <div className="relative">
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Mesaj işlemleri"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            onClick={() => {
              setErrorMessage(null);
              setMenuView("actions");
              setIsMenuOpen((current) => !current);
            }}
            className="grid size-7 place-items-center border-0 bg-transparent p-0 text-emerald-100 opacity-100 shadow-none transition-all duration-150 hover:-translate-y-0.5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100"
          >
            <ChevronDownIcon />
          </button>

          {isMenuOpen
            ? createPortal(
                <div
                  ref={menuRef}
                  role={menuView === "actions" ? "menu" : "alertdialog"}
                  aria-label={
                    menuView === "actions"
                      ? "Mesaj aksiyonları"
                      : "Mesaj silme onayı"
                  }
                  data-placement={menuPosition?.placement}
                  style={{
                    left: menuPosition?.left ?? 0,
                    opacity: menuPosition === null ? 0 : 1,
                    top: menuPosition?.top ?? 0,
                    visibility: menuPosition === null ? "hidden" : "visible",
                  }}
                  className="fixed z-50 w-44 max-h-[calc(100vh-1rem)] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 text-slate-800 shadow-lg transition-opacity duration-150"
                >
                  {menuView === "actions" ? (
                    <>
                      <button
                        ref={editButtonRef}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setDraft(message.body ?? "");
                          setErrorMessage(null);
                          setIsMenuOpen(false);
                          onEditingChange?.(true);
                          setMode("edit");
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800 focus:outline-none"
                      >
                        <EditIcon />
                        Düzenle
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setErrorMessage(null);
                          setMenuView("confirmDelete");
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50 focus:bg-red-50 focus:outline-none"
                      >
                        <TrashIcon />
                        Sil
                      </button>
                    </>
                  ) : (
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">Mesajı sil?</p>
                      <div className="mt-2.5 flex justify-end gap-1">
                        <button
                          ref={deleteCancelRef}
                          type="button"
                          onClick={() => {
                            setErrorMessage(null);
                            setMenuView("actions");
                            setIsMenuOpen(false);
                            menuButtonRef.current?.focus();
                          }}
                          disabled={deleteMessage.isPending}
                          className="rounded-md bg-transparent px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                          Vazgeç
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete()}
                          disabled={deleteMessage.isPending}
                          className="rounded-md bg-transparent px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deleteMessage.isPending ? "Siliniyor…" : "Sil"}
                        </button>
                      </div>
                      {errorMessage !== null ? (
                        <p role="alert" className="mt-2 text-xs text-red-600">
                          {errorMessage}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>,
                document.body,
              )
            : null}
        </div>
      ) : null}

      {mode === "edit" ? (
        <form
          onSubmit={(event) => void handleUpdate(event)}
          className="w-full min-w-0 space-y-2 transition-all duration-150"
          aria-label="Mesajı düzenle"
        >
          <label htmlFor={`edit-message-${message.id}`} className="sr-only">
            Mesaj metni
          </label>
          <textarea
            id={`edit-message-${message.id}`}
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={updateMessage.isPending}
            aria-describedby={`edit-message-help-${message.id}`}
            aria-invalid={validationMessage !== null}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={2}
            className="min-h-20 w-full min-w-0 resize-y rounded-lg border border-emerald-300/40 bg-emerald-800/30 px-3 py-2 text-sm leading-6 text-white outline-none transition-all duration-150 placeholder:text-emerald-100/60 focus:border-emerald-200 focus:bg-emerald-800/45 focus:ring-2 focus:ring-emerald-200/30 disabled:cursor-wait disabled:opacity-70"
          />
          <div
            id={`edit-message-help-${message.id}`}
            className="flex min-h-4 flex-wrap items-center justify-between gap-2 text-[10px] text-emerald-100/75"
          >
            {validationMessage === null ? <span /> : (
              <span role="alert">{validationMessage}</span>
            )}
            <span className="tabular-nums">
              {draft.length} / {MAX_MESSAGE_LENGTH}
            </span>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <button
              type="button"
              onClick={restoreMenuFocus}
              disabled={updateMessage.isPending}
              className="min-h-8 rounded-md border-0 bg-transparent px-3 py-1.5 text-xs font-semibold text-emerald-100 transition-colors duration-150 hover:bg-white/10 hover:text-white disabled:cursor-wait disabled:opacity-60"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={validationMessage !== null || updateMessage.isPending}
              className="min-h-8 rounded-md border-0 bg-white/90 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-colors duration-150 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateMessage.isPending ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </form>
      ) : null}

      {mode === "edit" && errorMessage !== null ? (
        <p
          role="alert"
          className="mt-1 w-full text-xs font-medium text-red-100"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="size-4"
      aria-hidden="true"
    >
      <path
        d="m5.5 7.5 4.5 4.5 4.5-4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="size-4 shrink-0"
      aria-hidden="true"
    >
      <path
        d="M4 14.75V16h1.25L14.6 6.65l-1.25-1.25L4 14.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m12.5 6.25 1.4-1.4a1.25 1.25 0 0 1 1.77 0l.48.48a1.25 1.25 0 0 1 0 1.77l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="size-4 shrink-0"
      aria-hidden="true"
    >
      <path d="M4.5 6h11M8 3.75h4M6 6l.6 10.25h6.8L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.25 8.5v5.25M11.75 8.5v5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function getMutationErrorMessage(
  error: unknown,
  action: "update" | "delete",
): string {
  if (!isMessageMutationError(error)) {
    return action === "update"
      ? "Mesaj güncellenemedi. Lütfen tekrar deneyin."
      : "Mesaj silinemedi. Lütfen tekrar deneyin.";
  }

  switch (error.code) {
    case "VALIDATION_ERROR":
    case "PAYLOAD_TOO_LARGE":
      return `Mesaj boş olamaz ve en fazla ${MAX_MESSAGE_LENGTH} karakter olabilir.`;
    case "MESSAGE_NOT_FOUND":
      return "Mesaj bulunamadı veya artık değiştirilemiyor.";
    case "CONVERSATION_NOT_FOUND":
      return "Konuşma bulunamadı.";
    case "AUTHENTICATION_REQUIRED":
    case "INVALID_TOKEN":
      return "Oturumunuz sona erdi. Lütfen tekrar giriş yapın.";
    case "INTERNAL_SERVER_ERROR":
      return "Sunucu hatası oluştu. Lütfen tekrar deneyin.";
  }
}
