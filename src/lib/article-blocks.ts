/**
 * Article content block types, parser, reading time calculator,
 * and heading extractor for Image Developments Journal articles.
 */

export type ArticleParagraphBlock = {
  type: "paragraph";
  text: string;
};

export type ArticleHeadingBlock = {
  type: "heading";
  level: 2 | 3;
  id: string;
  text: string;
};

export type ArticleListBlock = {
  type: "list";
  ordered: boolean;
  items: string[];
};

export type ArticleQuoteBlock = {
  type: "quote";
  text: string;
  attribution?: string;
  role?: string;
};

export type ArticleImageBlock = {
  type: "image";
  url: string;
  alt: string;
  caption?: string;
  credit?: string;
};

export type ArticleTwoImagesBlock = {
  type: "two-images";
  image1: { url: string; alt: string; caption?: string };
  image2: { url: string; alt: string; caption?: string };
  caption?: string;
};

export type ArticleVideoBlock = {
  type: "video";
  url: string;
  embedUrl: string;
  isVideoFile: boolean;
  title?: string;
  caption?: string;
};

export type ArticleProjectBlock = {
  type: "project";
  projectId?: string;
};

export type ArticleCtaBlock = {
  type: "cta";
  heading: string;
  text: string;
  buttonLabel: string;
  buttonLink?: string;
  actionType: "ENQUIRY" | "LINK";
};

export type ArticleBlock =
  | ArticleParagraphBlock
  | ArticleHeadingBlock
  | ArticleListBlock
  | ArticleQuoteBlock
  | ArticleImageBlock
  | ArticleTwoImagesBlock
  | ArticleVideoBlock
  | ArticleProjectBlock
  | ArticleCtaBlock;

export function slugifyHeading(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

export function calculateReadingTime(text: string, locale: "en" | "ar" = "en"): string {
  if (!text) return locale === "ar" ? "دقيقة واحدة للقراءة" : "1 min read";
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 190));
  if (locale === "ar") {
    if (minutes === 1) return "دقيقة واحدة للقراءة";
    if (minutes === 2) return "دقيقتان للقراءة";
    if (minutes <= 10) return `قراءة ${minutes} دقائق`;
    return `قراءة ${minutes} دقيقة`;
  }
  return `${minutes} min read`;
}

function resolveVideoEmbed(rawUrl: string): { embedUrl: string; isVideoFile: boolean } {
  const url = rawUrl.trim();
  if (/\.(mp4|webm|ogg)$/i.test(url)) {
    return { embedUrl: url, isVideoFile: true };
  }

  // YouTube match
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  if (ytMatch) {
    return { embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`, isVideoFile: false };
  }

  // Vimeo match
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/i);
  if (vimeoMatch) {
    return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`, isVideoFile: false };
  }

  return { embedUrl: url, isVideoFile: false };
}

