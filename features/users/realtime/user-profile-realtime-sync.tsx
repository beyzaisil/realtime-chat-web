"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import type { UserUpdatedEventDto } from "../../../lib/socket/socket-events";
import { useAuth } from "../../../providers/auth-provider";
import { useSocket } from "../../../providers/socket-provider";
import {
  hasPublicUserProfileChanged,
  updateUserProfileCaches,
} from "./user-profile-cache";

export function UserProfileRealtimeSync() {
  const queryClient = useQueryClient();
  const { user: currentUser, setCurrentUser } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    const handleUserUpdated = ({
      user: updatedUser,
    }: {
      user: UserUpdatedEventDto;
    }): void => {
      updateUserProfileCaches(queryClient, updatedUser);

      if (
        currentUser !== null &&
        hasPublicUserProfileChanged(currentUser, updatedUser)
      ) {
        setCurrentUser({ ...currentUser, ...updatedUser });
      }
    };

    socket.on("user:updated", handleUserUpdated);
    return () => {
      socket.off("user:updated", handleUserUpdated);
    };
  }, [currentUser, queryClient, setCurrentUser, socket]);

  return null;
}
