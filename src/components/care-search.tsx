"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Video, Building2 } from "lucide-react";
import { cities } from "@/lib/data";
import { useClinic } from "./provider";
export function CareSearch() {
  const { t, locale } = useClinic();
  const router = useRouter();
  const [mode, setMode] = useState("clinic");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  return (
    <form
      className="care-search"
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (city && mode === "clinic") params.set("city", city);
        params.set("mode", mode);
        router.push(`/doctors?${params}`);
      }}
    >
      <div
        className="search-mode"
        role="group"
        aria-label={t("نوع الاستشارة", "Consultation type", "סוג הייעוץ")}
      >
        <button
          type="button"
          aria-pressed={mode === "clinic"}
          onClick={() => setMode("clinic")}
        >
          <Building2 size={20} />
          {t("زيارة في العيادة", "In-clinic visit", "ביקור במרפאה")}
        </button>
        <button
          type="button"
          aria-pressed={mode === "video"}
          onClick={() => setMode("video")}
        >
          <Video size={20} />
          {t("استشارة أونلاين", "Online consultation", "ייעוץ מקוון")}
        </button>
      </div>
      <div className="care-search-fields">
        <label className="search-query">
          {t("الطبيب أو التخصص", "Doctor or specialty", "רופא או התמחות")}
          <span>
            <Search size={22} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(
                "اسم الطبيب، طب الأطفال، الجلدية…",
                "Name, pediatrics, dermatology…",
                "שם, ילדים, עור…",
              )}
            />
          </span>
        </label>
        {mode === "clinic" && (
          <label className="search-city">
            {t("أين تبحث؟", "Where?", "איפה?")}
            <span>
              <MapPin size={21} />
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">
                  {t("جميع المدن", "All cities", "כל הערים")}
                </option>
                {Object.entries(cities).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label[locale]}
                  </option>
                ))}
              </select>
            </span>
          </label>
        )}
        <button className="button search-submit">
          <Search size={20} />
          {t("ابحث عن طبيب", "Find a doctor", "מציאת רופא")}
        </button>
      </div>
    </form>
  );
}
