"use client";

import { useMemo, useState, type FormEvent } from "react";

import type { AuthSession } from "../../../lib/api/types";
import {
  getSecurityErrorMessage,
  SecurityClientError,
  validatePasswordChange,
} from "../api/security-error";
import {
  useActiveSessions,
  useChangePassword,
  useRevokeOtherSessions,
  useRevokeSession,
} from "../hooks/use-security";

type Confirmation =
  | { kind: "password" }
  | { kind: "other-sessions" }
  | { kind: "session"; session: AuthSession }
  | null;

export function AccountSecurity() {
  const sessionsQuery = useActiveSessions();
  const changePassword = useChangePassword();
  const revokeOtherSessions = useRevokeOtherSessions();
  const revokeSession = useRevokeSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionFeedback, setSessionFeedback] = useState<string | null>(null);
  const sessions = sessionsQuery.data?.items ?? [];
  const otherSessionCount = useMemo(
    () => sessions.filter((session) => !session.isCurrent).length,
    [sessions],
  );
  const isSessionMutationPending =
    revokeOtherSessions.isPending || revokeSession.isPending;

  const requestPasswordConfirmation = (
    event: FormEvent<HTMLFormElement>,
  ): void => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordFeedback(null);

    try {
      validatePasswordChange({ currentPassword, newPassword });
      if (newPassword !== confirmPassword) {
        throw new SecurityClientError(
          "PASSWORD_CONFIRMATION_MISMATCH",
          "Yeni parola ve tekrarı aynı olmalı.",
        );
      }
      setConfirmation({ kind: "password" });
    } catch (error) {
      setPasswordError(getSecurityErrorMessage(error));
    }
  };

  const confirmPasswordChange = async (): Promise<void> => {
    setPasswordError(null);
    setPasswordFeedback(null);
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setConfirmation(null);
      setPasswordFeedback(
        "Parolan değiştirildi. Mevcut oturumun açık kaldı; diğer tüm oturumlar sonlandırıldı.",
      );
    } catch (error) {
      setConfirmation(null);
      setPasswordError(getSecurityErrorMessage(error));
    }
  };

  const confirmSessionAction = async (): Promise<void> => {
    const pendingConfirmation = confirmation;
    if (pendingConfirmation === null || pendingConfirmation.kind === "password") {
      return;
    }

    setSessionError(null);
    setSessionFeedback(null);
    try {
      if (pendingConfirmation.kind === "other-sessions") {
        await revokeOtherSessions.mutateAsync();
        setSessionFeedback("Diğer tüm oturumlar sonlandırıldı.");
      } else {
        await revokeSession.mutateAsync(pendingConfirmation.session);
        if (!pendingConfirmation.session.isCurrent) {
          setSessionFeedback("Seçilen oturum sonlandırıldı.");
        }
      }
      setConfirmation(null);
    } catch (error) {
      setConfirmation(null);
      setSessionError(getSecurityErrorMessage(error));
    }
  };

  return (
    <section aria-labelledby="security-heading" className="space-y-6">
      <div>
        <h3 id="security-heading" className="font-bold text-slate-900">
          Güvenlik
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Parolanı ve hesabının açık olduğu cihazları yönet.
        </p>
      </div>

      <form onSubmit={requestPasswordConfirmation} className="space-y-3">
        <h4 className="text-sm font-bold text-slate-800">Parola değiştir</h4>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Mevcut parola
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            maxLength={128}
            disabled={changePassword.isPending}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Yeni parola
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={12}
            maxLength={128}
            disabled={changePassword.isPending}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Yeni parola tekrar
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={12}
            maxLength={128}
            disabled={changePassword.isPending}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
          />
        </label>
        <p className="text-xs text-slate-500">
          Yeni parola 12–128 karakter arasında ve mevcut paroladan farklı olmalı.
        </p>

        {confirmation?.kind === "password" ? (
          <ConfirmationBox
            title="Parola değiştirilsin mi?"
            description="Mevcut cihazın açık kalacak, diğer tüm oturumların bağlantısı kesilecek."
            confirmLabel="Parolayı değiştir"
            pending={changePassword.isPending}
            onCancel={() => setConfirmation(null)}
            onConfirm={() => void confirmPasswordChange()}
          />
        ) : (
          <button
            type="submit"
            disabled={changePassword.isPending}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
          >
            Devam et
          </button>
        )}

        {passwordError !== null ? (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {passwordError}
          </p>
        ) : null}
        {passwordFeedback !== null ? (
          <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {passwordFeedback}
          </p>
        ) : null}
      </form>

      <div className="h-px bg-slate-100" />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Aktif oturumlar</h4>
            <p className="mt-1 text-xs text-slate-500">
              Tanımadığın cihazların erişimini sonlandırabilirsin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void sessionsQuery.refetch()}
            disabled={sessionsQuery.isFetching}
            className="rounded-lg px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
          >
            {sessionsQuery.isFetching ? "Yenileniyor…" : "Yenile"}
          </button>
        </div>

        {sessionsQuery.isPending ? (
          <p className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">
            Oturumlar yükleniyor…
          </p>
        ) : sessionsQuery.isError ? (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-3 text-sm text-red-700">
            {getSecurityErrorMessage(sessionsQuery.error)}
          </p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="rounded-2xl border border-slate-200 p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {describeUserAgent(session.userAgent)}
                      </p>
                      {session.isCurrent ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                          Bu cihaz
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Son kullanım: {formatSessionDate(session.lastUsedAt)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Bitiş: {formatSessionDate(session.expiresAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmation({ kind: "session", session })}
                    disabled={isSessionMutationPending}
                    className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {session.isCurrent ? "Bu oturumu sonlandır" : "Oturumu sonlandır"}
                  </button>
                </div>

                {confirmation?.kind === "session" &&
                confirmation.session.id === session.id ? (
                  <div className="mt-3">
                    <ConfirmationBox
                      title={
                        session.isCurrent
                          ? "Bu cihazdaki oturum sonlandırılsın mı?"
                          : "Bu oturum sonlandırılsın mı?"
                      }
                      description={
                        session.isCurrent
                          ? "Bu cihazdan çıkış yapacak ve giriş ekranına döneceksin."
                          : "Bu cihazın hesabına erişimi hemen kesilecek."
                      }
                      confirmLabel="Oturumu sonlandır"
                      pending={revokeSession.isPending}
                      onCancel={() => setConfirmation(null)}
                      onConfirm={() => void confirmSessionAction()}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {otherSessionCount > 0 ? (
          confirmation?.kind === "other-sessions" ? (
            <ConfirmationBox
              title="Diğer tüm oturumlar sonlandırılsın mı?"
              description={`${otherSessionCount} diğer cihazın hesabına erişimi kesilecek. Bu cihaz açık kalacak.`}
              confirmLabel="Tümünü sonlandır"
              pending={revokeOtherSessions.isPending}
              onCancel={() => setConfirmation(null)}
              onConfirm={() => void confirmSessionAction()}
            />
          ) : (
            <button
              type="button"
              onClick={() => setConfirmation({ kind: "other-sessions" })}
              disabled={isSessionMutationPending}
              className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Diğer tüm oturumları sonlandır
            </button>
          )
        ) : null}

        {sessionError !== null ? (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {sessionError}
          </p>
        ) : null}
        {sessionFeedback !== null ? (
          <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {sessionFeedback}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ConfirmationBox({
  title,
  description,
  confirmLabel,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  pending: boolean;
  onCancel(): void;
  onConfirm(): void;
}) {
  return (
    <div role="alertdialog" aria-label={title} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
      <p className="text-sm font-bold text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-50"
        >
          Vazgeç
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "İşleniyor…" : confirmLabel}
        </button>
      </div>
    </div>
  );
}

function describeUserAgent(userAgent: string | null): string {
  if (userAgent === null || userAgent.trim().length === 0) {
    return "Bilinmeyen cihaz";
  }

  const browser = userAgent.includes("Edg/")
    ? "Edge"
    : userAgent.includes("Firefox/")
      ? "Firefox"
      : userAgent.includes("Chrome/")
        ? "Chrome"
        : userAgent.includes("Safari/")
          ? "Safari"
          : "Tarayıcı";
  const device = userAgent.includes("Windows")
    ? "Windows"
    : userAgent.includes("Android")
      ? "Android"
      : userAgent.includes("iPhone") || userAgent.includes("iPad")
        ? "iOS"
        : userAgent.includes("Mac OS")
          ? "macOS"
          : userAgent.includes("Linux")
            ? "Linux"
            : "Bilinmeyen cihaz";

  return `${browser} · ${device}`;
}

function formatSessionDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
