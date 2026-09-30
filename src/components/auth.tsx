"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useClinic } from "./provider";
import { auth } from "@/lib/api/auth";
import { authDestination, safeNext } from "@/lib/auth-navigation";
import { PageHeading, Brand } from "./ui";
import { SALCharacter } from "./sal/sal-character";

export function ErrorNotice({ error }: { error: string }) {
  return error ? (
    <p className="api-error" role="alert">
      {error}
    </p>
  ) : null;
}
export function AuthGuard({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: string[];
}) {
  const { user, authLoading, authError, t } = useClinic();
  const pathname = usePathname();
  const params = useSearchParams();
  const next = pathname + (params.size ? `?${params}` : "");
  const booking = pathname.startsWith("/booking/");
  if (authLoading)
    return (
      <div className="container page" role="status">
        <Brand sal />
        {t(
          "جارٍ التحقق من الحساب…",
          "Checking your account…",
          "בודקים את החשבון…",
        )}
      </div>
    );
  if (authError)
    return (
      <div className="container page">
        <ErrorNotice error={authError} />
        <Link href={`/auth?next=${encodeURIComponent(next)}`}>
          {t("تسجيل الدخول", "Sign in", "התחברות")}
        </Link>
      </div>
    );
  if (!user)
    return (
      <div className="container page auth-page booking-auth-gate">
        <SALCharacter state="idle" compact />
        <PageHeading
          title={
            booking
              ? t(
                  "لنُكمل حجزك",
                  "Let’s complete your booking",
                  "נשלים את ההזמנה",
                )
              : t(
                  "سجّل الدخول للمتابعة",
                  "Sign in to continue",
                  "התחברו כדי להמשיך",
                )
          }
          description={
            booking
              ? t(
                  "أنشئ حسابًا أو سجّل الدخول لإكمال الحجز. سنعيدك إلى الطبيب ونوع الزيارة اللذين اخترتهما.",
                  "Create an account to complete your booking, or sign in. We’ll return you to your selected doctor and visit type.",
                  "צרו חשבון או התחברו להשלמת ההזמנה. נחזיר אתכם לרופא ולסוג הביקור שבחרתם.",
                )
              : undefined
          }
        />
        <div className="auth-gate-actions">
          <Link
            className="button"
            href={`/auth?mode=signup&next=${encodeURIComponent(next)}`}
          >
            {t("إنشاء حساب", "Create account", "יצירת חשבון")}
          </Link>
          <Link
            className="button secondary"
            href={`/auth?next=${encodeURIComponent(next)}`}
          >
            {t("تسجيل الدخول", "Sign in", "התחברות")}
          </Link>
        </div>
        <Link className="text-link" href="/sal">
          {t("العودة إلى SAL", "Back to SAL", "חזרה ל־SAL")}
        </Link>
      </div>
    );
  if (roles && !roles.includes(user.role))
    return (
      <div className="container page">
        <PageHeading
          title={t(
            "هذه الصفحة ليست متاحة لحسابك",
            "This page is not available for your account",
            "העמוד אינו זמין לחשבון שלך",
          )}
        />
        <Link href={authDestination(null, user.role)}>
          {t("حسابي", "My account", "החשבון שלי")}
        </Link>
      </div>
    );
  return children;
}

export function AuthPage() {
  const params = useSearchParams();
  return <AuthForm key={params.get("mode") || "signin"} mode={params.get("mode") === "signup" ? "signup" : "signin"} next={params.get("next")} confirmationRetry={params.get("confirmation") === "retry"} />;
}

