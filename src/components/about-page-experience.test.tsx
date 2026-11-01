import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AboutPageContent } from "../content/home";
import { content } from "../content/home";
import { AboutPageExperience } from "./about-page-experience";

vi.mock("next/image", () => ({
  default: ({ fill, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    void fill;
    return <span data-image-alt={String(props.alt ?? "")} data-src={String(props.src ?? "")} />;
  },
}));

vi.mock("./page-transition", () => ({
  usePageTransition: () => ({ isInitialCinematic: false, introPhase: "done" }),
}));

vi.mock("./smooth-scroll", () => ({
  SmoothScroll: () => null,
}));

vi.mock("./enquiry-provider", () => ({
  useEnquiryModal: () => ({ openEnquiry: vi.fn() }),
}));

function getMockAboutContent(locale: "en" | "ar" = "en", overrides?: Partial<AboutPageContent>): AboutPageContent {
  const base = content[locale];
  return {
    ...base,
    backgrounds: {
      opening: "255, 255, 255",
      hero: "255, 255, 255",
      about: "255, 255, 255",
      projects: "255, 255, 255",
      lifestyle: "255, 255, 255",
      stats: "255, 255, 255",
      journal: "255, 255, 255",
      closing: "255, 255, 255",
      footer: "255, 255, 255",
    },
    about: {
      enabled: true,
      eyebrow: locale === "ar" ? "رحلتنا" : "Our journey",
      title: locale === "ar" ? "مسيرة من الأماكن والناس والتقدم." : "A timeline of places, people and progress.",
      intro: locale === "ar" ? "من فكرتنا الأولى إلى المجتمعات التي تتشكل اليوم." : "From our first idea to the communities taking shape today.",
      milestones: [
        {
          id: "m-2008",
          year: "2008",
          title: locale === "ar" ? "المنظور الأول" : "The first perspective",
          body: locale === "ar" ? "بدأت إيمدج للتطوير العقاري بإيمان راسخ." : "Image Developments began with a belief that real estate should start with people.",
          image: "https://images.unsplash.com/photo-1",
          alt: "Milestone 2008",
        },
        {
          id: "m-2018",
          year: "2018",
          title: locale === "ar" ? "مجتمعات تتشكل" : "Communities take shape",
          body: locale === "ar" ? "جمعت محفظة متنامية بين الطبيعة والعمارة." : "A growing portfolio brought landscape, architecture and everyday life together.",
          image: "https://images.unsplash.com/photo-2",
          alt: "Milestone 2018",
        },
        {
          id: "m-2025",
          year: "2025",
          title: locale === "ar" ? "فصل جديد" : "A new chapter",
          body: locale === "ar" ? "تحمل وجهات جديدة الفكرة الإنسانية ذاتها." : "New destinations carry the same human idea forward.",
          image: "https://images.unsplash.com/photo-3",
          alt: "Milestone 2025",
        },
      ],
    },
    stats: [
      { value: "18+", label: locale === "ar" ? "عاماً في صناعة المكان" : "Years shaping distinctive places" },
      { value: "4.2M", label: locale === "ar" ? "متر مربع قيد التطوير" : "Square metres in development" },
      { value: "9,500", label: locale === "ar" ? "منزل صُمم بعناية" : "Homes thoughtfully envisioned" },
    ],
    settings: {
      email: "hello@imagedevelopments.com",
      phone: "+20 2 0000 0000",
      hotline: "17087",
      workingHours: "Sunday - Thursday: 9:00 AM - 6:00 PM",
      address: "Cairo · Egypt",
      companyBrochureUrl: "https://example.com/brochure.pdf",
      socials: [],
      menuImage: "/images/menu.jpg",
      menuImageAlt: "Menu interior",
      seoTitle: "Image Developments",
      seoDescription: "Thoughtful communities",
    },
    aboutPage: {
      hero: {
        enabled: true,
        eyebrow: locale === "ar" ? "عن إيمدج" : "About Image",
        title: locale === "ar" ? "نصنع أماكن تتمحور حول الحياة التي تحتضنها." : "We shape places around the lives they hold.",
        body: locale === "ar" ? "تصنع إيمدج للتطوير العقاري مجتمعات مدروسة تتكامل فيها العمارة والطبيعة." : "Image Developments creates considered communities where architecture, landscape, and everyday experience belong together.",
        image: "https://images.unsplash.com/hero",
        alt: "Hero Image",
        ctaLabel: locale === "ar" ? "اكتشف رحلتنا" : "Explore Our Journey",
      },
      whoWeAre: {
        enabled: true,
        eyebrow: locale === "ar" ? "من نحن" : "Who We Are",
        title: locale === "ar" ? "صناعة مجتمعات متكاملة ومدروسة في مصر" : "Shaping Considered Communities Across Egypt",
        body: locale === "ar" ? "إيمدج للتطوير العقاري هي شركة رائدة في التطوير العمراني." : "Image Developments is an Egyptian real estate development company dedicated to creating vibrant destinations.",
        approach: locale === "ar" ? "يوحد نهجنا بين التصميم المتمحور حول الإنسان والحرفية المعمارية." : "Our integrated approach unites human-centered design and sustainable engineering.",
        image: "https://images.unsplash.com/whoweare",
        alt: "Who We Are Image",
        primaryCtaLabel: locale === "ar" ? "استكشف مشاريعنا" : "Explore Our Projects",
        primaryCtaUrl: `/${locale}/projects`,
        brochureCtaLabel: locale === "ar" ? "تحميل البروشور" : "Download Brochure",
      },
      visionMission: {
        enabled: true,
        visionEyebrow: locale === "ar" ? "رؤيتنا" : "Our Vision",
        visionTitle: locale === "ar" ? "إعادة تعريف أسلوب الحياة العصري" : "Redefining Modern Living Through Architecture & Nature",
        visionBody: locale === "ar" ? "أن نكون المطور العقاري الأكثر تميزاً وابتكاراً." : "To be Egypt's most thoughtful developer, recognized for creating enduring destinations.",
        missionEyebrow: locale === "ar" ? "رسالتنا" : "Our Mission",
        missionTitle: locale === "ar" ? "ابتكار مساحات مستدامة" : "Crafting Enduring Spaces with Purpose and Integrity",
        missionBody: locale === "ar" ? "تصميم وتسليم وجهات عمرانية ومخططات متكاملة." : "To design and deliver master-planned destinations that harmonize built form with open landscape.",
        image: "https://images.unsplash.com/vm",
        alt: "Vision & Mission Image",
        ctaLabel: locale === "ar" ? "استكشف مشاريعنا" : "Explore Our Projects",
        ctaUrl: `/${locale}/projects`,
      },
      achievements: {
        enabled: true,
        eyebrow: locale === "ar" ? "إنجازاتنا" : "Our Achievements",
        title: locale === "ar" ? "سجل حافل من التميز والإنجاز المعماري" : "A Proven Track Record of Architectural Excellence",
        description: locale === "ar" ? "ما يقارب عقدين من التطوير المدروس في أنحاء مصر." : "Nearly two decades of thoughtful development across Egypt.",
        ctaLabel: locale === "ar" ? "استعرض سجل إنجازاتنا" : "View Our Track Record",
        ctaUrl: `/${locale}/projects`,
      },
      leadership: {
        enabled: true,
        eyebrow: locale === "ar" ? "القيادة التنفيذية" : "Executive Leadership",
        title: locale === "ar" ? "الرؤية والخبرة وراء مسيرة إيمدج" : "The Vision and Expertise Behind Image",
        description: locale === "ar" ? "يجمع فريق قيادتنا عقوداً من الخبرة." : "Our multidisciplinary leadership team brings together decades of expertise.",
        ctaLabel: locale === "ar" ? "تواصل مع فريقنا" : "Contact Our Team",
        ctaUrl: `/${locale}/contact`,
        members: [
          {
            id: "leader-1",
            name: locale === "ar" ? "كريم منصور" : "Karim Mansour",
            role: locale === "ar" ? "المؤسس والرئيس التنفيذي" : "Founder & Chief Executive Officer",
            bio: locale === "ar" ? "يقود الرؤية الاستراتيجية للشركة." : "Leading the strategic vision of Image Developments.",
            image: "https://images.unsplash.com/leader-1",
            alt: "Karim Mansour",
          },
          {
            id: "leader-2",
            name: locale === "ar" ? "ليلى السيد" : "Layla El-Sayed",
            role: locale === "ar" ? "رئيسة قطاع العمارة والتصميم" : "Head of Architecture & Design",
            bio: locale === "ar" ? "تشرف على جودة التصميم في جميع المخططات." : "Directing design integrity across all masterplans.",
            image: "https://images.unsplash.com/leader-2",
            alt: "Layla El-Sayed",
          },
        ],
      },
      blocks: [],
    },
    ...overrides,
  };
}

describe("AboutPageExperience - Full BRD Compliance & History Preservation", () => {
  it("renders all required sections in the strict required order: Hero -> Who We Are -> Our Journey -> Vision & Mission -> Achievements -> Leadership -> Contact Form", () => {
    const copy = getMockAboutContent("en");
    const html = renderToStaticMarkup(<AboutPageExperience copy={copy} />);

    // Verify all section anchors and containers are present
    const heroIdx = html.indexOf('class="about-hero"');
    const whoWeAreIdx = html.indexOf('id="who-we-are"');
    const historyIdx = html.indexOf('id="about"');
    const visionMissionIdx = html.indexOf('id="vision-mission"');
    const achievementsIdx = html.indexOf('id="achievements"');
    const leadershipIdx = html.indexOf('id="leadership"');
    const contactFormIdx = html.indexOf('id="contact"');

    expect(heroIdx).toBeGreaterThan(-1);
    expect(whoWeAreIdx).toBeGreaterThan(heroIdx);
    expect(historyIdx).toBeGreaterThan(whoWeAreIdx);
    expect(visionMissionIdx).toBeGreaterThan(historyIdx);
    expect(achievementsIdx).toBeGreaterThan(visionMissionIdx);
    expect(leadershipIdx).toBeGreaterThan(achievementsIdx);
    expect(contactFormIdx).toBeGreaterThan(leadershipIdx);
  });

  it("A. ABOUT HERO: renders heading, introduction, and 'Explore Our Journey' button", () => {
    const copy = getMockAboutContent("en");
    const html = renderToStaticMarkup(<AboutPageExperience copy={copy} />);

    expect(html).toContain("We shape places around the lives they hold.");
    expect(html).toContain("Explore Our Journey");
    expect(html).toContain("btn-about-hero-cta");
  });

  it("B. WHO WE ARE: renders company story, project projects link, and download brochure button when configured", () => {
    const copy = getMockAboutContent("en");
    const html = renderToStaticMarkup(<AboutPageExperience copy={copy} />);

    expect(html).toContain("Shaping Considered Communities Across Egypt");
    expect(html).toContain("Explore Our Projects");
    expect(html).toContain('href="/en/projects"');
    expect(html).toContain("Download Brochure");
    expect(html).toContain('href="https://example.com/brochure.pdf"');
  });

  it("B. WHO WE ARE: omits brochure button when company brochure URL is not configured", () => {
    const baseSettings = getMockAboutContent("en").settings!;
    const copy = getMockAboutContent("en", {
      settings: {
        ...baseSettings,
        companyBrochureUrl: undefined,
      },
    });
    const html = renderToStaticMarkup(<AboutPageExperience copy={copy} />);

    expect(html).toContain("Explore Our Projects");
    expect(html).not.toContain("Download Brochure");
  });

  it("C. OUR JOURNEY (History Timeline): preserved 100% with horizontal sticky track, milestones, and achievements destination", () => {
    const copy = getMockAboutContent("en");
    const html = renderToStaticMarkup(<AboutPageExperience copy={copy} />);

    // Preserved class structure
    expect(html).toContain("about-timeline");
    expect(html).toContain("about-sticky");
    expect(html).toContain("about-track");
    expect(html).toContain("about-page");
    expect(html).toContain("about-scroll-hint");

    // Milestones verified
    expect(html).toContain("2008");
    expect(html).toContain("The first perspective");
    expect(html).toContain("2018");
    expect(html).toContain("2025");

    // Preserved CTA linking to #about-details
    expect(html).toContain("Discover Our Achievements");
    expect(html).toContain('href="#about-details"');
  });

  it("D. VISION & MISSION: renders distinct Vision and Mission statements, and Explore Projects CTA", () => {
    const copy = getMockAboutContent("en");
    const html = renderToStaticMarkup(<AboutPageExperience copy={copy} />);

    expect(html).toContain("Our Vision");
    expect(html).toContain("Redefining Modern Living Through Architecture &amp; Nature");
    expect(html).toContain("Our Mission");
    expect(html).toContain("Crafting Enduring Spaces with Purpose and Integrity");
  });

  it("E. OUR ACHIEVEMENTS: has both #achievements and #about-details anchors, verified stats, and track record CTA", () => {
    const copy = getMockAboutContent("en");
    const html = renderToStaticMarkup(<AboutPageExperience copy={copy} />);

    expect(html).toContain('id="achievements"');
    expect(html).toContain('id="about-details"');
    expect(html).toContain("18+");
    expect(html).toContain("Years shaping distinctive places");
    expect(html).toContain("4.2M");
    expect(html).toContain("9,500");
    expect(html).toContain("View Our Track Record");
  });

  it("F. LEADERSHIP: renders portraits, names, roles, bios, and Contact Our Team button", () => {
    const copy = getMockAboutContent("en");
    const html = renderToStaticMarkup(<AboutPageExperience copy={copy} />);

    expect(html).toContain("Karim Mansour");
    expect(html).toContain("Founder &amp; Chief Executive Officer");
    expect(html).toContain("Layla El-Sayed");
    expect(html).toContain("Contact Our Team");
  });

  it("F. LEADERSHIP: hides gracefully when zero members are configured", () => {
    const copy = getMockAboutContent("en", {
      aboutPage: {
        ...getMockAboutContent("en").aboutPage,
        leadership: {
          ...getMockAboutContent("en").aboutPage.leadership!,
          members: [],
        },
      },
    });
    const html = renderToStaticMarkup(<AboutPageExperience copy={copy} />);

    expect(html).not.toContain('id="leadership"');
    expect(html).not.toContain("Karim Mansour");
  });

  it("renders correctly in Arabic (RTL) with localized copy and links", () => {
    const copy = getMockAboutContent("ar");
    const html = renderToStaticMarkup(<AboutPageExperience copy={copy} />);

    expect(html).toContain("نصنع أماكن تتمحور حول الحياة التي تحتضنها.");
    expect(html).toContain("اكتشف رحلتنا");
    expect(html).toContain("صناعة مجتمعات متكاملة ومدروسة في مصر");
    expect(html).toContain("استكشف مشاريعنا");
    expect(html).toContain("تحميل البروشور");
    expect(html).toContain("رؤيتنا");
    expect(html).toContain("رسالتنا");
    expect(html).toContain("إنجازاتنا");
    expect(html).toContain("استعرض سجل إنجازاتنا");
    expect(html).toContain("كريم منصور");
    expect(html).toContain("تواصل مع فريقنا");
  });
});