export function parseArticleBlocks(content: string): ArticleBlock[] {
  if (!content) return [];
  const trimmed = content.trim();

  // 1. Check if content is already structured JSON
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.type) {
        return parsed.map((b) => {
          if (b.type === "heading") {
            return {
              ...b,
              id: b.id || slugifyHeading(b.text || ""),
            };
          }
          if (b.type === "video") {
            const { embedUrl, isVideoFile } = resolveVideoEmbed(b.url || "");
            return {
              ...b,
              embedUrl: b.embedUrl || embedUrl,
              isVideoFile: b.isVideoFile ?? isVideoFile,
            };
          }
          return b;
        });
      }
    } catch {
      // Fallback to text parser
    }
  }

  // 2. Parse Markdown / enhanced shortcodes into semantic blocks
  // Normalize headings so they are guaranteed to sit in discrete blocks
  const normalized = trimmed
    .replace(/\n(?=#{2,3}\s+)/g, "\n\n")
    .replace(/(^|\n)(#{2,3}\s+[^\n]+)\n(?!\n)/g, "$1$2\n\n");

  const rawSections = normalized.split(/\n\s*\n/);
  const blocks: ArticleBlock[] = [];

  for (const rawSec of rawSections) {
    const sec = rawSec.trim();
    if (!sec) continue;

    // Two-image shortcode: [[two-images: url1 | alt1 | cap1 ; url2 | alt2 | cap2]]
    if (sec.startsWith("[[two-images:") && sec.endsWith("]]")) {
      const inner = sec.slice(13, -2).trim();
      const parts = inner.split(";").map((p) => p.trim());
      const p1 = parts[0]?.split("|").map((s) => s.trim()) || [];
      const p2 = parts[1]?.split("|").map((s) => s.trim()) || [];

      blocks.push({
        type: "two-images",
        image1: {
          url: p1[0] || "",
          alt: p1[1] || "",
          caption: p1[2] || undefined,
        },
        image2: {
          url: p2[0] || "",
          alt: p2[1] || "",
          caption: p2[2] || undefined,
        },
      });
      continue;
    }

    // Video shortcode: [[video: url | caption]]
    if (sec.startsWith("[[video:") && sec.endsWith("]]")) {
      const inner = sec.slice(8, -2).trim();
      const parts = inner.split("|").map((s) => s.trim());
      const videoUrl = parts[0] || "";
      const caption = parts[1] || undefined;
      const { embedUrl, isVideoFile } = resolveVideoEmbed(videoUrl);

      blocks.push({
        type: "video",
        url: videoUrl,
        embedUrl,
        isVideoFile,
        caption,
      });
      continue;
    }

    // Project callout shortcode: [[project]] or [[project: id]]
    if (sec.startsWith("[[project") && sec.endsWith("]]")) {
      const inner = sec.slice(9, -2).replace(/^:/, "").trim();
      blocks.push({
        type: "project",
        projectId: inner || undefined,
      });
      continue;
    }

    // CTA shortcode: [[cta: Heading | Text | ButtonLabel | Link]]
    if (sec.startsWith("[[cta:") && sec.endsWith("]]")) {
      const inner = sec.slice(6, -2).trim();
      const [heading, text, buttonLabel, buttonLink] = inner.split("|").map((s) => s.trim());
      blocks.push({
        type: "cta",
        heading: heading || "Register Your Interest",
        text: text || "Explore living opportunities and bespoke residences.",
        buttonLabel: buttonLabel || "Register Interest",
        buttonLink: buttonLink || undefined,
        actionType: buttonLink ? "LINK" : "ENQUIRY",
      });
      continue;
    }

    // Markdown Image: ![Alt text](url "Caption | Credit")
    const imgMatch = sec.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
    if (imgMatch) {
      const alt = imgMatch[1] || "";
      const url = imgMatch[2] || "";
      const titleAttr = imgMatch[3] || "";
      const [caption, credit] = titleAttr.split("|").map((s) => s.trim());

      blocks.push({
        type: "image",
        url,
        alt,
        caption: caption || undefined,
        credit: credit || undefined,
      });
      continue;
    }

    // Heading 2: ## Title
    if (sec.startsWith("## ")) {
      const text = sec.slice(3).trim();
      blocks.push({
        type: "heading",
        level: 2,
        id: slugifyHeading(text),
        text,
      });
      continue;
    }

    // Heading 3: ### Title
    if (sec.startsWith("### ")) {
      const text = sec.slice(4).trim();
      blocks.push({
        type: "heading",
        level: 3,
        id: slugifyHeading(text),
        text,
      });
      continue;
    }

    // Blockquote: > Quote
    if (sec.startsWith("> ")) {
      const lines = sec.split("\n").map((l) => l.replace(/^>\s?/, "").trim());
      let attribution: string | undefined;
      const quoteLines: string[] = [];

      for (const line of lines) {
        if (/^[-—–]{1,2}\s+/.test(line)) {
          attribution = line.replace(/^[-—–]{1,2}\s+/, "").trim();
        } else {
          quoteLines.push(line);
        }
      }

      blocks.push({
        type: "quote",
        text: quoteLines.join(" "),
        attribution,
      });
      continue;
    }

    // Ordered list: 1. item
    if (/^\d+\.\s+/.test(sec)) {
      const items = sec
        .split("\n")
        .map((l) => l.replace(/^\d+\.\s+/, "").trim())
        .filter(Boolean);
      blocks.push({
        type: "list",
        ordered: true,
        items,
      });
      continue;
    }

    // Unordered list: - item or * item
    if (/^[-*]\s+/.test(sec)) {
      const items = sec
        .split("\n")
        .map((l) => l.replace(/^[-*]\s+/, "").trim())
        .filter(Boolean);
      blocks.push({
        type: "list",
        ordered: false,
        items,
      });
      continue;
    }

    // Standard paragraph
    blocks.push({
      type: "paragraph",
      text: sec,
    });
  }

  return blocks;
}

export function extractHeadings(blocks: ArticleBlock[]): ArticleHeadingBlock[] {
  return blocks.filter((b): b is ArticleHeadingBlock => b.type === "heading" && (b.level === 2 || b.level === 3));
}
