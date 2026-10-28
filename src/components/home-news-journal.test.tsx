import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeNewsJournal } from "./home-news-journal";
import type { HomeContent } from "@/content/home";

// Mock framer-motion to simplify static server markup tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, style, role, ...props }: any) => (
      <div className={className} style={style} role={role} {...props}>
        {children}
      </div>
    ),
    article: ({ children, className, role, ...props }: any) => (
      <article className={className} role={role} {...props}>
        {children}
      </article>
    ),
  },
  useReducedMotion: () => false,
}));

// Mock next/image
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, className, style }: any) => (
    <img src={src} alt={alt} className={className} style={style} />
  ),
}));

// Mock next/link
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, className, ariaLabel, tabIndex, ariaHidden }: any) => (
    <a href={href} className={className} aria-label={ariaLabel} tabIndex={tabIndex} aria-hidden={ariaHidden}>
      {children}
    </a>
  ),
}));

const mockArticlesEn = [
  {
    id: "art-1",
    slug: "designing-shade-breeze-belonging",
    title: "Designing shade, breeze and belonging",
    excerpt: "How considered orientation and courtyard proportions shape community comfort.",
    coverImageUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0",
    coverImageAlt: "Modern courtyard with natural light",
    focalPoint: "center",
    publicationDate: "18 Sep 2026",
    rawDate: "2026-09-18T00:00:00.000Z",
    category: "ARCHITECTURE",
    categoryLabel: "Architecture",
    href: "/en/journal/designing-shade-breeze-belonging",
  },
  {
    id: "art-2",
    slug: "landscape-comes-first-solaya",
    title: "The landscape comes first at Solaya",
    excerpt: "Prioritizing open natural contours before the first foundations were laid.",
    coverImageUrl: "https://images.unsplash.com/photo-1600607688960-e095ff83135c",
    coverImageAlt: "Lush landscape at Solaya",
    focalPoint: "top",
    publicationDate: "02 Aug 2026",
    rawDate: "2026-08-02T00:00:00.000Z",
    category: "EVENTS",
    categoryLabel: "Events",
    href: "/en/journal/landscape-comes-first-solaya",
  },
  {
    id: "art-3",
    slug: "new-coastal-rhythm",
    title: "A new coastal rhythm takes shape",
    excerpt: "Milestone updates from our seaside living destination.",
    coverImageUrl: "https://images.unsplash.com/photo-1600566753051-f0b89df2dd90",
    coverImageAlt: "Coastal architecture facing horizon",
    focalPoint: "center",
    publicationDate: "21 Jul 2026",
    rawDate: "2026-07-21T00:00:00.000Z",
    category: "CONSTRUCTION",
    categoryLabel: "Construction",
    href: "/en/journal/new-coastal-rhythm",
  },
];

const mockBaseCopyEn: HomeContent = {
  locale: "en",
  dir: "ltr",
  nav: [],
  backgrounds: {
    opening: "255, 255, 255",
    hero: "255, 255, 255",
    about: "255, 255, 255",
    projects: "255, 255, 255",
    lifestyle: "255, 255, 255",
    stats: "248, 246, 242",
    journal: "255, 255, 255",
    closing: "255, 255, 255",
    footer: "255, 255, 255",
  },
  hero: { eyebrow: "", title: [""], note: "", scroll: "" },
  about: { enabled: false, eyebrow: "", title: "", intro: "", milestones: [] },
  projects: [],
  inquiryProjects: [],
  lifestyle: { eyebrow: "", title: "" },
  stats: [],
  journal: { eyebrow: "", title: "", stories: [] },
  closing: { eyebrow: "", title: "" },
  common: { projects: "", explore: "", menu: "", close: "", language: "", contact: "", rights: "" },
  newsJournalSection: {
    enabled: true,
    label: "News & Journal",
    heading: "Stories, ideas, and updates.",
    description: "Perspectives on architecture, community milestones, and the ongoing progress shaping our destinations.",
    ctaLabel: "View All Articles",
    ctaUrl: "/journal",
    mode: "AUTO",
    categoryFilter: "ALL",
    articlesCount: 3,
    articles: mockArticlesEn,
  },
};