export function AuthForm({ mode, next: destination, confirmationRetry = false, onComplete, onGuest }: {
  mode: "signup" | "signin";
  next?: string | null;
  confirmationRetry?: boolean;
  onComplete?: () => void;
  onGuest?: () => void;
}) {
  const { t, locale, refreshUser } = useClinic();
  const router = useRouter();
  const [register, setRegister] = useState(mode === "signup");
  const next = safeNext(destination) || "/dashboard";
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [confirmRequired, setConfirmRequired] = useState(
    confirmationRetry,
  );
  function switchMode() {
    setError("");
    setNotice("");
    setRegister(!register);
  }
  async function resend() {
    if (!email) {
      setError(
        t("أدخل بريدك أولًا.", "Enter your email first.", "הזינו קודם דוא״ל."),
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      await auth.resend(email, next);
      setNotice(
        t(
          "إذا كان الحساب يحتاج إلى تأكيد، ستصلك رسالة جديدة.",
          "If the account needs confirmation, a new email will arrive shortly.",
          "אם החשבון דורש אימות, הודעה חדשה תישלח בקרוב.",
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page auth-page auth-encounter">
      <SALCharacter state={busy ? "thinking" : "idle"} compact />
      <PageHeading
        eyebrow="THE CLINIC"
        title={
          register
            ? t(
                "رعايتك، في مكان واحد",
                "Your care, in one place",
                "הטיפול שלכם, במקום אחד",
              )
            : t("أهلًا بعودتك", "Welcome back", "ברוכים השבים")
        }
        description={
          next.startsWith("/booking/")
            ? t(
                "خطوة واحدة لنكمل الحجز الذي اخترته.",
                "One step before continuing your selected booking.",
                "רק צעד אחד לפני המשך ההזמנה שבחרתם.",
              )
            : t(
                "تحدث مع SAL بحرية. حسابك يجمع مواعيدك ومحادثاتك.",
                "Talk with SAL freely. Your account brings your appointments and conversations together.",
                "דברו עם SAL בחופשיות. החשבון מרכז את התורים והשיחות שלכם.",
              )
        }
      />
      <div
        className="auth-mode-switch"
        role="tablist"
        aria-label={t(
          "الدخول أو التسجيل",
          "Sign in or sign up",
          "התחברות או הרשמה",
        )}
      >
        <button
          role="tab"
          aria-selected={!register}
          onClick={() => {
            if (register) switchMode();
          }}
          disabled={busy}
        >
          {t("تسجيل الدخول", "Sign in", "התחברות")}
        </button>
        <button
          role="tab"
          aria-selected={register}
          onClick={() => {
            if (!register) switchMode();
          }}
          disabled={busy}
        >
          {t("إنشاء حساب", "Create account", "יצירת חשבון")}
        </button>
      </div>
      <button
        className="google-auth-button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const { url } = await auth.google(next);
            window.location.assign(url);
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        <span aria-hidden="true">G</span>
        {t("المتابعة مع Google", "Continue with Google", "המשך עם Google")}
      </button>
      <div className="auth-divider">
        {t("أو بالبريد الإلكتروني", "or with email", "או באמצעות דוא״ל")}
      </div>
      <form
        className="live-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          setNotice("");
          const data = new FormData(e.currentTarget);
          try {
            if (register) {
              const result = await auth.register({
                email,
                password: String(data.get("password")),
                full_name: String(data.get("full_name")),
                preferred_language: locale,
                next,
              });
              if (result.confirmation_required) {
                setConfirmRequired(true);
                setNotice(
                  t(
                    "تحقق من بريدك. افتح رابط التأكيد لنُكمل من حيث توقفت.",
                    "Check your email. Open the confirmation link to continue where you left off.",
                    "בדקו את הדוא״ל ופתחו את קישור האימות כדי להמשיך מאותה נקודה.",
                  ),
                );
                return;
              }
            } else await auth.login(email, String(data.get("password")));
            const user = await refreshUser();
            if (!user)
              throw new Error(
                t(
                  "تعذّر التحقق من الجلسة. جرّب الدخول مرة أخرى.",
                  "We couldn’t verify the session. Please sign in again.",
                  "לא הצלחנו לאמת את ההתחברות. נסו שוב.",
                ),
              );
            onComplete?.();
            router.replace(authDestination(next, user.role));
          } catch (e) {
            setError((e as Error).message);
            setConfirmRequired(true);
          } finally {
            setBusy(false);
          }
        }}
      >
        {register && (
          <label>
            {t("الاسم الكامل", "Full name", "שם מלא")}
            <input
              name="full_name"
              autoComplete="name"
              minLength={2}
              maxLength={120}
              required
            />
          </label>
        )}
        <label>
          {t("البريد الإلكتروني", "Email", "דוא״ל")}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <label>
          {t("كلمة المرور", "Password", "סיסמה")}
          <input
            name="password"
            type="password"
            minLength={8}
            maxLength={128}
            autoComplete={register ? "new-password" : "current-password"}
            required
          />
        </label>
        <ErrorNotice error={error} />
        {notice && (
          <p className="auth-notice" role="status">
            {notice}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy
            ? t("لحظة واحدة…", "Please wait…", "רק רגע…")
            : register
              ? t("إنشاء حساب", "Create account", "יצירת חשבון")
              : t("تسجيل الدخول", "Sign in", "התחברות")}
        </button>
        {confirmRequired && (
          <button
            type="button"
            className="text-link"
            disabled={busy}
            onClick={resend}
          >
            {t(
              "إعادة إرسال رابط التأكيد",
              "Resend confirmation email",
              "שליחת קישור אימות חדש",
            )}
          </button>
        )}
        <button
          type="button"
          className="text-link"
          disabled={busy}
          onClick={switchMode}
        >
          {register
            ? t(
                "لدي حساب بالفعل",
                "I already have an account",
                "כבר יש לי חשבון",
              )
            : t("إنشاء حساب جديد", "Create a new account", "יצירת חשבון חדש")}
        </button>
      </form>
      <Link className="auth-guest-link" href="/sal" onClick={onGuest}>
        {t(
          "تحدث مع SAL بدون حساب",
          "Talk with SAL without an account",
          "שיחה עם SAL ללא חשבון",
        )}
      </Link>
    </div>
  );
}
