import { describe, expect, expectTypeOf, it } from "vitest";

import {
  isMediaMessage,
  isTextMessage,
  type MediaMessageDto,
  type MessageDto,
  type TextMessageDto,
} from "./types";

const baseMessage = {
  id: "message-1",
  conversationId: "conversation-1",
  senderId: "user-1",
  clientMessageId: "client-1",
  createdAt: "2030-01-01T10:00:00.000Z",
  editedAt: null,
  deletedAt: null,
};

describe("message discriminated union", () => {
  it("narrows TEXT and MEDIA messages using the kind discriminant", () => {
    const textMessage: MessageDto = {
      ...baseMessage,
      kind: "TEXT",
      body: "Merhaba",
    };
    const mediaMessage: MessageDto = {
      ...baseMessage,
      id: "message-2",
      clientMessageId: "client-2",
      kind: "MEDIA",
      body: null,
      attachments: [
        {
          id: "attachment-1",
          kind: "PDF",
          originalFileName: "document.pdf",
          contentType: "application/pdf",
          url: "/attachments/attachment-1/original",
        },
      ],
    };

    expect(isTextMessage(textMessage)).toBe(true);
    expect(isMediaMessage(textMessage)).toBe(false);
    expect(isMediaMessage(mediaMessage)).toBe(true);

    if (isTextMessage(textMessage)) {
      expectTypeOf(textMessage).toMatchTypeOf<TextMessageDto>();
      expect("attachments" in textMessage).toBe(false);
    }

    if (isMediaMessage(mediaMessage)) {
      expectTypeOf(mediaMessage).toMatchTypeOf<MediaMessageDto>();
      expect(mediaMessage.attachments[0]?.kind).toBe("PDF");
    }
  });
});