describe("HomeNewsJournal Component", () => {
  it("renders a 3-card editorial grid with proper heading, labels, and links", () => {
    const html = renderToStaticMarkup(<HomeNewsJournal copy={mockBaseCopyEn} />);

    // Section container and ARIA
    expect(html).toContain('id="journal"');
    expect(html).toContain('class="home-news-journal stage-pad"');
    expect(html).toContain('aria-label="Stories, ideas, and updates."');
    expect(html).toContain('dir="ltr"');

    // Section header elements
    expect(html).toContain("News &amp; Journal");
    expect(html).toContain("Stories, ideas, and updates.");
    expect(html).toContain("Perspectives on architecture");
    expect(html).toContain("View All Articles");
    expect(html).toContain('href="/en/journal"');
    expect(html).toContain("→"); // English arrow

    // Grid layout class
    expect(html).toContain("home-journal-grid is-trio");

    // All 3 article cards
    expect(html).toContain("Designing shade, breeze and belonging");
    expect(html).toContain("The landscape comes first at Solaya");
    expect(html).toContain("A new coastal rhythm takes shape");

    // Category and Date metadata
    expect(html).toContain("Architecture");
    expect(html).toContain("18 Sep 2026");
    expect(html).toContain("Events");
    expect(html).toContain("02 Aug 2026");

    // Excerpts
    expect(html).toContain("How considered orientation and courtyard");

    // Read Article action
    expect(html).toContain("Read Article");
    expect(html).toContain('href="/en/journal/designing-shade-breeze-belonging"');

    // Never displays internal admin author names
    expect(html).not.toContain("SYSTEM ADMIN");
    expect(html).not.toContain("admin");
  });

  it("renders correctly in Arabic RTL with localized content and arrows", () => {
    const mockCopyAr: HomeContent = {
      ...mockBaseCopyEn,
      locale: "ar",
      dir: "rtl",
      newsJournalSection: {
        enabled: true,
        label: "الأخبار والمقالات",
        heading: "قصص وأفكار ومستجدات",
        description: "رؤى معمارية ومحطات مجتمعية ومستجدات متواصلة تشكّل ملامح وجهاتنا العمرانية.",
        ctaLabel: "عرض جميع المقالات",
        ctaUrl: "/journal",
        mode: "AUTO",
        categoryFilter: "ALL",
        articlesCount: 3,
        articles: [
          {
            id: "art-1",
            slug: "designing-shade-breeze-belonging",
            title: "نصمم الظل والنسيم والشعور بالانتماء",
            excerpt: "كيف يوجه التفكير المعماري راحة المجتمع.",
            coverImageUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0",
            coverImageAlt: "فناء معماري حديث",
            focalPoint: "center",
            publicationDate: "١٨ سبتمبر ٢٠٢٦",
            rawDate: "2026-09-18T00:00:00.000Z",
            category: "ARCHITECTURE",
            categoryLabel: "عمارة وتصميم",
            href: "/ar/journal/designing-shade-breeze-belonging",
          },
        ],
      },
    };

    const html = renderToStaticMarkup(<HomeNewsJournal copy={mockCopyAr} />);

    expect(html).toContain('dir="rtl"');
    expect(html).toContain("الأخبار والمقالات");
    expect(html).toContain("قصص وأفكار ومستجدات");
    expect(html).toContain("عرض جميع المقالات");
    expect(html).toContain('href="/ar/journal"');
    expect(html).toContain("←"); // Arabic arrow
    expect(html).toContain("عمارة وتصميم");
    expect(html).toContain("اقرأ المقال");
    expect(html).toContain("نصمم الظل والنسيم والشعور بالانتماء");
  });

  it("hides cleanly (returns null) when section is disabled", () => {
    const disabledCopy: HomeContent = {
      ...mockBaseCopyEn,
      newsJournalSection: {
        ...mockBaseCopyEn.newsJournalSection!,
        enabled: false,
      },
    };

    const html = renderToStaticMarkup(<HomeNewsJournal copy={disabledCopy} />);
    expect(html).toBe("");
  });

  it("hides cleanly (returns null) when articles array is empty", () => {
    const emptyCopy: HomeContent = {
      ...mockBaseCopyEn,
      newsJournalSection: {
        ...mockBaseCopyEn.newsJournalSection!,
        articles: [],
      },
    };

    const html = renderToStaticMarkup(<HomeNewsJournal copy={emptyCopy} />);
    expect(html).toBe("");
  });

  it("adapts layout classes for 1 or 2 articles gracefully", () => {
    const singleArticleCopy: HomeContent = {
      ...mockBaseCopyEn,
      newsJournalSection: {
        ...mockBaseCopyEn.newsJournalSection!,
        articles: [mockArticlesEn[0]],
      },
    };

    const htmlSingle = renderToStaticMarkup(<HomeNewsJournal copy={singleArticleCopy} />);
    expect(htmlSingle).toContain("home-journal-grid is-single");

    const pairArticleCopy: HomeContent = {
      ...mockBaseCopyEn,
      newsJournalSection: {
        ...mockBaseCopyEn.newsJournalSection!,
        articles: [mockArticlesEn[0], mockArticlesEn[1]],
      },
    };

    const htmlPair = renderToStaticMarkup(<HomeNewsJournal copy={pairArticleCopy} />);
    expect(htmlPair).toContain("home-journal-grid is-pair");
  });

  it("preserves section background color from copy.backgrounds.stats", () => {
    const coloredCopy: HomeContent = {
      ...mockBaseCopyEn,
      backgrounds: {
        ...mockBaseCopyEn.backgrounds,
        stats: "240, 238, 230",
      },
    };

    const html = renderToStaticMarkup(<HomeNewsJournal copy={coloredCopy} />);
    expect(html).toContain("background-color:rgb(240, 238, 230)");
  });

  it("does not nest interactive <a> inside <a>", () => {
    const html = renderToStaticMarkup(<HomeNewsJournal copy={mockBaseCopyEn} />);
    const linkMatches = [...html.matchAll(/<\/?a\b[^>]*>/gi)].map(m => m[0]);
    let depth = 0;
    let maxDepth = 0;
    for (const tag of linkMatches) {
      if (tag.startsWith("</")) {
        depth--;
      } else {
        depth++;
        if (depth > maxDepth) maxDepth = depth;
      }
    }
    expect(maxDepth).toBe(1);
    expect(depth).toBe(0);
  });
});
