import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "@/components/admin/project-form";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, assets] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.mediaAsset.findMany({
      where: { kind: "IMAGE" },
      orderBy: { createdAt: "desc" },
      select: { id: true, url: true, filename: true, mimeType: true, size: true, kind: true },
    }),
  ]);
  if (!item) notFound();

  return (
    <>
      <header className="page-head">
        <div>
          <nav className="admin-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/admin">CMS</Link>
            <span className="sep">/</span>
            <Link href="/admin/projects">Projects</Link>
            <span className="sep">/</span>
            <strong>Edit {item.nameEn}</strong>
          </nav>
          <h1>Edit Project: {item.nameEn}</h1>
          <span>Update architectural photography, bilingual copy, project highlights, and status.</span>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>Preview:</span>
          <Link
            className="secondary"
            href={`/en/projects/${item.slug}${item.status !== "PUBLISHED" ? "?preview=true" : ""}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "13px" }}
          >
            English Page ↗
          </Link>
          <Link
            className="secondary"
            href={`/ar/projects/${item.slug}${item.status !== "PUBLISHED" ? "?preview=true" : ""}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "13px" }}
          >
            صفحة المشروع بالعربية ↗
          </Link>
        </div>
      </header>
      <ProjectForm item={item} assets={assets} />
    </>
  );
}
