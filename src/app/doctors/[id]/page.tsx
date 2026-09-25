import { doctors } from "@/lib/data";
import { notFound } from "next/navigation";
import { Profile } from "@/components/profile";
export function generateStaticParams() {
  return doctors.map((d) => ({ id: d.id }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doctor = doctors.find((d) => d.id === id);
  if (!doctor) notFound();
  return <Profile doctor={doctor} />;
}
