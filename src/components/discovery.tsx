"use client";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { doctors, specialties, languageNames, cities } from "@/lib/data";
import { useClinic } from "./provider";
import { DoctorCard, PageHeading, DemoNote, Brand, Arrow } from "./ui";
import Link from "next/link";
export type DiscoveryFilters = {
  specialty?: string;
  q?: string;
  city?: string;
  mode?: string;
};
export function Discovery({ initial = {} }: { initial?: DiscoveryFilters }) {
  const { t, locale } = useClinic();
  const [query, setQuery] = useState(initial.q ?? "");
  const [specialty, setSpecialty] = useState(initial.specialty ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [language, setLanguage] = useState("");
  const [available, setAvailable] = useState(false);
  const [mode, setMode] = useState(initial.mode ?? "");
  const [sort, setSort] = useState("soonest");
  const [showFilters, setShowFilters] = useState(false);
  const filtered = doctors
    .filter(
      (d) =>
        (!specialty || d.specialty === specialty) &&
        (!city || d.cityId === city) &&
        (!language || d.languages.some((l) => l === language)) &&
        (!available || d.nextDay === 1) &&
        (!mode || d.consultations.some((c) => c === mode)) &&
        `${Object.values(d.name).join(" ")} ${Object.values(specialties[d.specialty]).join(" ")}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) =>
      sort === "experience"
        ? b.experience - a.experience
        : a.nextDay - b.nextDay,
    );
  const reset = () => {
    setQuery("");
    setSpecialty("");
    setCity("");
    setLanguage("");
    setAvailable(false);
    setMode("");
  };
  const count = [specialty, city, language, available, mode].filter(
    Boolean,
  ).length;
  return (
    <div className="container page">
      <PageHeading
        eyebrow={t("دليل الأطباء", "DOCTOR DIRECTORY", "מדריך רופאים")}
        title={t(
          "ابحث عن طبيب يناسبك.",
          "Find a doctor who fits.",
          "מצאו רופא שמתאים לכם.",
        )}
        description={t(
          "اختر حسب التخصص واللغة والمدينة. راجع ملف الطبيب والوقت المتاح قبل الحجز.",
          "Choose by specialty, language and location. Review the profile and available times before you book.",
          "בחרו לפי התמחות, שפה ומיקום. בדקו את הפרופיל והזמינות לפני ההזמנה.",
        )}
      />
      <div className="directory-search">
        <div className="search-box">
          <Search size={23} />
          <input
            aria-label={t(
              "ابحث عن طبيب أو تخصص",
              "Search doctors or specialties",
              "חיפוש רופא או התמחות",
            )}
            placeholder={t(
              "ابحث باسم الطبيب أو التخصص",
              "Search doctor names or specialties",
              "חיפוש לפי שם או התמחות",
            )}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="icon-button"
              onClick={() => setQuery("")}
              aria-label={t("مسح البحث", "Clear search", "ניקוי חיפוש")}
            >
              <X size={18} />
            </button>
          )}
        </div>
        <button
          className="button outline mobile-filter-toggle"
          aria-expanded={showFilters}
          aria-controls="doctor-filters"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={19} />
          {t("الفلاتر", "Filters", "מסננים")}
          {count > 0 && ` (${count})`}
        </button>
      </div>
      <div className="discovery-layout">
        <aside
          id="doctor-filters"
          className={`filters ${showFilters ? "is-open" : ""}`}
        >
          <h2>
            <SlidersHorizontal size={20} />
            {t("خصص بحثك", "Refine your search", "סינון החיפוש")}
          </h2>
          <label>
            {t("نوع الاستشارة", "Consultation type", "סוג הייעוץ")}
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="">
                {t("كل الاستشارات", "All consultations", "כל סוגי הייעוץ")}
              </option>
              <option value="clinic">
                {t("في العيادة", "In clinic", "במרפאה")}
              </option>
              <option value="video">{t("بالفيديو", "Video", "וידאו")}</option>
            </select>
          </label>
          <label>
            {t("التخصص", "Specialty", "התמחות")}
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              <option value="">
                {t("كل التخصصات", "All specialties", "כל ההתמחויות")}
              </option>
              {Object.entries(specialties).map(([k, v]) => (
                <option value={k} key={k}>
                  {v[locale]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("المدينة", "City", "עיר")}
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">
                {t("كل المدن", "All cities", "כל הערים")}
              </option>
              {Object.entries(cities).map(([k, v]) => (
                <option value={k} key={k}>
                  {v[locale]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("لغة المحادثة", "Doctor language", "שפת הרופא")}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="">
                {t("كل اللغات", "All languages", "כל השפות")}
              </option>
              {Object.entries(languageNames).map(([k, v]) => (
                <option value={k} key={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />
            {t("متاح غدًا", "Available tomorrow", "זמין מחר")}
          </label>
          <button className="text-link muted" onClick={reset}>
            <X size={17} />
            {t("مسح الفلاتر", "Clear filters", "ניקוי מסננים")}
          </button>
          <div className="filter-sal">
            <Brand sal />
            <h3>
              {t(
                "لا تعرف التخصص؟",
                "Unsure which specialty?",
                "לא בטוחים באיזו התמחות?",
              )}
            </h3>
            <Link className="text-link" href="/sal">
              {t("اسأل SAL", "Ask SAL", "שאלו את SAL")}
              <Arrow />
            </Link>
          </div>
        </aside>
        <div className="directory-results">
          <div className="results-bar">
            <span aria-live="polite">
              <b>{filtered.length}</b>{" "}
              {t("ملفات أطباء", "doctor profiles", "פרופילי רופאים")}
            </span>
            <label>
              {t("الترتيب", "Sort", "מיון")}
              <select
                aria-label={t("ترتيب النتائج", "Sort results", "מיון תוצאות")}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="soonest">
                  {t("أقرب موعد", "Soonest available", "הזמן הקרוב ביותר")}
                </option>
                <option value="experience">
                  {t("سنوات الخبرة", "Years of experience", "שנות ניסיון")}
                </option>
              </select>
            </label>
          </div>
          <DemoNote />
          <div className="doctor-grid">
            {filtered.map((d) => (
              <DoctorCard
                key={d.id}
                doctor={d}
                mode={mode === "video" ? "video" : "clinic"}
              />
            ))}
          </div>
          {!filtered.length && (
            <div className="empty-state">
              <Search size={32} />
              <h2>
                {t(
                  "لا توجد نتائج مطابقة",
                  "No matching doctors",
                  "לא נמצאו רופאים",
                )}
              </h2>
              <p>
                {t(
                  "جرّب مدينة أخرى أو غيّر التخصص ونوع الاستشارة.",
                  "Try another city, specialty or consultation type.",
                  "נסו עיר, התמחות או סוג ייעוץ אחרים.",
                )}
              </p>
              <button className="button outline" onClick={reset}>
                {t("مسح الفلاتر", "Clear filters", "ניקוי מסננים")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
