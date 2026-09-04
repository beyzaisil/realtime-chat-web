import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AttachmentClientError } from "../api/message-attachment-error";
import { useUploadAttachments } from "../hooks/use-message-attachments";
import {
  useSendMediaMessage,
  useSendMessage,
} from "../hooks/use-send-message";
import { MessageComposer } from "./message-composer";

vi.mock("../hooks/use-message-attachments");
vi.mock("../hooks/use-send-message");

const sendText = vi.fn();
const sendMedia = vi.fn();
const uploadFiles = vi.fn();
const resetText = vi.fn();
const resetMedia = vi.fn();
const resetUpload = vi.fn();

function mockMutations({
  uploadPending = false,
  uploadError,
}: {
  uploadPending?: boolean;
  uploadError?: unknown;
} = {}): void {
  vi.mocked(useSendMessage).mockReturnValue({
    mutateAsync: sendText,
    isPending: false,
    isError: false,
    reset: resetText,
  } as unknown as ReturnType<typeof useSendMessage>);
  vi.mocked(useSendMediaMessage).mockReturnValue({
    mutateAsync: sendMedia,
    isPending: false,
    isError: false,
    reset: resetMedia,
  } as unknown as ReturnType<typeof useSendMediaMessage>);
  vi.mocked(useUploadAttachments).mockReturnValue({
    mutateAsync: uploadFiles,
    isPending: uploadPending,
    isError: uploadError !== undefined,
    error: uploadError,
    reset: resetUpload,
  } as unknown as ReturnType<typeof useUploadAttachments>);
}

function renderComposer() {
  const onTypingChange = vi.fn();
  const onStopTyping = vi.fn();
  const view = render(
    <MessageComposer
      conversationId="conversation-1"
      onTypingChange={onTypingChange}
      onStopTyping={onStopTyping}
    />,
  );
  return { ...view, onStopTyping, onTypingChange };
}

describe("MessageComposer attachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutations();
    sendText.mockResolvedValue({});
    sendMedia.mockResolvedValue({});
    uploadFiles.mockResolvedValue([
      { id: "attachment-1" },
      { id: "attachment-2" },
    ]);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi
        .fn()
        .mockReturnValueOnce("blob:image-preview")
        .mockReturnValueOnce("blob:pdf-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "11111111-1111-4111-8111-111111111111",
    );
    vi.spyOn(window, "open").mockReturnValue({
      opener: window,
    } as unknown as Window);
  });

  it("shows image and PDF previews and allows removing a selected file", async () => {
    renderComposer();
    const image = new File(["image"], "photo.png", { type: "image/png" });
    const pdf = new File(["pdf"], "report.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(screen.getByLabelText("Dosya seç"), {
      target: { files: [image, pdf] },
    });

    expect(screen.getByAltText("photo.png önizlemesi")).toHaveAttribute(
      "src",
      "blob:image-preview",
    );
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Açıklama ekle…")).toBeInTheDocument();

    await userEvent.setup().click(
      screen.getByRole("button", {
        name: "report.pdf dosyasını görüntüle",
      }),
    );
    expect(window.open).toHaveBeenCalledWith("blob:pdf-preview", "_blank");

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "report.pdf dosyasını kaldır" }));

    expect(screen.queryByText("report.pdf")).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:pdf-preview");
  });

  it("shows an error when the selected PDF preview window is blocked", () => {
    vi.mocked(window.open).mockReturnValueOnce(null);
    renderComposer();
    const pdf = new File(["pdf"], "report.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(screen.getByLabelText("Dosya seç"), {
      target: { files: [pdf] },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "report.pdf dosyasını görüntüle",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Tarayıcının açılır pencere iznini kontrol et.",
    );
  });

  it("uploads selected files and sends a MEDIA message with its caption", async () => {
    const { onStopTyping } = renderComposer();
    const image = new File(["image"], "photo.png", { type: "image/png" });
    const pdf = new File(["pdf"], "report.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(screen.getByLabelText("Dosya seç"), {
      target: { files: [image, pdf] },
    });
    await userEvent.setup().type(
      screen.getByRole("textbox", { name: "Açıklama" }),
      "  Tatil dosyaları  ",
    );

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Medya mesajı gönder" }));

    await waitFor(() => {
      expect(uploadFiles).toHaveBeenCalledWith([image, pdf]);
      expect(sendMedia).toHaveBeenCalledWith({
        attachmentIds: ["attachment-1", "attachment-2"],
        clientMessageId: "11111111-1111-4111-8111-111111111111",
        text: "  Tatil dosyaları  ",
      });
    });
    expect(onStopTyping).toHaveBeenCalledOnce();
    expect(screen.queryByText("report.pdf")).not.toBeInTheDocument();
  });

  it("shows upload progress and a user-friendly upload error", () => {
    mockMutations({ uploadPending: true });
    const view = renderComposer();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Dosyalar yükleniyor…",
    );
    expect(screen.getByRole("button", { name: "Dosya ekle" })).toBeDisabled();

    mockMutations({
      uploadError: new AttachmentClientError(
        "ATTACHMENT_STORAGE_UPLOAD_FAILED",
        "Dosya depolama servisine yüklenemedi.",
      ),
    });
    view.rerender(
      <MessageComposer
        conversationId="conversation-1"
        onTypingChange={vi.fn()}
        onStopTyping={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Dosya depolama servisine yüklenemedi.",
    );
  });

  it("rejects unsupported files before upload", () => {
    renderComposer();
    const textFile = new File(["plain"], "notes.txt", {
      type: "text/plain",
    });

    fireEvent.change(screen.getByLabelText("Dosya seç"), {
      target: { files: [textFile] },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Yalnızca JPEG, PNG, WebP veya PDF dosyaları yüklenebilir.",
    );
    expect(uploadFiles).not.toHaveBeenCalled();
  });

  it("supports keyboard selection and sending", async () => {
    const user = userEvent.setup();
    renderComposer();
    await user.tab();
    expect(screen.getByRole("button", { name: "Dosya ekle" })).toHaveFocus();

    await user.tab();
    const textarea = screen.getByRole("textbox", { name: "Mesaj" });
    expect(textarea).toHaveFocus();
    await user.type(textarea, "Klavye mesajı{Enter}");

    await waitFor(() => {
      expect(sendText).toHaveBeenCalledWith({ text: "Klavye mesajı" });
    });
  });
});
