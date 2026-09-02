"use client";

import { useMutation } from "@tanstack/react-query";

import type { UpdateCurrentUserOperationRequest } from "../../../lib/api/types";
import { useAuth } from "../../../providers/auth-provider";
import {
  completeAvatarUpload,
  createAvatarUpload,
  deleteCurrentUserAvatar,
  updateCurrentUser,
  uploadAvatarFile,
  validateAvatarFile,
} from "../api/profile-api";

export type AvatarUploadStage = "preparing" | "uploading" | "processing";

export interface UploadAvatarInput {
  file: File;
  onStageChange?(stage: AvatarUploadStage): void;
}

export function useUpdateProfile() {
  const { apiClient, setCurrentUser } = useAuth();

  return useMutation({
    mutationFn: (input: UpdateCurrentUserOperationRequest) =>
      updateCurrentUser(apiClient, input),
    onSuccess: ({ user }) => {
      setCurrentUser(user);
    },
  });
}

export function useUploadAvatar() {
  const { apiClient, setCurrentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ file, onStageChange }: UploadAvatarInput) => {
      onStageChange?.("preparing");
      const validated = validateAvatarFile(file);
      const intent = await createAvatarUpload(apiClient, {
        contentType: validated.contentType,
        contentLength: validated.contentLength,
      });

      onStageChange?.("uploading");
      await uploadAvatarFile(intent.upload, validated.file);

      onStageChange?.("processing");
      return completeAvatarUpload(apiClient, intent.uploadId);
    },
    onSuccess: ({ user }) => {
      setCurrentUser(user);
    },
  });
}

export function useDeleteAvatar() {
  const { apiClient, setCurrentUser } = useAuth();

  return useMutation({
    mutationFn: () => deleteCurrentUserAvatar(apiClient),
    onSuccess: ({ user }) => {
      setCurrentUser(user);
    },
  });
}
