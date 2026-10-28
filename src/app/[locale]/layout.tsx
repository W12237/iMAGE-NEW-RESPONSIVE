import { notFound } from "next/navigation";
import type { Locale } from "@/content/home";
import { getHomepageContent } from "@/lib/content";
import { PageTransitionProvider } from "@/components/page-transition";
import { EnquiryProvider } from "@/components/enquiry-provider";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "en" && locale !== "ar") notFound();
  const copy = await getHomepageContent(locale as Locale);

  return (
    <html
      lang={copy.locale}
      dir={copy.dir}
      className={copy.locale === "ar" ? "arabic" : "english"}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        <PageTransitionProvider copy={copy}>
          <EnquiryProvider copy={copy}>
            {children}
          </EnquiryProvider>
        </PageTransitionProvider>
      </body>
    </html>
  );
}
