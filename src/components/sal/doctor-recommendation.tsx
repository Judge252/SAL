"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Languages,
  CalendarDays,
  Video,
  Building2,
} from "lucide-react";
import {
  doctorsApi,
  toDoctor,
  type DoctorRecord,
  type Slot,
} from "@/lib/api/doctors";
import { languageNames } from "@/lib/data";
import { useClinic } from "../provider";
import { Avatar, Arrow } from "../ui";
import type { MatchContext } from "@/lib/api/sal";

export function DoctorRecommendation({
  doctor,
  index,
  matchContext,
}: {
  doctor: DoctorRecord;
  index: number;
  matchContext?: MatchContext;
}) {
  const { t, locale } = useClinic();
  const [availability, setAvailability] = useState<{
    slots: Slot[];
    loading: boolean;
    failed: boolean;
  }>({ slots: [], loading: true, failed: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    doctorsApi
      .slots(doctor.id)
      .then((slots) => {
        if (active) setAvailability({ slots, loading: false, failed: false });
      })
      .catch(() => {
        if (active)
          setAvailability({ slots: [], loading: false, failed: true });
      });
    return () => {
      active = false;
    };
  }, [doctor.id, attempt]);
  const specialty =
    doctor.specialties?.[`name_${locale}`] || doctor.specialties?.name_en;
  const locations = [
    ...new Set(doctor.doctor_locations.map((location) => location.city)),
  ].filter(Boolean);
  const modes = [
    ...new Set(
      doctor.services
        .filter((service) => service.active)
        .map((service) => service.consultation_type),
    ),
  ];
  const reasons = [
    matchContext?.specialty_id === doctor.specialty_id && specialty
      ? t(
          `تخصص ${specialty} الذي اختاره SAL`,
          `The ${specialty} specialty selected by SAL`,
          `ההתמחות ${specialty} שבחר SAL`,
        )
      : null,
    matchContext?.city &&
    locations.some(
      (city) =>
        city.toLocaleLowerCase() === matchContext.city?.toLocaleLowerCase(),
    )
      ? t(
          `في ${matchContext.city}`,
          `Located in ${matchContext.city}`,
          `ב${matchContext.city}`,
        )
      : null,
    matchContext?.language && doctor.languages?.includes(matchContext.language)
      ? t(
          `يتحدث ${languageNames[matchContext.language] || matchContext.language}`,
          `Speaks ${languageNames[matchContext.language] || matchContext.language}`,
          `דובר ${languageNames[matchContext.language] || matchContext.language}`,
        )
      : null,
    matchContext?.consultation_type &&
    modes.includes(matchContext.consultation_type)
      ? matchContext.consultation_type === "video"
        ? t("يقدم زيارات فيديو", "Offers video visits", "מציע ביקורי וידאו")
        : t(
            "يقدم زيارات في العيادة",
            "Offers clinic visits",
            "מציע ביקורים במרפאה",
          )
      : null,
  ].filter(Boolean);
  const reason = reasons.length
    ? reasons.join(" · ")
    : t(
        "خيار أعاده SAL. راجع التخصص والتفاصيل لتقرر مدى ملاءمته.",
        "Returned by SAL. Review the specialty and visit details to decide if it fits.",
        "אפשרות שהחזיר SAL. בדקו את ההתמחות ופרטי הביקור כדי להחליט אם היא מתאימה.",
      );
  const next = availability.slots[0];
  const mode = modes[0];
  return (
    <article className="sal-doctor-option">
      <div className="sal-option-number">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="sal-option-body">
        <div className="sal-option-heading">
          <Avatar doctor={toDoctor(doctor)} />
          <div>
            <h3>
              <Link href={`/doctors/${doctor.id}`}>{doctor.full_name}</Link>
            </h3>
            <p>{specialty}</p>
          </div>
        </div>
        <p className="sal-option-reason">
          <span className="sal-option-why">
            {t("لماذا هذا الخيار", "WHY THIS OPTION", "למה האפשרות הזו")}
          </span>
          {reason}
        </p>
        <dl className="sal-option-facts">
          <div>
            <dt>
              <Languages size={17} />
              {t("اللغات", "Languages", "שפות")}
            </dt>
            <dd>
              {doctor.languages
                ?.map((language) => languageNames[language] || language)
                .join(" · ") || "—"}
            </dd>
          </div>
          <div>
            <dt>
              <MapPin size={17} />
              {t("الموقع", "Location", "מיקום")}
            </dt>
            <dd>
              {locations.join(" · ") ||
                t("راجع الملف", "See profile", "לפרופיל")}
            </dd>
          </div>
          <div>
            <dt>
              {modes.includes("video") ? (
                <Video size={17} />
              ) : (
                <Building2 size={17} />
              )}
              {t("الزيارة", "Visit", "ביקור")}
            </dt>
            <dd>
              {modes
                .map((value) =>
                  value === "video"
                    ? t("فيديو", "Video", "וידאו")
                    : t("في العيادة", "In clinic", "במרפאה"),
                )
                .join(" · ") || "—"}
            </dd>
          </div>
        </dl>
        <div className="sal-option-footer">
          <div className="sal-option-availability">
            <CalendarDays size={18} />
            <span>
              {availability.loading
                ? t("نتحقق من المواعيد…", "Checking times…", "בודקים זמינות…")
                : availability.failed
                  ? t(
                      "تعذّر تحميل المواعيد",
                      "Could not load availability",
                      "לא ניתן לטעון זמינות",
                    )
                  : next
                    ? `${next.date} · ${next.start_time.slice(0, 5)}`
                    : t(
                        "لا توجد أوقات متاحة حاليًا",
                        "No open times right now",
                        "אין מועדים פנויים כרגע",
                      )}
              {next && (
                <small>
                  {t("بتوقيت القدس", "Jerusalem time", "שעון ירושלים")}
                </small>
              )}
            </span>
          </div>
          {availability.failed ? (
            <button
              className="text-link"
              onClick={() => {
                setAvailability({ slots: [], loading: true, failed: false });
                setAttempt((value) => value + 1);
              }}
            >
              {t("إعادة المحاولة", "Retry", "ניסיון נוסף")}
            </button>
          ) : null}
          {next && mode ? (
            <Link
              className="button small"
              href={`/booking/${doctor.id}?mode=${mode}`}
            >
              {t("اختر موعدك", "Choose a time", "בחירת מועד")}
              <Arrow />
            </Link>
          ) : (
            <Link className="text-link" href={`/doctors/${doctor.id}`}>
              {t("عرض الملف", "View profile", "לפרופיל")}
              <Arrow />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
