"use client";

import { useMutation } from "@tanstack/react-query";

import type { AccessMessageAttachmentPath } from "../../../lib/api/types";
import { useAuth } from "../../../providers/auth-provider";
import {
  accessMessageAttachmentThroughWebProxy,
  uploadMessageAttachment,
  uploadMessageAttachments,
} from "../api/message-attachments-api";

export interface AttachmentAccessInput {
  attachmentId: AccessMessageAttachmentPath["attachmentId"];
  variant: AccessMessageAttachmentPath["variant"];
}

export function useUploadAttachment(conversationId: string) {
  const { apiClient } = useAuth();

  return useMutation({
    mutationFn: (file: File) =>
      uploadMessageAttachment(apiClient, conversationId, file),
    retry: false,
  });
}

export function useUploadAttachments(conversationId: string) {
  const { apiClient } = useAuth();

  return useMutation({
    mutationFn: (files: readonly File[]) =>
      uploadMessageAttachments(apiClient, conversationId, files),
    retry: false,
  });
}

export function useAttachmentAccess(conversationId: string) {
  const { apiClient } = useAuth();

  return useMutation({
    mutationFn: ({ attachmentId, variant }: AttachmentAccessInput) =>
      accessMessageAttachmentThroughWebProxy(
        apiClient,
        conversationId,
        attachmentId,
        variant,
      ),
    retry: false,
  });
}
