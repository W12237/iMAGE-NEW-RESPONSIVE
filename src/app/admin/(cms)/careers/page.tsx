import { prisma } from "@/lib/prisma";
import { CareerJobForm } from "@/components/admin/career-job-form";
import { ActionForm } from "@/components/admin/action-form";
import { Bilingual } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media-field";
import {
  deleteCareerJob,
  toggleCareerJobStatus,
  updateCareerApplicationStatus,
  deleteCareerApplication,
  saveCareersPageContent,
} from "../../actions";

const statuses = ["NEW", "REVIEWED", "SHORTLISTED", "REJECTED"];

export default async function CareersAdminPage() {
  const [jobs, applications, home, images] = await Promise.all([
    prisma.careerJob.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { applications: true } } },
    }),
    prisma.careerApplication.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.homepage.findUniqueOrThrow({ where: { id: "homepage" } }),
    prisma.mediaAsset.findMany({
      where: { kind: "IMAGE" },
      orderBy: { createdAt: "desc" },
      select: { id: true, url: true, filename: true, mimeType: true, size: true, kind: true },
    }),
  ]);

  return (
    <>
      <header className="page-head">
        <div>
          <p>Human Resources & Careers</p>
          <h1>Careers & Applications</h1>
          <span>Manage open vacancies, job requirements, page culture content, and applicant submissions with private CV access.</span>
        </div>
      </header>

      {/* Careers Page Content & Imagery Section */}
      <section style={{ marginBottom: "48px" }}>
        <ActionForm action={saveCareersPageContent} submitLabel="Save Careers Content">
          <div className="section-title">
            <div>
              <h2>Careers Page Content & Imagery</h2>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                Edit the public Careers page hero, company culture headline, intro, and workplace imagery.
              </span>
            </div>
          </div>

          <h3 style={{ fontSize: "14px", fontWeight: 600, marginTop: "16px", marginBottom: "8px", color: "var(--forest, #123026)" }}>
            Careers Hero
          </h3>
          <Bilingual base="careersHeroEyebrow" label="Hero Eyebrow" en={home.careersHeroEyebrowEn} ar={home.careersHeroEyebrowAr} />
          <Bilingual base="careersHeroTitle" label="Hero Headline" en={home.careersHeroTitleEn} ar={home.careersHeroTitleAr} required />
          <Bilingual base="careersHeroIntro" label="Hero Introduction" en={home.careersHeroIntroEn} ar={home.careersHeroIntroAr} textarea required />
          <div style={{ marginTop: "12px" }}>
            <MediaField name="careersHeroImageUrl" label="Careers Hero Workplace Image" value={home.careersHeroImageUrl || undefined} assets={images} kind="IMAGE" />
          </div>

          <h3 style={{ fontSize: "14px", fontWeight: 600, marginTop: "24px", marginBottom: "8px", color: "var(--forest, #123026)" }}>
            Life at Image (Culture & Values)
          </h3>
          <Bilingual base="careersLifeEyebrow" label="Culture Eyebrow" en={home.careersLifeEyebrowEn} ar={home.careersLifeEyebrowAr} />
          <Bilingual base="careersLifeTitle" label="Culture Section Title" en={home.careersLifeTitleEn} ar={home.careersLifeTitleAr} required />
          <Bilingual base="careersLifeBody" label="Culture Description" en={home.careersLifeBodyEn} ar={home.careersLifeBodyAr} textarea required />
        </ActionForm>
      </section>

      {/* Applications Received Section */}
      <section style={{ marginBottom: "48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "600", margin: 0, color: "var(--admin-text, #111)" }}>
              Applicant Submissions ({applications.length})
            </h2>
            <small style={{ color: "#666" }}>CV documents are securely stored in private storage and accessible only to authorized administrators.</small>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Candidate</th>
                <th>Position</th>
                <th>CV Document</th>
                <th>Status & Review</th>
                <th className="lead-row-actions" />
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{app.createdAt.toLocaleString("en-GB")}</td>
                  <td>
                    <b>{app.fullName}</b>
                    <small>
                      <br />
                      <a href={`mailto:${app.email}`} style={{ color: "var(--forest, #123026)" }}>{app.email}</a>
                      <br />
                      <a href={`tel:${app.phone}`} style={{ color: "#666" }}>{app.phone}</a>
                    </small>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{app.jobTitle}</span>
                  </td>
                  <td>
                    <a
                      href={`/api/admin/cv/${app.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-button"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        textDecoration: "none",
                        backgroundColor: "#f5f4ef",
                        color: "var(--forest, #123026)",
                        fontWeight: 600,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                      </svg>
                      <span>Download CV</span>
                    </a>
                    <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
                      {app.cvFilename}
                    </div>
                  </td>
                  <td>
                    <form action={updateCareerApplicationStatus} className="lead-followup">
                      <input type="hidden" name="id" value={app.id} />
                      <select name="status" defaultValue={app.status}>
                        {statuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                      <textarea
                        name="notes"
                        defaultValue={app.notes ?? ""}
                        placeholder="Candidate notes or interview status"
                        rows={2}
                      />
                      <button>Save</button>
                    </form>
                  </td>
                  <td className="lead-row-actions">
                    <form action={deleteCareerApplication}>
                      <input type="hidden" name="id" value={app.id} />
                      <button className="danger">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!applications.length && <p className="empty">No applications received yet.</p>}
        </div>
      </section>

      {/* Vacancies / Job Listings Section */}
      <section style={{ marginBottom: "48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "600", margin: 0, color: "var(--admin-text, #111)" }}>
              Active Vacancies ({jobs.length})
            </h2>
            <small style={{ color: "#666" }}>Published job listings appear on the public /careers page.</small>
          </div>
        </div>

        <div className="table-wrap" style={{ marginBottom: "32px" }}>
          <table>
            <thead>
              <tr>
                <th>Sort</th>
                <th>Title (EN / AR)</th>
                <th>Department</th>
                <th>Location</th>
                <th>Status</th>
                <th>Applications</th>
                <th className="lead-row-actions" />
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.sortOrder}</td>
                  <td>
                    <b>{job.titleEn}</b>
                    <br />
                    <span dir="rtl" style={{ color: "#555" }}>{job.titleAr}</span>
                    <br />
                    <small style={{ color: "#888" }}>Slug: {job.slug}</small>
                  </td>
                  <td>
                    {job.departmentEn}
                    <br />
                    <small style={{ color: "#777" }}>{job.departmentAr}</small>
                  </td>
                  <td>{job.locationEn}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                          backgroundColor: job.status === "PUBLISHED" ? "#e8f5e9" : "#fff3e0",
                          color: job.status === "PUBLISHED" ? "#2e7d32" : "#e65100",
                        }}
                      >
                        {job.status}
                      </span>
                      <form action={toggleCareerJobStatus}>
                        <input type="hidden" name="id" value={job.id} />
                        <input type="hidden" name="currentStatus" value={job.status} />
                        <button
                          type="submit"
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            background: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          {job.status === "PUBLISHED" ? "Unpublish (Draft)" : "Publish"}
                        </button>
                      </form>
                    </div>
                  </td>
                  <td>
                    <b>{job._count.applications}</b> applicants
                  </td>
                  <td className="lead-row-actions">
                    <form action={deleteCareerJob}>
                      <input type="hidden" name="id" value={job.id} />
                      <button className="danger">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!jobs.length && <p className="empty">No career positions added yet.</p>}
        </div>

        {/* Add New Vacancy Form */}
        <CareerJobForm />
      </section>
    </>
  );
}
