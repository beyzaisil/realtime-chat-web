"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { toUserFacingAuthError } from "../../../lib/auth/user-facing-error";
import { useAuth } from "../../../providers/auth-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);

    try {
      await register({
        username: String(form.get("username") ?? ""),
        email: String(form.get("email") ?? ""),
        displayName: String(form.get("displayName") ?? ""),
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
        <p className="eyebrow">Yeni bir başlangıç</p>
        <h1>Hesabını oluştur</h1>
        <p>Birkaç bilgiyle mesajlaşmaya hazırlan.</p>
      </header>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Kullanıcı adı
          <input
            type="text"
            name="username"
            autoComplete="username"
            maxLength={32}
            required
          />
        </label>
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
          Görünen ad
          <input
            type="text"
            name="displayName"
            autoComplete="name"
            maxLength={80}
            required
          />
        </label>
        <label>
          Şifre
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
        </label>
        {error === null ? null : (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? "Hesap oluşturuluyor…" : "Hesap oluştur"}
        </button>
      </form>

      <p className="auth-switch">
        Zaten hesabın var mı? <Link href="/login">Giriş yap</Link>
      </p>
    </>
  );
}
