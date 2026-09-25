"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe2,
  Menu,
  X,
  CalendarDays,
  Search,
  Home,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Brand } from "./ui";
import { useClinic } from "./provider";
import type { Locale } from "@/lib/types";
export function Shell({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useClinic();
  const path = usePathname();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const open = menuFor === path;
  const nav = [
    {
      href: "/doctors",
      label: t("ابحث عن طبيب", "Find a doctor", "מציאת רופא"),
    },
    { href: "/specialties", label: t("التخصصات", "Specialties", "התמחויות") },
    {
      href: "/online",
      label: t("استشارة أونلاين", "Online consultation", "ייעוץ מקוון"),
    },
    { href: "/sal", label: t("اسأل SAL", "Ask SAL", "שאלו את SAL") },
  ];
  const mobile = [
    { href: "/", label: t("الرئيسية", "Home", "ראשי"), icon: Home },
    {
      href: "/doctors",
      label: t("الأطباء", "Doctors", "רופאים"),
      icon: Search,
    },
    { href: "/sal", label: "SAL", icon: Brand },
    {
      href: "/dashboard",
      label: t("مواعيدي", "My care", "התורים שלי"),
      icon: CalendarDays,
    },
  ];
  const active = (href: string) =>
    path === href || (href === "/doctors" && path.startsWith("/doctors/"));
  return (
    <>
      <a className="skip-link" href="#main">
        {t("انتقل إلى المحتوى", "Skip to content", "דלג לתוכן")}
      </a>
      <header className="header">
        <div className="container header-inner">
          <Link className="brand-home" href="/" aria-label="The Clinic">
            <Brand />
          </Link>
          <nav
            className="desktop-nav"
            aria-label={t("التنقل الرئيسي", "Main navigation", "ניווט ראשי")}
          >
            {nav.map((n) => (
              <Link
                className={active(n.href) ? "active" : ""}
                aria-current={active(n.href) ? "page" : undefined}
                href={n.href}
                key={n.href}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <label className="locale-switch">
              <Globe2 size={19} />
              <select
                aria-label="Language"
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
                <option value="he">עברית</option>
              </select>
            </label>
            <Link className="account-link" href="/dashboard">
              <UserRound size={20} />
              {t("مساحتي", "My care", "המרחב שלי")}
            </Link>
            <button
              className="icon-button menu-toggle"
              aria-label={t("القائمة", "Menu", "תפריט")}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setMenuFor(open ? null : path)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="menu-panel" id="mobile-menu">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setMenuFor(null)}>
                {n.label}
              </Link>
            ))}
            <Link href="/dashboard" onClick={() => setMenuFor(null)}>
              {t("مساحتي الصحية", "My care space", "המרחב שלי")}
            </Link>
            <Link href="/doctor-dashboard" onClick={() => setMenuFor(null)}>
              {t("مساحة الطبيب", "Doctor workspace", "מרחב הרופא")}
            </Link>
          </nav>
        )}
      </header>
      <main id="main">{children}</main>
      <footer className="footer">
        <div className="container footer-main">
          <div className="footer-brand">
            <Brand />
            <p>
              {t(
                "ابحث عن طبيب. اختر الرعاية التي تناسبك.",
                "Find a doctor. Choose the care that fits.",
                "מצאו רופא. בחרו את הטיפול שמתאים לכם.",
              )}
            </p>
            <span className="demo-label">
              {t("نسخة واجهة تجريبية", "Frontend prototype", "אב טיפוס לממשק")}
            </span>
          </div>
          <div className="footer-group">
            <h3>{t("ابحث عن رعاية", "Find care", "מצאו טיפול")}</h3>
            <Link href="/doctors">{t("الأطباء", "Doctors", "רופאים")}</Link>
            <Link href="/specialties">
              {t("التخصصات", "Specialties", "התמחויות")}
            </Link>
            <Link href="/online">
              {t("استشارات أونلاين", "Online consultations", "ייעוץ מקוון")}
            </Link>
            <Link href="/sal">
              {t("مساعد SAL", "SAL assistant", "עוזר SAL")}
            </Link>
          </div>
          <div className="footer-group">
            <h3>The Clinic</h3>
            <Link href="/information/about">
              {t("عن المنصة", "About the platform", "על הפלטפורמה")}
            </Link>
            <Link href="/doctor-dashboard">
              {t("للأطباء", "For clinicians", "לרופאים")}
            </Link>
            <Link href="/information/privacy">
              {t("الخصوصية", "Privacy", "פרטיות")}
            </Link>
            <Link href="/information/terms">
              {t("شروط التجربة", "Demo terms", "תנאי ההדגמה")}
            </Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 The Clinic</span>
          <span>العربية · עברית · English</span>
          <span>
            {t(
              "لا تُنشأ حجوزات حقيقية في هذه النسخة.",
              "No real bookings are created in this version.",
              "לא נוצרים תורים אמיתיים בגרסה זו.",
            )}
          </span>
        </div>
      </footer>
      <nav
        className="mobile-nav"
        aria-label={t("التنقل على الهاتف", "Mobile navigation", "ניווט בנייד")}
      >
        {mobile.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={active(n.href) ? "active" : ""}
            aria-current={active(n.href) ? "page" : undefined}
          >
            {n.href === "/sal" ? <Brand sal /> : <n.icon size={22} />}
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
