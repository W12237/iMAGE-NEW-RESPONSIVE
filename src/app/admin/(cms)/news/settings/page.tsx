import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JournalSettingsForm } from "@/components/admin/journal-settings-form";

export default async function JournalSettingsPage() {
  const [settings, articles] = await Promise.all([
    prisma.journalPageSettings.findUnique({ where: { id: "journal" } }),
    prisma.newsArticle.findMany({
      orderBy: { publicationDate: "desc" },
    }),
  ]);

  if (!settings) notFound();

  return (
    <>
      <header className="page-head">
        <div>
          <p>
            <Link href="/admin/news" style={{ textDecoration: "none", color: "inherit" }}>
              ← News & Articles
            </Link>
          </p>
          <h1>Journal Page Settings</h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <a
            href="/en/journal"
            target="_blank"
            rel="noreferrer"
            className="secondary"
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            View Live (EN) ↗
          </a>
          <a
            href="/ar/journal"
            target="_blank"
            rel="noreferrer"
            className="secondary"
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            عرض مباشر (العربية) ↗
          </a>
        </div>
      </header>

      <JournalSettingsForm settings={settings} articles={articles} />
    </>
  );
}
