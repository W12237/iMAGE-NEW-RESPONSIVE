import { describe, expect, it } from "vitest";
import {
  calculateReadingTime,
  extractHeadings,
  parseArticleBlocks,
  slugifyHeading,
  type ArticleHeadingBlock,
  type ArticleListBlock,
  type ArticleQuoteBlock,
  type ArticleImageBlock,
  type ArticleTwoImagesBlock,
  type ArticleVideoBlock,
  type ArticleCtaBlock,
} from "./article-blocks";

describe("article-blocks parser and helpers", () => {
  it("calculates localized reading time correctly", () => {
    const shortText = "Architecture in warm climates has always been a conversation with light.";
    expect(calculateReadingTime(shortText, "en")).toBe("1 min read");
    expect(calculateReadingTime(shortText, "ar")).toBe("دقيقة واحدة للقراءة");

    const longWords = new Array(500).fill("word").join(" ");
    expect(calculateReadingTime(longWords, "en")).toBe("3 min read");
    expect(calculateReadingTime(longWords, "ar")).toBe("قراءة 3 دقائق");
  });

  it("slugifies heading text properly for anchors", () => {
    expect(slugifyHeading("Microclimates and Orientation")).toBe("microclimates-and-orientation");
    expect(slugifyHeading("المناخ المصغر وتوجيه المباني")).toBe("المناخ-المصغر-وتوجيه-المباني");
  });

  it("parses Markdown headings, blockquotes, lists, images, and shortcodes", () => {
    const markdown = `
Introductory paragraph.

## Section Heading

Another paragraph with **bold** and *italic* text.

> A home that breathes creates peace.
> — Architect Name

- First bullet
- Second bullet

1. Ordered step 1
2. Ordered step 2

![Terrace](https://example.com/terrace.jpg "Terrace view | Nour El-Rifai")

[[two-images: https://example.com/1.jpg | Alt 1 | Cap 1 ; https://example.com/2.jpg | Alt 2 | Cap 2]]

[[video: https://www.youtube.com/watch?v=dQw4w9WgXcQ | Video caption]]

[[project]]

[[cta: Visit Us | Schedule a private tour | Contact Us | /en/contact]]
`;

    const blocks = parseArticleBlocks(markdown);
    expect(blocks.length).toBeGreaterThan(9);

    const heading = blocks.find((b): b is ArticleHeadingBlock => b.type === "heading" && b.text === "Section Heading");
    expect(heading).toBeDefined();
    expect(heading?.id).toBe("section-heading");

    const quote = blocks.find((b): b is ArticleQuoteBlock => b.type === "quote");
    expect(quote?.text).toContain("A home that breathes creates peace.");
    expect(quote?.attribution).toBe("Architect Name");

    const unlist = blocks.find((b): b is ArticleListBlock => b.type === "list" && !b.ordered);
    expect(unlist?.items).toHaveLength(2);

    const ordlist = blocks.find((b): b is ArticleListBlock => b.type === "list" && b.ordered);
    expect(ordlist?.items).toHaveLength(2);

    const img = blocks.find((b): b is ArticleImageBlock => b.type === "image");
    expect(img?.url).toBe("https://example.com/terrace.jpg");
    expect(img?.caption).toBe("Terrace view");
    expect(img?.credit).toBe("Nour El-Rifai");

    const twoImgs = blocks.find((b): b is ArticleTwoImagesBlock => b.type === "two-images");
    expect(twoImgs?.image1.url).toBe("https://example.com/1.jpg");
    expect(twoImgs?.image2.url).toBe("https://example.com/2.jpg");

    const vid = blocks.find((b): b is ArticleVideoBlock => b.type === "video");
    expect(vid?.embedUrl).toContain("youtube-nocookie.com/embed");

    const proj = blocks.find((b) => b.type === "project");
    expect(proj).toBeDefined();

    const cta = blocks.find((b): b is ArticleCtaBlock => b.type === "cta");
    expect(cta?.heading).toBe("Visit Us");
    expect(cta?.buttonLink).toBe("/en/contact");
  });

  it("extracts H2 and H3 headings for table of contents", () => {
    const markdown = `
## Main Heading
### Sub Heading
Some text
## Another Heading
`;
    const blocks = parseArticleBlocks(markdown);
    const headings = extractHeadings(blocks);
    expect(headings).toHaveLength(3);
    expect(headings[0].text).toBe("Main Heading");
    expect(headings[1].text).toBe("Sub Heading");
    expect(headings[2].text).toBe("Another Heading");
  });

  it("parses structured JSON block arrays directly", () => {
    const jsonBlocks = JSON.stringify([
      { type: "paragraph", text: "Direct JSON paragraph" },
      { type: "heading", level: 2, text: "JSON Heading" },
    ]);
    const blocks = parseArticleBlocks(jsonBlocks);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("paragraph");
    expect(blocks[1].type).toBe("heading");
  });
});
