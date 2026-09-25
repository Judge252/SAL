"use client";
import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Bookmark,
  FileText,
  Upload,
  X,
  MessageCircle,
  ArrowDownToLine,
} from "lucide-react";
import { doctors } from "@/lib/data";
import { useClinic } from "./provider";
import {
  PageHeading,
  DoctorCard,
  Avatar,
  Brand,
  Arrow,
  DemoNote,
  handleTabNavigation,
} from "./ui";
export function Dashboard() {
  const { t, locale, appointments, setAppointments, saved, messages } =
    useClinic();
  const [tab, setTab] = useState("appointments");
  const [files, setFiles] = useState<
    { id: string; name: string; size: number }[]
  >([]);
  const [error, setError] = useState("");
  const [cancel, setCancel] = useState<string | null>(null);
  const tabs = [
    {
      id: "appointments",
      icon: CalendarDays,
      label: t("مواعيدي", "Appointments", "התורים שלי"),
    },
    {
      id: "saved",
      icon: Bookmark,
      label: t("الأطباء المحفوظون", "Saved doctors", "רופאים שמורים"),
    },
    {
      id: "history",
      icon: MessageCircle,
      label: t("محادثات SAL", "SAL conversations", "שיחות SAL"),
    },
    {
      id: "documents",
      icon: FileText,
      label: t("مستنداتي", "Documents", "המסמכים שלי"),
    },
  ];
  return (
    <div className="container page">
      <PageHeading
        eyebrow={t("مساحتك الصحية", "YOUR CARE SPACE", "מרחב הבריאות שלך")}
        title={t(
          "كل ما يهمك، في مكانك.",
          "Your health, a little more organized.",
          "הבריאות שלך, קצת יותר מסודרת.",
        )}
        description={t(
          "مواعيدك، أطباؤك، وخطوتك القادمة. البيانات تبقى لهذه الجلسة فقط.",
          "Your visits, your doctors, your next step. Demo data lasts for this session only.",
          "התורים, הרופאים והצעד הבא שלך. נתוני ההדגמה נשמרים למפגש הנוכחי בלבד.",
        )}
      >
        <Link className="button" href="/doctors">
          {t("احجز موعدًا", "Book a visit", "קביעת תור")}
          <Arrow />
        </Link>
      </PageHeading>
      <div className="dashboard-banner">
        <Brand sal />
        <div>
          <h3>
            {t(
              "كيف يمكننا مساعدتك اليوم؟",
              "What’s on your mind today?",
              "מה מטריד אותך היום?",
            )}
          </h3>
          <p>
            {t(
              "ابدأ من حيث أنت. SAL يساعدك على ترتيب الخطوة التالية.",
              "Start where you are. SAL can help organize your next step.",
              "התחילו היכן שאתם. SAL יעזור לארגן את הצעד הבא.",
            )}
          </p>
        </div>
        <Link className="text-link" href="/sal">
          {t("تحدث مع SAL", "Talk to SAL", "שיחה עם SAL")}
          <Arrow />
        </Link>
      </div>
      <div
        className="tabs"
        role="tablist"
        onKeyDown={handleTabNavigation}
        aria-label={t("مساحتي الصحية", "My care sections", "אזורי הבריאות שלי")}
      >
        {tabs.map((item) => (
          <button
            role="tab"
            tabIndex={tab === item.id ? 0 : -1}
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            id={`tab-${item.id}`}
            key={item.id}
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
          >
            <item.icon size={18} />
            {item.label}
            {item.id === "appointments" && (
              <span>
                {appointments.filter((a) => a.status === "upcoming").length}
              </span>
            )}
          </button>
        ))}
      </div>
      <section
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="dashboard-content"
      >
        {tab === "appointments" && (
          <>
            <h2>
              {t("المواعيد القادمة", "Upcoming appointments", "התורים הבאים")}
            </h2>
            {appointments.length === 0 ? (
              <div className="empty-state">
                <CalendarDays />
                <h3>
                  {t(
                    "مكان لخطوتك القادمة.",
                    "A space for your next step.",
                    "מקום לצעד הבא שלך.",
                  )}
                </h3>
                <p>
                  {t(
                    "عندما تحجز موعدًا تجريبيًا، ستجده هنا.",
                    "Your demo appointments will appear here once you book.",
                    "התורים לדוגמה יופיעו כאן לאחר ההזמנה.",
                  )}
                </p>
                <Link className="button outline" href="/doctors">
                  {t("استكشف الأطباء", "Explore doctors", "גלו רופאים")}
                  <Arrow />
                </Link>
              </div>
            ) : (
              appointments.map((a) => {
                const d = doctors.find((d) => d.id === a.doctorId)!;
                return (
                  <article className="appointment-row" key={a.id}>
                    <Avatar doctor={d} />
                    <div>
                      <h3>{d.name[locale]}</h3>
                      <p>
                        {a.consultation === "video"
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
                      </p>
                      <p>
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                        }).format(new Date(`${a.date}T12:00:00`))}{" "}
                        · <bdi>{a.time}</bdi>
                      </p>
                    </div>
                    <span className="tag">
                      {a.status === "upcoming"
                        ? t(
                            "مؤكد · تجريبي",
                            "Confirmed · Demo",
                            "מאושר · הדגמה",
                          )
                        : t("ملغى", "Cancelled", "בוטל")}
                    </span>
                    {a.status === "upcoming" &&
                      (cancel === a.id ? (
                        <div className="cancel-actions">
                          <span>
                            {t(
                              "إلغاء هذا الموعد؟",
                              "Cancel this visit?",
                              "לבטל את התור?",
                            )}
                          </span>
                          <button
                            className="text-link error-text"
                            onClick={() => {
                              setAppointments((prev) =>
                                prev.map((item) =>
                                  item.id === a.id
                                    ? { ...item, status: "cancelled" }
                                    : item,
                                ),
                              );
                              setCancel(null);
                            }}
                          >
                            {t("نعم، إلغاء", "Yes, cancel", "כן, לבטל")}
                          </button>
                          <button
                            className="text-link"
                            onClick={() => setCancel(null)}
                          >
                            {t("احتفظ به", "Keep it", "להשאיר")}
                          </button>
                        </div>
                      ) : (
                        <button
                          className="text-link muted"
                          onClick={() => setCancel(a.id)}
                        >
                          {t("إلغاء الموعد", "Cancel visit", "ביטול תור")}
                        </button>
                      ))}
                  </article>
                );
              })
            )}
            <h2 className="mt-10">
              {t("الزيارات السابقة", "Previous visits", "ביקורים קודמים")}
            </h2>
            <p className="muted">
              {t(
                "لا توجد زيارات سابقة في هذه الجلسة.",
                "No previous visits in this session.",
                "אין ביקורים קודמים במפגש הזה.",
              )}
            </p>
          </>
        )}
        {tab === "saved" && (
          <>
            <h2>
              {t("أطباء اخترتهم أنت", "People you’ve saved", "הרופאים ששמרת")}
            </h2>
            {saved.length ? (
              <div className="doctor-grid">
                {doctors
                  .filter((d) => saved.includes(d.id))
                  .map((d) => (
                    <DoctorCard key={d.id} doctor={d} />
                  ))}
              </div>
            ) : (
              <div className="empty-state">
                <Bookmark />
                <h3>
                  {t(
                    "أبقِ خياراتك قريبة.",
                    "Keep good options close.",
                    "שמרו אפשרויות טובות קרוב.",
                  )}
                </h3>
                <p>
                  {t(
                    "اضغط علامة الحفظ على أي طبيب ليظهر هنا.",
                    "Tap the bookmark on any doctor to find them here.",
                    "לחצו על סימניית הרופא כדי למצוא אותו כאן.",
                  )}
                </p>
                <Link className="text-link" href="/doctors">
                  {t("استكشف الأطباء", "Explore doctors", "גלו רופאים")}
                  <Arrow />
                </Link>
              </div>
            )}
          </>
        )}
        {tab === "history" && (
          <>
            <h2>
              {t(
                "محادثاتك مع SAL",
                "Your conversations with SAL",
                "השיחות שלך עם SAL",
              )}
            </h2>
            <div className="empty-state">
              <Brand sal />
              <h3>
                {messages.length
                  ? t(
                      "محادثتك الحالية محفوظة هنا",
                      "Your current conversation is here",
                      "השיחה הנוכחית שלך כאן",
                    )
                  : t(
                      "كل رحلة تبدأ بكلمة.",
                      "Every journey begins with a word.",
                      "כל מסע מתחיל במילה.",
                    )}
              </h3>
              <p>
                {messages.length
                  ? t(
                      `${messages.length} رسائل في هذه الجلسة`,
                      `${messages.length} messages in this session`,
                      `${messages.length} הודעות במפגש הזה`,
                    )
                  : t(
                      "ابدأ محادثتك الأولى عندما تكون مستعدًا.",
                      "Start your first conversation whenever you’re ready.",
                      "התחילו את השיחה הראשונה כשאתם מוכנים.",
                    )}
              </p>
              <Link className="button" href="/sal">
                {messages.length
                  ? t("تابع المحادثة", "Continue conversation", "המשך שיחה")
                  : t("ابدأ مع SAL", "Start with SAL", "מתחילים עם SAL")}
                <Arrow />
              </Link>
            </div>
          </>
        )}
        {tab === "documents" && (
          <>
            <h2>
              {t(
                "مستنداتك الطبية",
                "Your medical documents",
                "המסמכים הרפואיים שלך",
              )}
            </h2>
            <p className="muted">
              {t(
                "معاينة محلية فقط. نعرض اسم الملف وحجمه دون قراءة محتواه أو رفعه. استخدم ملفات وهمية.",
                "Local preview only. We display the filename and size without reading or uploading the contents. Use sample files.",
                "תצוגה מקומית בלבד. מוצגים שם וגודל הקובץ בלי לקרוא או להעלות את התוכן. השתמשו בקובצי דוגמה.",
              )}
            </p>
            <label className="upload-zone">
              <Upload />
              <b>{t("اختر مستندًا", "Choose a document", "בחירת מסמך")}</b>
              <span>
                PDF, JPG, PNG ·{" "}
                {t("حتى 10 ميجابايت", "Up to 10 MB", "עד 10 MB")}
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (
                    file.size > 10 * 1024 * 1024 ||
                    !["application/pdf", "image/jpeg", "image/png"].includes(
                      file.type,
                    )
                  ) {
                    setError(
                      t(
                        "اختر ملف PDF أو صورة بحجم أقل من 10 ميجابايت.",
                        "Choose a PDF or image under 10 MB.",
                        "בחרו PDF או תמונה עד 10 MB.",
                      ),
                    );
                  } else {
                    setError("");
                    setFiles((prev) => [
                      ...prev,
                      {
                        id: crypto.randomUUID(),
                        name: file.name,
                        size: file.size,
                      },
                    ]);
                  }
                  e.target.value = "";
                }}
              />
            </label>
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
            {files.map((f) => (
              <div className="document-row" key={f.id}>
                <FileText />
                <div>
                  <b>{f.name}</b>
                  <small>
                    {(f.size / 1024).toFixed(1)} KB ·{" "}
                    {t("محلي فقط", "Local only", "מקומי בלבד")}
                  </small>
                </div>
                <ArrowDownToLine size={16} />
                <button
                  className="icon-button"
                  aria-label={t(
                    "إزالة المستند",
                    "Remove document",
                    "הסרת מסמך",
                  )}
                  onClick={() =>
                    setFiles((prev) => prev.filter((item) => item.id !== f.id))
                  }
                >
                  <X size={17} />
                </button>
              </div>
            ))}
          </>
        )}
      </section>
      <DemoNote />
    </div>
  );
}
