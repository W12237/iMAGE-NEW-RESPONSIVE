import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteNews } from "../../actions";

export default async function News() {
  const items = await prisma.newsArticle.findMany({
    orderBy: { publicationDate: "desc" },
  });

  return (
    <>
      <header className="page-head">
        <div>
          <p>Editorial & Stories</p>
          <h1>Journal & News Articles</h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link className="secondary" href="/admin/news/settings">
            ⚙ Journal Page Settings
          </Link>
          <Link className="primary" href="/admin/news/new">
            + New Article
          </Link>
        </div>
      </header>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th>Category</th>
              <th>Status</th>
              <th>Published</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((x) => (
              <tr key={x.id}>
                <td>
                  <b>{x.titleEn}</b>
                  <small style={{ display: "block", color: "var(--muted)" }}>{x.titleAr}</small>
                </td>
                <td>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: "rgba(27, 56, 43, 0.08)",
                      fontWeight: 600,
                    }}
                  >
                    {x.category}
                  </span>
                </td>
                <td>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color:
                        x.status === "PUBLISHED"
                          ? "#15803d"
                          : x.status === "DRAFT"
                          ? "#b45309"
                          : "#6b7280",
                    }}
                  >
                    {x.status}
                  </span>
                </td>
                <td>{x.publicationDate.toLocaleDateString("en-GB")}</td>
                <td>{x.featured ? `Featured (#${x.featuredOrder + 1})` : "—"}</td>
                <td className="row-actions">
                  <Link href={`/admin/news/${x.id}`}>Edit</Link>
                  <a
                    href={`/en/journal/${x.slug}${x.status !== "PUBLISHED" ? "?preview=true" : ""}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--forest)", textDecoration: "none", fontSize: "13px" }}
                  >
                    {x.status === "PUBLISHED" ? "View ↗" : "Preview ↗"}
                  </a>
                  {x.status !== "ARCHIVED" && (
                    <form action={deleteNews}>
                      <input type="hidden" name="id" value={x.id} />
                      <button type="submit" style={{ cursor: "pointer" }}>Archive</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && <p className="empty">No news articles yet.</p>}
      </div>
    </>
  );
}
