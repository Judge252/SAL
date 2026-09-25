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
        "نبدأ بتجربة عربية مع دعم العبرية والإنجليزية. هذه النسخة تعرض تجربة المنتج فقط؛ لا تتصل بعيادات أو خدمات طبية فعلية.",
        "We start with an Arabic-first experience, with Hebrew and English support. This version demonstrates the product experience; it is not connected to real clinics or medical services.",
        "אנחנו מתחילים בחוויה בערבית, עם תמיכה בעברית ובאנגלית. גרסה זו מדגימה את המוצר ואינה מחוברת למרפאות או לשירותים רפואיים אמיתיים.",
      ),
    },
    privacy: {
      title: t(
        "خصوصية هذه التجربة.",
        "Privacy in this prototype.",
        "פרטיות באב הטיפוס.",
      ),
      intro: t(
        "استخدم معلومات وهمية فقط. لا تُرسل المحادثات أو بيانات الحجز إلى أي عيادة أو خدمة ذكاء اصطناعي.",
        "Use fictional details only. Conversations and booking details are not sent to a clinic or an AI service.",
        "השתמשו בפרטים בדיוניים בלבד. שיחות ופרטי הזמנה אינם נשלחים למרפאה או לשירות בינה מלאכותית.",
      ),
      body: t(
        "تُحفظ المحادثات والمواعيد في ذاكرة الصفحة وتُمسح عند تحديثها. تعرض المستندات اسم الملف وحجمه فقط دون قراءة محتواه أو رفعه. تُستخدم كوكي واحدة لحفظ اللغة المختارة، ويمكن مسحها من إعدادات المتصفح.",
        "Conversations and appointments stay in page memory and clear on refresh. Documents display only filename and size; contents are not read or uploaded. One cookie remembers your language preference and can be cleared in your browser settings.",
        "השיחות והתורים נשמרים בזיכרון העמוד ונמחקים ברענון. מוצגים רק שם וגודל הקובץ, בלי לקרוא או להעלות את התוכן. עוגייה אחת שומרת את העדפת השפה וניתן למחוק אותה בהגדרות הדפדפן.",
      ),
    },
    terms: {
      title: t(
        "حدود النسخة التجريبية.",
        "What this prototype does.",
        "גבולות אב הטיפוס.",
      ),
      intro: t(
        "هذه واجهة تجريبية وليست خدمة طبية عاملة. لا تنشئ حجزًا حقيقيًا أو مكالمة فيديو ولا تقدم تشخيصًا أو نصيحة طبية.",
        "This is an interface prototype, not an operational medical service. It does not create real bookings or video calls, and does not provide diagnosis or medical advice.",
        "זהו אב טיפוס לממשק, לא שירות רפואי פעיל. הוא אינו יוצר תורים או שיחות אמיתיים ואינו מספק אבחנה או ייעוץ רפואי.",
      ),
      body: t(
        "ملفات الأطباء والأوقات والخبرة بيانات توضيحية. SAL يستخدم أسئلة ثابتة لأغراض عرض التجربة. اطلب الرعاية من مهني مؤهل؛ وفي حالة طارئة تواصل مع خدمات الطوارئ المحلية.",
        "Doctor profiles, times and experience are illustrative. SAL uses scripted questions to demonstrate the flow. Seek care from a qualified professional; in an emergency, contact local emergency services.",
        "פרופילי הרופאים, הזמנים והניסיון הם להמחשה. SAL משתמש בשאלות קבועות להדגמה. פנו לאיש מקצוע מוסמך; במקרה חירום פנו לשירותי החירום המקומיים.",
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
