"use client";
import Link from "next/link";
import Image from "next/image";
import { Video, CalendarDays, FileText } from "lucide-react";
import { useClinic } from "./provider";
import { Arrow, DoctorCard, DemoNote, PageHeading } from "./ui";

export function ConsultationFeature() {
  const { t } = useClinic();
  return (
    <section className="consultation-feature">
      <figure className="consultation-image">
        <Image
          src="/images/consultation-editorial.png"
          fill
          sizes="(max-width: 760px) 100vw, 50vw"
          alt={t(
            "مشهد توضيحي لمحادثة بين طبيبة ومريضة",
            "Illustrative scene of a clinician listening to a patient",
            "סצנה להמחשה של רופאה המקשיבה למטופלת",
          )}
        />
        <figcaption>
          {t("صورة توضيحية", "Illustrative image", "תמונה להמחשה")}
        </figcaption>
      </figure>
      <div className="consultation-copy">
        <span className="section-kicker">
          <Video size={21} />
          {t("استشارات أونلاين", "ONLINE CONSULTATIONS", "ייעוץ מקוון")}
        </span>
        <h2>
          {t(
            "وقت مع طبيبك، أينما كنت.",
            "Time with your doctor. Wherever you are.",
            "זמן עם הרופא. מכל מקום.",
          )}
        </h2>
        <p>
          {t(
            "اختر طبيبًا يقدم استشارات فيديو، وراجع الأوقات المتاحة، واحجز من مكانك.",
            "Choose a doctor offering video consultations, review available times, and book from where you are.",
            "בחרו רופא שמציע ייעוץ בווידאו, בדקו זמינות וקבעו תור מהמקום שלכם.",
          )}
        </p>
        <ul className="consultation-steps">
          <li>
            <CalendarDays size={20} />
            {t(
              "اختر موعدًا يناسبك",
              "Choose a time that suits you",
              "בחרו זמן שמתאים לכם",
            )}
          </li>
          <li>
            <FileText size={20} />
            {t(
              "جهّز أسئلتك والمستندات ذات الصلة",
              "Have your questions and relevant documents ready",
              "הכינו שאלות ומסמכים רלוונטיים",
            )}
          </li>
          <li>
            <Video size={20} />
            {t(
              "اختر الفيديو كنوع الاستشارة",
              "Select video as your consultation type",
              "בחרו וידאו כסוג הייעוץ",
            )}
          </li>
        </ul>
        <Link className="button" href="/online">
          {t(
            "عرض أطباء الأونلاين",
            "Find online doctors",
            "לרופאים בייעוץ מקוון",
          )}
          <Arrow />
        </Link>
        <small>
          {t(
            "يُنشئ الحجز موعدًا حقيقيًا بانتظار تأكيد الطبيب. منصة مكالمات الفيديو لم تُفعّل بعد.",
            "Booking creates a real appointment pending clinician confirmation. The video call platform is not enabled yet.",
            "ההזמנה יוצרת תור אמיתי הממתין לאישור הרופא. פלטפורמת שיחות הווידאו עוד אינה פעילה.",
          )}
        </small>
      </div>
    </section>
  );
}
export function OnlinePage() {
  const { t, doctors } = useClinic();
  return (
    <div className="container page">
      <PageHeading
        eyebrow={t(
          "استشارة من مكانك",
          "CARE FROM WHERE YOU ARE",
          "טיפול מכל מקום",
        )}
        title={t(
          "اختر طبيبك. وحدّد وقتك.",
          "Choose your doctor. Find your time.",
          "בחרו רופא. מצאו את הזמן שלכם.",
        )}
        description={t(
          "الأطباء الذين يقدمون استشارات فيديو في دليلنا. نوع الاستشارة ينتقل معك حتى تأكيد الموعد.",
          "Doctors offering video consultations in our directory. Your consultation type stays with you through booking.",
          "רופאים שמציעים ייעוץ וידאו במדריך שלנו. סוג הייעוץ נשמר לאורך תהליך ההזמנה.",
        )}
      />
      <div className="online-notice">
        <Video />
        <div>
          <b>
            {t(
              "موعد فيديو، بخطوات واضحة",
              "A video visit, with clear next steps",
              "ביקור וידאו, עם צעדים ברורים",
            )}
          </b>
          <p>
            {t(
              "اختر الطبيب ← اختر الخدمة والموعد ← راجع التأكيد. يُحفظ الطلب بانتظار تأكيد الطبيب.",
              "Choose a doctor → pick a service and time → review your confirmation. Your request is saved pending clinician confirmation.",
              "בחרו רופא ← בחרו שירות ומועד ← אישור. הבקשה נשמרת עד לאישור הרופא.",
            )}
          </p>
        </div>
      </div>
      <div className="doctor-grid">
        {doctors
          .filter((d) => d.consultations.includes("video"))
          .map((d) => (
            <DoctorCard key={d.id} doctor={d} mode="video" />
          ))}
      </div>
      <DemoNote />
    </div>
  );
}
