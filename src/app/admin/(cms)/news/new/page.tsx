import { prisma } from "@/lib/prisma";
import { NewsForm } from "@/components/admin/news-form";

export default async function NewArticle() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      slug: true,
      coverImageUrl: true,
      locationEn: true,
      locationAr: true,
      projectType: true,
      progressStatus: true,
      status: true,
    },
    orderBy: { nameEn: "asc" },
  });

  const availableArticles = await prisma.newsArticle.findMany({
    select: { id: true, titleEn: true, slug: true },
    where: { status: "PUBLISHED" },
    orderBy: { publicationDate: "desc" },
  });

  return (
    <>
      <header className="page-head">
        <div>
          <p>Journal</p>
          <h1>New article</h1>
        </div>
      </header>
      <NewsForm projects={projects} availableArticles={availableArticles} />
    </>
  );
}
