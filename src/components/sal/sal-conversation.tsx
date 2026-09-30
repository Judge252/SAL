"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowUpRight, ShieldCheck } from "lucide-react";
import { useClinic } from "../provider";
import { useSALSession } from "./sal-session";
import { type SALState } from "./sal-character";
import { SALHero } from "./sal-hero";
import { SALMessage } from "./sal-message";
import { SALInput } from "./sal-input";
import { DoctorRecommendation } from "./doctor-recommendation";
import { authDestination } from "@/lib/auth-navigation";

export function SALConversation({
  fullPage = false,
  historyId,
}: {
  fullPage?: boolean;
  historyId?: string;
}) {
  const { user, authLoading, authError, t } = useClinic();
  const session = useSALSession();
  const { loadConversation } = session;
  const router = useRouter();
  const inputId = useId();
  const transcript = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const patient = user?.role === "patient";
  const hasConversation = session.messages.length > 0;
  const state: SALState =
    session.busy || session.loading
      ? "thinking"
      : focused || session.draft
        ? "listening"
        : session.reply
          ? session.reply.doctors.length && !session.reply.urgent
            ? "recommendation"
            : "responding"
          : "idle";
  useEffect(() => {
    if (historyId && patient) void loadConversation(historyId);
  }, [historyId, patient, loadConversation]);
  useEffect(() => {
    if (!hasConversation) return;
    const element = transcript.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [hasConversation, session.messages.length, session.busy]);
  function reset() {
    session.reset();
    if (historyId) router.replace("/sal", { scroll: false });
  }
  return (
    <section
      className={`sal-experience ${fullPage ? "sal-experience-full" : ""}`}
      id="start-with-sal"
      aria-labelledby="sal-intro-heading"
    >
      <SALHero state={state} started={hasConversation} />
      <div className={`sal-desk ${hasConversation ? "has-conversation" : ""}`}>
        {!hasConversation && <div className="sal-consultation-intro">
          <span className="sal-consultation-label"><i aria-hidden="true" />{t("مساحتك للحديث", "YOUR SPACE TO TALK", "המקום שלכם לדבר")}</span>
          <h2>{t("ما الذي يشغلك اليوم؟", "What brings you here today?", "מה מטריד אתכם היום?")}</h2>
          <p>{t("ابدأ بما تشعر به، وسنرتّب الخطوة التالية معًا.", "Start with how you feel. We’ll find your next step together.", "התחילו במה שאתם מרגישים. נמצא יחד את הצעד הבא.")}</p>
          <ol className="sal-journey" aria-label={t("رحلتك مع SAL", "Your journey with SAL", "המסע שלכם עם SAL")}>
            <li aria-current="step"><span>01</span>{t("نتحدث", "Talk", "מדברים")}</li>
            <li><span>02</span>{t("نختار طبيبًا", "Find care", "בוחרים טיפול")}</li>
            <li><span>03</span>{t("نحجز موعدًا", "Book a visit", "קובעים תור")}</li>
          </ol>
        </div>}
        <div className="sal-desk-header">
          <div>
            <span className="sal-desk-label">
              {t("مساحة للحديث", "LET’S TALK", "מקום לשיחה")}
            </span>
            <span className="sal-desk-status" role="status">
              {state === "thinking"
                ? t(
                    "SAL يراجع رسالتك",
                    "SAL is considering your message",
                    "SAL בודק את ההודעה",
                  )
                : state === "listening"
                  ? t(
                      "خذ وقتك، أنا أستمع",
                      "Take your time. I’m listening",
                      "קחו את הזמן, אני מקשיב",
                    )
                  : state === "responding" || state === "recommendation"
                    ? t(
                        "لنراجع الخطوة التالية",
                        "Let’s review your next step",
                        "נבחן יחד את הצעד הבא",
                      )
                    : t(
                        "معك في الخطوة التالية",
                        "Here for your next step",
                        "כאן לצעד הבא שלכם",
                      )}
            </span>
          </div>
          {hasConversation ? (
            <button
              className="sal-new-conversation"
              disabled={session.busy || session.loading}
              onClick={reset}
              aria-label={t("محادثة جديدة", "New conversation", "שיחה חדשה")}
            >
              <Plus size={19} />
              <span>{t("جديدة", "New", "חדשה")}</span>
            </button>
          ) : (
            <span className="sal-desk-signature" aria-hidden="true">
              SAL.
            </span>
          )}
        </div>
        <div
          ref={transcript}
          className="sal-transcript"
          role="log"
          aria-label={t(
            "المحادثة مع SAL",
            "Conversation with SAL",
            "השיחה עם SAL",
          )}
          aria-live="polite"
          aria-busy={session.loading}
          tabIndex={hasConversation ? 0 : -1}
        >
          {session.loading ? (
            <p className="sal-history-loading">
              {t(
                "جارٍ استعادة محادثتك…",
                "Loading your conversation…",
                "טוענים את השיחה…",
              )}
            </p>
          ) : (
            session.messages.map((message) => (
              <SALMessage key={message.id} message={message} />
            ))
          )}
          {session.busy ? (
            <div className="sal-thinking" role="status">
              <span className="sal-thinking-bars" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <div>
                <b>
                  {t(
                    "أفكر في الخطوة المناسبة",
                    "Considering your next step",
                    "בודק את הצעד הבא",
                  )}
                </b>
                <p>
                  {t(
                    "أراجع رسالتك وسياق المحادثة.",
                    "Reviewing your message and the conversation.",
                    "בודק את ההודעה ואת הקשר השיחה.",
                  )}
                </p>
              </div>
            </div>
          ) : null}
          {session.reply?.urgent ? (
            <div className="sal-urgent" role="alert">
              <strong>
                {t(
                  "قد تحتاج إلى مساعدة عاجلة",
                  "You may need urgent help",
                  "ייתכן שיש צורך בעזרה דחופה",
                )}
              </strong>
              <p>
                {t(
                  "إذا كنت في خطر أو تشعر بأعراض شديدة، اتصل بخدمات الطوارئ المحلية الآن. لا تنتظر ردًا هنا.",
                  "If you are in danger or experiencing severe symptoms, contact local emergency services now. Do not wait for a reply here.",
                  "אם אתם בסכנה או חווים תסמינים חמורים, פנו כעת לשירותי החירום המקומיים. אל תחכו לתשובה כאן.",
                )}
              </p>
            </div>
          ) : null}
          {session.reply?.sources.length ? (
            <details className="sal-sources">
              <summary>
                {t(
                  "المصادر التي استند إليها SAL",
                  "Sources used by SAL",
                  "מקורות ששימשו את SAL",
                )}{" "}
                ({session.reply.sources.length})
              </summary>
              <ul>
                {session.reply.sources.map((source) => (
                  <li key={source.id}>{source.title}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
        {session.reply &&
        !session.reply.urgent &&
        session.reply.doctors.length > 0 ? (
          <a className="sal-results-jump" href="#sal-recommendations-title">
            {t(
              "راجع خيارات الأطباء أدناه",
              "Review doctor options below",
              "בדקו את אפשרויות הרופאים בהמשך",
            )}
            <ArrowUpRight size={17} />
          </a>
        ) : null}
        {session.error || authError ? (
          <div className="sal-request-error" role="alert">
            <p>
              {session.error ||
                t(
                  "تعذّر التحقق من حسابك. حاول تسجيل الدخول مجددًا.",
                  "We couldn’t verify your account. Please sign in again.",
                  "לא הצלחנו לאמת את החשבון. נסו להתחבר שוב.",
                )}
            </p>
            {session.error && !user ? (
              <button
                type="button"
                className="text-link"
                disabled={session.busy || authLoading}
                onClick={() => void session.send()}
              >
                {t("إعادة المحاولة", "Try again", "ניסיון נוסף")}
              </button>
            ) : (
              <Link href={session.error ? "/dashboard" : "/auth?next=%2Fsal"}>
                {session.error
                  ? t(
                      "سجل المحادثات",
                      "Conversation history",
                      "היסטוריית שיחות",
                    )
                  : t("تسجيل الدخول", "Sign in", "התחברות")}
              </Link>
            )}
          </div>
        ) : null}
        {user && !patient ? (
          <div className="sal-account-note">
            <p>
              {t(
                "المحادثة الصحية متاحة لحسابات المرضى. يمكنك إدارة عملك من حسابك.",
                "Care conversations are available to patient accounts. You can manage your work from your account.",
                "שיחות בריאות זמינות לחשבונות מטופלים. אפשר לנהל את העבודה דרך החשבון.",
              )}
            </p>
            <Link href={authDestination(null, user.role)}>
              {t("العودة إلى حسابي", "Go to my account", "לחשבון שלי")}
            </Link>
          </div>
        ) : (
          <SALInput
            inputId={inputId}
            value={session.draft}
            onChange={session.setDraft}
            onFocusChange={setFocused}
            busy={session.busy}
            disabled={authLoading || session.loading || !!authError}
            started={hasConversation}
            onSubmit={(event) => {
              event.preventDefault();
              if (authLoading || authError || session.busy || session.loading)
                return;
              if (!session.draft.trim()) return;
              void session.send();
            }}
          />
        )}
        <div className="sal-desk-foot">
          <ShieldCheck size={16} aria-hidden="true" />
          <p>
            {!user
              ? t(
                  "جرّب SAL بدون حساب. المحادثة مؤقتة وتُرسل إلى Gemini للرد.",
                  "No account needed. This conversation is temporary and sent to Gemini to respond.",
                  "אין צורך בחשבון. השיחה זמנית ונשלחת ל־Gemini לקבלת תשובה.",
                )
              : t(
                  "تُحفظ المحادثة في حسابك، وتُرسل الرسائل وسياقها إلى Gemini.",
                  "Conversations are saved to your account. Messages and context are sent to Gemini.",
                  "השיחות נשמרות בחשבון. ההודעות וההקשר נשלחים ל־Gemini.",
                )}
          </p>
        </div>
      </div>
      <div className="sal-experience-boundary">
        <p>
          {t(
            "SAL يساعدك في الوصول إلى الرعاية. لا يقدّم تشخيصًا أو علاجًا.",
            "SAL helps you navigate care. It does not diagnose or prescribe treatment.",
            "SAL עוזר לנווט בטיפול. הוא אינו מאבחן או רושם טיפול.",
          )}
        </p>
        <Link href="/dashboard">
          {t("محادثاتي السابقة", "My conversations", "השיחות שלי")}
          <ArrowUpRight size={15} />
        </Link>
      </div>
      {session.reply && !session.reply.urgent ? (
        <section
          className="sal-recommendations"
          aria-labelledby="sal-recommendations-title"
        >
          <div className="sal-recommendations-title">
            <span className="section-kicker">
              {t(
                "من المحادثة إلى الرعاية",
                "FROM CONVERSATION TO CARE",
                "מהשיחה לטיפול",
              )}
            </span>
            <h2 id="sal-recommendations-title">
              {session.reply.doctors.length
                ? t(
                    "لنراجع هذه الخيارات معًا.",
                    "Let’s look at your options.",
                    "נבחן יחד את האפשרויות.",
                  )
                : t(
                    "لنُكمل الصورة أولًا.",
                    "Let’s understand a little more.",
                    "נשלים קודם את התמונה.",
                  )}
            </h2>
            <p>
              {session.reply.doctors.length
                ? t(
                    "هذه النتائج أعادها SAL. قارن التفاصيل، ثم اختر الخدمة والموعد المناسبين لك.",
                    "These results were returned by SAL. Compare the details, then choose your service and appointment.",
                    "אלה התוצאות שהחזיר SAL. השוו את הפרטים, ואז בחרו שירות ומועד שמתאימים לכם.",
                  )
                : t(
                    "لم يُرجع SAL أطباء في هذه الخطوة. يمكنك إضافة تفاصيل للمحادثة أو البحث يدويًا.",
                    "SAL did not return doctors at this step. Add more detail to the conversation, or search the directory.",
                    "SAL לא החזיר רופאים בשלב זה. אפשר להוסיף פרטים לשיחה או לחפש במדריך.",
                  )}
            </p>
          </div>
          {session.reply.doctors.map((doctor, index) => (
            <DoctorRecommendation
              key={doctor.id}
              doctor={doctor}
              matchContext={session.reply?.match_context}
              index={index}
            />
          ))}
          {!session.reply.doctors.length ? (
            <Link className="text-link" href="/doctors">
              {t("البحث عن طبيب", "Search doctors", "חיפוש רופאים")}
              <ArrowUpRight size={17} />
            </Link>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
