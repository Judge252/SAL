"use client";
import Link from "next/link";
import Image from "next/image";
import { Video, CalendarDays, FileText } from "lucide-react";
import { useClinic } from "./provider";
import { Arrow, DoctorCard, DemoNote, PageHeading } from "./ui";
import { doctors } from "@/lib/data";
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
            "الحجز تجريبي. خدمة الفيديو غير متصلة بعد.",
            "Demo booking. Live video is not connected yet.",
            "הזמנה להדגמה. שירות הווידאו עדיין אינו מחובר.",
          )}
        </small>
      </div>
    </section>
  );
}
export function OnlinePage() {
  const { t } = useClinic();
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
          "الأطباء الذين يقدمون استشارات فيديو في دليلنا التجريبي. نوع الاستشارة ينتقل معك حتى تأكيد الموعد.",
          "Doctors offering video consultations in our demo directory. Your consultation type stays with you through booking.",
          "רופאים שמציעים ייעוץ וידאו במדריך ההדגמה. סוג הייעוץ נשמר לאורך תהליך ההזמנה.",
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
              "اختر الطبيب ← اختر الموعد ← أدخل بيانات تجريبية ← راجع التأكيد. لن يتم إنشاء مكالمة فعلية.",
              "Choose a doctor → pick a time → enter demo details → review your confirmation. No live call will be created.",
              "בחרו רופא ← זמן מתאים ← פרטים להדגמה ← אישור. לא תיווצר שיחה אמיתית.",
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
