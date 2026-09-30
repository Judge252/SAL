"use client";
import Link from "next/link";
import { useClinic } from "./provider";
import { CareSearch } from "./care-search";
import { SALConversation } from "./sal/sal-conversation";

export function HomePage() {
  const { t } = useClinic();
  const steps = [
    [t("احكِ بطريقتك", "Start in your own words", "ספרו במילים שלכם"), t("لا تحتاج إلى اختيار تخصص أولًا. أخبر SAL بما تشعر به.", "You don’t need to choose a specialty first. Tell SAL how you feel.", "אין צורך לבחור התמחות קודם. ספרו ל־SAL איך אתם מרגישים.")],
    [t("نفهم الخطوة التالية", "Find your next step", "מוצאים את הצעד הבא"), t("يساعدك SAL على فهم خيارات الرعاية والوصول إلى الطبيب المناسب.", "SAL helps you explore care options and find a suitable clinician.", "SAL עוזר לבחון אפשרויות טיפול ולמצוא רופא מתאים.")],
    [t("اختر زيارة تناسبك", "Choose a visit that fits", "בוחרים ביקור מתאים"), t("راجع الطبيب والأوقات المتاحة، ثم أرسل طلب الموعد.", "Review the clinician and available times, then request your appointment.", "בדקו את הרופא והמועדים הזמינים ושלחו בקשת תור.")],
  ];
  return <div className="sal-home">
    <div className="sal-product-opening"><div className="container"><SALConversation /></div></div>
    <section className="container sal-how" aria-label={t("كيف يساعدك SAL", "How SAL helps", "איך SAL עוזר")}>
      <ol className="sal-how-steps">{steps.map(([title, text], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
    </section>
    <section className="container sal-manual-search" id="manual-search">
      <div className="sal-section-heading">
        <span className="section-kicker">{t("تعرف من تبحث عنه؟", "ALREADY KNOW WHO YOU NEED?", "כבר יודעים את מי אתם מחפשים?")}</span>
        <h2>{t("يمكنك البحث بنفسك أيضًا.", "You can search directly, too.", "אפשר גם לחפש ישירות.")}</h2>
      </div>
      <CareSearch />
      <div className="sal-secondary-links">
        <Link href="/specialties">{t("جميع التخصصات", "Browse specialties", "לכל ההתמחויות")} ↗</Link>
        <Link href="/online">{t("خدمات الاستشارة", "Consultation services", "שירותי ייעוץ")} ↗</Link>
        <Link href="/information/privacy">{t("خصوصيتك", "Your privacy", "הפרטיות שלכם")} ↗</Link>
      </div>
    </section>
  </div>;
}
