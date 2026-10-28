"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import type { CareersPageContent, CareerJobItem } from "@/content/home";
import { SiteHeader } from "./site-header";
import { Footer } from "./homepage-experience";
import { SmoothScroll } from "./smooth-scroll";
import { submitCareerApplication, type CareerApplicationState } from "@/app/actions";

export function CareersPageExperience({ copy }: { copy: CareersPageContent }) {
  const ar = copy.locale === "ar";
  const homeHref = `/${copy.locale}`;
  const page = copy.careersPage;

  // Selected job for detail modal
  const [activeJobDetail, setActiveJobDetail] = useState<CareerJobItem | null>(null);

  // Application modal state
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<CareerApplicationState>({ status: "idle" });

  // Controlled form values preserved across errors
  const [formValues, setFormValues] = useState({
    fullName: "",
    phone: "",
    email: "",
    notes: "",
  });

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isApplyOpen && !isSubmitting) {
          setIsApplyOpen(false);
        } else if (activeJobDetail) {
          setActiveJobDetail(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isApplyOpen, isSubmitting, activeJobDetail]);

  const handleOpenApply = (job?: CareerJobItem) => {
    setActiveJobDetail(null);
    if (job) {
      setSelectedJobId(job.id);
    } else if (page.jobs.length > 0 && (!selectedJobId || selectedJobId === "general")) {
      setSelectedJobId(page.jobs[0].id);
    } else if (page.jobs.length === 0) {
      setSelectedJobId("general");
    }
    setFormState({ status: "idle" });
    setIsApplyOpen(true);
  };

  const handleOpenGeneralApply = () => {
    setActiveJobDetail(null);
    setSelectedJobId("general");
    setFormState({ status: "idle" });
    setIsApplyOpen(true);
  };

  const handleCloseApply = () => {
    setIsApplyOpen(false);
    setFormState({ status: "idle" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitApplication = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("locale", copy.locale);
    formData.set("fullName", formValues.fullName);
    formData.set("phone", formValues.phone);
    formData.set("email", formValues.email);
    formData.set("notes", formValues.notes);

    const chosenJob = page.jobs.find((j) => j.id === selectedJobId);
    if (chosenJob) {
      formData.set("jobId", chosenJob.id);
      formData.set("jobTitle", chosenJob.title);
    } else {
      formData.delete("jobId");
      formData.set("jobTitle", ar ? "طلب توظيف عام" : "General / Speculative Application");
    }

    try {
      const res = await submitCareerApplication(formState, formData);
      setFormState(res);
      if (res.status === "success") {
        // Clear fields on confirmed success
        setFormValues({ fullName: "", phone: "", email: "", notes: "" });
      }
    } catch {
      setFormState({
        status: "error",
        message: ar ? "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى." : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScrollToVacancies = () => {
    const el = document.getElementById("open-positions");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const currentJob = page.jobs.find((j) => j.id === selectedJobId);
  const selectedJobDisplayTitle = currentJob
    ? currentJob.title
    : ar
    ? "طلب توظيف عام"
    : "General Application";

  return (
    <>
      <SmoothScroll />
      <SiteHeader copy={copy} page="careers" />

      <main className="careers-page" dir={ar ? "rtl" : "ltr"}>
        {/* A. Hero Section */}
        <header className="careers-hero stage-pad">
          <nav className="careers-breadcrumb" aria-label="Breadcrumb">
            <Link href={homeHref}>{ar ? "الرئيسية" : "Home"}</Link>
            <span aria-hidden="true">/</span>
            <strong>{ar ? "الوظائف" : "Careers"}</strong>
          </nav>

          <div className="careers-hero-grid">
            <div className="careers-hero-text">
              <span className="careers-hero-eyebrow">{page.hero.eyebrow}</span>
              <h1>{page.hero.title}</h1>
              <p className="careers-hero-intro">{page.hero.intro}</p>
              <button
                type="button"
                className="btn-careers-scroll"
                onClick={handleScrollToVacancies}
                aria-label={ar ? "استكشف الفرص المتاحة" : "Explore Opportunities"}
              >
                <span>{ar ? "استكشف الفرص المتاحة" : "Explore Opportunities"}</span>
                <b aria-hidden="true">↓</b>
              </button>
            </div>

            <div className="careers-hero-media">
              <Image
                src={page.hero.image}
                alt={page.hero.title}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 45vw"
                quality={90}
                className="careers-hero-img"
              />
            </div>
          </div>
        </header>

        {/* B. Life at Image */}
        <section className="life-at-image-section stage-pad">
          <div className="section-header">
            <span className="section-eyebrow">{page.lifeAtImage.eyebrow}</span>
            <h2>{page.lifeAtImage.title}</h2>
          </div>

          <div className="life-at-image-grid">
            <div className="life-description">
              <p>{page.lifeAtImage.body}</p>
              <div className="life-pillars">
                <div className="pillar-item">
                  <strong>{ar ? "الإتقان المعماري" : "Craft & Precision"}</strong>
                  <span>{ar ? "معايير دقيقة في كل تفصيلة نبنيها." : "Meticulous standards in every space we shape."}</span>
                </div>
                <div className="pillar-item">
                  <strong>{ar ? "التعاون المشترك" : "Interdisciplinary Culture"}</strong>
                  <span>{ar ? "بيئة تعزز تبادل الخبرات والأفكار." : "Cross-functional teams driving innovation."}</span>
                </div>
                <div className="pillar-item">
                  <strong>{ar ? "النمو المستمر" : "Professional Evolution"}</strong>
                  <span>{ar ? "فرص حقيقية لتطوير مسارك المهني." : "Continuous pathways for career advancement."}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn-life-vacancies"
                onClick={handleScrollToVacancies}
              >
                <span>{ar ? "عرض الوظائف الشاغرة" : "View Open Positions"}</span>
                <b aria-hidden="true">{ar ? "←" : "→"}</b>
              </button>
            </div>

            <div className="life-gallery">
              {page.lifeAtImage.images.map((src, i) => (
                <div key={i} className={`life-thumb life-thumb-${i + 1}`}>
                  <Image src={src} alt={`Life at Image ${i + 1}`} fill sizes="33vw" quality={85} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* C. Open Positions */}
        <section id="open-positions" className="vacancies-section stage-pad">
          <div className="section-header">
            <div className="section-header-title-wrap">
              <span className="section-eyebrow">{ar ? "الفرص الوظيفية المتاحة" : "Current Opportunities"}</span>
              <h2>{ar ? "الوظائف المتاحة" : "Open Positions"}</h2>
            </div>
            <button
              type="button"
              className="btn-general-app-header"
              onClick={handleOpenGeneralApply}
            >
              <span>{ar ? "تقديم طلب عام" : "General Application"}</span>
              <b aria-hidden="true">{ar ? "←" : "→"}</b>
            </button>
          </div>

          {page.jobs.length > 0 ? (
            <>
              <div className="vacancies-list">
                {page.jobs.map((job) => (
                  <article key={job.id} className="vacancy-card">
                    <div className="vacancy-main">
                      <span className="vacancy-dept">{job.department}</span>
                      <h3 className="vacancy-title">{job.title}</h3>
                      <span className="vacancy-loc">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{job.location}</span>
                      </span>
                    </div>

                    <div className="vacancy-actions">
                      <button
                        type="button"
                        className="btn-view-job-details"
                        onClick={() => setActiveJobDetail(job)}
                        aria-label={`${ar ? "عرض تفاصيل" : "View details for"} ${job.title}`}
                      >
                        {ar ? "عرض تفاصيل الوظيفة" : "View Job Details"}
                      </button>
                      <button
                        type="button"
                        className="btn-apply-job"
                        onClick={() => handleOpenApply(job)}
                        aria-label={`${ar ? "قدّم الآن على" : "Apply now for"} ${job.title}`}
                      >
                        <span>{ar ? "قدّم الآن" : "Apply Now"}</span>
                        <b aria-hidden="true">{ar ? "←" : "→"}</b>
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="careers-speculative-footer">
                <p>
                  {ar
                    ? "لم تجد الشاغر المناسب لتخصصك وخبرتك؟"
                    : "Don't see an open vacancy matching your experience?"}
                </p>
                <button
                  type="button"
                  className="btn-speculative-link"
                  onClick={handleOpenGeneralApply}
                >
                  {ar ? "أرسل سيرتك الذاتية في طلب عام" : "Submit a Speculative Application"}
                </button>
              </div>
            </>
          ) : (
            <div className="vacancies-empty">
              <p>{ar ? "لا توجد شواغر معلنة حالياً. نرحب دائماً بالكفاءات الطموحة." : "No specific vacancies currently open. We always welcome ambitious talent."}</p>
              <button
                type="button"
                className="btn-apply-job"
                onClick={handleOpenGeneralApply}
                style={{ marginTop: "16px" }}
              >
                <span>{ar ? "قدّم طلباً عاماً الآن" : "Submit a General Application"}</span>
                <b aria-hidden="true">{ar ? "←" : "→"}</b>
              </button>
            </div>
          )}
        </section>
      </main>

      {/* =========================================================
          Job Details Modal
      ========================================================= */}
      {activeJobDetail && (
        <div
          className="modal-lightbox-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveJobDetail(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={activeJobDetail.title}
        >
          <div className="job-detail-modal-box" dir={ar ? "rtl" : "ltr"}>
            <div className="job-modal-header">
              <div>
                <span className="vacancy-dept">{activeJobDetail.department}</span>
                <h2>{activeJobDetail.title}</h2>
                <span className="vacancy-loc">{activeJobDetail.location}</span>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setActiveJobDetail(null)}
                aria-label={ar ? "إغلاق" : "Close"}
              >
                ×
              </button>
            </div>

            <div className="job-modal-content">
              <div className="job-section-block">
                <h4>{ar ? "نبذة عن الدور والمسؤوليات" : "Role Overview & Responsibilities"}</h4>
                <p>{activeJobDetail.description}</p>
              </div>

              <div className="job-section-block">
                <h4>{ar ? "المتطلبات والمؤهلات" : "Qualifications & Requirements"}</h4>
                <p>{activeJobDetail.requirements}</p>
              </div>
            </div>

            <div className="job-modal-footer">
              <button
                type="button"
                className="btn-apply-job"
                onClick={() => handleOpenApply(activeJobDetail)}
              >
                <span>{ar ? "قدّم لهذه الوظيفة الآن" : "Apply for this Position"}</span>
                <b aria-hidden="true">{ar ? "←" : "→"}</b>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          D. Career Application Modal
      ========================================================= */}
      {isApplyOpen && (
        <div
          className="modal-lightbox-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) handleCloseApply();
          }}
          role="dialog"
          aria-modal="true"
          aria-label={ar ? `التقديم: ${selectedJobDisplayTitle}` : `Apply: ${selectedJobDisplayTitle}`}
        >
          <div className="application-modal-box" dir={ar ? "rtl" : "ltr"}>
            <div className="application-modal-header">
              <div>
                <span className="apply-subhead">{ar ? "طلب تقديم وظيفي" : "Career Application"}</span>
                <h2>{selectedJobDisplayTitle}</h2>
                {currentJob && (
                  <span className="apply-dept">{currentJob.department} · {currentJob.location}</span>
                )}
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={handleCloseApply}
                disabled={isSubmitting}
                aria-label={ar ? "إغلاق" : "Close"}
              >
                ×
              </button>
            </div>

            {formState.status === "success" ? (
              <div className="apply-success-box">
                <div className="success-icon" aria-hidden="true">✓</div>
                <h3>{ar ? "تم إرسال طلبك بنجاح" : "Application Submitted"}</h3>
                <p>{formState.message}</p>
                <button
                  type="button"
                  className="btn-apply-job"
                  onClick={handleCloseApply}
                >
                  {ar ? "إغلاق" : "Done"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="application-form">
                {formState.status === "error" && formState.message && (
                  <div className="form-error-banner" role="alert">
                    {formState.message}
                  </div>
                )}

                {/* Selected Position Dropdown */}
                <div className="form-field">
                  <label htmlFor="app-job">
                    {ar ? "الوظيفة المتقدم لها *" : "Selected Position *"}
                  </label>
                  <select
                    id="app-job"
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    disabled={isSubmitting}
                    className="career-job-select"
                  >
                    {page.jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.department})
                      </option>
                    ))}
                    <option value="general">
                      {ar ? "طلب تقديم عام / غير مدرج" : "General / Speculative Application"}
                    </option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="app-name">
                      {ar ? "الاسم بالكامل *" : "Full Name *"}
                    </label>
                    <input
                      id="app-name"
                      name="fullName"
                      type="text"
                      required
                      value={formValues.fullName}
                      onChange={handleInputChange}
                      placeholder={ar ? "مثال: أحمد محمود" : "e.g. John Smith"}
                      disabled={isSubmitting}
                    />
                    {formState.fields?.fullName && (
                      <span className="field-err">{formState.fields.fullName}</span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="app-phone">
                      {ar ? "رقم الهاتف المحمول *" : "Phone Number *"}
                    </label>
                    <input
                      id="app-phone"
                      name="phone"
                      type="tel"
                      required
                      value={formValues.phone}
                      onChange={handleInputChange}
                      placeholder="+20 100 000 0000"
                      disabled={isSubmitting}
                    />
                    {formState.fields?.phone && (
                      <span className="field-err">{formState.fields.phone}</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="app-email">
                      {ar ? "البريد الإلكتروني *" : "Email Address *"}
                    </label>
                    <input
                      id="app-email"
                      name="email"
                      type="email"
                      required
                      value={formValues.email}
                      onChange={handleInputChange}
                      placeholder="name@example.com"
                      disabled={isSubmitting}
                    />
                    {formState.fields?.email && (
                      <span className="field-err">{formState.fields.email}</span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="app-cv">
                      {ar ? "السيرة الذاتية (CV) * (PDF, DOCX - كحد أقصى 5MB)" : "Upload CV * (PDF, DOCX - max 5MB)"}
                    </label>
                    <input
                      id="app-cv"
                      name="cv"
                      type="file"
                      required
                      accept=".pdf,.doc,.docx"
                      disabled={isSubmitting}
                      className="cv-file-input"
                    />
                    {formState.fields?.cv && (
                      <span className="field-err">{formState.fields.cv}</span>
                    )}
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="app-notes">
                    {ar ? "ملاحظات إضافية أو رابط لينكد إن (اختياري)" : "Additional Notes or LinkedIn URL (Optional)"}
                  </label>
                  <textarea
                    id="app-notes"
                    name="notes"
                    rows={3}
                    value={formValues.notes}
                    onChange={handleInputChange}
                    placeholder={ar ? "أخبرنا بإيجاز عن خبرتك السابقة..." : "Briefly tell us about your experience..."}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-actions-bottom">
                  <button
                    type="submit"
                    className="btn-submit-app"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span>{ar ? "جاري الإرسال..." : "Submitting..."}</span>
                    ) : (
                      <>
                        <span>{ar ? "إرسال طلب التقديم" : "Submit Application"}</span>
                        <b aria-hidden="true">{ar ? "←" : "→"}</b>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer copy={copy} page="careers" />
    </>
  );
}
