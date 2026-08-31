import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "../../../lib/http/api-error";
import { useDeleteMessage } from "../hooks/use-delete-message";
import { useUpdateMessage } from "../hooks/use-update-message";
import type { MessageDto } from "../types";
import { MessageActions } from "./message-actions";

vi.mock("../hooks/use-delete-message");
vi.mock("../hooks/use-update-message");

const message: MessageDto = {
  id: "message-1",
  conversationId: "conversation-1",
  senderId: "user-1",
  clientMessageId: "client-1",
  kind: "TEXT",
  body: "Mevcut mesaj",
  createdAt: "2030-01-01T10:00:00.000Z",
  editedAt: null,
  deletedAt: null,
};

const updateMutateAsync = vi.fn();
const deleteMutateAsync = vi.fn();

function mockMutations({
  updatePending = false,
  deletePending = false,
}: {
  updatePending?: boolean;
  deletePending?: boolean;
} = {}): void {
  vi.mocked(useUpdateMessage).mockReturnValue({
    mutateAsync: updateMutateAsync,
    isPending: updatePending,
  } as unknown as ReturnType<typeof useUpdateMessage>);
  vi.mocked(useDeleteMessage).mockReturnValue({
    mutateAsync: deleteMutateAsync,
    isPending: deletePending,
  } as unknown as ReturnType<typeof useDeleteMessage>);
}

async function openMenu() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Mesaj işlemleri" }));
  return user;
}

async function openEditForm() {
  const user = await openMenu();
  await user.click(screen.getByRole("menuitem", { name: "Düzenle" }));
  return user;
}

