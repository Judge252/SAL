import { notFound } from "next/navigation";
import { InformationPage } from "@/components/information";
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (section !== "about" && section !== "privacy" && section !== "terms")
    notFound();
  return <InformationPage section={section} />;
}
