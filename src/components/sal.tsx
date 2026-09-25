"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Send,
  RotateCcw,
  ShieldCheck,
  Check,
  AlertTriangle,
  Stethoscope,
} from "lucide-react";
import { useClinic, emptyIntake } from "./provider";
import { Brand, Arrow } from "./ui";
const redFlags =
  /chest|breath|suicid|bleeding|unconscious|صدر|تنفس|نزيف|انتحار|وعي|חזה|נשימ|דימום|הכרה|אובדנ/i;
export function SalPage() {
  const { t, messages, setMessages, intake, setIntake, chatStep, setChatStep } =
    useClinic();
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const urgent = chatStep === -1;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const questions = [
    t(
      "أهلًا، أنا SAL. أساعدك على ترتيب مخاوفك الصحية والاستعداد لزيارة الطبيب. ما الذي يشغلك اليوم؟",
      "Hi, I’m SAL. I’ll help you organize your health concerns and prepare for a doctor’s visit. What’s on your mind today?",
      "שלום, אני SAL. אעזור לארגן את החששות הבריאותיים ולהתכונן לביקור אצל רופא. מה מטריד אתכם היום?",
    ),
    t(
      "شكرًا لمشاركتك. منذ متى تشعر بذلك؟",
      "Thank you for sharing. How long have you felt this way?",
      "תודה ששיתפתם. כמה זמן אתם מרגישים כך?",
    ),
    t(
      "كيف تصف شدة ما تشعر به؟",
      "How would you describe the severity?",
      "איך הייתם מתארים את חומרת התחושה?",
    ),
    t(
      "ما عمرك؟ أدخل رقمًا بين 1 و120 لهذه التجربة.",
      "How old are you? Enter a number from 1 to 120 for this demo.",
      "בני כמה אתם? הזינו מספר בין 1 ל־120 להדגמה.",
    ),
    t(
      "في أي مدينة تفضّل زيارة الطبيب؟",
      "Which city would you prefer for your visit?",
      "באיזו עיר תעדיפו לבקר אצל הרופא?",
    ),
  ];
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (messages.length)
      end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, typing]);
  function submit(value: string) {
    if (!value.trim() || typing || chatStep >= 5 || urgent) return;
    if (
      chatStep === 3 &&
      (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 120)
    )
      return;
    const dangerous =
      redFlags.test(value) ||
      (chatStep === 2 && value === t("شديد", "Severe", "חמור"));
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: value },
    ]);
    setDraft("");
    setTyping(true);
    setIntake((prev) => ({
      ...prev,
      [["concern", "duration", "severity", "age", "city"][chatStep]]: value,
    }));
    if (dangerous) {
      setChatStep(-1);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: t(
            "قد تحتاج هذه الأعراض إلى رعاية عاجلة. لا تنتظر محادثة SAL أو موعدًا عبر الإنترنت. تواصل فورًا مع خدمات الطوارئ المحلية إذا كانت الأعراض شديدة أو تشعر أنك في خطر. هذا النموذج لا يستطيع تقييم حالتك.",
            "These symptoms may need urgent attention. Do not wait for SAL or an online appointment. Contact local emergency services immediately if symptoms are severe or you feel in danger. This prototype cannot assess your condition.",
            "התסמינים עשויים לדרוש טיפול דחוף. אל תחכו ל־SAL או לתור מקוון. פנו מיד לשירותי החירום המקומיים אם התסמינים חמורים או שאתם בסכנה. אב הטיפוס אינו יכול להעריך את מצבכם.",
          ),
        },
      ]);
    } else {
      setChatStep(chatStep + 1);
      if (chatStep < 4)
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: questions[chatStep + 1],
          },
        ]);
    }
    timer.current = setTimeout(() => setTyping(false), 650);
  }
  function reset() {
    if (timer.current) clearTimeout(timer.current);
    setTyping(false);
    setMessages([]);
    setIntake(emptyIntake);
    setChatStep(0);
    setDraft("");
  }
  const options =
    chatStep === 1
      ? [
          t("اليوم", "Today", "היום"),
          t("منذ أيام", "A few days", "כמה ימים"),
          t("منذ أسابيع", "A few weeks", "כמה שבועות"),
          t("أكثر من شهر", "Over a month", "יותר מחודש"),
        ]
      : chatStep === 2
        ? [
            t("خفيف", "Mild", "קל"),
            t("متوسط", "Moderate", "בינוני"),
            t("شديد", "Severe", "חמור"),
          ]
        : chatStep === 4
          ? [
              t("حيفا", "Haifa", "חיפה"),
              t("الناصرة", "Nazareth", "נצרת"),
              t("تل أبيب–يافا", "Tel Aviv–Jaffa", "תל אביב–יפו"),
            ]
          : [];
  return (
    <div className="container sal-page">
      <div className="sal-page-top">
        <div className="flex items-center gap-3">
          <Brand sal />
          <div>
            <h1>
              SAL{" "}
              <span>
                {t(
                  "رفيق رحلتك الصحية",
                  "Your care companion",
                  "השותף שלך לבריאות",
                )}
              </span>
            </h1>
            <small>
              <i className="live-dot" />
              {t("هنا ليستمع إليك", "Here to listen", "כאן כדי להקשיב")}
            </small>
          </div>
        </div>
        <button className="text-link" onClick={reset}>
          <RotateCcw size={16} />
          {t("بداية جديدة", "Start fresh", "התחלה חדשה")}
        </button>
      </div>
      <div className="sal-layout">
        <aside className="journey-sidebar">
          <span className="caps">YOUR CARE JOURNEY</span>
          <h2>
            {t("خطوة بخطوة، معك.", "One step at a time.", "צעד אחר צעד.")}
          </h2>
          <ol>
            {[
              t("نسمعك", "Your story", "הסיפור שלך"),
              t("نفهم التفاصيل", "The details", "הפרטים"),
              t("نوضح الخطوة القادمة", "Your next step", "הצעד הבא"),
              t("نجد الطبيب المناسب", "Your doctor", "הרופא שלך"),
            ].map((s, i) => (
              <li
                className={
                  (chatStep === 0 ? 0 : chatStep < 5 ? 1 : 2) >= i
                    ? "current"
                    : ""
                }
                key={s}
              >
                <span>
                  {i < (chatStep === 0 ? 0 : chatStep < 5 ? 1 : 2) ? (
                    <Check size={14} />
                  ) : (
                    i + 1
                  )}
                </span>
                {s}
              </li>
            ))}
          </ol>
          <div className="privacy-note">
            <ShieldCheck size={22} />
            <h3>
              {t(
                "مساحة مريحة للمحادثة",
                "Room to talk, at your pace",
                "מרחב לשיחה בקצב שלך",
              )}
            </h3>
            <p>
              {t(
                "تجربة إرشادية، وليست تشخيصًا. لا تدخل بيانات صحية حقيقية. تُمسح المحادثة عند تحديث الصفحة.",
                "A guided demo, not a diagnosis. Use fictional health details. Your conversation clears on refresh.",
                "הדגמה מודרכת, לא אבחנה. השתמשו בפרטים בדיוניים. השיחה נמחקת ברענון.",
              )}
            </p>
          </div>
        </aside>
        <section className="chat-panel">
          <div className="chat-header">
            <span>
              {t("لنتحدث عنك", "LET’S TALK ABOUT YOU", "בואו נדבר עליכם")}
            </span>
            <span className="tag">
              {t("تجربة SAL", "SAL demo", "הדגמת SAL")}
            </span>
          </div>
          <div
            className="chat-messages"
            role="log"
            aria-live="polite"
            aria-label="SAL conversation"
          >
            <div className="message assistant">
              <Brand sal />
              <div>{questions[0]}</div>
            </div>
            {messages
              .filter(
                (m, i) =>
                  !(
                    typing &&
                    m.role === "assistant" &&
                    i === messages.length - 1
                  ),
              )
              .map((m) => (
                <div key={m.id} className={`message ${m.role}`}>
                  {m.role === "assistant" && <Brand sal />}
                  <div>{m.text}</div>
                </div>
              ))}
            {typing && (
              <div className="message assistant">
                <Brand sal />
                <div
                  className="typing"
                  aria-label={t("SAL يكتب", "SAL is typing", "SAL מקליד")}
                >
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            )}
            {urgent && !typing && (
              <div className="urgent-note" role="alert">
                <AlertTriangle />
                <div>
                  <b>
                    {t(
                      "الأولوية لسلامتك",
                      "Your safety comes first",
                      "הבטיחות שלך קודמת",
                    )}
                  </b>
                  <p>
                    {t(
                      "لا يمكن متابعة الحجز من هذا المسار. اطلب مساعدة طبية مباشرة.",
                      "Booking is paused on this path. Please seek direct medical assistance.",
                      "ההזמנה נעצרה במסלול זה. פנו לעזרה רפואית ישירה.",
                    )}
                  </p>
                </div>
              </div>
            )}
            {chatStep === 5 && !typing && (
              <div className="sal-result">
                <span className="tag">
                  <Check size={14} />
                  {t("ملخص رحلتك", "Your visit brief", "סיכום הביקור")}
                </span>
                <h2>
                  {t(
                    "الصورة أصبحت أوضح.",
                    "A little more clarity.",
                    "קצת יותר בהירות.",
                  )}
                </h2>
                <dl>
                  {[
                    [t("ما يشغلك", "Your concern", "החשש שלך"), intake.concern],
                    [t("المدة", "Duration", "משך"), intake.duration],
                    [t("الشدة", "Severity", "חומרה"), intake.severity],
                    [t("العمر", "Age", "גיל"), intake.age],
                    [t("المدينة", "City", "עיר"), intake.city],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="recommendation">
                  <Stethoscope />
                  <div>
                    <b>
                      {t(
                        "استكشف طب العائلة",
                        "Explore family medicine",
                        "גלו רפואת משפחה",
                      )}
                    </b>
                    <p>
                      {t(
                        "وجهة توضيحية ثابتة في هذا النموذج، وليست توصية طبية مبنية على أعراضك.",
                        "A fixed example destination in this prototype, not a medical recommendation based on your symptoms.",
                        "יעד קבוע להדגמה, לא המלצה רפואית המבוססת על התסמינים שלך.",
                      )}
                    </p>
                  </div>
                </div>
                <Link className="button" href="/doctors?specialty=family">
                  {t("استكشف الأطباء", "Explore doctors", "גלו רופאים")}
                  <Arrow />
                </Link>
              </div>
            )}
            <div ref={end} />
          </div>
          {chatStep < 5 && !urgent && (
            <div className="composer-area">
              {!typing && options.length > 0 && (
                <div className="quick-options">
                  {options.map((o) => (
                    <button key={o} onClick={() => submit(o)}>
                      {o}
                    </button>
                  ))}
                </div>
              )}
              {chatStep === 0 && messages.length === 0 && (
                <div className="suggestions">
                  <span>
                    {t("جرّب مثالًا:", "Try an example:", "נסו דוגמה:")}
                  </span>
                  <button
                    onClick={() =>
                      submit(
                        t(
                          "أريد ترتيب زيارة فحص عام",
                          "I’d like to plan a general checkup",
                          "אני רוצה לתכנן בדיקה כללית",
                        ),
                      )
                    }
                  >
                    {t("أريد فحصًا عامًا", "A general checkup", "בדיקה כללית")}
                    <Arrow diagonal />
                  </button>
                </div>
              )}
              <form
                className="composer"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(draft);
                }}
              >
                <input
                  aria-label={t(
                    "رسالتك إلى SAL",
                    "Your message to SAL",
                    "ההודעה שלך ל־SAL",
                  )}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={
                    chatStep === 3
                      ? t(
                          "عمرك بالأرقام…",
                          "Your age in numbers…",
                          "הגיל שלך במספרים…",
                        )
                      : t(
                          "اكتب هنا، نحن نسمعك…",
                          "Write here. We’re listening…",
                          "כתבו כאן. אנחנו מקשיבים…",
                        )
                  }
                  type={chatStep === 3 ? "number" : "text"}
                  min={1}
                  max={120}
                  maxLength={1000}
                  required
                  disabled={typing}
                />
                <button
                  className="send-button"
                  disabled={!draft.trim() || typing}
                  aria-label={t("إرسال", "Send message", "שליחה")}
                >
                  <Send size={19} />
                </button>
              </form>
              <p className="composer-note">
                {t(
                  "تجربة فقط · استخدم معلومات وهمية. لا يقدم SAL نصيحة طبية.",
                  "Demo only · Use fictional details. SAL does not provide medical advice.",
                  "הדגמה בלבד · השתמשו בפרטים בדיוניים. SAL אינו מספק ייעוץ רפואי.",
                )}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
