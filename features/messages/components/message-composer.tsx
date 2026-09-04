"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

import {
  ATTACHMENT_ACCEPTED_TYPES,
  validateAttachmentFiles,
} from "../api/message-attachments-api";
import { getAttachmentErrorMessage } from "../api/message-attachment-error";
import { useUploadAttachments } from "../hooks/use-message-attachments";
import {
  MAX_MESSAGE_LENGTH,
  useSendMediaMessage,
  useSendMessage,
} from "../hooks/use-send-message";

interface SelectedFile {
  file: File;
  id: string;
  isImage: boolean;
  previewUrl: string;
}

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
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploadedAttachmentIds, setUploadedAttachmentIds] = useState<
    string[] | null
  >(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const selectedFilesRef = useRef<SelectedFile[]>([]);
  const fileSequenceRef = useRef(0);
  const mediaClientMessageIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachButtonRef = useRef<HTMLButtonElement>(null);
  const sendMessage = useSendMessage(conversationId);
  const sendMediaMessage = useSendMediaMessage(conversationId);
  const uploadAttachments = useUploadAttachments(conversationId);
  const trimmedText = text.trim();
  const isTooLong = text.length > MAX_MESSAGE_LENGTH;
  const hasFiles = selectedFiles.length > 0;
  const isBusy =
    sendMessage.isPending ||
    sendMediaMessage.isPending ||
    uploadAttachments.isPending;
  const canSend =
    !isTooLong && !isBusy && (hasFiles || trimmedText.length > 0);

  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  useEffect(
    () => () => {
      revokePreviewUrls(selectedFilesRef.current);
    },
    [],
  );

  const resetAttachmentMutations = (): void => {
    uploadAttachments.reset();
    sendMediaMessage.reset();
    setUploadedAttachmentIds(null);
    mediaClientMessageIdRef.current = null;
  };

  const clearSelectedFiles = (): void => {
    revokePreviewUrls(selectedFiles);
    setSelectedFiles([]);
    resetAttachmentMutations();
    if (fileInputRef.current !== null) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelection = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    const pickedFiles = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (pickedFiles.length === 0) {
      return;
    }

    const allFiles = [
      ...selectedFiles.map((selection) => selection.file),
      ...pickedFiles,
    ];

    try {
      validateAttachmentFiles(allFiles);
      const additions = pickedFiles.map((file) => {
        fileSequenceRef.current += 1;
        return {
          file,
          id: `${file.name}-${String(file.lastModified)}-${String(fileSequenceRef.current)}`,
          isImage: file.type.startsWith("image/"),
          previewUrl: URL.createObjectURL(file),
        };
      });
      setSelectedFiles((current) => [...current, ...additions]);
      setSelectionError(null);
      resetAttachmentMutations();
    } catch (error: unknown) {
      setSelectionError(getAttachmentErrorMessage(error));
    }
  };

  const removeSelectedFile = (id: string): void => {
    const removed = selectedFiles.find((selection) => selection.id === id);
    if (removed !== undefined) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    setSelectedFiles((current) =>
      current.filter((selection) => selection.id !== id),
    );
    setSelectionError(null);
    resetAttachmentMutations();
    attachButtonRef.current?.focus();
  };

  const submit = async (): Promise<void> => {
    if (!canSend) {
      return;
    }

    const submittedText = text;
    onStopTyping();
    setSelectionError(null);

    try {
      if (hasFiles) {
        let attachmentIds = uploadedAttachmentIds;
        if (attachmentIds === null) {
          const attachments = await uploadAttachments.mutateAsync(
            selectedFiles.map((selection) => selection.file),
          );
          attachmentIds = attachments.map((attachment) => attachment.id);
          setUploadedAttachmentIds(attachmentIds);
        }

        mediaClientMessageIdRef.current ??= crypto.randomUUID();
        await sendMediaMessage.mutateAsync({
          attachmentIds,
          clientMessageId: mediaClientMessageIdRef.current,
          ...(trimmedText.length === 0 ? {} : { text: submittedText }),
        });
        clearSelectedFiles();
        setText((current) => (current === submittedText ? "" : current));
        return;
      }

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

  const attachmentError =
    selectionError ??
    (uploadAttachments.isError
      ? getAttachmentErrorMessage(uploadAttachments.error)
      : sendMediaMessage.isError
        ? getAttachmentErrorMessage(sendMediaMessage.error)
        : null);

  return (
    <footer className="border-t border-slate-200 bg-white px-3 py-3 md:px-6 md:py-4">
      {selectedFiles.length > 0 ? (
        <ul
          aria-label="Seçilen dosyalar"
          className="mx-auto mb-2 flex max-w-4xl gap-2 overflow-x-auto pb-1"
        >
          {selectedFiles.map((selection) => (
            <li
              key={selection.id}
              className="relative flex min-w-36 max-w-52 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2"
            >
              {selection.isImage ? (
                // Object URLs are local previews and cannot use Next/Image optimization.
                <img
                  src={selection.previewUrl}
                  alt={`${selection.file.name} önizlemesi`}
                  className="size-12 rounded-lg object-cover"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => openSelectedPdf(selection, setSelectionError)}
                  disabled={isBusy}
                  aria-label={`${selection.file.name} dosyasını görüntüle`}
                  className="grid size-12 shrink-0 place-items-center rounded-lg bg-red-50 text-red-700 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600 disabled:opacity-50"
                >
                  <PdfIcon />
                </button>
              )}
              <span className="min-w-0 pr-5">
                <span className="block truncate text-xs font-semibold text-slate-700">
                  {selection.file.name}
                </span>
                <span className="mt-0.5 block text-[10px] text-slate-400">
                  {formatFileSize(selection.file.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeSelectedFile(selection.id)}
                disabled={isBusy}
                aria-label={`${selection.file.name} dosyasını kaldır`}
                className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600 disabled:opacity-50"
              >
                <CloseIcon />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ATTACHMENT_ACCEPTED_TYPES.join(",")}
          onChange={handleFileSelection}
          disabled={isBusy}
          tabIndex={-1}
          aria-label="Dosya seç"
          className="sr-only"
        />
        <button
          ref={attachButtonRef}
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
          aria-label="Dosya ekle"
          className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-200 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-50"
        >
          <AttachmentIcon />
        </button>
        <label htmlFor="message-composer" className="sr-only">
          {hasFiles ? "Açıklama" : "Mesaj"}
        </label>
        <textarea
          id="message-composer"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setSelectionError(null);
            sendMessage.reset();
            sendMediaMessage.reset();
            onTypingChange(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          disabled={isBusy}
          rows={1}
          placeholder={hasFiles ? "Açıklama ekle…" : "Bir mesaj yaz…"}
          aria-describedby="message-length composer-status composer-error"
          className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-wait disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!canSend}
          aria-label={hasFiles ? "Medya mesajı gönder" : "Mesaj gönder"}
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <SendIcon />
        </button>
      </div>

      <div className="mx-auto mt-1 flex max-w-4xl items-center justify-between gap-3 px-2">
        <span
          id="composer-status"
          role="status"
          aria-live="polite"
          className="min-h-4 text-[11px] font-medium text-emerald-700"
        >
          {uploadAttachments.isPending
            ? "Dosyalar yükleniyor…"
            : sendMediaMessage.isPending
              ? "Medya mesajı gönderiliyor…"
              : ""}
        </span>
        <span
          id="message-length"
          className={`text-[10px] ${isTooLong ? "font-semibold text-red-600" : "text-slate-400"}`}
        >
          {text.length}/{MAX_MESSAGE_LENGTH}
        </span>
      </div>

      {attachmentError !== null ? (
        <p
          id="composer-error"
          role="alert"
          className="mx-auto mt-1 max-w-4xl px-2 text-xs text-red-600"
        >
          {attachmentError}
        </p>
      ) : sendMessage.isError ? (
        <p
          id="composer-error"
          role="alert"
          className="mx-auto mt-1 max-w-4xl px-2 text-xs text-red-600"
        >
          Mesaj gönderilemedi. Taslağın korundu; tekrar deneyebilirsin.
        </p>
      ) : null}
    </footer>
  );
}

function revokePreviewUrls(files: readonly SelectedFile[]): void {
  for (const file of files) {
    URL.revokeObjectURL(file.previewUrl);
  }
}

function openSelectedPdf(
  selection: SelectedFile,
  setError: (message: string | null) => void,
): void {
  const previewWindow = window.open(selection.previewUrl, "_blank");
  if (previewWindow === null) {
    setError(
      "PDF önizleme penceresi açılamadı. Tarayıcının açılır pencere iznini kontrol et.",
    );
    return;
  }

  previewWindow.opener = null;
  setError(null);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1_024) {
    return `${String(bytes)} B`;
  }
  if (bytes < 1_024 * 1_024) {
    return `${(bytes / 1_024).toFixed(1)} KiB`;
  }
  return `${(bytes / (1_024 * 1_024)).toFixed(1)} MiB`;
}

function AttachmentIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
      <path d="m7.2 10.8 4.95-4.95a2.4 2.4 0 1 1 3.4 3.4L9.2 15.6a4 4 0 0 1-5.65-5.66l6.36-6.36" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
      <path d="M5 2.75h6l4 4v10.5H5V2.75Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M11 2.75v4h4M7.25 12.5h5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-3.5" aria-hidden="true">
      <path d="m6 6 8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
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
