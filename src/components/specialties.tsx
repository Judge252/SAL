"use client";
import { useState } from "react";
import Link from "next/link";
import { doctors, specialties, specialtyDescriptions } from "@/lib/data";
import type { Specialty } from "@/lib/types";
import { useClinic } from "./provider";
import { Arrow, Avatar, PageHeading } from "./ui";
export function SpecialtySelector({
  expanded = false,
}: {
  expanded?: boolean;
}) {
  const { t, locale } = useClinic();
  const [selected, setSelected] = useState<Specialty>("family");
  const entries = (Object.keys(specialties) as Specialty[]).slice(
    0,
    expanded ? 10 : 6,
  );
  const matches = doctors.filter((d) => d.specialty === selected);
  return (
    <div className="specialty-browser">
      <div
        className="specialty-list"
        role="group"
        aria-label={t("اختر تخصصًا", "Select a specialty", "בחירת התמחות")}
      >
        {entries.map((key, i) => (
          <button
            key={key}
            aria-pressed={key === selected}
            onClick={() => setSelected(key)}
          >
            <span className="specialty-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{specialties[key][locale]}</span>
            <Arrow />
          </button>
        ))}
      </div>
      <div className="specialty-detail" aria-live="polite">
        <span className="section-kicker">
          {t("تعرف على التخصص", "ABOUT THE SPECIALTY", "על ההתמחות")}
        </span>
        <h3>{specialties[selected][locale]}</h3>
        <p>{specialtyDescriptions[selected][locale]}</p>
        {matches.length ? (
          <>
            <div className="specialty-people">
              {matches.slice(0, 2).map((d) => (
                <Link key={d.id} href={`/doctors/${d.id}`}>
                  <Avatar doctor={d} />
                  <span>
                    <b>{d.name[locale]}</b>
                    <small>{d.city[locale]}</small>
                  </span>
                  <Arrow diagonal />
                </Link>
              ))}
            </div>
            <Link className="button" href={`/doctors?specialty=${selected}`}>
              {t("عرض أطباء التخصص", "View specialists", "לרופאים בתחום")}
              <Arrow />
            </Link>
          </>
        ) : (
          <div className="specialty-empty">
            <p>
              {t(
                "لا توجد ملفات لهذا التخصص في النسخة التجريبية بعد.",
                "No profiles in this specialty are available in the demo yet.",
                "אין עדיין פרופילים בתחום זה בהדגמה.",
              )}
            </p>
            <Link href="/doctors" className="text-link">
              {t(
                "عرض التخصصات المتاحة",
                "View available specialties",
                "לתחומים הזמינים",
              )}
              <Arrow />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
export function SpecialtiesPage() {
  const { t } = useClinic();
  return (
    <div className="container page">
      <PageHeading
        eyebrow={t("دليل التخصصات", "SPECIALTY DIRECTORY", "מדריך התמחויות")}
        title={t(
          "ابدأ من التخصص المناسب.",
          "Start with the right specialty.",
          "מתחילים בהתמחות הנכונה.",
        )}
        description={t(
          "تعرّف على مجالات الرعاية، ثم اختر الطبيب والموعد المناسبين لك.",
          "Explore areas of care, then choose the doctor and appointment that work for you.",
          "גלו תחומי טיפול ואז בחרו רופא ומועד שמתאימים לכם.",
        )}
      />
      <SpecialtySelector expanded />
      <div className="inline-help">
        <b>
          {t(
            "لا تعرف من أين تبدأ؟",
            "Not sure where to start?",
            "לא יודעים היכן להתחיל?",
          )}
        </b>
        <Link className="text-link" href="/sal">
          {t(
            "رتّب أسئلتك مع SAL",
            "Organize your questions with SAL",
            "ארגנו את השאלות עם SAL",
          )}
          <Arrow />
        </Link>
      </div>
    </div>
  );
}
