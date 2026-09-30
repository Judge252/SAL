"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api/auth";
import { authDestination, safeNext } from "@/lib/auth-navigation";
import { useClinic } from "./provider";
import { SALCharacter } from "./sal/sal-character";

export function ConfirmAccount() {
  const { t, refreshUser } = useClinic();
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState(false);
  const [next, setNext] = useState("/dashboard");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const url = new URL(window.location.href);
    const fragment = new URLSearchParams(url.hash.slice(1));
    const destination = safeNext(url.searchParams.get("next")) || "/dashboard";
    const data: Record<string, string> = {};
    for (const key of ["token_hash", "type", "code", "state"]) {
      const value = url.searchParams.get(key);
      if (value) data[key] = value;
    }
    if (fragment.get("access_token")) {
      data.access_token = fragment.get("access_token")!;
      data.refresh_token = fragment.get("refresh_token") || "";
    }
    const failed = url.searchParams.has("error") || fragment.has("error");
    window.history.replaceState(null, "", "/auth/confirm");
    void Promise.resolve().then(async () => {
      setNext(destination);
      try {
        if (failed || !(data.token_hash || data.code || data.access_token))
          throw new Error("Invalid link");
        await auth.confirm(data);
        const user = await refreshUser();
        if (!user) throw new Error("Session unavailable");
        router.replace(authDestination(destination, user.role));
      } catch {
        setError(true);
      }
    });
  }, [refreshUser, router]);
  return (
    <div className="container page auth-page auth-confirm">
      <SALCharacter state={error ? "idle" : "thinking"} compact />
      <h1>
        {error
          ? t(
              "لنستعد الدخول إلى حسابك",
              "Let’s get you signed in",
              "נחזור להתחברות",
            )
          : t("نؤكد حسابك", "Confirming your account", "מאמתים את החשבון")}
      </h1>
      {error ? (
        <div role="alert">
          <p>
            {t(
              "الرابط غير مكتمل أو انتهت صلاحيته أو استُخدم بالفعل. جرّب تسجيل الدخول؛ وإذا لم يتأكد بريدك، اطلب رابطًا جديدًا.",
              "This link is incomplete, expired, or already used. Try signing in; if your email is still unconfirmed, request a new link.",
              "הקישור אינו שלם, פג תוקפו או שכבר נעשה בו שימוש. נסו להתחבר, או בקשו קישור חדש אם הדוא״ל עדיין לא אומת.",
            )}
          </p>
          <Link
            className="button"
            href={`/auth?next=${encodeURIComponent(next)}&confirmation=retry`}
          >
            {t(
              "تسجيل الدخول أو إرسال رابط جديد",
              "Sign in or resend confirmation",
              "התחברות או שליחת קישור חדש",
            )}
          </Link>
        </div>
      ) : (
        <p role="status">
          {t(
            "نجهز جلستك بأمان. لحظة واحدة…",
            "Securely preparing your session. One moment…",
            "מכינים את ההתחברות בבטחה. רק רגע…",
          )}
        </p>
      )}
    </div>
  );
}
