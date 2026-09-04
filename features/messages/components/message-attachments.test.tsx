import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAttachmentAccess } from "../hooks/use-message-attachments";
import type { MessageAttachmentDto } from "../types";
import { MessageAttachments } from "./message-attachments";

vi.mock("../hooks/use-message-attachments");

const image: Extract<MessageAttachmentDto, { kind: "IMAGE" }> = {
  id: "attachment-image",
  kind: "IMAGE",
  originalFileName: "holiday.webp",
  contentType: "image/webp",
  width: 1280,
  height: 720,
  url: "/attachments/attachment-image/original",
  thumbnailUrl: "/attachments/attachment-image/thumbnail",
};

const pdf: Extract<MessageAttachmentDto, { kind: "PDF" }> = {
  id: "attachment-pdf",
  kind: "PDF",
  originalFileName: "report.pdf",
  contentType: "application/pdf",
  url: "/attachments/attachment-pdf/original",
};

const access = vi.fn();
const anchorClick = vi.fn();
const previewReplace = vi.fn();
const previewClose = vi.fn();

describe("MessageAttachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi
        .fn()
        .mockReturnValueOnce("blob:thumbnail")
        .mockReturnValueOnce("blob:original"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      anchorClick,
    );
    vi.spyOn(window, "open").mockReturnValue({
      close: previewClose,
      document: { title: "" },
      location: { replace: previewReplace },
      opener: window,
    } as unknown as Window);
    access.mockImplementation(
      ({ variant }: { variant: "original" | "thumbnail" }) =>
        Promise.resolve(
          new Response(new Blob([variant], { type: "application/octet-stream" })),
        ),
    );
    vi.mocked(useAttachmentAccess).mockReturnValue({
      mutateAsync: access,
      isPending: false,
    } as unknown as ReturnType<typeof useAttachmentAccess>);
  });

  it("loads and renders an IMAGE thumbnail, then opens the original", async () => {
    render(
      <MessageAttachments
        attachments={[image]}
        conversationId="conversation-1"
        isOwn={false}
      />,
    );

    expect(screen.getByText("Görsel yükleniyor…")).toBeInTheDocument();
    expect(
      await screen.findByRole("img", { name: "holiday.webp" }),
    ).toHaveAttribute("src", "blob:thumbnail");
    expect(access).toHaveBeenCalledWith({
      attachmentId: "attachment-image",
      variant: "thumbnail",
    });

    fireEvent.click(
      screen.getByRole("button", { name: "holiday.webp görselini aç" }),
    );

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith("", "_blank");
      expect(access).toHaveBeenCalledWith({
        attachmentId: "attachment-image",
        variant: "original",
      });
      expect(previewReplace).toHaveBeenCalledWith("blob:original");
    });
  });

  it("renders a PDF card, opens it for viewing and downloads it", async () => {
    render(
      <MessageAttachments
        attachments={[pdf]}
        conversationId="conversation-1"
        isOwn
      />,
    );

    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    expect(screen.getByText("PDF dosyası")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "report.pdf dosyasını görüntüle" }),
    );

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith("", "_blank");
      expect(access).toHaveBeenCalledWith({
        attachmentId: "attachment-pdf",
        variant: "original",
      });
      expect(previewReplace).toHaveBeenCalledWith("blob:thumbnail");
    });

    fireEvent.click(
      screen.getByRole("button", { name: "report.pdf dosyasını indir" }),
    );

    await waitFor(() => {
      expect(access).toHaveBeenCalledWith({
        attachmentId: "attachment-pdf",
        variant: "original",
      });
      expect(anchorClick).toHaveBeenCalledOnce();
    });
  });

  it("reports when the browser blocks the PDF preview window", () => {
    vi.mocked(window.open).mockReturnValueOnce(null);
    render(
      <MessageAttachments
        attachments={[pdf]}
        conversationId="conversation-1"
        isOwn={false}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "report.pdf dosyasını görüntüle" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Tarayıcının açılır pencere iznini kontrol et.",
    );
    expect(access).not.toHaveBeenCalled();
  });

  it("shows an understandable access error", async () => {
    access.mockRejectedValueOnce(new Error("network"));
    render(
      <MessageAttachments
        attachments={[image]}
        conversationId="conversation-1"
        isOwn={false}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Dosya işlemi tamamlanamadı. Lütfen tekrar dene.",
    );
  });
});
