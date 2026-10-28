import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { content } from "../content/home";
import type { NewsDetailPageContent } from "../content/home";
import { ArticleDetailExperience } from "./article-detail-experience";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/journal/designing-shade-breeze-belonging",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("./page-transition", () => ({
  usePageTransition: () => ({ introPhase: "done", isInitialCinematic: false }),
}));

vi.mock("./smooth-scroll", () => ({
  SmoothScroll: () => null,
}));

vi.mock("next/image", () => ({
  default: ({ fill, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    void fill;
    return <span data-testid="img" data-alt={String(props.alt ?? "")} />;
  },
}));

vi.mock("framer-motion", () => ({
  motion: {
    header: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => <header {...props}>{children}</header>,
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    a: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
    create: <T,>(Comp: T): T => Comp,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

vi.mock("./enquiry-provider", () => ({
  useEnquiryModal: () => ({
    openEnquiry: vi.fn(),
    closeEnquiry: vi.fn(),
    isOpen: false,
    config: {},
  }),
}));

describe("ArticleDetailExperience", () => {
  const mockEnglishCopy: NewsDetailPageContent = {
    ...content.en,
    article: {
      id: "art-1",
      slug: "designing-shade-breeze-belonging",
      title: "Designing shade, breeze and belonging",
      excerpt: "How passive shading and cross-ventilation corridors shape our homes.",
      content: `Architecture in warm climates begins with light and shadow.

## Passive Cooling Techniques
Deep overhangs keep living areas cool during midday.

> "A home that breathes creates peace."
> — Tarek Kamel

[[two-images: https://example.com/1.jpg | Shading screen | Bronze louvers ; https://example.com/2.jpg | Courtyard | Water courtyard]]

[[project]]`,
      date: "18 September 2026",
      rawDate: "2026-09-18T00:00:00.000Z",
      image: "https://example.com/cover.jpg",
      alt: "Cover photograph",
      category: "ARCHITECTURE",
      readingTime: "4 min read",
      author: "Mariam El-Khatib",
      coverCaption: "Courtyards at dusk",
      coverCredit: "Photography by Nour El-Rifai",
      showRelatedProject: true,
      showTableOfContents: true,
      status: "PUBLISHED",
      relatedProject: {
        id: "proj-solaya",
        slug: "solaya",
        name: "Solaya",
        location: "New Zayed",
        projectType: "Residential",
        progressStatus: "Ongoing",
        shortDescription: "A curated residential haven nestled in New Zayed.",
        image: "https://example.com/solaya.jpg",
        imageAlt: "Solaya community",
        focalPoint: "center",
        status: "PUBLISHED",
      },
    },
    relatedStories: [
      {
        id: "art-2",
        slug: "landscape-comes-first-solaya",
        title: "The landscape comes first at Solaya",
        excerpt: "Nature as the primary architectural element.",
        date: "02 Aug 2026",
        image: "https://example.com/related1.jpg",
        alt: "Landscape view",
        category: "EVENTS",
      },
    ],
  };

  it("renders the article header with breadcrumb, category, title, date, reading time, author, and cover caption", () => {
    const html = renderToStaticMarkup(<ArticleDetailExperience copy={mockEnglishCopy} />);

    // Breadcrumb
    expect(html).toContain("article-detail-breadcrumb");
    expect(html).toContain("Home");
    expect(html).toContain("Journal");
    expect(html).toContain("Designing shade, breeze and belonging");

    // Category and meta
    expect(html).toContain("Architecture");
    expect(html).toContain("18 September 2026");
    expect(html).toContain("4 min read");
    expect(html).toContain("Mariam El-Khatib");

    // Caption & credit
    expect(html).toContain("Courtyards at dusk");
    expect(html).toContain("Photography by Nour El-Rifai");
  });

  it("renders Table of Contents when enabled and headings are present", () => {
    // With one H2 and no other headings, TOC requires >= 2 headings, let's verify with 2 headings
    const copyWithHeadings: NewsDetailPageContent = {
      ...mockEnglishCopy,
      article: {
        ...mockEnglishCopy.article,
        content: `## Section One\nText\n## Section Two\nText`,
      },
    };
    const tocHtml = renderToStaticMarkup(<ArticleDetailExperience copy={copyWithHeadings} />);
    expect(tocHtml).toContain("article-toc-box");
    expect(tocHtml).toContain("Table of Contents");
    expect(tocHtml).toContain("Section One");
    expect(tocHtml).toContain("Section Two");
  });

  it("renders editorial content blocks: headings, quotes, and two-image breakouts", () => {
    const html = renderToStaticMarkup(<ArticleDetailExperience copy={mockEnglishCopy} />);

    expect(html).toContain("Passive Cooling Techniques");
    expect(html).toContain("A home that breathes creates peace.");
    expect(html).toContain("— Tarek Kamel");
    expect(html).toContain("article-two-images-breakout");
  });

  it("renders Related Project spotlight section with database-driven details and actions", () => {
    const html = renderToStaticMarkup(<ArticleDetailExperience copy={mockEnglishCopy} />);

    expect(html).toContain("article-related-project-section");
    expect(html).toContain("Solaya");
    expect(html).toContain("New Zayed");
    expect(html).toContain("Residential");
    expect(html).toContain("Ongoing");
    expect(html).toContain('href="/en/projects/solaya"');
    expect(html).toContain("Explore Project");
    expect(html).toContain("Register Interest");
  });

  it("renders Back to Journal link and up to 3 related articles", () => {
    const html = renderToStaticMarkup(<ArticleDetailExperience copy={mockEnglishCopy} />);

    expect(html).toContain("Back to Journal");
    expect(html).toContain("The landscape comes first at Solaya");
    expect(html).toContain('href="/en/journal/landscape-comes-first-solaya"');
  });

  it("renders Arabic localized layout properly without internal admin usernames", () => {
    const mockArabicCopy: NewsDetailPageContent = {
      ...content.ar,
      article: {
        ...mockEnglishCopy.article,
        title: "نصمم الظل والنسيم والشعور بالانتماء",
        excerpt: "كيف تساهم تقنيات التظليل في راحة الساكنين.",
        date: "١٨ سبتمبر ٢٠٢٦",
        readingTime: "قراءة ٤ دقائق",
        author: "SYSTEM ADMIN", // Should be suppressed
        coverCaption: "الأفنية عند الغروب",
        coverCredit: "تصوير نور الرفاعي",
        relatedProject: {
          ...mockEnglishCopy.article.relatedProject!,
          name: "سولايا",
          location: "نيو زايد",
          shortDescription: "مجتمع سكني راقٍ في قلب نيو زايد.",
        },
      },
      relatedStories: [],
    };

    const html = renderToStaticMarkup(<ArticleDetailExperience copy={mockArabicCopy} />);

    expect(html).toContain('dir="rtl"');
    expect(html).toContain("الرئيسية");
    expect(html).toContain("يوميات إيمدج");
    expect(html).toContain("نصمم الظل والنسيم والشعور بالانتماء");
    expect(html).toContain("قراءة ٤ دقائق");

    // Internal username SYSTEM ADMIN is cleanly suppressed
    expect(html).not.toContain("SYSTEM ADMIN");

    // Related project in Arabic
    expect(html).toContain("المشروع ذو الصلة");
    expect(html).toContain("سولايا");
    expect(html).toContain("نيو زايد");
    expect(html).toContain("استكشف المشروع");
    expect(html).toContain("سجل اهتمامك");
    expect(html).toContain("العودة إلى اليوميات");

    // When related stories is empty, the section is gracefully hidden
    expect(html).not.toContain("article-related-section");
  });

  it("renders Other Projects sidebar on the physical left with project cards and View All link in English", () => {
    const copyWithSidebar: NewsDetailPageContent = {
      ...mockEnglishCopy,
      sidebarProjects: {
        enabled: true,
        heading: "Other Projects",
        mode: "AUTO",
        projects: [
          {
            id: "proj-aera",
            slug: "aera",
            name: "Aera",
            location: "New Cairo",
            projectType: "Residential",
            progressStatus: "Ongoing",
            image: "https://example.com/aera.jpg",
            imageAlt: "Aera community",
            href: "/en/projects/aera",
          },
          {
            id: "proj-marea",
            slug: "marea",
            name: "Marea",
            location: "North Coast",
            projectType: "Residential",
            progressStatus: "Upcoming",
            image: "https://example.com/marea.jpg",
            imageAlt: "Marea coastal destination",
            href: "/en/projects/marea",
          },
        ],
        showLocation: true,
        showType: true,
        showStatus: true,
        viewAllLabel: "View All Projects",
        viewAllHref: "/en/projects",
      },
    };

    const html = renderToStaticMarkup(<ArticleDetailExperience copy={copyWithSidebar} />);

    // Grid container with two-column layout
    expect(html).toContain("article-two-column-layout has-sidebar");
    expect(html).toContain("article-projects-sidebar");
    expect(html).toContain("Other Projects");

    // Project cards
    expect(html).toContain("Aera");
    expect(html).toContain("New Cairo");
    expect(html).toContain('href="/en/projects/aera"');
    expect(html).toContain("Marea");
    expect(html).toContain("North Coast");
    expect(html).toContain('href="/en/projects/marea"');

    // Explore Project action
    expect(html).toContain("Explore Project");

    // View All Projects link
    expect(html).toContain("View All Projects");
    expect(html).toContain('href="/en/projects"');
  });

  it("renders Other Projects sidebar with Arabic typography and localized links", () => {
    const copyArabicWithSidebar: NewsDetailPageContent = {
      ...mockEnglishCopy,
      locale: "ar",
      sidebarProjects: {
        enabled: true,
        heading: "مشروعات أخرى",
        mode: "AUTO",
        projects: [
          {
            id: "proj-aera",
            slug: "aera",
            name: "إيرا",
            location: "القاهرة الجديدة",
            projectType: "سكني",
            progressStatus: "قيد التنفيذ",
            image: "https://example.com/aera.jpg",
            imageAlt: "مجتمع إيرا",
            href: "/ar/projects/aera",
          },
        ],
        showLocation: true,
        showType: true,
        showStatus: true,
        viewAllLabel: "عرض جميع المشروعات",
        viewAllHref: "/ar/projects",
      },
    };

    const html = renderToStaticMarkup(<ArticleDetailExperience copy={copyArabicWithSidebar} />);

    expect(html).toContain("article-projects-sidebar");
    expect(html).toContain("مشروعات أخرى");
    expect(html).toContain("إيرا");
    expect(html).toContain("القاهرة الجديدة");
    expect(html).toContain('href="/ar/projects/aera"');
    expect(html).toContain("استكشف المشروع");
    expect(html).toContain("عرض جميع المشروعات");
    expect(html).toContain('href="/ar/projects"');
  });

  it("gracefully collapses to no-sidebar layout when sidebarProjects is disabled or empty", () => {
    const copyNoSidebar: NewsDetailPageContent = {
      ...mockEnglishCopy,
      sidebarProjects: {
        enabled: false,
        heading: "Other Projects",
        mode: "AUTO",
        projects: [],
        showLocation: true,
        showType: true,
        showStatus: true,
        viewAllLabel: "View All Projects",
        viewAllHref: "/en/projects",
      },
    };

    const html = renderToStaticMarkup(<ArticleDetailExperience copy={copyNoSidebar} />);

    expect(html).toContain("article-two-column-layout no-sidebar");
    expect(html).not.toContain("article-projects-sidebar");
  });
});
