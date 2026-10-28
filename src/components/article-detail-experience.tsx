"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useMemo } from "react";
import type { NewsDetailPageContent } from "@/content/home";
import { SiteHeader } from "./site-header";
import { Footer } from "./homepage-experience";
import { SmoothScroll } from "./smooth-scroll";
import { useEnquiryModal } from "./enquiry-provider";
import {
  parseArticleBlocks,
  extractHeadings,
  type ArticleBlock,
} from "@/lib/article-blocks";

function renderInlineFormatting(text: string): React.ReactNode {
  if (!text) return "";
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\)|\n)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token === "\n") {
      parts.push(<br key={match.index} />);
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const linkMatch = token.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        const isExt = linkMatch[2].startsWith("http");
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            className="article-inline-link"
            target={isExt ? "_blank" : undefined}
            rel={isExt ? "noopener noreferrer" : undefined}
          >
            {linkMatch[1]}
          </a>
        );
      }
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

export function ArticleDetailExperience({ copy }: { copy: NewsDetailPageContent }) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const ar = copy.locale === "ar";
  const article = copy.article;
  const homeHref = `/${copy.locale}`;
  const journalHref = `/${copy.locale}/journal`;

  const { openEnquiry } = useEnquiryModal();

  const categoryLabels: Record<string, { en: string; ar: string }> = {
    NEWS: { en: "News", ar: "أخبار" },
    EVENTS: { en: "Events", ar: "فعاليات" },
    CONSTRUCTION: { en: "Construction Update", ar: "تحديثات الإنشاء" },
    ARCHITECTURE: { en: "Architecture", ar: "عمارة" },
  };

  const categoryDisplay =
    categoryLabels[article.category]?.[ar ? "ar" : "en"] || article.category;

  // Clean author check
  const isInternalAccount =
    !article.author ||
    /^(SYSTEM\s*ADMIN|ADMIN|ADMINISTRATOR)$/i.test(article.author.trim());
  const publicAuthor = isInternalAccount ? null : article.author?.trim();

  // Parse editorial content blocks
  const blocks = useMemo(
    () => parseArticleBlocks(article.content || article.excerpt),
    [article.content, article.excerpt]
  );

  // Extract headings for Table of Contents
  const headings = useMemo(() => extractHeadings(blocks), [blocks]);
  const showToc = Boolean(article.showTableOfContents && headings.length >= 2);

  // Handle CTA action
  const handleCtaClick = (
    actionType: "ENQUIRY" | "LINK",
    link?: string,
    projectId?: string,
    projectName?: string
  ) => {
    if (actionType === "ENQUIRY") {
      openEnquiry({
        projectId: projectId || article.relatedProject?.id,
        projectName: projectName || article.relatedProject?.name,
        enquiryType: projectId || article.relatedProject ? "project" : "general",
        sourcePage: pathname,
        sourceCta: "article_cta",
      });
    } else if (link) {
      if (link.startsWith("http")) {
        window.open(link, "_blank", "noopener,noreferrer");
      } else {
        router.push(link);
      }
    }
  };

  const sidebarProjects = copy.sidebarProjects;
  const hasSidebar = Boolean(
    sidebarProjects?.enabled &&
      sidebarProjects.projects &&
      sidebarProjects.projects.length > 0
  );
  const sidebarHeading =
    sidebarProjects?.heading || (ar ? "مشروعات أخرى" : "Other Projects");

  return (
    <>
      <SmoothScroll />
      <SiteHeader copy={copy} page="journal" />

      <main className="article-detail-page" dir={ar ? "rtl" : "ltr"}>
        <div className="article-container article-main-container stage-pad">
          {/* Breadcrumb Navigation */}
          <nav className="article-detail-breadcrumb" aria-label="Breadcrumb">
            <Link href={homeHref}>{ar ? "الرئيسية" : "Home"}</Link>
            <span className="breadcrumb-separator" aria-hidden="true">
              /
            </span>
            <Link href={journalHref}>{ar ? "يوميات إيمدج" : "Journal"}</Link>
            <span className="breadcrumb-separator" aria-hidden="true">
              /
            </span>
            <span className="breadcrumb-current" aria-current="page">
              {article.title}
            </span>
          </nav>

          {/* Article Introduction Header (spans full width above columns) */}
          <header className="article-detail-header">
            <div className="article-detail-meta-row">
              <span className="article-detail-category-badge">{categoryDisplay}</span>
              <span className="meta-separator" aria-hidden="true">
                •
              </span>
              <time className="article-detail-date" dateTime={article.rawDate}>
                {article.date}
              </time>
              {article.readingTime && (
                <>
                  <span className="meta-separator" aria-hidden="true">
                    •
                  </span>
                  <span className="article-detail-reading-time">
                    {article.readingTime}
                  </span>
                </>
              )}
              {publicAuthor && (
                <>
                  <span className="meta-separator" aria-hidden="true">
                    •
                  </span>
                  <span className="article-detail-author">{publicAuthor}</span>
                </>
              )}
              {article.constructionDate && (
                <>
                  <span className="meta-separator" aria-hidden="true">
                    •
                  </span>
                  <span className="article-detail-construction-date">
                    {ar ? `تحديث: ${article.constructionDate}` : `Update: ${article.constructionDate}`}
                  </span>
                </>
              )}
            </div>

            <h1 className="article-detail-title">{article.title}</h1>
            {article.excerpt && (
              <p className="article-detail-excerpt">{article.excerpt}</p>
            )}
          </header>

          {/* Two-Column Desktop Layout (Physical Left: Sidebar, Physical Right: Article Content) */}
          <div
            className={`article-two-column-layout ${
              hasSidebar ? "has-sidebar" : "no-sidebar"
            }`}
          >
            {/* Primary Article Content Column (Placed 1st in DOM for clean mobile/accessibility flow) */}
            <article className="article-body-column" dir={ar ? "rtl" : "ltr"}>
              {/* Cover Image & Caption */}
              <figure className="article-detail-cover-figure">
                <div className="article-detail-cover-frame">
                  <Image
                    src={article.image}
                    alt={article.alt || article.title}
                    fill
                    priority
                    sizes="(max-width: 960px) 100vw, 850px"
                    style={{ objectPosition: article.focalPoint || "center" }}
                    className="article-detail-cover-img"
                  />
                </div>
                {(article.coverCaption || article.coverCredit) && (
                  <figcaption className="article-cover-caption">
                    {article.coverCaption && (
                      <span className="caption-text">{article.coverCaption}</span>
                    )}
                    {article.coverCaption && article.coverCredit && (
                      <span className="caption-divider" aria-hidden="true">
                        {" "}—{" "}
                      </span>
                    )}
                    {article.coverCredit && (
                      <span className="credit-text">{article.coverCredit}</span>
                    )}
                  </figcaption>
                )}
              </figure>

              {/* Table of Contents (for longer articles) */}
              {showToc && (
                <div className="article-detail-content-wrapper">
                  <aside
                    className="article-toc-box"
                    aria-label={ar ? "محتويات المقال" : "Table of Contents"}
                  >
                    <div className="article-toc-heading">
                      <span className="toc-icon" aria-hidden="true">
                        §
                      </span>
                      <h3>{ar ? "محتويات المقال" : "Table of Contents"}</h3>
                    </div>
                    <nav className="article-toc-nav">
                      <ol>
                        {headings.map((h, i) => (
                          <li key={h.id} className={`toc-level-${h.level}`}>
                            <a href={`#${h.id}`}>
                              <span className="toc-number">{String(i + 1).padStart(2, "0")}</span>
                              <span className="toc-text">{h.text}</span>
                            </a>
                          </li>
                        ))}
                      </ol>
                    </nav>
                  </aside>
                </div>
              )}

              {/* Editorial Reading Column with CMS Blocks */}
              <div className="article-detail-content-wrapper">
                <div className="article-detail-rich-body">
                  {blocks.map((block: ArticleBlock, idx: number) => {
                    switch (block.type) {
                      case "paragraph":
                        return (
                          <p key={idx} className="article-body-p">
                            {renderInlineFormatting(block.text)}
                          </p>
                        );

                      case "heading": {
                        const HeadingTag = block.level === 3 ? "h3" : "h2";
                        const headingClass =
                          block.level === 3 ? "article-body-h3" : "article-body-h2";
                        return (
                          <HeadingTag key={idx} id={block.id} className={headingClass}>
                            {block.text}
                          </HeadingTag>
                        );
                      }

                      case "quote":
                        return (
                          <blockquote key={idx} className="article-body-quote">
                            <p>{renderInlineFormatting(block.text)}</p>
                            {block.attribution && (
                              <cite className="quote-attribution">
                                — {block.attribution}
                              </cite>
                            )}
                          </blockquote>
                        );

                      case "list":
                        if (block.ordered) {
                          return (
                            <ol key={idx} className="article-body-list ordered">
                              {block.items.map((item, itemIdx) => (
                                <li key={itemIdx}>{renderInlineFormatting(item)}</li>
                              ))}
                            </ol>
                          );
                        }
                        return (
                          <ul key={idx} className="article-body-list unordered">
                            {block.items.map((item, itemIdx) => (
                              <li key={itemIdx}>{renderInlineFormatting(item)}</li>
                            ))}
                          </ul>
                        );

                      case "image":
                        return (
                          <figure key={idx} className="article-body-image-breakout">
                            <div className="article-breakout-frame">
                              <Image
                                src={block.url}
                                alt={block.alt || article.title}
                                fill
                                sizes="(max-width: 900px) 100vw, 960px"
                                className="article-breakout-img"
                                loading="lazy"
                              />
                            </div>
                            {(block.caption || block.credit) && (
                              <figcaption className="article-block-caption">
                                {block.caption && <span>{block.caption}</span>}
                                {block.caption && block.credit && <span> — </span>}
                                {block.credit && <cite>{block.credit}</cite>}
                              </figcaption>
                            )}
                          </figure>
                        );

                      case "two-images":
                        return (
                          <figure key={idx} className="article-two-images-breakout">
                            <div className="two-images-grid">
                              <div className="two-images-card">
                                <div className="two-images-frame">
                                  <Image
                                    src={block.image1.url}
                                    alt={block.image1.alt || article.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 480px"
                                    className="two-images-img"
                                    loading="lazy"
                                  />
                                </div>
                                {block.image1.caption && (
                                  <figcaption className="two-images-subcaption">
                                    {block.image1.caption}
                                  </figcaption>
                                )}
                              </div>
                              <div className="two-images-card">
                                <div className="two-images-frame">
                                  <Image
                                    src={block.image2.url}
                                    alt={block.image2.alt || article.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 480px"
                                    className="two-images-img"
                                    loading="lazy"
                                  />
                                </div>
                                {block.image2.caption && (
                                  <figcaption className="two-images-subcaption">
                                    {block.image2.caption}
                                  </figcaption>
                                )}
                              </div>
                            </div>
                            {block.caption && (
                              <figcaption className="article-block-caption text-center">
                                {block.caption}
                              </figcaption>
                            )}
                          </figure>
                        );

                      case "video":
                        return (
                          <figure key={idx} className="article-video-breakout">
                            <div className="article-video-frame">
                              {block.isVideoFile ? (
                                <video
                                  src={block.embedUrl}
                                  controls
                                  playsInline
                                  preload="metadata"
                                  className="article-video-element"
                                />
                              ) : (
                                <iframe
                                  src={block.embedUrl}
                                  title={block.title || article.title}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  className="article-video-iframe"
                                />
                              )}
                            </div>
                            {block.caption && (
                              <figcaption className="article-block-caption">
                                {block.caption}
                              </figcaption>
                            )}
                          </figure>
                        );

                      case "project":
                        if (!article.relatedProject) return null;
                        return (
                          <div key={idx} className="article-inline-project-callout">
                            <div className="inline-project-thumb">
                              <Image
                                src={article.relatedProject.image}
                                alt={article.relatedProject.imageAlt}
                                fill
                                sizes="120px"
                                className="inline-project-img"
                              />
                            </div>
                            <div className="inline-project-content">
                              <span className="inline-project-tag">
                                {ar ? "المشروع ذو الصلة" : "Related Project"}
                              </span>
                              <h4 className="inline-project-title">
                                {article.relatedProject.name}
                              </h4>
                              <p className="inline-project-location">
                                {article.relatedProject.location}
                              </p>
                              <Link
                                href={`/${copy.locale}/projects/${article.relatedProject.slug}`}
                                className="inline-project-link"
                              >
                                <span>{ar ? "استكشف المشروع" : "Explore Project"}</span>
                                <span aria-hidden="true">{ar ? "←" : "→"}</span>
                              </Link>
                            </div>
                          </div>
                        );

                      case "cta":
                        return (
                          <div key={idx} className="article-contextual-cta">
                            <h3 className="contextual-cta-heading">{block.heading}</h3>
                            <p className="contextual-cta-text">{block.text}</p>
                            <button
                              type="button"
                              className="btn-contextual-cta"
                              onClick={() =>
                                handleCtaClick(
                                  block.actionType || "ENQUIRY",
                                  block.buttonLink
                                )
                              }
                            >
                              {block.buttonLabel}
                            </button>
                          </div>
                        );

                      default:
                        return null;
                    }
                  })}
                </div>

                {/* Optional Standalone Contextual CTA configured in article settings */}
                {article.cta?.enabled && (
                  <div className="article-standalone-cta">
                    <div className="standalone-cta-inner">
                      <h3 className="standalone-cta-title">{article.cta.heading}</h3>
                      <p className="standalone-cta-text">{article.cta.text}</p>
                      <button
                        type="button"
                        className="btn-article-cta"
                        onClick={() =>
                          handleCtaClick(
                            article.cta?.actionType || "ENQUIRY",
                            article.cta?.buttonLink
                          )
                        }
                      >
                        {article.cta.buttonLabel}
                      </button>
                    </div>
                  </div>
                )}

                {/* Back to Journal Link */}
                <div className="article-back-navigation">
                  <Link href={journalHref} className="btn-back-to-journal">
                    <span className="back-arrow" aria-hidden="true">
                      {ar ? "→" : "←"}
                    </span>
                    <span>{ar ? "العودة إلى اليوميات" : "Back to Journal"}</span>
                  </Link>
                </div>
              </div>
            </article>

            {/* Other Projects Sidebar (Physical Left) */}
            {hasSidebar && sidebarProjects && (
              <aside
                className="article-projects-sidebar"
                aria-label={sidebarHeading}
                dir={ar ? "rtl" : "ltr"}
              >
                <div className="article-sidebar-sticky-inner">
                  <h3 className="article-sidebar-heading">{sidebarHeading}</h3>

                  <div className="article-sidebar-projects-list">
                    {sidebarProjects.projects.map((proj) => (
                      <article
                        key={proj.id}
                        className="article-sidebar-project-card"
                      >
                        <Link
                          href={proj.href}
                          className="sidebar-project-media-link"
                          tabIndex={-1}
                          aria-hidden="true"
                        >
                          <div className="sidebar-project-media-frame">
                            <Image
                              src={proj.image}
                              alt={proj.imageAlt || proj.name}
                              fill
                              sizes="(max-width: 960px) 100vw, 320px"
                              style={{
                                objectPosition: proj.focalPoint || "center",
                              }}
                              className="sidebar-project-img"
                            />
                            {(sidebarProjects.showType ||
                              sidebarProjects.showStatus) && (
                              <div className="sidebar-project-badges">
                                {sidebarProjects.showType && proj.projectType && (
                                  <span className="sidebar-badge type">
                                    {proj.projectType}
                                  </span>
                                )}
                                {sidebarProjects.showStatus &&
                                  proj.progressStatus && (
                                    <span className="sidebar-badge status">
                                      {proj.progressStatus}
                                    </span>
                                  )}
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="sidebar-project-content">
                          <h4 className="sidebar-project-title">
                            <Link href={proj.href}>{proj.name}</Link>
                          </h4>

                          {sidebarProjects.showLocation && proj.location && (
                            <p className="sidebar-project-location">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                                className="location-icon"
                              >
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              <span>{proj.location}</span>
                            </p>
                          )}

                          <Link
                            href={proj.href}
                            className="sidebar-project-explore-link"
                          >
                            <span>{ar ? "استكشف المشروع" : "Explore Project"}</span>
                            <span className="explore-arrow" aria-hidden="true">
                              {ar ? "←" : "→"}
                            </span>
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>

                  <Link
                    href={sidebarProjects.viewAllHref}
                    className="btn-sidebar-view-all"
                  >
                    <span>{sidebarProjects.viewAllLabel}</span>
                    <span aria-hidden="true" className="view-all-arrow">
                      {ar ? "←" : "→"}
                    </span>
                  </Link>
                </div>
              </aside>
            )}
          </div>
        </div>

        {/* Related Project Section */}
        {article.showRelatedProject && article.relatedProject && (
          <section
            className="article-related-project-section stage-pad"
            aria-label={ar ? "المشروع ذو الصلة" : "Related Project"}
          >
            <div className="article-related-project-container">
              <div className="related-project-header">
                <span className="section-eyebrow">
                  {ar ? "مشاريع إيمدج" : "Featured Destination"}
                </span>
                <h2 className="related-project-heading">
                  {ar ? "المشروع ذو الصلة" : "Related Project"}
                </h2>
              </div>

              <div className="related-project-card">
                <div className="related-project-media">
                  <Image
                    src={article.relatedProject.image}
                    alt={article.relatedProject.imageAlt}
                    fill
                    sizes="(max-width: 900px) 100vw, 550px"
                    style={{ objectPosition: article.relatedProject.focalPoint || "center" }}
                    className="related-project-img"
                  />
                  <div className="related-project-badges">
                    <span className="project-badge type">
                      {article.relatedProject.projectType}
                    </span>
                    <span className="project-badge status">
                      {article.relatedProject.progressStatus}
                    </span>
                  </div>
                </div>

                <div className="related-project-info">
                  <div className="related-project-meta">
                    <span className="related-project-location">
                      {article.relatedProject.location}
                    </span>
                    {article.constructionDate && (
                      <>
                        <span className="meta-separator" aria-hidden="true">
                          •
                        </span>
                        <span className="related-project-update-date">
                          {ar
                            ? `تحديث: ${article.constructionDate}`
                            : `Update: ${article.constructionDate}`}
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="related-project-name">
                    {article.relatedProject.name}
                  </h3>

                  <p className="related-project-description">
                    {article.relatedProject.shortDescription}
                  </p>

                  <div className="related-project-actions">
                    <Link
                      href={`/${copy.locale}/projects/${article.relatedProject.slug}`}
                      className="btn-explore-project"
                    >
                      <span>{ar ? "استكشف المشروع" : "Explore Project"}</span>
                      <span aria-hidden="true">{ar ? "←" : "→"}</span>
                    </Link>

                    <button
                      type="button"
                      className="btn-register-interest"
                      onClick={() =>
                        openEnquiry({
                          projectId: article.relatedProject?.id,
                          projectName: article.relatedProject?.name,
                          enquiryType: "project",
                          sourcePage: pathname,
                          sourceCta: "article_related_project_register",
                        })
                      }
                    >
                      {ar ? "سجل اهتمامك" : "Register Interest"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Related Stories */}
        {copy.relatedStories && copy.relatedStories.length > 0 && (
          <aside
            className="article-related-section stage-pad"
            aria-label={ar ? "مقالات ذات صلة" : "Related Articles"}
          >
            <div className="article-related-container">
              <div className="article-related-header">
                <span className="section-eyebrow">
                  {ar ? "من الاستوديو" : "From the Studio"}
                </span>
                <h2 className="article-related-heading">
                  {ar ? "مقالات ذات صلة" : "Related Articles"}
                </h2>
              </div>

              <div className="article-related-grid">
                {copy.relatedStories.map((story) => (
                  <article key={story.id} className="article-related-card">
                    <Link
                      href={`/${copy.locale}/journal/${story.slug}`}
                      className="article-related-thumb-link"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <div className="article-related-thumb-frame">
                        <Image
                          src={story.image}
                          alt={story.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 360px"
                          style={{ objectPosition: story.focalPoint || "center" }}
                          className="article-related-thumb-img"
                        />
                      </div>
                    </Link>

                    <div className="article-related-body">
                      <div className="article-related-meta">
                        <span className="article-related-category">
                          {categoryLabels[story.category]?.[ar ? "ar" : "en"] ||
                            story.category}
                        </span>
                        <span className="meta-separator" aria-hidden="true">
                          •
                        </span>
                        <time
                          className="article-related-date"
                          dateTime={story.rawDate}
                        >
                          {story.date}
                        </time>
                      </div>

                      <h3 className="article-related-title">
                        <Link href={`/${copy.locale}/journal/${story.slug}`}>
                          {story.title}
                        </Link>
                      </h3>

                      <p className="article-related-excerpt">{story.excerpt}</p>

                      <Link
                        href={`/${copy.locale}/journal/${story.slug}`}
                        className="article-related-read-more"
                      >
                        <span>{ar ? "اقرأ المزيد" : "Read More"}</span>
                        <span aria-hidden="true">{ar ? "←" : "→"}</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </aside>
        )}
      </main>

      <Footer copy={copy} page="journal" />
    </>
  );
}
