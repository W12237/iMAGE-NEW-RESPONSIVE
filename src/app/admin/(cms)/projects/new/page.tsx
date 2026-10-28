import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "@/components/admin/project-form";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const assets = await prisma.mediaAsset.findMany({
    where: { kind: "IMAGE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true, filename: true, mimeType: true, size: true, kind: true },
  });

  return (
    <>
      <header className="page-head">
        <div>
          <nav className="admin-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/admin">CMS</Link>
            <span className="sep">/</span>
            <Link href="/admin/projects">Projects</Link>
            <span className="sep">/</span>
            <strong>Create New</strong>
          </nav>
          <h1>Create New Project</h1>
          <span>Add a new architectural project with English and Arabic content, cover imagery, and SEO metadata.</span>
        </div>
      </header>
      <ProjectForm assets={assets} />
    </>
  );
}
