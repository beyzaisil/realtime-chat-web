"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { useAuth } from "../../../providers/auth-provider";
import { UserAvatar } from "../../users/components/user-avatar";
import { AccountSecurity } from "../../security/components/account-security";
import { getProfileErrorMessage } from "../api/profile-error";
import { validateAvatarFile } from "../api/profile-api";
import {
  useDeleteAvatar,
  useUpdateProfile,
  useUploadAvatar,
  type AvatarUploadStage,
} from "../hooks/use-profile-mutations";

const UPLOAD_STAGE_LABELS: Record<AvatarUploadStage, string> = {
  preparing: "Yükleme hazırlanıyor…",
  uploading: "Görsel yükleniyor…",
  processing: "Avatar işleniyor…",
};

export function ProfileDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose(): void;
}) {
  const { user } = useAuth();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarFeedback, setAvatarFeedback] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadStage, setUploadStage] = useState<AvatarUploadStage | null>(null);
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const isAvatarPending = uploadAvatar.isPending || deleteAvatar.isPending;

  useEffect(() => {
    if (!open || user === null) {
      return;
    }

    setUsername(user.username);
    setDisplayName(user.displayName);
    setProfileFeedback(null);
    setProfileError(null);
    setSelectedFile(null);
    setAvatarFeedback(null);
    setAvatarError(null);
    setUploadStage(null);
    updateProfile.reset();
    uploadAvatar.reset();
    deleteAvatar.reset();
    window.setTimeout(() => firstInputRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && !updateProfile.isPending && !isAvatarPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // Mutation state is intentionally reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  if (!open || user === null) {
    return null;
  }

  const handleProfileSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setProfileFeedback(null);
    setProfileError(null);
    const trimmedUsername = username.trim();
    const trimmedDisplayName = displayName.trim();

    if (trimmedUsername.length < 1 || trimmedUsername.length > 32) {
      setProfileError("Kullanıcı adı 1–32 karakter arasında olmalı.");
      return;
    }
    if (trimmedDisplayName.length < 1 || trimmedDisplayName.length > 80) {
      setProfileError("Görünen ad 1–80 karakter arasında olmalı.");
      return;
    }

    const input = {
      ...(trimmedUsername === user.username
        ? {}
        : { username: trimmedUsername }),
      ...(trimmedDisplayName === user.displayName
        ? {}
        : { displayName: trimmedDisplayName }),
    };

    if (Object.keys(input).length === 0) {
      setProfileError("Kaydetmek için en az bir bilgiyi değiştir.");
      return;
    }

    try {
      const response = await updateProfile.mutateAsync(input);
      setUsername(response.user.username);
      setDisplayName(response.user.displayName);
      setProfileFeedback("Profil bilgilerin güncellendi.");
    } catch (error) {
      setProfileError(getProfileErrorMessage(error));
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] ?? null;
    setAvatarFeedback(null);
    setAvatarError(null);
    setUploadStage(null);

    if (file === null) {
      setSelectedFile(null);
      return;
    }

    try {
      validateAvatarFile(file);
      setSelectedFile(file);
    } catch (error) {
      setSelectedFile(null);
      setAvatarError(getProfileErrorMessage(error));
      event.target.value = "";
    }
  };

  const handleAvatarUpload = async (): Promise<void> => {
    if (selectedFile === null) {
      setAvatarError("Önce bir görsel seç.");
      return;
    }

    setAvatarFeedback(null);
    setAvatarError(null);
    try {
      await uploadAvatar.mutateAsync({
        file: selectedFile,
        onStageChange: setUploadStage,
      });
      setSelectedFile(null);
      setUploadStage(null);
      if (fileInputRef.current !== null) {
        fileInputRef.current.value = "";
      }
      setAvatarFeedback("Avatarın güncellendi.");
    } catch (error) {
      setUploadStage(null);
      setAvatarError(getProfileErrorMessage(error));
    }
  };

  const handleAvatarDelete = async (): Promise<void> => {
    setAvatarFeedback(null);
    setAvatarError(null);
    try {
      await deleteAvatar.mutateAsync();
      setSelectedFile(null);
      if (fileInputRef.current !== null) {
        fileInputRef.current.value = "";
      }
      setAvatarFeedback("Avatarın kaldırıldı.");
    } catch (error) {
      setAvatarError(getProfileErrorMessage(error));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !updateProfile.isPending &&
          !isAvatarPending
        ) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-dialog-title"
        className="max-h-[min(760px,92vh)] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
              Hesabım
            </p>
            <h2 id="profile-dialog-title" className="mt-1 text-xl font-bold text-slate-950">
              Profil
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={updateProfile.isPending || isAvatarPending}
            aria-label="Profili kapat"
            className="grid size-9 place-items-center rounded-full text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            ×
          </button>
        </header>

        <div className="space-y-7 p-5 sm:p-6">
          <section aria-labelledby="avatar-heading" className="space-y-4">
            <div className="flex items-center gap-4">
              <UserAvatar user={user} size="lg" />
              <div className="min-w-0">
                <h3 id="avatar-heading" className="font-bold text-slate-900">
                  Profil fotoğrafı
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  JPEG, PNG veya WebP · en fazla 5 MiB
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={isAvatarPending}
              aria-label="Avatar görseli seç"
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:font-semibold file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-60"
            />

            {selectedFile !== null ? (
              <p className="truncate text-sm text-slate-600">
                Seçilen dosya: <strong>{selectedFile.name}</strong>
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleAvatarUpload()}
                disabled={selectedFile === null || isAvatarPending}
                className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {uploadStage === null
                  ? "Avatarı yükle"
                  : UPLOAD_STAGE_LABELS[uploadStage]}
              </button>
              {user.avatarUrl !== null ? (
                <button
                  type="button"
                  onClick={() => void handleAvatarDelete()}
                  disabled={isAvatarPending}
                  className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-55"
                >
                  {deleteAvatar.isPending ? "Kaldırılıyor…" : "Avatarı kaldır"}
                </button>
              ) : null}
            </div>

            {avatarError !== null ? (
              <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {avatarError}
              </p>
            ) : null}
            {avatarFeedback !== null ? (
              <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {avatarFeedback}
              </p>
            ) : null}
          </section>

          <div className="h-px bg-slate-100" />

          <form onSubmit={(event) => void handleProfileSubmit(event)} className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900">Profil bilgileri</h3>
              <p className="mt-1 text-sm text-slate-500">
                İnsanların seni nasıl göreceğini güncelle.
              </p>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Kullanıcı adı
              <input
                ref={firstInputRef}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                maxLength={32}
                disabled={updateProfile.isPending}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Görünen ad
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={80}
                disabled={updateProfile.isPending}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
              />
            </label>

            {profileError !== null ? (
              <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {profileError}
              </p>
            ) : null}
            {profileFeedback !== null ? (
              <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {profileFeedback}
              </p>
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
              >
                {updateProfile.isPending ? "Kaydediliyor…" : "Profili kaydet"}
              </button>
            </div>
          </form>

          <div className="h-px bg-slate-100" />

          <AccountSecurity />
        </div>
      </section>
    </div>
  );
}
