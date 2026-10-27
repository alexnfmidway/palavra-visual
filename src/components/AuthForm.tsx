"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { isValidHandle, normalizeHandle } from "@/lib/auth/handle";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

type Props = { mode: "sign-in" | "sign-up"; t: Dictionary["auth"]; locale: Locale };

const field = "min-h-12 w-full rounded-xl border border-muted bg-surface px-4 text-base";

export function AuthForm({ mode, t, locale }: Props) {
  const router = useRouter();
  const signUp = mode === "sign-up";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function messageFor(code?: string) {
    switch (code) {
      case "INVALID_EMAIL_OR_PASSWORD":
        return t.errors.invalidCredentials;
      case "PASSWORD_TOO_SHORT":
        return t.errors.passwordTooShort;
      case "INVALID_EMAIL":
        return t.errors.invalidEmail;
      case "USER_ALREADY_EXISTS":
      case "FAILED_TO_CREATE_USER":
        return t.errors.createFailed;
      default:
        return signUp ? t.errors.createFailed : t.errors.generic;
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    setError(null);
    setBusy(true);
    try {
      if (signUp) {
        const handle = normalizeHandle(String(data.get("handle") ?? ""));
        if (!isValidHandle(handle)) {
          setError(t.errors.invalidHandle);
          return;
        }
        const result = await authClient.signUp.email({
          email,
          password,
          name: String(data.get("name") ?? "").trim(),
          handle,
        });
        if (result.error) return setError(messageFor(result.error.code));
      } else {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) return setError(messageFor(result.error.code));
      }
      router.push(`/${locale}`);
      router.refresh();
    } catch {
      setError(t.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
      {signUp && (
        <>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">{t.name}</span>
            <input name="name" required autoComplete="name" className={field} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">{t.handle}</span>
            <input
              name="handle"
              required
              minLength={3}
              maxLength={21}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-describedby="handle-hint"
              className={field}
            />
            <span id="handle-hint" className="block text-xs text-muted">
              {t.handleHint}
            </span>
          </label>
        </>
      )}
      <label className="block space-y-1">
        <span className="text-sm font-semibold">{t.email}</span>
        <input name="email" type="email" required autoComplete="email" inputMode="email" className={field} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">{t.password}</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={signUp ? "new-password" : "current-password"}
          aria-describedby={signUp ? "password-hint" : undefined}
          className={field}
        />
        {signUp && (
          <span id="password-hint" className="block text-xs text-muted">
            {t.passwordHint}
          </span>
        )}
      </label>

      {error && (
        <p role="alert" className="rounded-xl border border-line bg-surface p-3 text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-full bg-primary px-6 font-semibold text-on-primary disabled:opacity-60"
      >
        {busy ? t.working : signUp ? t.submitSignUp : t.submitSignIn}
      </button>

      <p className="text-center text-sm text-muted">
        {signUp ? t.haveAccount : t.noAccount}{" "}
        <Link href={`/${locale}/${signUp ? "entrar" : "criar-conta"}`} className="font-semibold text-link underline">
          {signUp ? t.signIn : t.signUp}
        </Link>
      </p>
    </form>
  );
}
