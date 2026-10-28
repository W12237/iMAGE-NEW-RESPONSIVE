import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [
    totalProjects,
    publishedProjects,
    draftProjects,
    totalNews,
    mediaCount,
    totalLeads,
    recentLeads,
    recentProjects,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: "PUBLISHED" } }),
    prisma.project.count({ where: { status: "DRAFT" } }),
    prisma.newsArticle.count(),
    prisma.mediaAsset.count(),
    prisma.contactSubmission.count(),
    prisma.contactSubmission.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        status: true,
        createdAt: true,
        locale: true,
      },
    }),
    prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        locationEn: true,
        status: true,
        updatedAt: true,
        featured: true,
      },
    }),
  ]);

  return (
    <>
      <header className="page-head">
        <div>
          <nav className="admin-breadcrumbs" aria-label="Breadcrumb">
            <span>CMS</span>
            <span className="sep">/</span>
            <strong>Overview</strong>
          </nav>
          <h1>Content Dashboard</h1>
          <span>Real-time overview of published content, developments portfolio, and customer enquiries.</span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link className="secondary" href="/en/projects" target="_blank">
            View Public Projects ↗
          </Link>
          <Link className="primary" href="/admin/projects/new">
            + New Project
          </Link>
        </div>
      </header>

      {/* Real Metric Summaries */}
      <section className="metric-grid" aria-label="Overview Metrics">
        <div className="metric">
          <div className="metric-header">
            <strong>{totalProjects}</strong>
            <span className="metric-badge published">{publishedProjects} Live</span>
          </div>
          <span className="metric-label">Projects Portfolio</span>
          <small className="metric-hint">{draftProjects} draft / in review</small>
        </div>

        <div className="metric">
          <div className="metric-header">
            <strong>{totalLeads}</strong>
            <span className="metric-badge enquiries">Active</span>
          </div>
          <span className="metric-label">Customer Enquiries</span>
          <small className="metric-hint">Form & callback submissions</small>
        </div>

        <div className="metric">
          <div className="metric-header">
            <strong>{totalNews}</strong>
            <span className="metric-badge articles">Articles</span>
          </div>
          <span className="metric-label">Journal Stories</span>
          <small className="metric-hint">Published editorial updates</small>
        </div>

        <div className="metric">
          <div className="metric-header">
            <strong>{mediaCount}</strong>
            <span className="metric-badge media">Assets</span>
          </div>
          <span className="metric-label">Media Library</span>
          <small className="metric-hint">High-resolution photography</small>
        </div>
      </section>

      {/* Two Column Layout: Recent Enquiries & Recent Project Updates */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "24px", marginBottom: "24px" }}>
        {/* Recent Enquiries */}
        <section className="panel" style={{ margin: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ margin: 0 }}>Recent Enquiries</h2>
            <Link className="secondary" href="/admin/leads" style={{ fontSize: "12px", padding: "6px 12px" }}>
              View all leads →
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            <p className="empty">No customer enquiries received yet.</p>
          ) : (
            <div className="table-wrap" style={{ padding: 0, border: "none", boxShadow: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Interest</th>
                    <th>Date</th>
                    <th>Locale</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <strong>{lead.name}</strong>
                        <small>{lead.email}</small>
                      </td>
                      <td>
                        <span style={{ fontSize: "13px", color: "var(--forest)", fontWeight: 500 }}>
                          {lead.subject || "General Inquiry"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                          {lead.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${lead.locale === "ar" ? "badge-ar" : "badge-en"}`}>
                          {lead.locale.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Portfolio Status */}
        <section className="panel" style={{ margin: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ margin: 0 }}>Projects Activity</h2>
            <Link className="secondary" href="/admin/projects" style={{ fontSize: "12px", padding: "6px 12px" }}>
              Manage projects →
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <p className="empty">No projects created yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    background: "var(--bg-page)",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "14px", color: "var(--ink)" }}>{project.nameEn}</strong>
                      <span style={{ fontSize: "13px", color: "var(--muted)" }}>({project.nameAr})</span>
                    </div>
                    <small style={{ color: "var(--muted)", fontSize: "12px" }}>{project.locationEn}</small>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className={`status-badge status-${project.status.toLowerCase()}`}>
                      {project.status}
                    </span>
                    <Link
                      href={`/admin/projects/${project.id}`}
                      style={{
                        fontSize: "12px",
                        color: "var(--forest)",
                        fontWeight: 600,
                        padding: "4px 8px",
                        background: "#ffffff",
                        borderRadius: "4px",
                        border: "1px solid var(--line)",
                      }}
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick Action Navigation */}
      <section className="panel">
        <h2>Quick Content Management</h2>
        <div className="quick-links">
          <Link href="/admin/homepage">Homepage Sections</Link>
          <Link href="/admin/projects">Projects Portfolio</Link>
          <Link href="/admin/leads">Enquiry Leads</Link>
          <Link href="/admin/news">Journal & News</Link>
          <Link href="/admin/about">About Company</Link>
          <Link href="/admin/team">Team Directory</Link>
          <Link href="/admin/partners">Partnerships</Link>
          <Link href="/admin/media">Media Library</Link>
          <Link href="/admin/settings">Brand & Contact Details</Link>
        </div>
      </section>
    </>
  );
}
