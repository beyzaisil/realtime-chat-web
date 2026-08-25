"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { toUserFacingAuthError } from "../../../lib/auth/user-facing-error";
import { useAuth } from "../../../providers/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);

    try {
      await login({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      router.replace("/chat");
    } catch (submissionError: unknown) {
      setError(toUserFacingAuthError(submissionError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="auth-heading">
        <p className="eyebrow">Tekrar hoş geldin</p>
        <h1>Hesabına giriş yap</h1>
        <p>Mesajlarına kaldığın yerden devam et.</p>
      </header>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          E-posta
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
          />
        </label>
        <label>
          Şifre
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </label>
        {error === null ? null : (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
      </form>

      <p className="auth-switch">
        Hesabın yok mu? <Link href="/register">Kayıt ol</Link>
      </p>
    </>
  );
}
