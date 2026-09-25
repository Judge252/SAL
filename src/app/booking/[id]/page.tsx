import { doctors } from "@/lib/data";
import { notFound } from "next/navigation";
import { Booking } from "@/components/booking";
export const metadata = { title: "Book a visit" };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string; time?: string }>;
}) {
  const { id } = await params;
  const doctor = doctors.find((d) => d.id === id);
  if (!doctor) notFound();
  const { mode, time } = await searchParams;
  return <Booking doctor={doctor} initialMode={mode} initialTime={time} />;
}
