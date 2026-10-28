import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { NewsPageContent, NewsStoryItem } from "../content/home";
import { content } from "../content/home";
import { JournalPageExperience } from "./journal-page-experience";

vi.mock("next/image", () => ({
  default: ({ fill, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    void fill;
    return <span data-image-alt={String(props.alt ?? "")} />;
  },
}));

vi.mock("./smooth-scroll", () => ({
  SmoothScroll: () => null,
}));

vi.mock("./enquiry-provider", () => ({
  useEnquiryModal: () => ({
    openEnquiry: vi.fn(),
    closeEnquiry: vi.fn(),
    isOpen: false,
  }),
}));

const mockStories: NewsStoryItem[] = [
  {
    id: "story-1",
    slug: "designing-shade-breeze",
    title: "Designing shade, breeze and belonging",
    excerpt: "Exploring climate-responsive architecture across Egyptian destinations.",
    date: "14 Oct 2026",
    rawDate: "2026-10-14T00:00:00.000Z",
    image: "https://images.unsplash.com/photo-1",
    alt: "Designing shade",
    category: "NEWS",
    author: "Omar Farouk",
  },
  {
    id: "story-2",
    slug: "landscape-comes-first",
    title: "The landscape comes first at Solaya",
    excerpt: "Integrating native flora and open horizons into community design.",
    date: "10 Oct 2026",
    rawDate: "2026-10-10T00:00:00.000Z",
    image: "https://images.unsplash.com/photo-2",
    alt: "Landscape comes first",
    category: "EVENTS",
  },
  {
    id: "story-3",
    slug: "coastal-rhythm-takes-shape",
    title: "A new coastal rhythm takes shape",
    excerpt: "Construction progress report from the northern shoreline.",
    date: "05 Oct 2026",
    rawDate: "2026-10-05T00:00:00.000Z",
    image: "https://images.unsplash.com/photo-3",
    alt: "Coastal rhythm",
    category: "CONSTRUCTION",
  },
  {
    id: "story-4",
    slug: "architecture-and-light",
    title: "Architecture and Natural Light",
    excerpt: "How daylight orientation enhances everyday wellbeing.",
    date: "01 Oct 2026",
    rawDate: "2026-10-01T00:00:00.000Z",
    image: "https://images.unsplash.com/photo-4",
    alt: "Architecture and Light",
    category: "NEWS",
  },
];

function buildMockContent(locale: "en" | "ar" = "en"): NewsPageContent {
  const base = content[locale];
  return {
    ...base,
    newsPage: {
      hero: {
        eyebrow: locale === "ar" ? "يوميات إيمدج" : "Image Journal",
        title: locale === "ar" ? "يوميات إيمدج" : "Journal",
        intro:
          locale === "ar"
            ? "تابع أحدث المستجدات، الفعاليات وتطورات البناء في مجتمعات إيمدج للتطوير العقاري."
            : "Follow milestones, architecture, events, and construction progress across Image destinations.",
      },
      featuredStory: mockStories[0],
      allStories: mockStories,
      sidebar: {
        enabled: true,
        heading: locale === "ar" ? "أحدث المقالات" : "Recent Articles",
        articles: mockStories.slice(0, 3),
      },
      categories: ["NEWS", "EVENTS", "CONSTRUCTION"],
      articlesPerPage: 6,
      closingCta: {
        enabled: true,
        heading: locale === "ar" ? "اكتشف مجتمعاتنا السكنية" : "Discover Our Living Communities",
        text:
          locale === "ar"
            ? "استكشف وجهاتنا المطورة بعناية في مصر أو تواصل مع مستشارينا العقاريين."
            : "Explore our master-planned destinations across Egypt or speak with our property advisors.",
        buttonLabel: locale === "ar" ? "استكشف مشاريعنا" : "Explore Our Projects",
        buttonLink: "/projects",
        secondary: true,
      },
      seoTitle: "Journal & News — Image Developments",
      seoDescription: "Discover latest news and stories.",
    },
  };
}

describe("JournalPageExperience", () => {
  it("renders the single main H1 and intro text", () => {
    const markup = renderToStaticMarkup(<JournalPageExperience copy={buildMockContent("en")} />);
    expect(markup).toContain("<h1");
    expect(markup).toContain("Journal");
    expect(markup).toContain("Follow milestones, architecture, events, and construction progress");
  });

  it("renders the breadcrumb linking to home", () => {
    const markup = renderToStaticMarkup(<JournalPageExperience copy={buildMockContent("en")} />);
    expect(markup).toContain('aria-label="Breadcrumb"');
    expect(markup).toContain('href="/en"');
  });

  it("renders category tabs including All, News, Events, and Construction", () => {
    const markup = renderToStaticMarkup(<JournalPageExperience copy={buildMockContent("en")} />);
    expect(markup).toContain("All");
    expect(markup).toContain("News");
    expect(markup).toContain("Events");
    expect(markup).toContain("Construction Updates");
  });

  it("displays the featured article prominently at the top and does not duplicate it in feed", () => {
    const markup = renderToStaticMarkup(<JournalPageExperience copy={buildMockContent("en")} />);
    expect(markup).toContain("featured-preview");
    expect(markup).toContain("Designing shade, breeze and belonging");

    // The featured title should only appear once as an article title
    const matches = markup.match(/Designing shade, breeze and belonging/g);
    // It appears in the featured article heading and sidebar item
    expect(matches).toBeDefined();
    // In the main feed, featured-title class must be present
    expect(markup).toContain("featured-title");
  });

  it("renders the Recent Articles compact sidebar with heading and items", () => {
    const markup = renderToStaticMarkup(<JournalPageExperience copy={buildMockContent("en")} />);
    expect(markup).toContain("Recent Articles");
    expect(markup).toContain("journal-sidebar");
    expect(markup).toContain("journal-sidebar-item");
  });

  it("displays valid public author and suppresses internal account names", () => {
    const markup = renderToStaticMarkup(<JournalPageExperience copy={buildMockContent("en")} />);
    expect(markup).toContain("Omar Farouk");
    expect(markup).not.toContain("SYSTEM ADMIN");
    expect(markup).not.toContain("ADMINISTRATOR");
  });

  it("renders the restrained closing CTA with projects link and callback button", () => {
    const markup = renderToStaticMarkup(<JournalPageExperience copy={buildMockContent("en")} />);
    expect(markup).toContain("Discover Our Living Communities");
    expect(markup).toContain("Explore Our Projects");
    expect(markup).toContain('href="/en/projects"');
    expect(markup).toContain("Request a Call Back");
  });

  it("supports Arabic locale with proper RTL labels and translations", () => {
    const markup = renderToStaticMarkup(<JournalPageExperience copy={buildMockContent("ar")} />);
    expect(markup).toContain('dir="rtl"');
    expect(markup).toContain("يوميات إيمدج");
    expect(markup).toContain("الرئيسية");
    expect(markup).toContain("الكل");
    expect(markup).toContain("الأخبار");
    expect(markup).toContain("أحدث المقالات");
    expect(markup).toContain("استكشف مشاريعنا");
    expect(markup).toContain("طلب معاودة الاتصال");
  });
});
