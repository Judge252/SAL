"use client";
import Link from "next/link";
import {
  Bookmark,
  MapPin,
  Languages,
  GraduationCap,
  CalendarDays,
  Video,
  Building2,
} from "lucide-react";
import type { Doctor } from "@/lib/types";
import { useClinic } from "./provider";
import { Avatar, Arrow, DemoNote } from "./ui";
import { languageNames, specialties, specialtyDescriptions } from "@/lib/data";
export function Profile({ doctor: d }: { doctor: Doctor }) {
  const { t, locale, saved, toggleSaved } = useClinic();
  return (
    <div className="container page">
      <Link className="back-link" href="/doctors">
        <Arrow />
        {t("جميع الأطباء", "All doctors", "כל הרופאים")}
      </Link>
      <section className="profile-hero">
        <Avatar doctor={d} large />
        <div>
          <span className="demo-label">
            {t(
              "ملف طبيب توضيحي · غير موثّق",
              "Illustrative clinician profile · Unverified",
              "פרופיל רופא לדוגמה · לא מאומת",
            )}
          </span>
          <h1>{d.name[locale]}</h1>
          <p>{specialties[d.specialty][locale]}</p>
          <div className="doctor-meta">
            <span>
              <MapPin size={19} />
              {d.city[locale]}
            </span>
            <span>
              <Languages size={19} />
              {d.languages.map((l) => languageNames[l]).join(" · ")}
            </span>
          </div>
        </div>
        <button
          className={`button outline ${saved.includes(d.id) ? "saved" : ""}`}
          onClick={() => toggleSaved(d.id)}
        >
          <Bookmark size={20} />
          {saved.includes(d.id)
            ? t("تم الحفظ", "Saved", "נשמר")
            : t("احفظ الطبيب", "Save doctor", "שמירת רופא")}
        </button>
      </section>
      <div className="profile-layout">
        <div>
          <section className="profile-section">
            <h2>{t("عن الطبيب", "About the clinician", "על הרופא")}</h2>
            <p>{specialtyDescriptions[d.specialty][locale]}</p>
            <p>
              {t(
                "هذا ملف تجريبي يعرض المعلومات التي ستساعدك على الاختيار. لا يمثل طبيبًا حقيقيًا على المنصة.",
                "This demo profile shows the information that will help you choose. It does not represent a real clinician on the platform.",
                "פרופיל ההדגמה מציג מידע שיעזור לכם לבחור. הוא אינו מייצג רופא אמיתי בפלטפורמה.",
              )}
            </p>
            <div className="profile-facts">
              <div>
                <GraduationCap />
                <b>
                  {d.experience}{" "}
                  {t("عامًا من الخبرة", "years of experience", "שנות ניסיון")}
                </b>
                <span>
                  {t(
                    "بيانات الملف تجريبية",
                    "Illustrative profile data",
                    "נתונים להמחשה",
                  )}
                </span>
              </div>
              <div>
                <Languages />
                <b>{d.languages.map((l) => languageNames[l]).join(" · ")}</b>
                <span>
                  {t("لغات الاستشارة", "Consultation languages", "שפות הייעוץ")}
                </span>
              </div>
            </div>
          </section>
          <section className="profile-section">
            <h2>
              {t("أنواع الزيارة", "Ways to see this clinician", "דרכי ביקור")}
            </h2>
            <div className="visit-types">
              {d.consultations.map((type) => (
                <Link href={`/booking/${d.id}?mode=${type}`} key={type}>
                  {type === "video" ? <Video /> : <Building2 />}
                  <div>
                    <h3>
                      {type === "video"
                        ? t(
                            "استشارة فيديو",
                            "Video consultation",
                            "ייעוץ וידאו",
                          )
                        : t(
                            "زيارة في العيادة",
                            "In-clinic visit",
                            "ביקור במרפאה",
                          )}
                    </h3>
                    <p>
                      {type === "video"
                        ? t(
                            "اختر موعدك عن بُعد. مكالمات الفيديو غير متصلة في هذه النسخة.",
                            "Choose a remote visit. Live calls are not connected in this prototype.",
                            "בחרו ביקור מרחוק. שיחות חיות אינן מחוברות באב הטיפוס.",
                          )
                        : d.city[locale]}
                    </p>
                  </div>
                  <Arrow />
                </Link>
              ))}
            </div>
          </section>
          <section className="profile-section">
            <h2>{t("موقع العيادة", "Clinic location", "מיקום המרפאה")}</h2>
            <div className="location-panel">
              <MapPin size={30} />
              <div>
                <h3>{d.city[locale]}</h3>
                <p>
                  {t(
                    "الموقع توضيحي. سيظهر العنوان الكامل بعد ربط بيانات العيادة.",
                    "Illustrative location. The full address will appear when clinic data is connected.",
                    "מיקום להמחשה. הכתובת המלאה תופיע עם חיבור נתוני המרפאה.",
                  )}
                </p>
              </div>
            </div>
          </section>
          <section className="profile-section">
            <h2>{t("قبل موعدك", "Before your appointment", "לפני התור")}</h2>
            <p>
              {t(
                "جهّز الأسئلة التي تريد مناقشتها. راجع نوع الاستشارة والوقت واللغة قبل تأكيد اختيارك.",
                "Prepare the questions you want to discuss. Review the consultation type, time and language before confirming your choice.",
                "הכינו את השאלות שתרצו לשאול. בדקו את סוג הייעוץ, הזמן והשפה לפני אישור הבחירה.",
              )}
            </p>
          </section>
        </div>
        <aside className="booking-aside">
          <CalendarDays size={27} />
          <h2>
            {t(
              "اختر موعد زيارتك.",
              "Choose your appointment.",
              "בחרו את מועד הביקור.",
            )}
          </h2>
          <p>
            {t(
              "راجع الأوقات المتاحة ونوع الاستشارة.",
              "Review available times and consultation types.",
              "בדקו זמנים פנויים וסוגי ייעוץ.",
            )}
          </p>
          <div className="appointment-preview">
            <span>
              {t(
                "أقرب موعد تجريبي",
                "Next demo appointment",
                "התור הבא להדגמה",
              )}
            </span>
            <b>
              {d.nextDay === 1
                ? t("غدًا", "Tomorrow", "מחר")
                : t(
                    `خلال ${d.nextDay} أيام`,
                    `In ${d.nextDay} days`,
                    `בעוד ${d.nextDay} ימים`,
                  )}{" "}
              · 09:00
            </b>
          </div>
          <Link className="button full" href={`/booking/${d.id}`}>
            {t("اختر موعدًا", "Choose an appointment", "בחירת תור")}
            <Arrow />
          </Link>
          <DemoNote />
        </aside>
      </div>
    </div>
  );
}
