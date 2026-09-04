"use client";

import { useEffect, useState } from "react";

import { getAttachmentErrorMessage } from "../api/message-attachment-error";
import { useAttachmentAccess } from "../hooks/use-message-attachments";
import type { MessageAttachmentDto } from "../types";

export function MessageAttachments({
  attachments,
  conversationId,
  isOwn,
}: {
  attachments: readonly MessageAttachmentDto[];
  conversationId: string;
  isOwn: boolean;
}) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <ul aria-label="Mesaj ekleri" className="mb-1.5 grid gap-2">
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          {attachment.kind === "IMAGE" ? (
            <ImageAttachment
              attachment={attachment}
              conversationId={conversationId}
              isOwn={isOwn}
            />
          ) : (
            <PdfAttachment
              attachment={attachment}
              conversationId={conversationId}
              isOwn={isOwn}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

function ImageAttachment({
  attachment,
  conversationId,
  isOwn,
}: {
  attachment: Extract<MessageAttachmentDto, { kind: "IMAGE" }>;
  conversationId: string;
  isOwn: boolean;
}) {
  const accessThumbnail = useAttachmentAccess(conversationId);
  const accessOriginal = useAttachmentAccess(conversationId);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let nextObjectUrl: string | null = null;

    void accessThumbnail
      .mutateAsync({ attachmentId: attachment.id, variant: "thumbnail" })
      .then(async (response) => response.blob())
      .then((blob) => {
        if (!active) {
          return;
        }
        nextObjectUrl = URL.createObjectURL(blob);
        setThumbnailUrl(nextObjectUrl);
      })
      .catch((error: unknown) => {
        if (active) {
          setThumbnailError(getAttachmentErrorMessage(error));
        }
      });

    return () => {
      active = false;
      if (nextObjectUrl !== null) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
    // The attachment id uniquely identifies this immutable media resource.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment.id, conversationId]);

  const openOriginal = async (): Promise<void> => {
    const previewWindow = window.open("", "_blank");
    if (previewWindow === null) {
      setThumbnailError(
        "Görsel penceresi açılamadı. Tarayıcının açılır pencere iznini kontrol et.",
      );
      return;
    }

    previewWindow.opener = null;
    previewWindow.document.title = "Görsel hazırlanıyor…";

    try {
      setThumbnailError(null);
      const response = await accessOriginal.mutateAsync({
        attachmentId: attachment.id,
        variant: "original",
      });
      const objectUrl = URL.createObjectURL(await response.blob());
      previewWindow.location.replace(objectUrl);
      scheduleObjectUrlCleanup(objectUrl);
    } catch (error: unknown) {
      previewWindow.close();
      setThumbnailError(getAttachmentErrorMessage(error));
    }
  };

  return (
    <div className="overflow-hidden rounded-xl">
      <button
        type="button"
        onClick={() => void openOriginal()}
        disabled={accessOriginal.isPending}
        aria-label={`${attachment.originalFileName} görselini aç`}
        className="block w-full overflow-hidden rounded-xl bg-slate-200/50 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-wait disabled:opacity-70"
      >
        {thumbnailUrl !== null ? (
          // Authenticated attachment responses are represented by local object URLs.
          <img
            src={thumbnailUrl}
            alt={attachment.originalFileName}
            width={attachment.width}
            height={attachment.height}
            className="max-h-80 w-full object-cover"
          />
        ) : thumbnailError === null ? (
          <span
            role="status"
            className="grid min-h-40 place-items-center px-6 text-xs text-slate-500"
          >
            Görsel yükleniyor…
          </span>
        ) : (
          <span className="grid min-h-28 place-items-center px-6 text-center text-xs text-red-700">
            Görsel gösterilemedi
          </span>
        )}
      </button>
      {accessOriginal.isPending ? (
        <p
          role="status"
          className={`px-1 pt-1 text-[11px] ${isOwn ? "text-emerald-100" : "text-slate-500"}`}
        >
          Görsel hazırlanıyor…
        </p>
      ) : null}
      {thumbnailError !== null ? (
        <p
          role="alert"
          className={`px-1 pt-1 text-[11px] ${isOwn ? "text-red-100" : "text-red-700"}`}
        >
          {thumbnailError}
        </p>
      ) : null}
    </div>
  );
}

function PdfAttachment({
  attachment,
  conversationId,
  isOwn,
}: {
  attachment: Extract<MessageAttachmentDto, { kind: "PDF" }>;
  conversationId: string;
  isOwn: boolean;
}) {
  const accessOriginal = useAttachmentAccess(conversationId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const view = async (): Promise<void> => {
    const previewWindow = window.open("", "_blank");
    if (previewWindow === null) {
      setErrorMessage(
        "PDF görüntüleme penceresi açılamadı. Tarayıcının açılır pencere iznini kontrol et.",
      );
      return;
    }

    previewWindow.opener = null;
    previewWindow.document.title = "PDF hazırlanıyor…";

    try {
      setErrorMessage(null);
      const objectUrl = await loadPdfObjectUrl(
        accessOriginal,
        attachment.id,
      );
      previewWindow.location.replace(objectUrl);
      scheduleObjectUrlCleanup(objectUrl);
    } catch (error: unknown) {
      previewWindow.close();
      setErrorMessage(getAttachmentErrorMessage(error));
    }
  };

  const download = async (): Promise<void> => {
    try {
      setErrorMessage(null);
      const objectUrl = await loadPdfObjectUrl(
        accessOriginal,
        attachment.id,
      );
      downloadObjectUrl(objectUrl, attachment.originalFileName);
    } catch (error: unknown) {
      setErrorMessage(getAttachmentErrorMessage(error));
    }
  };

  return (
    <div>
      <div
        className={`flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70 ${
          isOwn
            ? "border-emerald-500 bg-emerald-800/35 focus-visible:outline-emerald-200"
            : "border-slate-200 bg-slate-50 focus-visible:outline-emerald-600"
        }`}
      >
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-lg ${
            isOwn ? "bg-white/15 text-white" : "bg-red-50 text-red-700"
          }`}
        >
          <PdfIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {attachment.originalFileName}
          </span>
          <span
            className={`mt-0.5 block text-[11px] ${isOwn ? "text-emerald-100" : "text-slate-500"}`}
          >
            {accessOriginal.isPending ? "PDF hazırlanıyor…" : "PDF dosyası"}
          </span>
        </span>
        <span
          role="group"
          aria-label={`${attachment.originalFileName} işlemleri`}
          className="flex shrink-0 items-center gap-1"
        >
          <button
            type="button"
            onClick={() => void view()}
            disabled={accessOriginal.isPending}
            aria-label={`${attachment.originalFileName} dosyasını görüntüle`}
            className={`grid size-9 place-items-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 disabled:cursor-wait disabled:opacity-60 ${
              isOwn
                ? "hover:bg-white/15 focus-visible:outline-emerald-200"
                : "hover:bg-slate-200 focus-visible:outline-emerald-600"
            }`}
          >
            <ViewIcon />
          </button>
          <button
            type="button"
            onClick={() => void download()}
            disabled={accessOriginal.isPending}
            aria-label={`${attachment.originalFileName} dosyasını indir`}
            className={`grid size-9 place-items-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 disabled:cursor-wait disabled:opacity-60 ${
              isOwn
                ? "hover:bg-white/15 focus-visible:outline-emerald-200"
                : "hover:bg-slate-200 focus-visible:outline-emerald-600"
            }`}
          >
            <DownloadIcon />
          </button>
        </span>
      </div>
      {errorMessage !== null ? (
        <p
          role="alert"
          className={`px-1 pt-1 text-[11px] ${isOwn ? "text-red-100" : "text-red-700"}`}
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

async function loadPdfObjectUrl(
  accessOriginal: ReturnType<typeof useAttachmentAccess>,
  attachmentId: string,
): Promise<string> {
  const response = await accessOriginal.mutateAsync({
    attachmentId,
    variant: "original",
  });
  const pdfBlob = new Blob([await response.arrayBuffer()], {
    type: "application/pdf",
  });
  return URL.createObjectURL(pdfBlob);
}

function downloadObjectUrl(objectUrl: string, fileName: string): void {
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  scheduleObjectUrlCleanup(objectUrl);
}

function scheduleObjectUrlCleanup(objectUrl: string): void {
  globalThis.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
      <path d="M5 2.75h6l4 4v10.5H5V2.75Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M11 2.75v4h4M7.25 12.5h5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5 shrink-0" aria-hidden="true">
      <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 16h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ViewIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5 shrink-0" aria-hidden="true">
      <path d="M2.5 10s2.7-4.5 7.5-4.5 7.5 4.5 7.5 4.5-2.7 4.5-7.5 4.5S2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
