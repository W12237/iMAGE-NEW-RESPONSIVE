"use client";

import React, { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import type { TermsPageContent } from "@/content/home";
import { SiteHeader } from "./site-header";
import { Footer } from "./homepage-experience";

const urlPattern = /(https?:\/\/[^\s]+)/;

function textWithLinks(text: string): ReactNode[] {
  return text.split(urlPattern).map((part, index) =>
    urlPattern.test(part) ? (
      <a key={index} href={part} target="_blank" rel="noopener noreferrer">
        {part}
      </a>
    ) : (
      part
    )
  );
}

function TermsBody({ body }: { body: string }) {
  return (
    <div className="terms-rich-copy">
      {body
        .trim()
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((block, index) => {
          const lines = block
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
          const bullets = lines.every((line) => /^[-*]\s+/.test(line));
          const numbered = lines.every((line) => /^\d+[.)]\s+/.test(line));

          if (bullets || numbered) {
            const Tag = numbered ? "ol" : "ul";
            return (
              <Tag key={index}>
                {lines.map((line, item) => (
                  <li key={item}>
                    {textWithLinks(
                      line.replace(bullets ? /^[-*]\s+/ : /^\d+[.)]\s+/, "")
                    )}
                  </li>
                ))}
              </Tag>
            );
          }

          return (
            <p key={index}>
              {lines.map((line, item) => (
                <span key={item}>
                  {textWithLinks(line)}
                  {item < lines.length - 1 && <br />}
                </span>
              ))}
            </p>
          );
        })}
    </div>
  );
}

