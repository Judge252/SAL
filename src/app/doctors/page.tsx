import { Discovery } from "@/components/discovery";
export const metadata = { title: "Find a doctor" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    specialty?: string;
    q?: string;
    city?: string;
    mode?: string;
  }>;
}) {
  const initial = await searchParams;
  return <Discovery key={JSON.stringify(initial)} initial={initial} />;
}
