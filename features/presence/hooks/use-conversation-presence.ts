"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  PresenceState,
  PresenceUpdatedPayload,
} from "../../../lib/socket/socket-events";
import { useSocket } from "../../../providers/socket-provider";

const PRESENCE_BATCH_SIZE = 100;

export type PresenceByUserId = Record<string, PresenceState>;

export function useConversationPresence(
  userIds: readonly string[],
): PresenceByUserId {
  const { socket, isConnected } = useSocket();
  const [presence, setPresence] = useState<PresenceByUserId>({});
  const userIdsKey = useMemo(
    () => [...new Set(userIds)].sort().join("\u0000"),
    [userIds],
  );
  const uniqueUserIds = useMemo(
    () => (userIdsKey.length === 0 ? [] : userIdsKey.split("\u0000")),
    [userIdsKey],
  );

  useEffect(() => {
    const handlePresenceUpdated = (
      update: PresenceUpdatedPayload,
    ): void => {
      setPresence((current) => ({
        ...current,
        [update.userId]: {
          status: update.status,
          lastSeenAt: update.lastSeenAt,
        },
      }));
    };

    socket.on("presence:updated", handlePresenceUpdated);
    return () => {
      socket.off("presence:updated", handlePresenceUpdated);
    };
  }, [socket]);

  useEffect(() => {
    if (!isConnected || uniqueUserIds.length === 0) {
      return;
    }

    let active = true;

    for (
      let offset = 0;
      offset < uniqueUserIds.length;
      offset += PRESENCE_BATCH_SIZE
    ) {
      const batch = uniqueUserIds.slice(
        offset,
        offset + PRESENCE_BATCH_SIZE,
      );
      socket.emit("presence:subscribe", { userIds: batch }, (response) => {
        if (!active || !response.ok) {
          return;
        }
        setPresence((current) => ({ ...current, ...response.data }));
      });
    }

    return () => {
      active = false;
    };
  }, [isConnected, socket, uniqueUserIds]);

  return presence;
}
