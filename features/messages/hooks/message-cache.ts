import type { InfiniteData } from "@tanstack/react-query";

import type { MessageDto, MessageHistoryPage } from "../types";

export type MessageHistoryData = InfiniteData<
  MessageHistoryPage,
  unknown
>;

export function flattenMessageHistory(
  data: MessageHistoryData | undefined,
): MessageDto[] {
  const unique = new Map<string, MessageDto>();
  const clientIds = new Set<string>();

  for (const page of [...(data?.pages ?? [])].reverse()) {
    for (const message of page.items) {
      if (unique.has(message.id) || clientIds.has(message.clientMessageId)) {
        continue;
      }
      unique.set(message.id, message);
      clientIds.add(message.clientMessageId);
    }
  }

  return [...unique.values()];
}

export function upsertMessageInHistory(
  data: MessageHistoryData | undefined,
  message: MessageDto,
): MessageHistoryData {
  if (data === undefined || data.pages.length === 0) {
    return {
      pages: [{ items: [message], nextCursor: null }],
      pageParams: [null],
    };
  }

  const pages = data.pages.map((page) => ({
    ...page,
    items: page.items.filter(
      (item) =>
        item.id !== message.id &&
        item.clientMessageId !== message.clientMessageId,
    ),
  }));
  const newestPage = pages[0];

  if (newestPage === undefined) {
    return data;
  }

  newestPage.items = [...newestPage.items, message].sort(compareMessages);
  return { ...data, pages };
}

function compareMessages(left: MessageDto, right: MessageDto): number {
  const dateOrder = left.createdAt.localeCompare(right.createdAt);
  return dateOrder === 0 ? left.id.localeCompare(right.id) : dateOrder;
}