export function TermsPageExperience({ copy }: { copy: TermsPageContent }) {
  const ar = copy.locale === "ar";
  const homeHref = `/${copy.locale}`;
  const sections = copy.termsPage.sections || [];

  const [activeSection, setActiveSection] = useState<string>(() =>
    sections.length > 0 ? `terms-${sections[0].id}` : ""
  );

  // Active section tracking via IntersectionObserver
  useEffect(() => {
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          setActiveSection(visible.target.id);
        }
      },
      {
        rootMargin: "-120px 0px -60% 0px",
        threshold: 0,
      }
    );

    sections.forEach((s) => {
      const el = document.getElementById(`terms-${s.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  // Handle direct links on initial load / hash changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.replace("#", "");
      const target = document.getElementById(id);
      if (target) {
        setActiveSection(id);
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  const handleTocClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      window.history.pushState(null, "", `#${targetId}`);
      setActiveSection(targetId);
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <SiteHeader copy={copy} page="terms" />
      <main className="terms-page" dir={copy.dir}>
        {/* Page Introduction Hero */}
        <header id="top" className="terms-hero stage-pad">
          <div className="terms-hero-inner">
            {/* Discreet Breadcrumb */}
            <nav className="terms-breadcrumb" aria-label={ar ? "مسار التنقل" : "Breadcrumb"}>
              <Link href={homeHref} className="terms-breadcrumb-link">
                {ar ? "الرئيسية" : "Home"}
              </Link>
              <span className="terms-breadcrumb-sep" aria-hidden="true">
                /
              </span>
              <span className="terms-breadcrumb-current" aria-current="page">
                {ar ? "الشروط والأحكام" : "Terms & Conditions"}
              </span>
            </nav>

            {/* Single H1 */}
            <h1 className="terms-h1">{copy.termsPage.title}</h1>

            {/* Introduction & Secondary Metadata */}
            <div className="terms-hero-meta-row">
              {copy.termsPage.intro && (
                <p className="terms-intro-p">{copy.termsPage.intro}</p>
              )}
              {copy.termsPage.lastUpdated && (
                <div className="terms-revision-date">
                  <span className="terms-revision-label">
                    {ar ? "آخر تحديث منشور" : "Last updated"}
                  </span>
                  <time className="terms-revision-val">{copy.termsPage.lastUpdated}</time>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Legal Reading Document Container */}
        <section className="terms-document-section stage-pad">
          <div className="terms-document-layout">
            {/* Desktop Table of Contents Sidebar */}
            {sections.length > 1 && (
              <aside className="terms-toc-aside" aria-label={ar ? "فهرس المحتويات" : "Table of contents"}>
                <div className="terms-toc-sticky-box">
                  <h2 className="terms-toc-heading">{ar ? "في هذه الصفحة" : "On this page"}</h2>
                  <nav className="terms-toc-nav">
                    {sections.map((section) => {
                      const id = `terms-${section.id}`;
                      const isActive = activeSection === id;
                      return (
                        <a
                          key={section.id}
                          href={`#${id}`}
                          onClick={(e) => handleTocClick(e, id)}
                          className={`terms-toc-link ${isActive ? "is-active" : ""}`}
                          aria-current={isActive ? "location" : undefined}
                        >
                          <span className="terms-toc-bullet" aria-hidden="true" />
                          <span className="terms-toc-text">{section.title}</span>
                        </a>
                      );
                    })}
                  </nav>
                </div>
              </aside>
            )}

            {/* Mobile Expandable "On this page" TOC */}
            {sections.length > 1 && (
              <div className="terms-mobile-toc-wrap">
                <details className="terms-mobile-toc">
                  <summary className="terms-mobile-toc-summary">
                    <span>{ar ? "في هذه الصفحة (فهرس البنود)" : "On this page (Table of contents)"}</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </summary>
                  <nav className="terms-mobile-toc-nav">
                    {sections.map((section) => {
                      const id = `terms-${section.id}`;
                      const isActive = activeSection === id;
                      return (
                        <a
                          key={section.id}
                          href={`#${id}`}
                          onClick={(e) => handleTocClick(e, id)}
                          className={`terms-mobile-toc-link ${isActive ? "is-active" : ""}`}
                        >
                          {section.title}
                        </a>
                      );
                    })}
                  </nav>
                </details>
              </div>
            )}

            {/* Continuous Legal Reading Column */}
            <div className="terms-reading-column">
              {sections.length > 0 ? (
                <div className="terms-clauses-flow">
                  {sections.map((section) => (
                    <article
                      id={`terms-${section.id}`}
                      key={section.id}
                      className="terms-clause-article"
                    >
                      <h2 className="terms-clause-title">{section.title}</h2>
                      <TermsBody body={section.body} />
                    </article>
                  ))}
                </div>
              ) : (
                <p className="terms-empty">
                  {ar
                    ? "سيتم نشر الشروط والأحكام المعتمدة قريباً."
                    : "Approved terms and conditions will be published soon."}
                </p>
              )}

              {/* End-of-Page Utility: Questions & Privacy Block */}
              <div className="terms-end-utility">
                <div className="terms-utility-card">
                  <div className="terms-utility-body">
                    <h3 className="terms-utility-title">
                      {ar ? "هل لديك استفسارات حول هذه الشروط؟" : "Questions about these terms?"}
                    </h3>
                    <p className="terms-utility-text">
                      {ar
                        ? "فريقنا القانوني والاستشاري في إيمدج للتطوير العقاري متاح للإجابة على استفساراتكم وتقديم الدعم المطلوب."
                        : "Our legal and advisory team at Image Developments is available to assist you with any questions or clarifications."}
                    </p>
                  </div>
                  <div className="terms-utility-actions">
                    <Link href={`/${copy.locale}/contact`} className="terms-contact-btn">
                      <span>{ar ? "تواصل معنا" : "Contact Us"}</span>
                      <span aria-hidden="true">{ar ? "←" : "→"}</span>
                    </Link>
                    <Link href={`/${copy.locale}/policy`} className="terms-policy-link">
                      {ar ? "سياسة الخصوصية" : "Privacy Policy"}
                    </Link>
                    <button
                      type="button"
                      onClick={scrollToTop}
                      className="terms-back-top-btn"
                      aria-label={ar ? "العودة إلى أعلى الصفحة" : "Back to top"}
                    >
                      <span>{ar ? "العودة للأعلى" : "Back to top"}</span>
                      <span aria-hidden="true">↑</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer copy={copy} page="terms" />
    </>
  );
}
