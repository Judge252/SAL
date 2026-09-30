"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { useClinic } from "./provider";
import { AuthForm } from "./auth";

type Intent = { mode: "signin" | "signup"; next: string; confirmationRetry: boolean };

// Keep ordinary links as navigation fallbacks. In the hydrated product, open
// the same existing auth form in a native dialog with browser focus trapping.
export function AuthModalProvider({ children }: { children: ReactNode }) {
  const { user, t } = useClinic();
  const [intent, setIntent] = useState<Intent | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  function close() {
    dialog.current?.close();
    setIntent(null);
    origin.current?.focus();
  }
  useEffect(() => {
    function intercept(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target || link.hasAttribute("download") || link.closest("dialog")) return;
      const url = new URL(link.href, location.origin);
      if (url.origin !== location.origin) return;
      const booking = !user && url.pathname.startsWith("/booking/");
      if (!booking && url.pathname !== "/auth") return;
      if (!booking && location.pathname === "/auth") return;
      event.preventDefault();
      origin.current = link;
      setIntent({
        mode: url.searchParams.get("mode") === "signup" ? "signup" : "signin",
        next: booking ? url.pathname + url.search : url.searchParams.get("next") || location.pathname + location.search,
        confirmationRetry: url.searchParams.get("confirmation") === "retry",
      });
    }
    document.addEventListener("click", intercept, true);
    return () => document.removeEventListener("click", intercept, true);
  }, [user]);
  useEffect(() => {
    if (!intent) return;
    const element = dialog.current;
    const previous = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = previous; };
  }, [intent]);
  return <>
    {children}
    {intent && <dialog ref={dialog} className="auth-modal" aria-label={t("حسابك في The Clinic", "Your The Clinic account", "החשבון שלכם ב־The Clinic")} onCancel={event => { event.preventDefault(); close(); }} onKeyDown={event => {
      if (event.key !== "Tab") return;
      const targets = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]')).filter(element => element.getClientRects().length > 0);
      const first = targets[0], last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
    }}>
      <button className="icon-button auth-modal-close" onClick={close} aria-label={t("إغلاق", "Close", "סגירה")} autoFocus><X size={21} /></button>
      <AuthForm mode={intent.mode} next={intent.next} confirmationRetry={intent.confirmationRetry} onComplete={close} onGuest={close} />
    </dialog>}
  </>;
}
