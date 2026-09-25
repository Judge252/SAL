"use client";
import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  MapPin,
  Clock3,
} from "lucide-react";
import type { Doctor, ConsultationType } from "@/lib/types";
import { appointmentDays, appointmentTimes, specialties } from "@/lib/data";
import { clinicService } from "@/lib/services";
import { useClinic } from "./provider";
import { Avatar, Arrow, PageHeading, DemoNote } from "./ui";
export function Booking({
  doctor,
  initialMode,
  initialTime,
}: {
  doctor: Doctor;
  initialMode?: string;
  initialTime?: string;
}) {
  const { t, locale, appointments, setAppointments } = useClinic();
  const [step, setStep] = useState(1);
  const [days] = useState(() => appointmentDays(doctor.nextDay));
  const [day, setDay] = useState(days[0]);
  const [time, setTime] = useState(
    appointmentTimes.includes(initialTime ?? "") ? initialTime! : "",
  );
  const [consultation, setConsultation] = useState<ConsultationType>(
    initialMode === "video" && doctor.consultations.includes("video")
      ? "video"
      : "clinic",
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(`${date}T12:00:00`));
  async function confirm() {
    setBusy(true);
    setError("");
    try {
      if (
        appointments.some(
          (a) =>
            a.doctorId === doctor.id &&
            a.date === day &&
            a.time === time &&
            a.status === "upcoming",
        )
      )
        throw new Error("taken");
      const appointment = await clinicService.createAppointment({
        doctorId: doctor.id,
        date: day,
        time,
        consultation,
      });
      setAppointments((prev) => [...prev, appointment]);
      setReference(appointment.id.slice(0, 8).toUpperCase());
      setStep(3);
      setName("");
      setPhone("");
    } catch {
      setError(
        t(
          "هذا الموعد لم يعد متاحًا. اختر موعدًا آخر.",
          "This time is no longer available. Choose another slot.",
          "הזמן הזה אינו זמין. בחרו מועד אחר.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page booking-page">
      <PageHeading
        eyebrow={t("خطوتك القادمة", "YOUR NEXT STEP", "הצעד הבא")}
        title={
          step === 3
            ? t(
                "خطوة أقرب للاطمئنان.",
                "One step closer to clarity.",
                "צעד קרוב יותר לבהירות.",
              )
            : t(
                "موعد يناسب حياتك.",
                "Care that fits your day.",
                "טיפול שמתאים ליום שלך.",
              )
        }
        description={t(
          "رحلة حجز بسيطة، من اختيارك إلى تأكيدك.",
          "A simple journey, from choosing to confirming.",
          "תהליך פשוט, מבחירה ועד אישור.",
        )}
      />
      <ol className="booking-steps">
        {[
          t("الطبيب", "Doctor", "רופא"),
          t("الموعد", "Appointment", "מועד"),
          t("بياناتك", "Your details", "הפרטים שלך"),
          t("التأكيد", "Confirmation", "אישור"),
        ].map((label, i) => (
          <li className={i <= step ? "current" : ""} key={label}>
            <span>{i < step ? <Check size={15} /> : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <div className="booking-layout">
        <section className="booking-form">
          {step === 1 && (
            <>
              <fieldset className="consultation-picker">
                <legend>
                  {t("نوع الاستشارة", "Consultation type", "סוג הייעוץ")}
                </legend>
                {doctor.consultations.map((type) => (
                  <label
                    className={consultation === type ? "selected" : ""}
                    key={type}
                  >
                    <input
                      type="radio"
                      name="consultation"
                      value={type}
                      checked={consultation === type}
                      onChange={() => setConsultation(type)}
                    />
                    {type === "video"
                      ? t("استشارة فيديو", "Video consultation", "ייעוץ וידאו")
                      : t(
                          "زيارة في العيادة",
                          "In-clinic visit",
                          "ביקור במרפאה",
                        )}
                  </label>
                ))}
              </fieldset>
              <h2>
                {t("اختر يومًا ووقتًا", "Choose a day & time", "בחרו יום ושעה")}
              </h2>
              <p>
                {t(
                  "المواعيد حسب التوقيت المحلي لإسرائيل.",
                  "Appointments are in Israel local time.",
                  "התורים לפי השעון המקומי בישראל.",
                )}
              </p>
              <div className="date-options">
                {days.map((date) => (
                  <button
                    key={date}
                    aria-pressed={date === day}
                    className={date === day ? "selected" : ""}
                    onClick={() => {
                      setDay(date);
                      setTime("");
                    }}
                  >
                    {formatDate(date)}
                  </button>
                ))}
              </div>
              <h3>{t("الأوقات المتاحة", "Available times", "שעות זמינות")}</h3>
              <div className="time-options">
                {appointmentTimes.map((slot) => (
                  <button
                    key={slot}
                    disabled={appointments.some(
                      (a) =>
                        a.doctorId === doctor.id &&
                        a.date === day &&
                        a.time === slot &&
                        a.status === "upcoming",
                    )}
                    aria-pressed={time === slot}
                    className={time === slot ? "selected" : ""}
                    onClick={() => setTime(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              <button
                className="button"
                disabled={!time}
                onClick={() => setStep(2)}
              >
                {t(
                  "المتابعة إلى بياناتك",
                  "Continue to your details",
                  "המשך לפרטים שלך",
                )}
                <Arrow />
              </button>
            </>
          )}
          {step === 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void confirm();
              }}
            >
              <h2>
                {t(
                  "كيف نتواصل معك؟",
                  "How can we reach you?",
                  "איך ניצור איתך קשר?",
                )}
              </h2>
              <p>
                {t(
                  "استخدم بيانات وهمية لهذه التجربة. لا تُرسل البيانات إلى أي جهة.",
                  "Use fictional details for this demo. Nothing is sent to a clinic.",
                  "השתמשו בפרטים בדיוניים. דבר לא נשלח למרפאה.",
                )}
              </p>
              <label>
                {t("الاسم الكامل", "Full name", "שם מלא")}
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t(
                    "مثال: سارة أحمد",
                    "e.g. Sara Ahmad",
                    "לדוגמה: שרה אחמד",
                  )}
                />
              </label>
              <label>
                {t("رقم الهاتف", "Phone number", "מספר טלפון")}
                <input
                  required
                  type="tel"
                  pattern="[+]?[0-9 ]{9,19}"
                  title={t(
                    "أدخل أرقامًا ومسافات، مع علامة + اختيارية في البداية",
                    "Use digits and spaces, with an optional leading +",
                    "השתמשו בספרות ורווחים, עם + אפשרי בהתחלה",
                  )}
                  maxLength={20}
                  dir="ltr"
                  autoComplete="off"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="050 000 0000"
                />
              </label>
              <label className="check-label">
                <input type="checkbox" required />
                {t(
                  "أفهم أن هذا حجز تجريبي وليس موعدًا حقيقيًا.",
                  "I understand this is a demo booking, not a real appointment.",
                  "ברור לי שזו הזמנה לדוגמה ולא תור אמיתי.",
                )}
              </label>
              {error && (
                <p role="alert" className="error-text">
                  {error}
                </p>
              )}
              <div className="form-actions">
                <button
                  type="button"
                  className="button outline"
                  onClick={() => setStep(1)}
                >
                  {t("رجوع", "Back", "חזרה")}
                </button>
                <button className="button" disabled={busy}>
                  {busy
                    ? t("جارٍ التأكيد…", "Confirming…", "מאשר…")
                    : t(
                        "تأكيد الحجز التجريبي",
                        "Confirm demo booking",
                        "אישור הזמנה לדוגמה",
                      )}
                  <Arrow />
                </button>
              </div>
            </form>
          )}
          {step === 3 && (
            <div className="confirmation">
              <CheckCircle2 size={56} />
              <span className="tag">
                {t(
                  "تم حفظ الحجز في هذه الجلسة",
                  "Saved for this session",
                  "נשמר למפגש הזה",
                )}
              </span>
              <h2>
                {t(
                  "موعدك التجريبي جاهز.",
                  "Your demo visit is set.",
                  "התור לדוגמה מוכן.",
                )}
              </h2>
              <p>
                {t(
                  "لم يتم إرسال طلب أو رسالة إلى الطبيب. يمكنك إدارة هذا الموعد في مساحتك الصحية.",
                  "No request or message was sent to a doctor. Manage this appointment in your care space.",
                  "לא נשלחה בקשה או הודעה לרופא. אפשר לנהל את התור במרחב הבריאות שלך.",
                )}
              </p>
              <p className="reference">DEMO / {reference}</p>
              <Link href="/dashboard" className="button">
                {t("انتقل إلى مساحتي", "Go to my care", "למרחב הבריאות שלי")}
                <Arrow />
              </Link>
            </div>
          )}
        </section>
        <aside className="booking-summary">
          <span className="tag booking-type">
            {consultation === "video"
              ? t("استشارة فيديو", "Video consultation", "ייעוץ וידאו")
              : t("زيارة في العيادة", "In-clinic visit", "ביקור במרפאה")}
          </span>
          <span className="caps">YOUR VISIT, AT A GLANCE</span>
          <div className="summary-doctor">
            <Avatar doctor={doctor} />
            <div>
              <h3>{doctor.name[locale]}</h3>
              <p>{specialties[doctor.specialty][locale]}</p>
            </div>
          </div>
          <div className="summary-row">
            <MapPin size={18} />
            {doctor.city[locale]}
          </div>
          <div className="summary-row">
            <CalendarDays size={18} />
            {formatDate(day)}
          </div>
          <div className="summary-row">
            <Clock3 size={18} />
            {time || t("اختر وقتًا", "Choose a time", "בחרו שעה")}
          </div>
          {step < 3 && (
            <Link className="text-link" href="/doctors">
              {t("تغيير الطبيب", "Change doctor", "החלפת רופא")}
              <Arrow />
            </Link>
          )}
          <DemoNote />
        </aside>
      </div>
    </div>
  );
}
