"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpLeft,
  ArrowUpRight,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Languages,
  UserRound,
} from "lucide-react";
import { useClinic } from "./provider";
import type { Doctor, ConsultationType } from "@/lib/types";
import { languageNames } from "@/lib/data";
import type { ReactNode, KeyboardEvent } from "react";
export function handleTabNavigation(event: KeyboardEvent<HTMLDivElement>) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
  );
  const current = tabs.indexOf(event.target as HTMLButtonElement);
  if (current < 0) return;
  event.preventDefault();
  const direction = document.documentElement.dir === "rtl" ? -1 : 1;
  const offset = event.key === "ArrowRight" ? direction : -direction;
  const index =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (current + offset + tabs.length) % tabs.length;
  tabs[index].focus();
  tabs[index].click();
}
export function Brand({
  sal = false,
  className = "",
}: {
  sal?: boolean;
  className?: string;
}) {
  return (
    <span className={`${sal ? "sal-mark" : "clinic-mark"} ${className}`}>
      <Image
        src={sal ? "/brand/sal.png" : "/brand/logo.png"}
        alt={sal ? "SAL" : "The Clinic"}
        width={sal ? 1254 : 1672}
        height={sal ? 1254 : 941}
        priority={!sal}
      />
    </span>
  );
}
export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  const { locale } = useClinic();
  const Icon = diagonal
    ? locale === "en"
      ? ArrowUpRight
      : ArrowUpLeft
    : locale === "en"
      ? ArrowRight
      : ArrowLeft;
  return <Icon size={20} aria-hidden="true" />;
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
export function Avatar({
  doctor,
  large = false,
}: {
  doctor: Doctor;
  large?: boolean;
}) {
  const { locale, t } = useClinic();
  return (
    <div
      className={`avatar ${doctor.color} ${large ? "large" : ""}`}
      aria-label={`${doctor.name[locale]} — ${t("صورة الملف غير متوفرة", "Profile photo not available", "תמונת פרופיל אינה זמינה")}`}
    >
      {doctor.portrait ? (
        <Image
          src={doctor.portrait}
          alt={doctor.name[locale]}
          fill
          sizes={large ? "160px" : "100px"}
          style={{ objectFit: "cover" }}
        />
      ) : (
        <>
          <UserRound aria-hidden="true" />
          <span>{doctor.initials}</span>
        </>
      )}
    </div>
  );
}
export function DoctorCard({doctor:d,mode="clinic"}:{doctor:Doctor;mode?:ConsultationType}){
 const {t,locale,specialties}=useClinic();const href=`/booking/${d.id}?mode=${mode}`;
 return <article className="doctor-card"><Avatar doctor={d}/><div className="doctor-information"><div className="doctor-card-heading"><div><Link className="doctor-name" href={`/doctors/${d.id}`}>{d.name[locale]}</Link><p className="specialty">{specialties[d.specialty]?.[locale]||d.record.specialties?.name_en}</p></div></div><div className="doctor-meta"><span><MapPin size={17}/>{d.city[locale]}</span><span><Languages size={17}/>{d.languages.map(l=>languageNames[l]||l).join(' · ')}</span></div><div className="consultation-labels">{d.consultations.map(c=><span key={c}>{c==='video'?t('بالفيديو','Video','וידאו'):t('في العيادة','In clinic','במרפאה')}</span>)}</div><Link href={`/doctors/${d.id}`} className="profile-link">{t('عرض الملف','View profile','לפרופיל')}<Arrow diagonal/></Link></div><div className="doctor-availability"><Link href={href} className="button small">{t('عرض المواعيد','View available times','צפייה בזמינות')}<Arrow/></Link></div></article>;
}
export function DemoNote(){return null;}
