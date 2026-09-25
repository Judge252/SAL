"use client";
import { useState } from "react";
import { CalendarDays, Clock3, Users, Check, Save } from "lucide-react";
import { PageHeading, Avatar, DemoNote, handleTabNavigation } from "./ui";
import { useClinic } from "./provider";
import { doctors, appointmentDays, appointmentTimes } from "@/lib/data";
export function DoctorWorkspace() {
  const { t, locale } = useClinic();
  const [tab, setTab] = useState("schedule");
  const [days] = useState(() => appointmentDays());
  const [day, setDay] = useState(days[0]);
  const [slots, setSlots] = useState<Record<string, string[]>>({});
  const [requests, setRequests] = useState([
    { id: 1, name: "S. A.", time: "09:00", status: "pending" },
    { id: 2, name: "M. K.", time: "10:30", status: "pending" },
  ]);
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("haifa");
  const [saved, setSaved] = useState(false);
  const openSlots = slots[day] ?? ["09:00", "10:30", "14:30"];
  return (
    <div className="container page">
      <PageHeading
        eyebrow={t(
          "مساحة الطبيب · تجريبية",
          "DOCTOR WORKSPACE · DEMO",
          "מרחב הרופא · הדגמה",
        )}
        title={t(
          "مساحة أكبر للرعاية.",
          "More space for good care.",
          "יותר מקום לטיפול טוב.",
        )}
        description={t(
          "نظرة واضحة ليومك، ووقت أكبر لمرضاك.",
          "A clearer view of your day. More time for your patients.",
          "תמונה ברורה של היום שלך. יותר זמן למטופלים.",
        )}
      >
        <div className="workspace-identity">
          <Avatar doctor={doctors[0]} />
          <div>
            <b>{doctors[0].name[locale]}</b>
            <small>{t("حساب توضيحي", "Demo account", "חשבון לדוגמה")}</small>
          </div>
        </div>
      </PageHeading>
      <div className="stat-grid">
        {[
          {
            icon: CalendarDays,
            value: "2",
            label: t("طلبات توضيحية", "Sample requests", "בקשות לדוגמה"),
          },
          {
            icon: Users,
            value: String(
              requests.filter((r) => r.status === "accepted").length,
            ),
            label: t("طلبات مقبولة", "Accepted requests", "בקשות שאושרו"),
          },
          {
            icon: Clock3,
            value: String(openSlots.length),
            label: t(
              "أوقات متاحة في اليوم المحدد",
              "Open slots on selected day",
              "זמנים פנויים ביום הנבחר",
            ),
          },
        ].map((s) => (
          <div className="stat" key={s.label}>
            <s.icon size={22} />
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <div
        className="tabs"
        role="tablist"
        onKeyDown={handleTabNavigation}
        aria-label={t(
          "مساحة الطبيب",
          "Doctor workspace sections",
          "אזורי מרחב הרופא",
        )}
      >
        {[
          {
            id: "schedule",
            label: t("جدول المواعيد", "Schedule", "לוח זמנים"),
          },
          {
            id: "requests",
            label: t("طلبات المرضى", "Patient requests", "בקשות מטופלים"),
          },
          {
            id: "profile",
            label: t("إدارة الملف", "Manage profile", "ניהול פרופיל"),
          },
        ].map((item) => (
          <button
            role="tab"
            tabIndex={tab === item.id ? 0 : -1}
            id={`doctor-tab-${item.id}`}
            aria-controls={`doctor-panel-${item.id}`}
            aria-selected={tab === item.id}
            key={item.id}
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <section
        className="dashboard-content"
        role="tabpanel"
        id={`doctor-panel-${tab}`}
        aria-labelledby={`doctor-tab-${tab}`}
      >
        {tab === "schedule" && (
          <>
            <div className="section-heading">
              <div>
                <h2>
                  {t(
                    "الأوقات التي تناسبك",
                    "Set your availability",
                    "קבעו את הזמינות שלכם",
                  )}
                </h2>
                <p>
                  {t(
                    "اضغط أي وقت لفتحه أو إغلاقه. التغييرات محلية لهذا النموذج فقط.",
                    "Select a time to open or close it. Changes stay in this demo only.",
                    "לחצו על שעה כדי לפתוח או לסגור אותה. השינויים מקומיים להדגמה.",
                  )}
                </p>
              </div>
              <span className="tag">
                {t("توقيت إسرائيل", "Israel local time", "שעון ישראל")}
              </span>
            </div>
            <div className="date-options">
              {days.map((d) => (
                <button
                  key={d}
                  className={day === d ? "selected" : ""}
                  aria-pressed={day === d}
                  onClick={() => setDay(d)}
                >
                  {new Intl.DateTimeFormat(locale, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  }).format(new Date(`${d}T12:00:00`))}
                </button>
              ))}
            </div>
            <div className="availability-grid">
              {appointmentTimes.map((time) => (
                <button
                  key={time}
                  className={openSlots.includes(time) ? "open" : ""}
                  aria-pressed={openSlots.includes(time)}
                  onClick={() =>
                    setSlots((prev) => ({
                      ...prev,
                      [day]: openSlots.includes(time)
                        ? openSlots.filter((s) => s !== time)
                        : [...openSlots, time],
                    }))
                  }
                >
                  <Clock3 />
                  <b>{time}</b>
                  <span>
                    {openSlots.includes(time)
                      ? t("متاح", "Available", "זמין")
                      : t("مغلق", "Closed", "סגור")}
                  </span>
                  {openSlots.includes(time) && <Check size={16} />}
                </button>
              ))}
            </div>
            <h2 className="mt-10">
              {t("المواعيد المقبولة", "Accepted appointments", "תורים שאושרו")}
            </h2>
            {requests.filter((r) => r.status === "accepted").length === 0 ? (
              <p className="muted">
                {t(
                  "اقبل طلبًا من تبويب طلبات المرضى ليظهر هنا.",
                  "Accept a request from Patient requests to see it here.",
                  "אשרו בקשה בלשונית בקשות מטופלים כדי לראות אותה כאן.",
                )}
              </p>
            ) : (
              requests
                .filter((r) => r.status === "accepted")
                .map((r) => (
                  <div className="appointment-row" key={r.id}>
                    <div className="tiny-avatar">{r.name}</div>
                    <b>
                      {t("مريض تجريبي", "Demo patient", "מטופל לדוגמה")}{" "}
                      {r.name}
                    </b>
                    <span>{r.time}</span>
                    <span className="tag">
                      {t("غدًا · مؤكد", "Tomorrow · Confirmed", "מחר · מאושר")}
                    </span>
                  </div>
                ))
            )}
          </>
        )}
        {tab === "requests" && (
          <>
            <h2>
              {t(
                "طلبات تنتظر ردك",
                "Waiting for your response",
                "ממתינים לתשובתך",
              )}
            </h2>
            {requests.map((r) => (
              <div className="appointment-row" key={r.id}>
                <div className="tiny-avatar">{r.name}</div>
                <div>
                  <h3>
                    {t("مريض تجريبي", "Demo patient", "מטופל לדוגמה")} {r.name}
                  </h3>
                  <p>
                    {t(
                      "زيارة أولى · غدًا",
                      "First visit · Tomorrow",
                      "ביקור ראשון · מחר",
                    )}{" "}
                    · {r.time}
                  </p>
                </div>
                {r.status === "pending" ? (
                  <div className="form-actions">
                    <button
                      className="button small"
                      onClick={() =>
                        setRequests((prev) =>
                          prev.map((x) =>
                            x.id === r.id ? { ...x, status: "accepted" } : x,
                          ),
                        )
                      }
                    >
                      {t("قبول", "Accept", "אישור")}
                    </button>
                    <button
                      className="button small outline"
                      onClick={() =>
                        setRequests((prev) =>
                          prev.map((x) =>
                            x.id === r.id ? { ...x, status: "declined" } : x,
                          ),
                        )
                      }
                    >
                      {t("اعتذار", "Decline", "דחייה")}
                    </button>
                  </div>
                ) : (
                  <span className="tag">
                    {r.status === "accepted"
                      ? t("تم القبول", "Accepted", "אושר")
                      : t("تم الاعتذار", "Declined", "נדחה")}
                  </span>
                )}
              </div>
            ))}
          </>
        )}
        {tab === "profile" && (
          <form
            className="profile-edit"
            onSubmit={(e) => {
              e.preventDefault();
              setSaved(true);
            }}
          >
            <h2>{t("ملفك التعريفي", "Your profile", "הפרופיל שלך")}</h2>
            <p className="muted">
              {t(
                "تعديلات تجريبية لهذه الصفحة فقط؛ لا تُنشر إلى دليل الأطباء.",
                "Demo edits for this page only; changes are not published to the directory.",
                "עריכות להדגמה בעמוד זה בלבד; הן אינן מתפרסמות במדריך.",
              )}
            </p>
            <label>
              {t("الاسم", "Name", "שם")}
              <input value={doctors[0].name[locale]} readOnly />
            </label>
            <label>
              {t("مدينة العيادة", "Clinic city", "עיר המרפאה")}
              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setSaved(false);
                }}
              >
                {["haifa", "nazareth", "jaffa"].map((c) => (
                  <option value={c} key={c}>
                    {doctors.find((d) => d.cityId === c)!.city[locale]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("نبذة عنك", "About you", "עליך")}
              <textarea
                value={bio}
                maxLength={600}
                required
                rows={4}
                placeholder={t(
                  "اكتب نبذة تعريفية…",
                  "Write a short introduction…",
                  "כתבו הקדמה קצרה…",
                )}
                onChange={(e) => {
                  setBio(e.target.value);
                  setSaved(false);
                }}
              />
            </label>
            <button className="button">
              <Save size={17} />
              {t(
                "حفظ التعديلات التجريبية",
                "Save demo changes",
                "שמירת שינויים לדוגמה",
              )}
            </button>
            {saved && (
              <p className="success-text" role="status">
                <Check size={16} />
                {t(
                  "تم حفظ التعديلات لهذه الصفحة.",
                  "Changes saved for this page.",
                  "השינויים נשמרו בעמוד זה.",
                )}
              </p>
            )}
          </form>
        )}
      </section>
      <DemoNote />
    </div>
  );
}