describe("MessageActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMutateAsync.mockResolvedValue({
      ...message,
      body: "Güncellenmiş mesaj",
      editedAt: "2030-01-01T10:05:00.000Z",
    });
    deleteMutateAsync.mockResolvedValue({
      ...message,
      body: null,
      deletedAt: "2030-01-01T10:06:00.000Z",
    });
    mockMutations();
  });

  it("shows edit and delete actions only for the message owner", async () => {
    render(<MessageActions message={message} currentUserId="user-1" />);

    const trigger = screen.getByRole("button", { name: "Mesaj işlemleri" });
    expect(trigger.querySelector("svg")).toBeInTheDocument();
    expect(trigger).toHaveClass(
      "border-0",
      "bg-transparent",
      "shadow-none",
      "md:opacity-0",
      "md:group-hover:opacity-100",
    );
    await openMenu();

    expect(screen.getByRole("menu")).toHaveAttribute(
      "data-placement",
      "bottom",
    );
    expect(screen.getByRole("menuitem", { name: "Düzenle" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Sil" })).toBeVisible();
  });

  it("does not show actions for another user's message", () => {
    render(<MessageActions message={message} currentUserId="user-2" />);

    expect(
      screen.queryByRole("button", { name: "Mesaj işlemleri" }),
    ).not.toBeInTheDocument();
  });

  it("does not show actions for a deleted message", () => {
    render(
      <MessageActions
        message={{
          ...message,
          body: null,
          deletedAt: "2030-01-01T10:06:00.000Z",
        }}
        currentUserId="user-1"
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Mesaj işlemleri" }),
    ).not.toBeInTheDocument();
  });

  it("opens the edit form with the current body and cancels it", async () => {
    render(<MessageActions message={message} currentUserId="user-1" />);

    const user = await openEditForm();
    const textarea = screen.getByRole("textbox", { name: "Mesaj metni" });

    expect(textarea).toHaveValue("Mevcut mesaj");
    expect(textarea).toHaveFocus();
    expect(
      screen.queryByText("Değişiklik karşı tarafa anında yansır."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Mesajı düzenle" })).not.toHaveClass(
      "shadow-xl",
    );
    await user.click(screen.getByRole("button", { name: "Vazgeç" }));
    expect(updateMutateAsync).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("form", { name: "Mesajı düzenle" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mesaj işlemleri" })).toHaveFocus();
  });

  it("submits the trimmed edited message", async () => {
    render(<MessageActions message={message} currentUserId="user-1" />);
    const user = await openEditForm();
    const textarea = screen.getByRole("textbox", { name: "Mesaj metni" });

    await user.clear(textarea);
    await user.type(textarea, "  Güncellenmiş mesaj  ");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(updateMutateAsync).toHaveBeenCalledOnce();
    expect(updateMutateAsync).toHaveBeenCalledWith({
      messageId: "message-1",
      text: "Güncellenmiş mesaj",
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Mesaj işlemleri" }),
      ).toHaveFocus(),
    );
  });

  it("rejects empty and overlong edit content", async () => {
    render(<MessageActions message={message} currentUserId="user-1" />);
    const user = await openEditForm();
    const textarea = screen.getByRole("textbox", { name: "Mesaj metni" });
    const saveButton = screen.getByRole("button", { name: "Kaydet" });

    await user.clear(textarea);
    expect(screen.getByText("Mesaj boş olamaz.")).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    fireEvent.change(textarea, { target: { value: "x".repeat(4_001) } });
    expect(
      screen.getByText("Mesaj en fazla 4000 karakter olabilir."),
    ).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
    expect(updateMutateAsync).not.toHaveBeenCalled();
  });

  it("requires explicit confirmation before deleting", async () => {
    render(<MessageActions message={message} currentUserId="user-1" />);
    const user = await openMenu();

    await user.click(screen.getByRole("menuitem", { name: "Sil" }));
    expect(
      screen.queryByRole("toolbar", { name: "Mesaj seçimi" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Mesajı sil?");
    expect(deleteMutateAsync).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Sil" }));
    expect(deleteMutateAsync).toHaveBeenCalledOnce();
    expect(deleteMutateAsync).toHaveBeenCalledWith({ messageId: "message-1" });
    await waitFor(() =>
      expect(
        screen.queryByRole("alertdialog"),
      ).not.toBeInTheDocument(),
    );
  });

  it("closes the in-place delete confirmation when cancelled", async () => {
    render(<MessageActions message={message} currentUserId="user-1" />);
    const user = await openMenu();

    await user.click(screen.getByRole("menuitem", { name: "Sil" }));
    const confirmation = screen.getByRole("alertdialog");
    expect(confirmation).toHaveAttribute("data-placement");
    await user.click(screen.getByRole("button", { name: "Vazgeç" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(deleteMutateAsync).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Mesaj işlemleri" })).toHaveFocus();
  });

  it("disables controls while an update is pending", async () => {
    mockMutations({ updatePending: true });
    render(<MessageActions message={message} currentUserId="user-1" />);

    await openEditForm();

    expect(screen.getByRole("textbox", { name: "Mesaj metni" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Kaydediliyor…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Vazgeç" })).toBeDisabled();
  });

  it("disables confirmation controls while a delete is pending", async () => {
    const view = render(
      <MessageActions message={message} currentUserId="user-1" />,
    );
    const user = await openMenu();

    await user.click(screen.getByRole("menuitem", { name: "Sil" }));
    mockMutations({ deletePending: true });
    view.rerender(<MessageActions message={message} currentUserId="user-1" />);

    expect(screen.getByRole("button", { name: "Siliniyor…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Vazgeç" })).toBeDisabled();
    expect(deleteMutateAsync).not.toHaveBeenCalled();
  });

  it("shows a user-friendly API error message", async () => {
    updateMutateAsync.mockRejectedValue(
      new ApiClientError({
        status: 404,
        code: "MESSAGE_NOT_FOUND",
        message: "Message not found",
      }),
    );
    render(<MessageActions message={message} currentUserId="user-1" />);
    const user = await openEditForm();

    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Mesaj bulunamadı veya artık değiştirilemiyor.");
  });

  it("supports keyboard menu opening, Escape cleanup and focus return", async () => {
    const user = userEvent.setup();
    render(<MessageActions message={message} currentUserId="user-1" />);

    await user.tab();
    const menuButton = screen.getByRole("button", { name: "Mesaj işlemleri" });
    expect(menuButton).toHaveFocus();
    await user.keyboard("{Enter}");
    const editAction = screen.getByRole("menuitem", { name: "Düzenle" });
    await waitFor(() => expect(editAction).toHaveFocus());

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(menuButton).toHaveFocus();
  });

  it("flips the menu above and keeps it inside a narrow mobile viewport", async () => {
    const heightSpy = vi
      .spyOn(window, "innerHeight", "get")
      .mockReturnValue(568);
    const widthSpy = vi
      .spyOn(window, "innerWidth", "get")
      .mockReturnValue(320);
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function getRect(this: HTMLElement) {
        if (this.getAttribute("aria-label") === "Mesaj işlemleri") {
          return createRect({
            bottom: 548,
            height: 28,
            left: 290,
            right: 318,
            top: 520,
            width: 28,
          });
        }

        if (this.getAttribute("role") === "menu") {
          return createRect({
            bottom: 104,
            height: 104,
            left: 0,
            right: 160,
            top: 0,
            width: 160,
          });
        }

        return createRect({});
      });

    try {
      render(<MessageActions message={message} currentUserId="user-1" />);
      await openMenu();
      const menu = screen.getByRole("menu");

      await waitFor(() =>
        expect(menu).toHaveAttribute("data-placement", "top"),
      );
      expect(menu).toHaveStyle({ left: "152px", top: "410px" });
    } finally {
      rectSpy.mockRestore();
      widthSpy.mockRestore();
      heightSpy.mockRestore();
    }
  });
});

function createRect({
  bottom = 0,
  height = 0,
  left = 0,
  right = 0,
  top = 0,
  width = 0,
}: Partial<DOMRect>): DOMRect {
  return {
    bottom,
    height,
    left,
    right,
    top,
    width,
    x: left,
    y: top,
    toJSON: () => ({}),
  };
}
