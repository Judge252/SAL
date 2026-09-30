"use client";
import Link from "next/link";
import { useClinic } from "./provider";
import { PageHeading, Arrow } from "./ui";
export function InformationPage({
  section,
}: {
  section: "about" | "privacy" | "terms";
}) {
  const { t } = useClinic();
  const content = {
    about: {
      title: t(
        "رعاية تبدأ باختيار واضح.",
        "Care starts with a clear choice.",
        "טיפול מתחיל בבחירה ברורה.",
      ),
      intro: t(
        "The Clinic منصة للوصول إلى الأطباء واستكشاف التخصصات وتنظيم المواعيد، مع مساعدة SAL في التنقل بين خيارات الرعاية.",
        "The Clinic helps people find doctors, explore specialties and organize appointments, with SAL assisting in navigating care options.",
        "The Clinic עוזרת למצוא רופאים, לגלות התמחויות ולארגן תורים, בעזרת SAL לניווט באפשרויות הטיפול.",
      ),
      body: t(
        "نبدأ بتجربة عربية مع دعم العبرية والإنجليزية. تُدار حسابات المرضى والأطباء والمواعيد على المنصة مباشرة، وتُراجع ملفات الأطباء قبل نشرها.",
        "We start with an Arabic-first experience, with Hebrew and English support. Patient accounts, clinician profiles and appointments are managed directly on the platform, and clinician profiles are reviewed before publication.",
        "אנחנו מתחילים בחוויה בערבית, עם תמיכה בעברית ובאנגלית. חשבונות המטופלים, פרופילי הרופאים והתורים מנוהלים ישירות בפלטפורמה, ופרופילי הרופאים נבדקים לפני הפרסום.",
      ),
    },
    privacy: {
      title: t(
        "خصوصيتك على المنصة.",
        "Your privacy on the platform.",
        "הפרטיות בפלטפורמה.",
      ),
      intro: t(
        "تُستخدم بياناتك لإدارة حسابك ومواعيدك ومساعدتك في التنقل. تُرسل رسائل SAL وسياقها إلى Gemini لتقديم المساعدة.",
        "Your data is used to manage your account, appointments and care navigation. SAL messages and their context are sent to Gemini to provide assistance.",
        "הנתונים שלכם משמשים לניהול החשבון, התורים וניווט הטיפול. הודעות SAL וההקשר שלהן נשלחים ל־Gemini לצורך הסיוע.",
      ),
      body: t(
        "تُحفظ المحادثات والمواعيد والملفات المرتبطة بحسابك في قاعدة بيانات المنصة، وتظل ملفاتك الخاصة متاحة لحسابك فقط. تُستخدم كوكي جلسة لحفظ تسجيل الدخول وكوكي واحدة لحفظ اللغة المختارة، ويمكن مسحها من إعدادات المتصفح.",
        "Conversations, appointments and your files are stored in the platform database with your account, and your private files remain available only to your account. A session cookie keeps you signed in, and one cookie remembers your language preference — both can be cleared in your browser settings.",
        "השיחות, התורים והקבצים הקשורים לחשבונכם נשמרים במסד הנתונים של הפלטפורמה, והקבצים הפרטיים שלכם נשארים זמינים לחשבונכם בלבד. עוגיית התחברות שומרת על הכניסה שלכם ועוגייה אחת שומרת את העדפת השפה — ניתן למחוק אותן בהגדרות הדפדפן.",
      ),
    },
    terms: {
      title: t(
        "ماذا تقدم المنصة.",
        "What the platform does.",
        "מה הפלטפורמה מציעה.",
      ),
      intro: t(
        "The Clinic تساعدك في الوصول إلى الرعاية وتنظيم المواعيد، وهي ليست بديلًا عن الطبيب ولا تقدم تشخيصًا أو نصيحة طبية.",
        "The Clinic helps you reach care and organize appointments. It is not a replacement for a clinician and does not provide diagnosis or medical advice.",
        "The Clinic עוזרת להגיע לטיפול ולארגן תורים. היא אינה תחליף לרופא ואינה מספקת אבחנה או ייעוץ רפואי.",
      ),
      body: t(
        "يؤكد الطبيب طلب الموعد قبل اعتماده، والدفع الإلكتروني غير مفعّل بعد. SAL لا يشخّص ولا يصف علاجًا. اطلب الرعاية من مهني مؤهل؛ وفي حالة طارئة تواصل مع خدمات الطوارئ المحلية فورًا.",
        "A clinician confirms your appointment request before it is final, and online payment is not enabled yet. SAL does not diagnose or prescribe. Seek care from a qualified professional; in an emergency, contact local emergency services immediately.",
        "הרופא מאשר את בקשת התור לפני שהיא סופית, ותשלום מקוון עוד אינו פעיל. SAL אינו מאבחן ואינו רושם טיפול. פנו לאיש מקצוע מוסמך; במקרה חירום פנו מיד לשירותי החירום המקומיים.",
      ),
    },
  }[section];
  return (
    <div className="container page information-page">
      <PageHeading
        eyebrow="The Clinic"
        title={content.title}
        description={content.intro}
      />
      <p>{content.body}</p>
      <Link className="button" href="/doctors">
        {t("افتح دليل الأطباء", "Open the doctor directory", "למדריך הרופאים")}
        <Arrow />
      </Link>
    </div>
  );
}
