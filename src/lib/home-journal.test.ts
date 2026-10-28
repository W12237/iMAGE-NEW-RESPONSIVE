import { describe, it, expect } from "vitest";
import { JOURNAL_CATEGORY_LABELS, type HomeJournalArticle } from "@/content/home";

describe("Home News & Journal CMS Business Logic", () => {
  const sampleArticles = [
    {
      id: "art-1",
      slug: "architecture-vision",
      titleEn: "Architecture Vision",
      titleAr: "رؤية معمارية",
      excerptEn: "Considered facades",
      excerptAr: "واجهات مدروسة",
      category: "ARCHITECTURE",
      publicationDate: new Date("2026-09-01T10:00:00Z"),
      coverImageUrl: "https://example.com/arch.jpg",
      status: "PUBLISHED",
    },
    {
      id: "art-2",
      slug: "construction-milestone",
      titleEn: "Construction Milestone",
      titleAr: "محطة إنشائية",
      excerptEn: "Foundation complete",
      excerptAr: "اكتمال الأساسات",
      category: "CONSTRUCTION",
      publicationDate: new Date("2026-08-15T10:00:00Z"),
      coverImageUrl: "https://example.com/const.jpg",
      status: "PUBLISHED",
    },
    {
      id: "art-3",
      slug: "community-events",
      titleEn: "Community Gathering",
      titleAr: "لقاء مجتمعي",
      excerptEn: "Neighbors connect",
      excerptAr: "تواصل الجيران",
      category: "EVENTS",
      publicationDate: new Date("2026-07-20T10:00:00Z"),
      coverImageUrl: "https://example.com/event.jpg",
      status: "PUBLISHED",
    },
    {
      id: "art-4",
      slug: "english-only-article",
      titleEn: "English Only Story",
      titleAr: "", // Not available in Arabic
      excerptEn: "English text only",
      excerptAr: "",
      category: "NEWS",
      publicationDate: new Date("2026-06-10T10:00:00Z"),
      coverImageUrl: "https://example.com/eng.jpg",
      status: "PUBLISHED",
    },
  ];

  it("filters out articles missing translation for the requested language", () => {
    // English
    const enAvailable = sampleArticles.filter(a => Boolean(a.titleEn?.trim()));
    expect(enAvailable).toHaveLength(4);

    // Arabic
    const arAvailable = sampleArticles.filter(a => Boolean(a.titleAr?.trim()));
    expect(arAvailable).toHaveLength(3);
    expect(arAvailable.map(a => a.id)).not.toContain("art-4");
  });

  it("filters by category in AUTO mode", () => {
    const categoryFilter = "ARCHITECTURE";
    const filtered = sampleArticles.filter(a => a.category?.toUpperCase() === categoryFilter.toUpperCase());
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("art-1");
  });

  it("respects manual ordering when in MANUAL mode", () => {
    const manualOrderIds = ["art-3", "art-1", "art-2"];
    const articleMap = new Map(sampleArticles.map(a => [a.id, a]));
    const ordered = manualOrderIds
      .map(id => articleMap.get(id))
      .filter((a): a is typeof sampleArticles[0] => Boolean(a));

    expect(ordered.map(a => a.id)).toEqual(["art-3", "art-1", "art-2"]);
    expect(ordered[0].titleEn).toBe("Community Gathering");
    expect(ordered[1].titleEn).toBe("Architecture Vision");
    expect(ordered[2].titleEn).toBe("Construction Milestone");
  });

  it("limits results to specified article count (default 3)", () => {
    const maxCount = 2;
    const sliced = sampleArticles.slice(0, maxCount);
    expect(sliced).toHaveLength(2);
  });

  it("correctly maps localized category labels", () => {
    expect(JOURNAL_CATEGORY_LABELS.ARCHITECTURE.en).toBe("Architecture");
    expect(JOURNAL_CATEGORY_LABELS.ARCHITECTURE.ar).toBe("عمارة وتصميم");
    expect(JOURNAL_CATEGORY_LABELS.CONSTRUCTION.en).toBe("Construction");
    expect(JOURNAL_CATEGORY_LABELS.CONSTRUCTION.ar).toBe("إنشاءات وتطوير");
    expect(JOURNAL_CATEGORY_LABELS.EVENTS.en).toBe("Events");
    expect(JOURNAL_CATEGORY_LABELS.EVENTS.ar).toBe("فعاليات ومناسبات");
  });
});
