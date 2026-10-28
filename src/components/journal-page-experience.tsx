"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import type { NewsPageContent } from "@/content/home";
import { SiteHeader } from "./site-header";
import { Footer } from "./homepage-experience";
import { SmoothScroll } from "./smooth-scroll";
import { useEnquiryModal } from "./enquiry-provider";

export function JournalPageExperience({ copy }: { copy: NewsPageContent }) {
  const ar = copy.locale === "ar";
  const homeHref = `/${copy.locale}`;
  const page = copy.newsPage;
  const { openEnquiry } = useEnquiryModal();

  const batchSize = page.articlesPerPage || 6;

  // 1. Category state synchronized with URL search params
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      if (cat) return cat.toUpperCase();
    }
    return "ALL";
  });
  const [visibleCount, setVisibleCount] = useState<number>(batchSize);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>("");

  // Sync category on browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      setActiveCategory(cat ? cat.toUpperCase() : "ALL");
      setVisibleCount(batchSize);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [batchSize]);

  const handleCategoryChange = (category: string) => {
    const newCat = category.toUpperCase();
    setActiveCategory(newCat);
    setVisibleCount(batchSize);
    setAnnouncement(
      ar
        ? `تم تحديث التصنيف إلى: ${getCategoryLabel(newCat, ar)}`
        : `Filtered to ${getCategoryLabel(newCat, ar)}`
    );

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (newCat === "ALL") {
        url.searchParams.delete("category");
      } else {
        url.searchParams.set("category", newCat.toLowerCase());
      }
      window.history.pushState({}, "", url.toString());
    }
  };

  // Category label helper
  const getCategoryLabel = (cat: string, isArabic: boolean): string => {
    const map: Record<string, { en: string; ar: string }> = {
      ALL: { en: "All", ar: "الكل" },
      NEWS: { en: "News", ar: "الأخبار" },
      EVENTS: { en: "Events", ar: "الفعاليات" },
      CONSTRUCTION: { en: "Construction Updates", ar: "تحديثات الإنشاء" },
    };
    if (map[cat]) return isArabic ? map[cat].ar : map[cat].en;
    // Format custom category
    const formatted = cat.charAt(0) + cat.slice(1).toLowerCase().replace(/_/g, " ");
    return formatted;
  };

  // 2. Feed stories calculation (Featured at top, no duplication, category-filtered)
  const { topFeatured, remainingStories } = useMemo(() => {
    const all = page.allStories;

    if (activeCategory === "ALL") {
      const featured = page.featuredStory || all[0];
      const remaining = featured ? all.filter((s) => s.id !== featured.id) : all;
      return { topFeatured: featured, remainingStories: remaining };
    }

    // Filter matching category
    const matching = all.filter(
      (s) => s.category.toUpperCase() === activeCategory.toUpperCase()
    );

    if (matching.length === 0) {
      return { topFeatured: undefined, remainingStories: [] };
    }

    // If global featured story matches the active category, use it; otherwise use first matching story
    const featured =
      matching.find((s) => page.featuredStory && s.id === page.featuredStory.id) ||
      matching[0];

    const remaining = matching.filter((s) => s.id !== featured.id);
    return { topFeatured: featured, remainingStories: remaining };
  }, [page.allStories, page.featuredStory, activeCategory]);

  const displayedRemaining = remainingStories.slice(0, visibleCount);
  const hasMore = visibleCount < remainingStories.length;

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => {
        const next = prev + batchSize;
        const total = (topFeatured ? 1 : 0) + remainingStories.length;
        const shown = Math.min((topFeatured ? 1 : 0) + next, total);
        setAnnouncement(
          ar
            ? `تم عرض ${shown} من أصل ${total} مقالاً`
            : `Showing ${shown} of ${total} articles`
        );
        return next;
      });
      setIsLoadingMore(false);
    }, 200);
  };

  // Check public author (ensure never showing SYSTEM ADMIN or internal account)
  const formatAuthor = (author?: string): string | null => {
    if (!author) return null;
    const trimmed = author.trim();
    if (!trimmed || /^(SYSTEM\s*ADMIN|ADMIN|ADMINISTRATOR)$/i.test(trimmed)) {
      return null;
    }
    return trimmed;
  };

  // Categories list
  const categoryTabs = ["ALL", ...page.categories];

  return (
    <>
      <SmoothScroll />
      <SiteHeader copy={copy} page="journal" />

      <main className="journal-page-editorial" dir={ar ? "rtl" : "ltr"}>
        {/* Screen Reader Live Announcements */}
        <div className="sr-only" role="status" aria-live="polite">
          {announcement}
        </div>

        {/* 1. Compact Breadcrumb & Journal Introduction */}
        <section className="journal-intro-section stage-pad">
          <div className="journal-intro-container">
            <nav className="journal-breadcrumb" aria-label="Breadcrumb">
              <Link href={homeHref}>{ar ? "الرئيسية" : "Home"}</Link>
              <span className="breadcrumb-separator" aria-hidden="true">
                /
              </span>
              <span className="breadcrumb-current" aria-current="page">
                {ar ? "يوميات إيمدج" : "Journal"}
              </span>
            </nav>

            <div className="journal-intro-header">
              <div className="journal-intro-content">
                <span className="journal-eyebrow">
                  {page.hero.eyebrow || (ar ? "يوميات إيمدج" : "Image Journal")}
                </span>
                <h1 className="journal-main-title">{page.hero.title}</h1>
                <p className="journal-intro-text">{page.hero.intro}</p>
              </div>

              {page.hero.image && (
                <div className="journal-hero-compact-media">
                  <Image
                    src={page.hero.image}
                    alt={page.hero.alt || page.hero.title}
                    fill
                    priority
                    sizes="(max-width: 900px) 100vw, 420px"
                    style={{ objectPosition: page.hero.focalPoint || "center" }}
                    className="journal-hero-compact-img"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. Category Navigation */}
        <section className="journal-category-nav-section stage-pad">
          <div className="journal-category-nav-container">
            <div
              className="journal-category-tabs"
              role="tablist"
              aria-label={ar ? "تصنيفات المقالات" : "Article Categories"}
            >
              {categoryTabs.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    id={`journal-tab-${cat.toLowerCase()}`}
                    aria-selected={isActive}
                    aria-controls="journal-editorial-feed"
                    className={`journal-category-tab ${isActive ? "is-active" : ""}`}
                    onClick={() => handleCategoryChange(cat)}
                  >
                    <span>{getCategoryLabel(cat, ar)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. Main Editorial Layout (Article Feed ~2/3 + Recent Articles Sidebar ~1/3) */}
        <section
          id="journal-editorial-feed"
          className="journal-editorial-section stage-pad"
          aria-label={ar ? "مقالات اليوميات" : "Journal Articles Feed"}
        >
          <div className="journal-editorial-layout">
            {/* Primary Column: Article Feed */}
            <div className="journal-main-feed">
              {topFeatured ? (
                <>
                  {/* Featured Article Preview */}
                  <article className="journal-article-preview featured-preview">
                    <Link
                      href={`/${copy.locale}/journal/${topFeatured.slug}`}
                      className="journal-preview-media-link"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <div className="journal-preview-media-frame">
                        <Image
                          src={topFeatured.image}
                          alt={topFeatured.alt || topFeatured.title}
                          fill
                          priority
                          sizes="(max-width: 900px) 100vw, (max-width: 1200px) 65vw, 780px"
                          style={{ objectPosition: topFeatured.focalPoint || "center" }}
                          className="journal-preview-img"
                        />
                      </div>
                    </Link>

                    <div className="journal-preview-meta">
                      <span className="journal-preview-category">
                        {getCategoryLabel(topFeatured.category, ar)}
                      </span>
                      <span className="journal-preview-dot" aria-hidden="true">
                        •
                      </span>
                      <time className="journal-preview-date" dateTime={topFeatured.rawDate}>
                        {topFeatured.date}
                      </time>
                      {formatAuthor(topFeatured.author) && (
                        <>
                          <span className="journal-preview-dot" aria-hidden="true">
                            •
                          </span>
                          <span className="journal-preview-author">
                            {formatAuthor(topFeatured.author)}
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="journal-preview-title featured-title">
                      <Link href={`/${copy.locale}/journal/${topFeatured.slug}`}>
                        {topFeatured.title}
                      </Link>
                    </h2>

                    <p className="journal-preview-excerpt">{topFeatured.excerpt}</p>

                    <div className="journal-preview-footer">
                      <Link
                        href={`/${copy.locale}/journal/${topFeatured.slug}`}
                        className="journal-read-more-link"
                        aria-label={`${ar ? "اقرأ المزيد:" : "Read more:"} ${topFeatured.title}`}
                      >
                        <span>{ar ? "اقرأ المزيد" : "Read More"}</span>
                        <span className="read-more-arrow" aria-hidden="true">
                          {ar ? "←" : "→"}
                        </span>
                      </Link>
                    </div>
                  </article>

                  {/* Vertically Stacked Article Previews */}
                  {displayedRemaining.map((story) => (
                    <article key={story.id} className="journal-article-preview">
                      <Link
                        href={`/${copy.locale}/journal/${story.slug}`}
                        className="journal-preview-media-link"
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        <div className="journal-preview-media-frame">
                          <Image
                            src={story.image}
                            alt={story.alt || story.title}
                            fill
                            loading="lazy"
                            sizes="(max-width: 900px) 100vw, (max-width: 1200px) 65vw, 780px"
                            style={{ objectPosition: story.focalPoint || "center" }}
                            className="journal-preview-img"
                          />
                        </div>
                      </Link>

                      <div className="journal-preview-meta">
                        <span className="journal-preview-category">
                          {getCategoryLabel(story.category, ar)}
                        </span>
                        <span className="journal-preview-dot" aria-hidden="true">
                          •
                        </span>
                        <time className="journal-preview-date" dateTime={story.rawDate}>
                          {story.date}
                        </time>
                        {formatAuthor(story.author) && (
                          <>
                            <span className="journal-preview-dot" aria-hidden="true">
                              •
                            </span>
                            <span className="journal-preview-author">
                              {formatAuthor(story.author)}
                            </span>
                          </>
                        )}
                      </div>

                      <h2 className="journal-preview-title">
                        <Link href={`/${copy.locale}/journal/${story.slug}`}>
                          {story.title}
                        </Link>
                      </h2>

                      <p className="journal-preview-excerpt">{story.excerpt}</p>

                      <div className="journal-preview-footer">
                        <Link
                          href={`/${copy.locale}/journal/${story.slug}`}
                          className="journal-read-more-link"
                          aria-label={`${ar ? "اقرأ المزيد:" : "Read more:"} ${story.title}`}
                        >
                          <span>{ar ? "اقرأ المزيد" : "Read More"}</span>
                          <span className="read-more-arrow" aria-hidden="true">
                            {ar ? "←" : "→"}
                          </span>
                        </Link>
                      </div>
                    </article>
                  ))}

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="journal-load-more-container">
                      <button
                        type="button"
                        id="journal-load-more-btn"
                        className="journal-load-more-btn"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        aria-busy={isLoadingMore}
                      >
                        {isLoadingMore ? (
                          <span className="journal-loading-inline">
                            <span className="journal-spinner" aria-hidden="true" />
                            <span>{ar ? "جاري التحميل..." : "Loading articles..."}</span>
                          </span>
                        ) : (
                          <span>{ar ? "عرض المزيد من المقالات" : "Load More Articles"}</span>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Informative Empty State */
                <div className="journal-empty-state" role="status">
                  <div className="journal-empty-icon" aria-hidden="true">
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                      <path d="M6 6h10" />
                      <path d="M6 10h10" />
                    </svg>
                  </div>
                  <h3>
                    {ar
                      ? "لا توجد مقالات ضمن هذا التصنيف حالياً"
                      : "No articles found in this category"}
                  </h3>
                  <p>
                    {ar
                      ? "جرّب اختيار تصنيف آخر أو العودة إلى عرض جميع المقالات في اليوميات."
                      : "Try selecting another category or view all published articles in the Journal."}
                  </p>
                  <button
                    type="button"
                    className="journal-reset-category-btn"
                    onClick={() => handleCategoryChange("ALL")}
                  >
                    {ar ? "عرض جميع المقالات" : "View All Articles"}
                  </button>
                </div>
              )}
            </div>

            {/* Secondary Column: Compact Recent Articles Sidebar */}
            {page.sidebar.enabled && (
              <aside
                className="journal-sidebar"
                aria-label={page.sidebar.heading || (ar ? "أحدث المقالات" : "Recent Articles")}
              >
                <div className="journal-sidebar-inner">
                  <h3 className="journal-sidebar-title">
                    {page.sidebar.heading || (ar ? "أحدث المقالات" : "Recent Articles")}
                  </h3>

                  <div className="journal-sidebar-list">
                    {page.sidebar.articles.map((item) => (
                      <article key={item.id} className="journal-sidebar-item">
                        <Link
                          href={`/${copy.locale}/journal/${item.slug}`}
                          className="journal-sidebar-thumb-link"
                          tabIndex={-1}
                          aria-hidden="true"
                        >
                          <div className="journal-sidebar-thumb-frame">
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              sizes="96px"
                              style={{ objectPosition: item.focalPoint || "center" }}
                              className="journal-sidebar-thumb-img"
                            />
                          </div>
                        </Link>

                        <div className="journal-sidebar-info">
                          <span className="journal-sidebar-category">
                            {getCategoryLabel(item.category, ar)}
                          </span>
                          <h4 className="journal-sidebar-item-title">
                            <Link href={`/${copy.locale}/journal/${item.slug}`}>
                              {item.title}
                            </Link>
                          </h4>
                          <time className="journal-sidebar-date" dateTime={item.rawDate}>
                            {item.date}
                          </time>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </section>

        {/* 4. Restrained Closing CTA */}
        {page.closingCta.enabled && (
          <section
            className="journal-closing-cta-section stage-pad"
            aria-label={page.closingCta.heading}
          >
            <div className="journal-closing-cta-container">
              <div className="journal-closing-cta-body">
                <h2 className="journal-closing-cta-title">{page.closingCta.heading}</h2>
                <p className="journal-closing-cta-desc">{page.closingCta.text}</p>
                <div className="journal-closing-cta-actions">
                  <Link
                    href={`/${copy.locale}${page.closingCta.buttonLink.startsWith("/") ? page.closingCta.buttonLink : "/" + page.closingCta.buttonLink}`}
                    className="journal-closing-primary-btn"
                  >
                    <span>{page.closingCta.buttonLabel}</span>
                    <span aria-hidden="true">{ar ? "←" : "→"}</span>
                  </Link>

                  {page.closingCta.secondary && (
                    <button
                      type="button"
                      className="journal-closing-secondary-btn"
                      onClick={() => openEnquiry({ sourcePage: "journal-cta" })}
                    >
                      <span>{ar ? "طلب معاودة الاتصال" : "Request a Call Back"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer copy={copy} page="journal" />
    </>
  );
}
