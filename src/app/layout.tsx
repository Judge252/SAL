import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/noto-sans-arabic";
import "@fontsource-variable/heebo";
import "./globals.css";
import { Provider } from "@/components/provider";
import { Shell } from "@/components/shell";
import { cookies } from "next/headers";
export const metadata: Metadata = {
  title: {
    default: "The Clinic — رعاية تبدأ بفهمك",
    template: "%s | The Clinic",
  },
  description:
    "A thoughtful way to find your next step in healthcare. Meet SAL, discover doctors, and explore your care journey.",
  icons: { icon: "/brand/sal.png", apple: "/brand/sal.png" },
  robots: { index: false, follow: false },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = (await cookies()).get("clinic-locale")?.value;
  const locale = value === "en" || value === "he" ? value : "ar";
  return (
    <html lang={locale} dir={locale === "en" ? "ltr" : "rtl"}>
      <body>
        <Provider initialLocale={locale}>
          <Shell>{children}</Shell>
        </Provider>
      </body>
    </html>
  );
}
