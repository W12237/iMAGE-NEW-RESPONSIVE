import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

export default async function DevelopmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale === "ar" ? "ar" : "en"}/projects`);
}
