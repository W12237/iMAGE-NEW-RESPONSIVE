import "server-only";
import { cache } from "react";
import type {
  Locale,
  HomeContent,
  ProjectsPageContent,
  ProjectDetailPageContent,
  CareersPageContent,
  NewsPageContent,
  NewsDetailPageContent,
  SidebarProjectCard,
  SidebarProjectsConfig,
  NewsStoryItem,
  AboutPageContent,
  TeamPageContent,
  PartnersPageContent,
  PolicyPageContent,
  TermsPageContent,
  HistoryPageContent,
  ContactPageContent,
  PageSectionContent,
  HomeJournalArticle,
} from "../content/home";
import { content, siteMedia, JOURNAL_CATEGORY_LABELS } from "../content/home";
import { normalizePageSectionLayout } from "./page-section-layouts";
import { normalizeBlockKind } from "./page-blocks";
import { parseBlockSettings } from "./block-settings";
import { prisma } from "./prisma";
import { calculateReadingTime } from "./article-blocks";
import {
  resolveTypography,
  TYPOGRAPHY_ROLES,
  type TypographyRole,
  type TypographyValues,
  type ResolvedTypography,
  type SupportedLocale,
} from "./typography";

export const PUBLIC_PAGES = [
  "home",
  "about",
  "history",
  "developments",
  "projects",
  "journal",
  "team",
  "partners",
  "careers",
  "policy",
  "terms",
  "contact",
] as const;
export type PublicPageKey = (typeof PUBLIC_PAGES)[number];

const pick = (locale: Locale, en: string, ar: string) => locale === "ar" ? ar : en;

export const getPageSections = cache(async (locale: Locale, page: PublicPageKey) => {
  if (!process.env.DATABASE_URL) return [];
  const sections = await prisma.pageSection.findMany({ where: { page, visible: true }, orderBy: { sortOrder: "asc" } });
  return sections.map(section => ({ id: section.id, kind: normalizeBlockKind(section.kind), settings: parseBlockSettings(section.settings), layout: normalizePageSectionLayout(section.layout), eyebrow: pick(locale, section.eyebrowEn, section.eyebrowAr), title: pick(locale, section.titleEn, section.titleAr), body: pick(locale, section.bodyEn, section.bodyAr), image: section.imageUrl ?? undefined, imageAlt: pick(locale, section.imageAltEn, section.imageAltAr), ctaLabel: pick(locale, section.ctaLabelEn, section.ctaLabelAr) || undefined, ctaUrl: section.ctaUrl ?? undefined, backgroundRgb: section.backgroundRgb }));
});

export const getHomepageContent = cache(async (locale: Locale): Promise<HomeContent> => {
  const supportedLocale: SupportedLocale = locale === "ar" ? "ar" : "en";
  const roles: TypographyRole[] = ["heroHeading", "sectionHeading", "cardTitle", "body", "meta", "tag"];

  if (!process.env.DATABASE_URL) {
    const emptyTypoMap = new Map<string, TypographyValues>();
    const resolvedGlobal = Object.fromEntries(
      roles.map(r => [r, resolveTypography(r, "global", supportedLocale, emptyTypoMap)])
    ) as Record<TypographyRole, ResolvedTypography>;
    const resolvedProjects = Object.fromEntries(
      roles.map(r => [r, resolveTypography(r, "home_projects", supportedLocale, emptyTypoMap)])
    ) as Record<TypographyRole, ResolvedTypography>;

    const base = { ...content[locale], backgrounds: { opening: "255, 255, 255", hero: "255, 255, 255", about: "255, 255, 255", projects: "255, 255, 255", lifestyle: "255, 255, 255", stats: "255, 255, 255", journal: "255, 255, 255", closing: "255, 255, 255", footer: "255, 255, 255" } };
    return { ...base, opening: { enabled: true, headline: locale === "ar" ? "منظور جديد" : "A new perspective", poster: siteMedia.hero }, projectsOpening: { enabled: true, headline: locale === "ar" ? "محفظة المشاريع" : "Our Portfolio" }, hero: { ...base.hero, image: siteMedia.hero, poster: siteMedia.hero, alt: "Contemporary residence framed by palms" }, lifestyle: { ...base.lifestyle, image: siteMedia.lifestyle, alt: "Sunlit living space opening to the landscape" }, visibility: { projects: true, stats: true }, sectionOrder: ["projects", "lifestyle", "stats", "journal", "closing"], projectsSection: { heading: locale === "ar" ? "المشاريع" : "Projects", description: locale === "ar" ? "مجموعة مختارة من الوجهات السكنية والمختلطة التي تصنع ملامح جديدة للحياة الحضرية في مصر." : "A curated collection of residential and mixed-use destinations shaping Egypt's urban landscape.", exploreLabel: locale === "ar" ? "اكتشف المكان" : "Explore the place", enquireLabel: locale === "ar" ? "استفسر الآن" : "Enquire", viewAllLabel: locale === "ar" ? "جميع المشاريع" : "View All Projects", spacing: "standard", theme: "light", imagePosition: "start", filterEnabled: true, showResultCount: true, locationFilterLabel: locale === "ar" ? "الموقع" : "Location", typeFilterLabel: locale === "ar" ? "نوع المشروع" : "Project Type", statusFilterLabel: locale === "ar" ? "حالة المشروع" : "Project Status", resetFilterLabel: locale === "ar" ? "إعادة ضبط الفلاتر" : "Reset Filters", locationTagsEnabled: true, allLabel: locale === "ar" ? "كافة المشاريع" : "All Projects", showTagCounts: false, locationOrder: "auto" }, typography: { global: resolvedGlobal, home_projects: resolvedProjects }, newsJournalSection: { enabled: true, label: locale === "ar" ? "الأخبار والمقالات" : "News & Journal", heading: locale === "ar" ? "قصص وأفكار ومستجدات" : "Stories, ideas, and updates.", description: locale === "ar" ? "رؤى معمارية ومحطات مجتمعية ومستجدات متواصلة تشكّل ملامح وجهاتنا العمرانية." : "Perspectives on architecture, community milestones, and the ongoing progress shaping our destinations.", ctaLabel: locale === "ar" ? "عرض جميع المقالات" : "View All Articles", ctaUrl: `/${locale}/journal`, mode: "AUTO", categoryFilter: "ALL", articlesCount: 3, articles: [] }, settings: { email: "hello@imagedevelopments.com", phone: "+20 2 0000 0000", hotline: "17087", workingHours: locale === "ar" ? "الأحد - الخميس: ٩:٠٠ ص - ٦:٠٠ م" : "Sunday - Thursday: 9:00 AM - 6:00 PM", address: locale === "ar" ? "القاهرة · مصر" : "Cairo · Egypt", menuImage: siteMedia.detail, menuImageAlt: "Warm architectural interior", socials: [{ label: "Instagram", url: "https://instagram.com" }, { label: "LinkedIn", url: "https://linkedin.com" }, { label: "Facebook", url: "https://facebook.com" }], seoTitle: "Image Developments — Places with perspective", seoDescription: "Image Developments creates considered communities across Egypt." }, common: { ...base.common, statsHeading: locale === "ar" ? "إيمدج بالأرقام" : "Image in numbers" } };
  }
  const [home, settings, nav, projects, openingProjects, news, pageSections, allPublishedNews, typographyRecords] = await Promise.all([
    prisma.homepage.findUnique({ where: { id: "homepage" }, include: { stats: { orderBy: { sortOrder: "asc" } }, aboutMilestones: { orderBy: { sortOrder: "asc" } } } }),
    prisma.globalSettings.findUnique({ where: { id: "global" }, include: { socialLinks: { orderBy: { sortOrder: "asc" } } } }),
    prisma.navigationItem.findMany({
      orderBy: { sortOrder: "asc" },
    }),
    prisma.project.findMany({ where: { status: "PUBLISHED", featured: true }, orderBy: { featuredOrder: "asc" }, take: 6 }),
    prisma.project.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ featured: "desc" }, { featuredOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.newsArticle.findMany({ where: { status: "PUBLISHED", featured: true }, orderBy: [{ featuredOrder: "asc" }, { publicationDate: "desc" }], take: 3 }),
    prisma.pageSection.findMany({ where: { visible: true }, orderBy: { sortOrder: "asc" } }),
    prisma.newsArticle.findMany({
      where: {
        status: "PUBLISHED",
        publicationDate: { lte: new Date() },
      },
      orderBy: [{ publicationDate: "desc" }],
      take: 40,
    }),
    prisma.typographySetting.findMany(),
  ]);
  if (!home || !settings) throw new Error("CMS is not seeded. Run `pnpm db:seed`.");
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const currentProject = projects[0];
  const currentGallery = currentProject ? (() => { try { const value = JSON.parse(currentProject.gallery); return Array.isArray(value) ? value.filter((image): image is string => typeof image === "string" && Boolean(image.trim())).slice(0, 4) : [] } catch { return [] } })() : [];
  const openingImages = currentProject ? Array.from({ length: 5 }, (_, index) => [...currentGallery, currentProject.coverImageUrl, ...openingProjects.map(project => project.coverImageUrl)][index % Math.max(1, currentGallery.length + 1 + openingProjects.length)]) : [];

  const journalMode = (home.statsJournalMode as "AUTO" | "MANUAL") || "AUTO";
  const categoryFilter = home.statsJournalCategory || "ALL";
  const maxArticles = Math.max(1, Math.min(6, home.statsJournalCount ?? 3));

  let candidateArticles = allPublishedNews.filter(a => {
    return locale === "ar" ? Boolean(a.titleAr?.trim()) : Boolean(a.titleEn?.trim());
  });

  if (categoryFilter !== "ALL" && journalMode === "AUTO") {
    candidateArticles = candidateArticles.filter(a => a.category?.toUpperCase() === categoryFilter.toUpperCase());
  }

  let selectedArticles = candidateArticles;
  if (journalMode === "MANUAL") {
    let manualIds: string[] = [];
    try {
      manualIds = JSON.parse(home.statsJournalArticleIds || "[]");
    } catch {
      manualIds = [];
    }
    if (manualIds.length > 0) {
      const articleMap = new Map(candidateArticles.map(a => [a.id, a]));
      const ordered = manualIds
        .map(id => articleMap.get(id))
        .filter((a): a is typeof candidateArticles[0] => Boolean(a));
      if (ordered.length > 0) {
        selectedArticles = ordered;
      }
    }
  }

  const seenArticleIds = new Set<string>();
  const deduplicatedArticles = selectedArticles.filter(a => {
    if (seenArticleIds.has(a.id)) return false;
    seenArticleIds.add(a.id);
    return true;
  }).slice(0, maxArticles);

  const homeJournalArticles: HomeJournalArticle[] = deduplicatedArticles.map(a => {
    const catKey = (a.category || "NEWS").toUpperCase();
    const catObj = JOURNAL_CATEGORY_LABELS[catKey] || { en: a.category || "News", ar: a.category || "أخبار" };
    const catLabel = locale === "ar" ? catObj.ar : catObj.en;
    const title = pick(locale, a.titleEn, a.titleAr);
    const excerpt = pick(locale, a.excerptEn || "", a.excerptAr || "") || undefined;
    const coverImageAlt = pick(locale, a.coverImageAltEn || "", a.coverImageAltAr || "") || title;
    return {
      id: a.id,
      slug: a.slug,
      title,
      excerpt,
      coverImageUrl: a.coverImageUrl,
      coverImageAlt,
      focalPoint: a.focalPoint || "center",
      publicationDate: fmt.format(a.publicationDate),
      rawDate: a.publicationDate.toISOString(),
      category: a.category,
      categoryLabel: catLabel,
      href: `/${locale}/journal/${a.slug}`,
    };
  });
  const typoMap = new Map<string, TypographyValues>();
  for (const record of typographyRecords) {
    typoMap.set(record.key, {
      fontSizeMobile: record.fontSizeMobile ?? undefined,
      fontSizeDesktop: record.fontSizeDesktop ?? undefined,
      lineHeight: record.lineHeight ?? undefined,
      fontWeight: record.fontWeight ?? undefined,
    });
  }

  const resolvedGlobal = Object.fromEntries(
    roles.map(r => [r, resolveTypography(r, "global", supportedLocale, typoMap)])
  ) as Record<TypographyRole, ResolvedTypography>;

  const resolvedProjects = Object.fromEntries(
    roles.map(r => [r, resolveTypography(r, "home_projects", supportedLocale, typoMap)])
  ) as Record<TypographyRole, ResolvedTypography>;

  return {
    locale, dir: locale === "ar" ? "rtl" : "ltr",
    backgrounds: { opening: home.openingBackgroundRgb, hero: home.heroBackgroundRgb, about: home.aboutBackgroundRgb, projects: home.projectsBackgroundRgb, lifestyle: home.lifestyleBackgroundRgb, stats: home.statsBackgroundRgb, journal: home.journalBackgroundRgb, closing: home.closingBackgroundRgb, footer: home.footerBackgroundRgb },
    opening: { enabled: home.openingEnabled, headline: pick(locale, home.openingHeadlineEn, home.openingHeadlineAr), desktopVideo: home.openingVideoDesktopUrl ?? undefined, mobileVideo: home.openingVideoMobileUrl ?? undefined, poster: home.openingPosterUrl ?? home.heroMediaUrl },
    projectsOpening: { enabled: home.projectsOpeningEnabled, headline: pick(locale, home.projectsOpeningHeadlineEn, home.projectsOpeningHeadlineAr) },
    typography: { global: resolvedGlobal, home_projects: resolvedProjects },
    nav: nav
      .filter((n: any) => n.visible !== false || n.mobileVisible !== false)
      .map(n => ({
        id: n.id,
        label: pick(locale, n.labelEn, n.labelAr),
        href: n.url,
        external: n.external,
        group: (n.group as "primary" | "secondary") || "primary",
        previewImage: (locale === "ar" && n.previewImageUrlAr) ? n.previewImageUrlAr : (n.previewImageUrl || undefined),
        focalPoint: n.focalPoint || "center",
        visible: n.visible,
        mobileVisible: (n as any).mobileVisible !== false,
      })),
    hero: { enabled: home.heroEnabled, eyebrow: pick(locale, home.heroEyebrowEn, home.heroEyebrowAr), title: pick(locale, home.heroTitleEn, home.heroTitleAr).split("\n"), note: pick(locale, home.heroNoteEn, home.heroNoteAr), scroll: pick(locale, home.heroDiscoverEn, home.heroDiscoverAr), image: home.heroMediaUrl, mobileImage: home.heroMobileMediaUrl ?? undefined, desktopVideo: home.heroVideoDesktopUrl ?? undefined, mobileVideo: home.heroVideoMobileUrl ?? undefined, poster: home.heroPosterUrl ?? home.heroMediaUrl, alt: pick(locale, home.heroMediaAltEn, home.heroMediaAltAr) },
    about: { enabled: home.aboutEnabled, eyebrow: pick(locale, home.aboutEyebrowEn, home.aboutEyebrowAr), title: pick(locale, home.aboutTitleEn, home.aboutTitleAr), intro: pick(locale, home.aboutIntroEn, home.aboutIntroAr), milestones: home.aboutMilestones.map(item => ({ id: item.id, year: item.year, title: pick(locale, item.titleEn, item.titleAr), body: pick(locale, item.bodyEn, item.bodyAr), image: item.imageUrl, alt: pick(locale, item.imageAltEn, item.imageAltAr) })) },
    projects: projects.map(p => ({
      id: p.id,
      slug: p.slug,
      name: pick(locale, p.nameEn, p.nameAr),
      location: pick(locale, p.locationEn, p.locationAr),
      locationEn: p.locationEn,
      locationAr: p.locationAr,
      promise: pick(locale, p.shortDescriptionEn, p.shortDescriptionAr),
      image: p.coverImageUrl,
      alt: pick(locale, p.coverImageAltEn, p.coverImageAltAr),
      ctaUrl: p.ctaUrl && !p.ctaUrl.startsWith("#") ? p.ctaUrl : `/${locale}/projects/${p.slug}`,
      ctaLabel: pick(locale, p.ctaLabelEn ?? "", p.ctaLabelAr ?? "") || undefined,
      projectType: p.projectType,
      progressStatus: p.progressStatus,
      brochureUrl: p.brochureUrl ?? undefined,
    })),
    projectsSection: {
      heading: pick(locale, home.projectsHeadingEn, home.projectsHeadingAr),
      description: pick(locale, home.projectsDescriptionEn ?? "", home.projectsDescriptionAr ?? "") || undefined,
      exploreLabel: pick(locale, home.projectsExploreEn, home.projectsExploreAr),
      enquireLabel: pick(locale, home.projectsEnquireEn ?? "Enquire", home.projectsEnquireAr ?? "استفسر الآن"),
      viewAllLabel: pick(locale, home.projectsViewAllEn ?? "View All Projects", home.projectsViewAllAr ?? "جميع المشاريع"),
      spacing: (home.projectsSpacing as "compact" | "standard" | "spacious") || "standard",
      theme: (home.projectsTheme as "light" | "warm" | "dark") || "light",
      imagePosition: (home.projectsImagePosition as "start" | "end") || "start",
      filterEnabled: true,
      showResultCount: true,
      locationFilterLabel: locale === "ar" ? "الموقع" : "Location",
      typeFilterLabel: locale === "ar" ? "نوع المشروع" : "Project Type",
      statusFilterLabel: locale === "ar" ? "حالة المشروع" : "Project Status",
      resetFilterLabel: locale === "ar" ? "إعادة ضبط الفلاتر" : "Reset Filters",
      locationTagsEnabled: home.projectsLocationTagsEnabled ?? true,
      allLabel: pick(locale, home.projectsAllLabelEn || "All Projects", home.projectsAllLabelAr || "كافة المشاريع"),
      showTagCounts: home.projectsShowTagCounts ?? false,
      locationOrder: (home.projectsLocationOrder as "auto" | "manual") || "auto",
      visibleLocations: home.projectsVisibleLocations ? (() => { try { return JSON.parse(home.projectsVisibleLocations); } catch { return undefined; } })() : undefined,
    },
    inquiryProjects: openingProjects.map(p => ({ id: p.id, name: pick(locale, p.nameEn, p.nameAr) })),
    openingProjects: openingProjects.map(p => ({ name: pick(locale, p.nameEn, p.nameAr), location: pick(locale, p.locationEn, p.locationAr), image: p.coverImageUrl })),
    openingProject: currentProject ? { name: pick(locale, currentProject.nameEn, currentProject.nameAr), location: pick(locale, currentProject.locationEn, currentProject.locationAr), image: currentProject.coverImageUrl, images: openingImages } : undefined,
    lifestyle: {
      enabled: home.lifestyleEnabled,
      eyebrow: pick(locale, home.lifestyleEyebrowEn, home.lifestyleEyebrowAr),
      title: pick(locale, home.lifestyleTitleEn, home.lifestyleTitleAr),
      image: home.lifestyleMediaUrl,
      alt: pick(locale, home.lifestyleMediaAltEn, home.lifestyleMediaAltAr),
      ctaLabel: pick(locale, (home as any).lifestyleCtaLabelEn ?? (locale === "ar" ? "اكتشف قصتنا" : "Discover Our Story"), (home as any).lifestyleCtaLabelAr ?? "اكتشف قصتنا") || (locale === "ar" ? "اكتشف قصتنا" : "Discover Our Story"),
      ctaUrl: (home as any).lifestyleCtaUrl || `/${locale}/about`,
    },
    stats: home.stats.filter(s => s.visible !== false).map(s => ({ value: pick(locale, s.valueEn, s.valueAr), label: pick(locale, s.labelEn, s.labelAr), unit: pick(locale, s.unitEn ?? "", s.unitAr ?? "") || undefined })),
    statsSection: {
      enabled: home.statsEnabled,
      label: pick(locale, home.statsLabelEn ?? "About Image", home.statsLabelAr ?? "عن إيمدج") || undefined,
      heading: pick(locale, home.statsHeadingEn, home.statsHeadingAr),
      description: pick(locale, home.statsDescriptionEn ?? "", home.statsDescriptionAr ?? "") || undefined,
      imageUrl: home.statsImageUrl ?? undefined,
      imageAlt: pick(locale, home.statsImageAltEn ?? "Image Developments architecture", home.statsImageAltAr ?? "العمارة المعاصرة في إيمدج للتطوير العقاري"),
      focalPoint: home.statsImageFocalPoint || "center",
      ctaLabel: pick(locale, home.statsCtaLabelEn ?? (locale === "ar" ? "اكتشف قصتنا" : "Discover Our Story"), home.statsCtaLabelAr ?? "اكتشف قصتنا") || undefined,
      ctaUrl: home.statsCtaUrl || `/${locale}/about`,
      stats: home.stats.filter(s => s.visible !== false).map(s => ({
        id: s.id,
        value: pick(locale, s.valueEn, s.valueAr),
        unit: pick(locale, s.unitEn ?? "", s.unitAr ?? "") || undefined,
        label: pick(locale, s.labelEn, s.labelAr),
        visible: s.visible,
        sortOrder: s.sortOrder,
      })),
    },
    newsJournalSection: {
      enabled: home.statsEnabled,
      label: pick(locale, home.statsLabelEn ?? "News & Journal", home.statsLabelAr ?? "الأخبار والمقالات") || (locale === "ar" ? "الأخبار والمقالات" : "News & Journal"),
      heading: pick(locale, home.statsHeadingEn ?? "Stories, ideas, and updates.", home.statsHeadingAr ?? "قصص وأفكار ومستجدات") || (locale === "ar" ? "قصص وأفكار ومستجدات" : "Stories, ideas, and updates."),
      description: pick(locale, home.statsDescriptionEn ?? "", home.statsDescriptionAr ?? "") || undefined,
      ctaLabel: pick(locale, home.statsCtaLabelEn ?? (locale === "ar" ? "عرض جميع المقالات" : "View All Articles"), home.statsCtaLabelAr ?? "عرض جميع المقالات") || (locale === "ar" ? "عرض جميع المقالات" : "View All Articles"),
      ctaUrl: home.statsCtaUrl || `/${locale}/journal`,
      mode: journalMode,
      categoryFilter,
      articlesCount: maxArticles,
      articles: homeJournalArticles,
    },
    journal: { enabled: home.journalEnabled, eyebrow: pick(locale, home.journalEyebrowEn, home.journalEyebrowAr), title: pick(locale, home.journalTitleEn, home.journalTitleAr), stories: news.map(n => ({ slug: n.slug, date: fmt.format(n.publicationDate), title: pick(locale, n.titleEn, n.titleAr), image: n.coverImageUrl, alt: pick(locale, n.coverImageAltEn, n.coverImageAltAr) })) },
    closing: {
      enabled: home.closingEnabled,
      eyebrow: pick(locale, home.closingEyebrowEn, home.closingEyebrowAr),
      title: pick(locale, home.closingTitleEn, home.closingTitleAr),
      description: (locale === "ar" ? home.closingDescriptionAr : home.closingDescriptionEn) !== null && (locale === "ar" ? home.closingDescriptionAr : home.closingDescriptionEn) !== undefined
        ? (locale === "ar" ? home.closingDescriptionAr! : home.closingDescriptionEn!)
        : content[locale].closing.description,
      formHeading: (locale === "ar" ? home.closingFormHeadingAr : home.closingFormHeadingEn) !== null && (locale === "ar" ? home.closingFormHeadingAr : home.closingFormHeadingEn) !== undefined
        ? (locale === "ar" ? home.closingFormHeadingAr! : home.closingFormHeadingEn!)
        : content[locale].closing.formHeading,
      submitLabel: (locale === "ar" ? home.closingSubmitLabelAr : home.closingSubmitLabelEn) !== null && (locale === "ar" ? home.closingSubmitLabelAr : home.closingSubmitLabelEn) !== undefined
        ? (locale === "ar" ? home.closingSubmitLabelAr! : home.closingSubmitLabelEn!)
        : content[locale].closing.submitLabel,
      successMessage: (locale === "ar" ? home.closingSuccessMessageAr : home.closingSuccessMessageEn) !== null && (locale === "ar" ? home.closingSuccessMessageAr : home.closingSuccessMessageEn) !== undefined
        ? (locale === "ar" ? home.closingSuccessMessageAr! : home.closingSuccessMessageEn!)
        : content[locale].closing.successMessage,
      cta: pick(locale, home.closingCtaEn, home.closingCtaAr),
      url: home.closingCtaUrl,
    },
    visibility: { projects: home.projectsEnabled, stats: home.statsEnabled },
    sectionOrder: JSON.parse(home.sectionOrder) as string[],
    settings: {
      email: settings.contactEmail,
      phone: settings.phone,
      hotline: settings.hotline || "17087",
      workingHours: pick(locale, settings.workingHoursEn, settings.workingHoursAr),
      companyBrochureUrl: settings.companyBrochureUrl ?? undefined,
      address: pick(locale, settings.addressEn, settings.addressAr),
      mapUrl: settings.mapUrl || "https://maps.google.com/?q=Image+Developments+Cairo+Egypt",
      description: pick(locale, settings.descriptionEn ?? "", settings.descriptionAr ?? "") || pick(locale, home.heroNoteEn, home.heroNoteAr),
      footerExploreHeading: pick(locale, settings.footerExploreHeadingEn ?? "Explore", settings.footerExploreHeadingAr ?? "استكشف"),
      footerProjectsHeading: pick(locale, settings.footerProjectsHeadingEn ?? "Our Projects", settings.footerProjectsHeadingAr ?? "مشاريعنا"),
      footerContactHeading: pick(locale, settings.footerContactHeadingEn ?? "Contact", settings.footerContactHeadingAr ?? "تواصل معنا"),
      callbackEnabled: settings.callbackEnabled !== false,
      callbackLabel: pick(locale, settings.callbackLabelEn ?? "Request a Call Back", settings.callbackLabelAr ?? "طلب معاودة الاتصال"),
      menuImage: settings.menuMediaUrl,
      menuImageAlt: pick(locale, settings.menuMediaAltEn, settings.menuMediaAltAr),
      menuImageFocalPoint: settings.menuMediaFocalPoint || "center",
      socials: settings.socialLinks.map((item) => ({ label: item.name, url: item.url, svgIcon: item.svgIcon })),
      seoTitle: pick(locale, settings.defaultSeoTitleEn, settings.defaultSeoTitleAr),
      seoDescription: pick(locale, settings.defaultSeoDescriptionEn, settings.defaultSeoDescriptionAr),
    },
    common: { projects: pick(locale, home.projectsHeadingEn, home.projectsHeadingAr), explore: pick(locale, home.projectsExploreEn, home.projectsExploreAr), menu: locale === "ar" ? "افتح القائمة" : "Open menu", close: locale === "ar" ? "أغلق القائمة" : "Close menu", language: locale === "ar" ? "English" : "العربية", contact: locale === "ar" ? "تواصل معنا" : "Get in touch", rights: pick(locale, settings.copyrightEn, settings.copyrightAr), statsHeading: pick(locale, home.statsHeadingEn, home.statsHeadingAr) },
    pageSectionsByPage: pageSections.reduce<Record<string, PageSectionContent[]>>((groups, section) => { (groups[section.page] ??= []).push({ id: section.id, kind: normalizeBlockKind(section.kind), settings: parseBlockSettings(section.settings), layout: normalizePageSectionLayout(section.layout), eyebrow: pick(locale, section.eyebrowEn, section.eyebrowAr), title: pick(locale, section.titleEn, section.titleAr), body: pick(locale, section.bodyEn, section.bodyAr), image: section.imageUrl ?? undefined, imageAlt: pick(locale, section.imageAltEn, section.imageAltAr), ctaLabel: pick(locale, section.ctaLabelEn, section.ctaLabelAr) || undefined, ctaUrl: section.ctaUrl ?? undefined, backgroundRgb: section.backgroundRgb }); return groups }, {}),
  };
});

export const getProjectsPageContent = cache(async (locale: Locale): Promise<ProjectsPageContent> => {
  const base = await getHomepageContent(locale);
  const home = process.env.DATABASE_URL
    ? await prisma.homepage.findUnique({ where: { id: "homepage" } })
    : null;

  const defaultHeroImage =
    home?.projectsHeroImageUrl ||
    base.projects[0]?.image ||
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=88";

  const defaultMobileHeroImage =
    home?.projectsHeroMobileImageUrl || defaultHeroImage;

  const projectsHero = {
    enabled: home?.projectsHeroEnabled ?? true,
    eyebrow: pick(locale, home?.projectsHeroEyebrowEn ?? "Image Portfolio", home?.projectsHeroEyebrowAr ?? "محفظة المشاريع"),
    title: pick(locale, home?.projectsHeroTitleEn ?? "Our Projects", home?.projectsHeroTitleAr ?? "مشاريعنا"),
    description: pick(
      locale,
      home?.projectsHeroDescriptionEn ??
      "Explore our collection of considered destinations and master-planned communities, where architectural craft meets landscape and everyday living.",
      home?.projectsHeroDescriptionAr ??
      "استكشف وجهات ومجتمعات إيمدج للتطوير العقاري، حيث تتناغم العمارة الحديثة مع الطبيعة وتفاصيل الحياة اليومية لصنع قيمة مستدامة."
    ),
    imageUrl: defaultHeroImage,
    mobileImageUrl: defaultMobileHeroImage,
    focalPoint: home?.projectsHeroFocalPoint || "center",
    imageAlt: pick(
      locale,
      home?.projectsHeroImageAltEn ?? "Image Developments Projects",
      home?.projectsHeroImageAltAr ?? "مشاريع إيمدج للتطوير العقاري"
    ),
    primaryCta: pick(locale, home?.projectsHeroPrimaryCtaEn ?? "Explore Projects", home?.projectsHeroPrimaryCtaAr ?? "استكشف المشاريع"),
    secondaryCta: pick(locale, home?.projectsHeroSecondaryCtaEn ?? "Register Interest", home?.projectsHeroSecondaryCtaAr ?? "سجّل اهتمامك"),
  };

  if (!process.env.DATABASE_URL) {
    return {
      ...base,
      projectsHero,
      allProjects: base.projects.map((p, i) => ({
        id: base.inquiryProjects[i]?.id ?? `proj-${i}`,
        slug: base.inquiryProjects[i]?.id ?? `project-${i}`,
        projectType: i === 1 ? "Commercial" : "Residential",
        progressStatus: i === 2 ? "Upcoming" : "Ongoing",
        featured: i === 0,
        ...p,
      })),
    };
  }
  const publishedProjects = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ featured: "desc" }, { featuredOrder: "asc" }, { createdAt: "desc" }],
  });
  return {
    ...base,
    projectsHero,
    allProjects: publishedProjects.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: pick(locale, p.nameEn, p.nameAr),
      location: pick(locale, p.locationEn, p.locationAr),
      promise: pick(locale, p.shortDescriptionEn, p.shortDescriptionAr),
      image: p.coverImageUrl,
      alt: pick(locale, p.coverImageAltEn, p.coverImageAltAr),
      ctaUrl: p.ctaUrl ?? undefined,
      ctaLabel: pick(locale, p.ctaLabelEn ?? "", p.ctaLabelAr ?? "") || undefined,
      focalPoint: p.coverImageFocalPoint || "center",
      projectType: p.projectType || "Residential",
      progressStatus: p.progressStatus || "Ongoing",
      featured: p.featured,
      logoUrl: p.logoUrl ?? undefined,
    })),
  };
});

export const getProjectDetailContent = cache(async (locale: Locale, slug: string, isPreview = false): Promise<ProjectDetailPageContent | null> => {
  const base = await getHomepageContent(locale);
  if (!process.env.DATABASE_URL) return null;
  const project = await prisma.project.findFirst({
    where: { slug, ...(isPreview ? {} : { status: "PUBLISHED" }) },
    include: {
      keyFactsList: { orderBy: { sortOrder: "asc" } },
      highlightsList: { orderBy: { sortOrder: "asc" } },
      unitTypesList: { orderBy: { sortOrder: "asc" } },
      galleryItemList: { orderBy: { sortOrder: "asc" } },
      constructionUpdatesList: { orderBy: { sortOrder: "asc" } },
      connectivityList: { orderBy: { sortOrder: "asc" } },
      visualTours: {
        where: isPreview ? {} : { publicationState: "PUBLISHED", processingState: "READY" },
        orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      },
    },
  });
  if (!project) return null;

  const parseJson = <T>(val: string | null | undefined, fallback: T): T => {
    if (!val) return fallback;
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  };

  const rawKeyFacts = parseJson<Array<{ labelEn: string; labelAr: string; valueEn: string; valueAr: string; unitEn?: string; unitAr?: string; icon?: string }>>(project.keyFacts, []);
  const rawHighlights = parseJson<Array<{ titleEn: string; titleAr: string; descriptionEn: string; descriptionAr: string; icon?: string; image?: string }>>(project.highlights, []);
  const rawUnitTypes = parseJson<Array<{ id: string; nameEn?: string; nameAr?: string; titleEn?: string; titleAr?: string; areaEn?: string; areaAr?: string; areaRange?: string; areaUnit?: string; finishingEn?: string; finishingAr?: string; paymentEn?: string; paymentAr?: string; paymentPlanEn?: string; paymentPlanAr?: string; image?: string; floorPlanUrl?: string; descriptionEn?: string; descriptionAr?: string }>>(project.unitTypes, []);
  const rawNearby = parseJson<Array<{ nameEn: string; nameAr: string; distanceEn: string; distanceAr: string; type?: string }>>(project.nearbyLocations, []);
  const rawUpdates = parseJson<Array<{ date: string; titleEn: string; titleAr: string; descriptionEn?: string; descriptionAr?: string; imageUrl?: string; isVideo?: boolean }>>(project.constructionUpdates, []);
  const rawGallery = parseJson<string[]>(project.gallery, []);

  // Merge gallery items: if normalized items exist, map them; otherwise use raw gallery
  const galleryUrls = project.galleryItemList && project.galleryItemList.length > 0
    ? project.galleryItemList.map(g => g.imageUrl)
    : (rawGallery.length > 0 ? rawGallery : [project.coverImageUrl]);

  // Key facts: normalized take priority
  const keyFacts = project.keyFactsList && project.keyFactsList.length > 0
    ? project.keyFactsList.map(f => ({
      label: pick(locale, f.labelEn, f.labelAr),
      value: pick(locale, f.valueEn, f.valueAr),
      unit: pick(locale, f.unitEn ?? "", f.unitAr ?? "") || undefined,
      icon: f.icon || undefined,
    }))
    : rawKeyFacts.map((f) => ({
      label: pick(locale, f.labelEn, f.labelAr),
      value: pick(locale, f.valueEn, f.valueAr),
      unit: pick(locale, f.unitEn ?? "", f.unitAr ?? "") || undefined,
      icon: f.icon || undefined,
    }));

  // Highlights: normalized take priority
  const highlights = project.highlightsList && project.highlightsList.length > 0
    ? project.highlightsList.map(h => ({
      title: pick(locale, h.titleEn, h.titleAr),
      description: pick(locale, h.descriptionEn, h.descriptionAr),
      icon: h.icon || undefined,
      image: h.imageUrl || undefined,
    }))
    : rawHighlights.map((h) => ({
      title: pick(locale, h.titleEn, h.titleAr),
      description: pick(locale, h.descriptionEn, h.descriptionAr),
      icon: h.icon,
      image: h.image,
    }));

  // Unit Types: normalized take priority
  const unitTypes = project.unitTypesList && project.unitTypesList.length > 0
    ? project.unitTypesList.map(u => ({
      id: u.id,
      name: pick(locale, u.titleEn, u.titleAr),
      area: u.areaRange || pick(locale, u.areaEn ?? "", u.areaAr ?? "") || (u.areaUnit ? `${u.areaUnit}` : ""),
      areaRange: u.areaRange || undefined,
      areaUnit: u.areaUnit || undefined,
      finishing: pick(locale, u.finishingEn ?? "", u.finishingAr ?? "") || (locale === "ar" ? "تشطيب كامل فندقي" : "Fully Finished"),
      payment: pick(locale, u.paymentPlanEn ?? "", u.paymentPlanAr ?? "") || (locale === "ar" ? "مقدم ١٠٪ والتقسيط حتى ٨ سنوات" : "10% down payment, up to 8 years"),
      description: pick(locale, u.descriptionEn ?? "", u.descriptionAr ?? "") || undefined,
      image: u.imageUrl || undefined,
      floorPlanUrl: u.floorPlanUrl || undefined,
    }))
    : rawUnitTypes.map((u) => ({
      id: u.id,
      name: pick(locale, u.nameEn || u.titleEn || "", u.nameAr || u.titleAr || ""),
      area: u.areaRange || pick(locale, u.areaEn ?? "", u.areaAr ?? "") || "",
      areaRange: u.areaRange,
      areaUnit: u.areaUnit,
      finishing: pick(locale, u.finishingEn ?? "", u.finishingAr ?? "") || (locale === "ar" ? "تشطيب كامل" : "Finished"),
      payment: pick(locale, u.paymentEn ?? u.paymentPlanEn ?? "", u.paymentAr ?? u.paymentPlanAr ?? "") || (locale === "ar" ? "خطط سداد ميسرة" : "Flexible Payment Plans"),
      description: pick(locale, u.descriptionEn ?? "", u.descriptionAr ?? "") || undefined,
      image: u.image,
      floorPlanUrl: u.floorPlanUrl,
    }));

  // Nearby Destinations / Connectivity: normalized take priority
  const nearbyLocations = project.connectivityList && project.connectivityList.length > 0
    ? project.connectivityList.map(c => ({
      name: pick(locale, c.destinationEn, c.destinationAr),
      distance: pick(locale, c.distanceOrDurationEn, c.distanceOrDurationAr),
      type: c.travelType || "CAR",
    }))
    : rawNearby.map((n) => ({
      name: pick(locale, n.nameEn, n.nameAr),
      distance: pick(locale, n.distanceEn, n.distanceAr),
      type: n.type,
    }));

  // Construction Updates: normalized take priority
  const constructionUpdates = project.constructionUpdatesList && project.constructionUpdatesList.length > 0
    ? project.constructionUpdatesList.map(u => ({
      date: u.date ? u.date.toISOString().split("T")[0] : "",
      title: pick(locale, u.titleEn, u.titleAr),
      imageUrl: u.imageUrl || undefined,
      isVideo: u.isVideo,
    }))
    : rawUpdates.map((u) => ({
      date: u.date,
      title: pick(locale, u.titleEn, u.titleAr),
      imageUrl: u.imageUrl,
      isVideo: u.isVideo,
    }));

  // Visual Tours: filter by locale (target === "ALL" or target === locale)
  const visualTours = (project.visualTours || [])
    .filter(t => t.localeTarget === "ALL" || t.localeTarget === locale)
    .map(t => ({
      id: t.id,
      title: pick(locale, t.titleEn, t.titleAr),
      description: pick(locale, t.descriptionEn ?? "", t.descriptionAr ?? "") || undefined,
      extractedPrefix: t.extractedPrefix,
      entryFilePath: t.entryFilePath,
      posterUrl: t.posterUrl || undefined,
      isDefault: t.isDefault,
      localeTarget: t.localeTarget,
      sourceType: t.sourceType,
      assetCount: t.assetCount,
    }));

  const otherPublished = await prisma.project.findMany({
    where: { status: "PUBLISHED", id: { not: project.id } },
    take: 4,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  return {
    ...base,
    project: {
      id: project.id,
      slug: project.slug,
      projectCode: project.projectCode ?? undefined,
      name: pick(locale, project.nameEn, project.nameAr),
      shortDescription: pick(locale, project.shortDescriptionEn, project.shortDescriptionAr),
      fullDescription: pick(locale, project.fullDescriptionEn ?? project.shortDescriptionEn, project.fullDescriptionAr ?? project.shortDescriptionAr),
      heroTitle: pick(locale, project.heroTitleEn ?? project.nameEn, project.heroTitleAr ?? project.nameAr),
      heroDescription: pick(locale, project.heroDescriptionEn ?? project.shortDescriptionEn, project.heroDescriptionAr ?? project.shortDescriptionAr),
      location: pick(locale, project.locationEn, project.locationAr),
      address: pick(locale, project.addressEn ?? project.locationEn, project.addressAr ?? project.locationAr),
      directionsUrl: project.directionsUrl ?? undefined,
      coverImageUrl: project.coverImageUrl,
      coverImageAlt: pick(locale, project.coverImageAltEn, project.coverImageAltAr),
      mobileHeroImageUrl: project.mobileHeroImageUrl ?? undefined,
      heroVideoUrl: project.heroVideoUrl ?? undefined,
      cardImageUrl: project.cardImageUrl ?? undefined,
      gallery: galleryUrls,
      logoUrl: project.logoUrl ?? undefined,
      ctaLabel: pick(locale, project.ctaLabelEn ?? "", project.ctaLabelAr ?? "") || undefined,
      ctaUrl: project.ctaUrl ?? undefined,
      projectType: project.projectType || "Residential",
      progressStatus: project.progressStatus || "Ongoing",
      masterPlanUrl: project.masterPlanUrl ?? undefined,
      brochureUrl: project.brochureUrl ?? undefined,
      videoTourUrl: project.videoTourUrl ?? undefined,
      latitude: project.latitude ?? undefined,
      longitude: project.longitude ?? undefined,
      mapUrl: project.mapUrl ?? (project.latitude && project.longitude ? `https://maps.google.com/?q=${project.latitude},${project.longitude}` : undefined),
      keyFacts,
      highlights,
      unitTypes,
      nearbyLocations,
      constructionUpdates,
      visualTours,
      seoTitle: pick(locale, project.seoTitleEn ?? `${project.nameEn} — Image Developments`, project.seoTitleAr ?? `${project.nameAr} — إيمدج للتطوير العقاري`),
      seoDescription: pick(locale, project.seoDescriptionEn ?? project.shortDescriptionEn, project.seoDescriptionAr ?? project.shortDescriptionAr),
      ogImageUrl: project.ogImageUrl ?? project.coverImageUrl,
      status: project.status,
    },
    otherProjects: otherPublished.map((op) => ({
      id: op.id,
      slug: op.slug,
      name: pick(locale, op.nameEn, op.nameAr),
      location: pick(locale, op.locationEn, op.locationAr),
      image: op.coverImageUrl,
      projectType: op.projectType || "Residential",
    })),
  };
});

export const getCareersPageContent = cache(async (locale: Locale): Promise<CareersPageContent> => {
  const base = await getHomepageContent(locale);
  const home = process.env.DATABASE_URL
    ? await prisma.homepage.findUnique({ where: { id: "homepage" } })
    : null;
  const jobs = process.env.DATABASE_URL
    ? await prisma.careerJob.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
    })
    : [];

  const isAr = locale === "ar";
  const lifeImagesParsed: string[] = (() => {
    try {
      const arr = JSON.parse(home?.careersLifeImages || "[]");
      return Array.isArray(arr) && arr.length > 0 ? arr : [];
    } catch {
      return [];
    }
  })();

  const defaultLifeImages = [
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=85",
  ];

  return {
    ...base,
    careersPage: {
      hero: {
        eyebrow: pick(locale, home?.careersHeroEyebrowEn ?? "Careers at Image", home?.careersHeroEyebrowAr ?? "انضم إلى فريقنا"),
        title: pick(locale, home?.careersHeroTitleEn ?? "Shape places that shape tomorrow.", home?.careersHeroTitleAr ?? "اصنع مستقبلاً يحمل بصمتك."),
        intro: pick(
          locale,
          home?.careersHeroIntroEn ??
          "At Image Developments, we bring together passionate professionals across architecture, engineering, and development to create places with lasting value.",
          home?.careersHeroIntroAr ??
          "في إيمدج للتطوير العقاري، نبحث دائماً عن العقول المبدعة والمهارات المتفردة لنبني معاً مجتمعات استثنائية."
        ),
        image:
          home?.careersHeroImageUrl ||
          "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=88",
      },
      lifeAtImage: {
        eyebrow: pick(locale, home?.careersLifeEyebrowEn ?? "Life at Image", home?.careersLifeEyebrowAr ?? "الحياة في إيمدج"),
        title: pick(
          locale,
          home?.careersLifeTitleEn ?? "An inspiring culture built on craft, collaboration, and growth.",
          home?.careersLifeTitleAr ?? "بيئة عمل ملهمة ترتكز على التعاون والإتقان."
        ),
        body: pick(
          locale,
          home?.careersLifeBodyEn ??
          "We cultivate a collaborative environment where diverse perspectives drive innovation. We empower our team members with meaningful challenges and continuous professional development.",
          home?.careersLifeBodyAr ??
          "نؤمن بأن الابتكار الحقيقي ينبع من بيئة تقدّر الأفكار وتدعم التطوير المهني المستمر. نلتزم بتوفير مساحة محفزة للإبداع والنمو."
        ),
        images: lifeImagesParsed.length > 0 ? lifeImagesParsed : defaultLifeImages,
      },
      jobs: jobs.map((j) => ({
        id: j.id,
        slug: j.slug,
        title: pick(locale, j.titleEn, j.titleAr),
        department: pick(locale, j.departmentEn, j.departmentAr),
        location: pick(locale, j.locationEn, j.locationAr),
        description: pick(locale, j.descriptionEn, j.descriptionAr),
        requirements: pick(locale, j.requirementsEn, j.requirementsAr),
      })),
      seoTitle: isAr ? "الوظائف والفرص المهنية — إيمدج للتطوير العقاري" : "Careers & Opportunities — Image Developments",
      seoDescription: isAr
        ? "استكشف الفرص الوظيفية المتاحة في إيمدج للتطوير العقاري وانضم إلى فريقنا."
        : "Explore career opportunities at Image Developments and join our multidisciplinary team.",
    },
  };
});

export const getNewsPageContent = cache(async (locale: Locale): Promise<NewsPageContent> => {
  const base = await getHomepageContent(locale);
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const isAr = locale === "ar";

  let settings = null;
  if (process.env.DATABASE_URL) {
    try {
      settings = await prisma.journalPageSettings.findUnique({ where: { id: "journal" } });
    } catch {
      settings = null;
    }
  }

  const articles = process.env.DATABASE_URL
    ? await prisma.newsArticle.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publicationDate: "desc" }],
    })
    : [];

  const cleanAuthor = (en?: string | null, ar?: string | null): string | undefined => {
    const raw = pick(locale, en || "", ar || "").trim();
    if (!raw || /^(SYSTEM\s*ADMIN|ADMIN|ADMINISTRATOR)$/i.test(raw)) return undefined;
    return raw;
  };

  const allStories: NewsStoryItem[] = articles.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: pick(locale, a.titleEn, a.titleAr),
    excerpt: pick(locale, a.excerptEn, a.excerptAr),
    date: fmt.format(a.publicationDate),
    rawDate: a.publicationDate.toISOString(),
    image: a.coverImageUrl,
    alt: pick(locale, a.coverImageAltEn, a.coverImageAltAr) || pick(locale, a.titleEn, a.titleAr),
    category: a.category || "NEWS",
    projectId: a.projectId ?? undefined,
    author: cleanAuthor(a.authorEn, a.authorAr),
    focalPoint: a.focalPoint || "center",
  }));

  // Determine featured story:
  // 1. settings.featuredArticleId
  // 2. an article with a.featured === true
  // 3. latest published article fallback
  let featuredStory: NewsStoryItem | undefined = undefined;
  if (settings?.featuredArticleId) {
    featuredStory = allStories.find((s) => s.id === settings.featuredArticleId);
  }
  if (!featuredStory) {
    const featuredInDb = articles.find((a) => a.featured);
    if (featuredInDb) {
      featuredStory = allStories.find((s) => s.id === featuredInDb.id);
    }
  }
  if (!featuredStory && allStories.length > 0) {
    featuredStory = allStories[0];
  }

  // Sidebar articles
  const sidebarCount = settings?.sidebarItemCount ?? 5;
  let sidebarArticles: NewsStoryItem[] = [];
  if (settings?.sidebarMode === "MANUAL" && settings.sidebarArticleIds) {
    try {
      const parsedIds = JSON.parse(settings.sidebarArticleIds) as string[];
      if (Array.isArray(parsedIds) && parsedIds.length > 0) {
        sidebarArticles = parsedIds
          .map((id) => allStories.find((s) => s.id === id))
          .filter((s): s is NewsStoryItem => !!s);
      }
    } catch {
      sidebarArticles = [];
    }
  }
  if (sidebarArticles.length === 0) {
    // Automatic latest published articles
    sidebarArticles = allStories.slice(0, sidebarCount);
  }

  // Unique categories
  const standardCats = ["NEWS", "EVENTS", "CONSTRUCTION"];
  const dynamicCats = Array.from(new Set(allStories.map((s) => s.category).filter(Boolean)));
  const combinedCats = Array.from(new Set([...standardCats, ...dynamicCats]));

  const heroTitle = settings
    ? pick(locale, settings.titleEn, settings.titleAr)
    : (isAr ? "يوميات إيمدج" : "Journal");

  const heroIntro = settings
    ? pick(locale, settings.introEn, settings.introAr)
    : (isAr
      ? "تابع أحدث المستجدات، الفعاليات وتطورات البناء في مجتمعات إيمدج للتطوير العقاري."
      : "Follow milestones, architecture, events, and construction progress across Image destinations.");

  const heroImage = settings?.heroImageUrl || undefined;
  const heroAlt = settings ? pick(locale, settings.heroImageAltEn || "", settings.heroImageAltAr || "") : undefined;

  return {
    ...base,
    newsPage: {
      hero: {
        eyebrow: isAr ? "يوميات إيمدج" : "Image Journal",
        title: heroTitle,
        intro: heroIntro,
        image: heroImage,
        alt: heroAlt,
        focalPoint: settings?.heroFocalPoint || "center",
      },
      featuredStory,
      allStories,
      sidebar: {
        enabled: settings?.sidebarEnabled ?? true,
        heading: settings
          ? pick(locale, settings.sidebarHeadingEn, settings.sidebarHeadingAr)
          : (isAr ? "أحدث المقالات" : "Recent Articles"),
        articles: sidebarArticles.slice(0, sidebarCount),
      },
      categories: combinedCats,
      articlesPerPage: settings?.articlesPerPage ?? 6,
      closingCta: {
        enabled: settings?.closingCtaEnabled ?? true,
        heading: settings
          ? pick(locale, settings.closingCtaHeadingEn, settings.closingCtaHeadingAr)
          : (isAr ? "اكتشف مجتمعاتنا السكنية" : "Discover Our Living Communities"),
        text: settings
          ? pick(locale, settings.closingCtaTextEn, settings.closingCtaTextAr)
          : (isAr
            ? "استكشف وجهاتنا المطورة بعناية في مصر أو تواصل مع مستشارينا العقاريين."
            : "Explore our master-planned destinations across Egypt or speak with our property advisors."),
        buttonLabel: settings
          ? pick(locale, settings.closingCtaButtonEn, settings.closingCtaButtonAr)
          : (isAr ? "استكشف مشاريعنا" : "Explore Our Projects"),
        buttonLink: settings?.closingCtaLink || "/projects",
        secondary: settings?.closingCtaSecondary ?? true,
      },
      seoTitle: settings
        ? pick(locale, settings.seoTitleEn, settings.seoTitleAr)
        : (isAr ? "الأخبار والمقالات — إيمدج للتطوير العقاري" : "Journal & News — Image Developments"),
      seoDescription: settings
        ? pick(locale, settings.seoDescriptionEn, settings.seoDescriptionAr)
        : (isAr
          ? "اطلع على أحدث المقالات والأخبار وتحديثات البناء من إيمدج للتطوير العقاري."
          : "Discover the latest insights, announcements, and progress updates from Image Developments."),
    },
  };
});

export const getNewsDetailContent = cache(async (locale: Locale, slug: string, isPreview = false): Promise<NewsDetailPageContent | null> => {
  const base = await getHomepageContent(locale);
  if (!process.env.DATABASE_URL) return null;
  const article = await prisma.newsArticle.findFirst({
    where: { slug, ...(isPreview ? {} : { status: "PUBLISHED" }) },
  });
  if (!article) return null;
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const longFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  const cleanAuthor = (en?: string | null, ar?: string | null): string | undefined => {
    const raw = pick(locale, en || "", ar || "").trim();
    if (!raw || /^(SYSTEM\s*ADMIN|ADMIN|ADMINISTRATOR)$/i.test(raw)) return undefined;
    return raw;
  };

  // Fetch related project if associated
  let relatedProject: NewsDetailPageContent["article"]["relatedProject"] = null;
  if (article.projectId) {
    try {
      const proj = await prisma.project.findFirst({
        where: { id: article.projectId, status: "PUBLISHED" },
      });
      if (proj) {
        relatedProject = {
          id: proj.id,
          slug: proj.slug,
          name: pick(locale, proj.nameEn, proj.nameAr),
          location: pick(locale, proj.locationEn, proj.locationAr),
          projectType: proj.projectType,
          progressStatus: proj.progressStatus,
          shortDescription: pick(locale, proj.shortDescriptionEn, proj.shortDescriptionAr),
          image: proj.coverImageUrl,
          imageAlt: pick(locale, proj.coverImageAltEn, proj.coverImageAltAr) || pick(locale, proj.nameEn, proj.nameAr),
          focalPoint: proj.coverImageFocalPoint || "center",
          status: proj.status,
        };
      }
    } catch {
      relatedProject = null;
    }
  }

  // Related articles: manual selection first, then smart fallback
  let relatedArticles: Array<typeof article> = [];
  const selectedIds: string[] = [];

  if (article.relatedArticleIds) {
    try {
      const parsed = JSON.parse(article.relatedArticleIds) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const found = await prisma.newsArticle.findMany({
          where: { id: { in: parsed, not: article.id }, status: "PUBLISHED" },
        });
        relatedArticles = found;
        found.forEach((f) => selectedIds.push(f.id));
      }
    } catch {
      relatedArticles = [];
    }
  }

  // Fallback 1: Articles linked to the same project
  if (relatedArticles.length < 3 && article.projectId) {
    const exclude = [article.id, ...selectedIds];
    const sameProject = await prisma.newsArticle.findMany({
      where: {
        status: "PUBLISHED",
        projectId: article.projectId,
        id: { notIn: exclude },
      },
      take: 3 - relatedArticles.length,
      orderBy: { publicationDate: "desc" },
    });
    sameProject.forEach((p) => {
      relatedArticles.push(p);
      selectedIds.push(p.id);
    });
  }

  // Fallback 2: Articles with the same category
  if (relatedArticles.length < 3) {
    const exclude = [article.id, ...selectedIds];
    const sameCategory = await prisma.newsArticle.findMany({
      where: {
        status: "PUBLISHED",
        category: article.category,
        id: { notIn: exclude },
      },
      take: 3 - relatedArticles.length,
      orderBy: { publicationDate: "desc" },
    });
    sameCategory.forEach((c) => {
      relatedArticles.push(c);
      selectedIds.push(c.id);
    });
  }

  // Fallback 3: Latest published articles
  if (relatedArticles.length < 3) {
    const exclude = [article.id, ...selectedIds];
    const recent = await prisma.newsArticle.findMany({
      where: {
        status: "PUBLISHED",
        id: { notIn: exclude },
      },
      take: 3 - relatedArticles.length,
      orderBy: { publicationDate: "desc" },
    });
    recent.forEach((r) => {
      relatedArticles.push(r);
      selectedIds.push(r.id);
    });
  }

  const rawBodyText = pick(locale, article.contentEn, article.contentAr) || pick(locale, article.excerptEn, article.excerptAr);
  const readingTime = calculateReadingTime(rawBodyText, locale);

  const coverCaption = pick(locale, article.coverCaptionEn || "", article.coverCaptionAr || "") || undefined;
  const coverCredit = pick(locale, article.coverCreditEn || "", article.coverCreditAr || "") || undefined;

  let galleryItems: string[] = [];
  if (article.gallery) {
    try {
      const parsedG = JSON.parse(article.gallery);
      if (Array.isArray(parsedG)) galleryItems = parsedG;
    } catch {
      galleryItems = [];
    }
  }

  const cta = article.ctaEnabled
    ? {
      enabled: true,
      heading:
        pick(locale, article.ctaHeadingEn || "", article.ctaHeadingAr || "") ||
        (locale === "ar" ? "سجل اهتمامك" : "Register Your Interest"),
      text:
        pick(locale, article.ctaTextEn || "", article.ctaTextAr || "") ||
        (locale === "ar"
          ? "تواصل مع مستشارينا العقاريين لاكتشاف فرص السكن والاستثمار."
          : "Speak with our property advisors to explore living and investment opportunities."),
      buttonLabel:
        pick(locale, article.ctaButtonEn || "", article.ctaButtonAr || "") ||
        (locale === "ar" ? "سجل الآن" : "Register Interest"),
      buttonLink: article.ctaLink || undefined,
      actionType: (article.ctaActionType === "LINK" && article.ctaLink ? "LINK" : "ENQUIRY") as "ENQUIRY" | "LINK",
    }
    : undefined;

  // --- Sidebar Projects (Other Projects on Physical Left) ---
  const sidebarEnabled = article.sidebarProjectsEnabled ?? true;
  const sidebarProjectsList: SidebarProjectCard[] = [];
  const maxProjectsCount = Math.min(
    Math.max(article.sidebarProjectsCount ?? 3, 2),
    4
  );

  if (sidebarEnabled) {
    const excludedProjectIds = article.projectId ? [article.projectId] : [];

    if (article.sidebarProjectsMode === "MANUAL") {
      let manualIds: string[] = [];
      try {
        if (article.sidebarProjectIds) {
          const parsed = JSON.parse(article.sidebarProjectIds);
          if (Array.isArray(parsed)) {
            manualIds = parsed.filter(
              (id: string) => !excludedProjectIds.includes(id)
            );
          }
        }
      } catch {
        manualIds = [];
      }

      if (manualIds.length > 0) {
        const manualProjects = await prisma.project.findMany({
          where: {
            id: { in: manualIds },
            status: "PUBLISHED",
          },
        });
        const projectMap = new Map(manualProjects.map((p) => [p.id, p]));
        manualIds.forEach((id) => {
          const p = projectMap.get(id);
          if (p && sidebarProjectsList.length < maxProjectsCount) {
            sidebarProjectsList.push({
              id: p.id,
              slug: p.slug,
              name: pick(locale, p.nameEn, p.nameAr),
              location: pick(locale, p.locationEn, p.locationAr),
              projectType: p.projectType,
              progressStatus: p.progressStatus,
              image: p.coverImageUrl,
              imageAlt:
                pick(locale, p.coverImageAltEn, p.coverImageAltAr) ||
                pick(locale, p.nameEn, p.nameAr),
              focalPoint: p.coverImageFocalPoint || "center",
              href: `/${locale}/projects/${p.slug}`,
            });
          }
        });
      }
    }

    // Auto mode or fallback to fill remaining slots
    if (sidebarProjectsList.length < maxProjectsCount) {
      const alreadyIds = [
        ...excludedProjectIds,
        ...sidebarProjectsList.map((p) => p.id),
      ];
      const autoProjects = await prisma.project.findMany({
        where: {
          status: "PUBLISHED",
          id: { notIn: alreadyIds },
        },
        orderBy: [
          { featured: "desc" },
          { featuredOrder: "asc" },
          { updatedAt: "desc" },
        ],
        take: maxProjectsCount - sidebarProjectsList.length,
      });

      autoProjects.forEach((p) => {
        sidebarProjectsList.push({
          id: p.id,
          slug: p.slug,
          name: pick(locale, p.nameEn, p.nameAr),
          location: pick(locale, p.locationEn, p.locationAr),
          projectType: p.projectType,
          progressStatus: p.progressStatus,
          image: p.coverImageUrl,
          imageAlt:
            pick(locale, p.coverImageAltEn, p.coverImageAltAr) ||
            pick(locale, p.nameEn, p.nameAr),
          focalPoint: p.coverImageFocalPoint || "center",
          href: `/${locale}/projects/${p.slug}`,
        });
      });
    }
  }

  const sidebarProjects: SidebarProjectsConfig = {
    enabled: sidebarEnabled && sidebarProjectsList.length > 0,
    heading:
      pick(
        locale,
        article.sidebarProjectsHeadingEn || "",
        article.sidebarProjectsHeadingAr || ""
      ) || (locale === "ar" ? "مشروعات أخرى" : "Other Projects"),
    mode: (article.sidebarProjectsMode === "MANUAL" ? "MANUAL" : "AUTO") as
      | "AUTO"
      | "MANUAL",
    projects: sidebarProjectsList,
    showLocation: article.sidebarShowLocation ?? true,
    showType: article.sidebarShowType ?? true,
    showStatus: article.sidebarShowStatus ?? true,
    viewAllLabel:
      pick(
        locale,
        article.sidebarViewAllLabelEn || "",
        article.sidebarViewAllLabelAr || ""
      ) || (locale === "ar" ? "عرض جميع المشروعات" : "View All Projects"),
    viewAllHref: `/${locale}/projects`,
  };

  return {
    ...base,
    article: {
      id: article.id,
      slug: article.slug,
      title: pick(locale, article.titleEn, article.titleAr),
      excerpt: pick(locale, article.excerptEn, article.excerptAr),
      content: pick(locale, article.contentEn, article.contentAr),
      date: longFmt.format(article.publicationDate),
      rawDate: article.publicationDate.toISOString(),
      constructionDate: article.constructionDate ? longFmt.format(article.constructionDate) : undefined,
      rawConstructionDate: article.constructionDate?.toISOString(),
      image: article.coverImageUrl,
      alt: pick(locale, article.coverImageAltEn, article.coverImageAltAr) || pick(locale, article.titleEn, article.titleAr),
      category: article.category || "NEWS",
      projectId: article.projectId ?? undefined,
      author: cleanAuthor(article.authorEn, article.authorAr),
      focalPoint: article.focalPoint || "center",
      status: article.status,
      readingTime,
      coverCaption,
      coverCredit,
      showRelatedProject: article.showRelatedProject ?? true,
      showTableOfContents: article.showTableOfContents ?? false,
      videoUrl: article.videoUrl || undefined,
      gallery: galleryItems,
      cta,
      relatedProject,
    },
    relatedStories: relatedArticles.slice(0, 3).map((r) => ({
      id: r.id,
      slug: r.slug,
      title: pick(locale, r.titleEn, r.titleAr),
      excerpt: pick(locale, r.excerptEn, r.excerptAr),
      date: fmt.format(r.publicationDate),
      rawDate: r.publicationDate.toISOString(),
      image: r.coverImageUrl,
      alt: pick(locale, r.coverImageAltEn, r.coverImageAltAr) || pick(locale, r.titleEn, r.titleAr),
      category: r.category || "NEWS",
      projectId: r.projectId ?? undefined,
      author: cleanAuthor(r.authorEn, r.authorAr),
      focalPoint: r.focalPoint || "center",
    })),
    sidebarProjects,
  };
});

export const getAboutPageContent = cache(async (locale: Locale): Promise<AboutPageContent> => {
  const base = await getHomepageContent(locale);
  if (!process.env.DATABASE_URL) return {
    ...base,
    aboutPage: {
      hero: {
        enabled: true,
        eyebrow: locale === "ar" ? "عن إيمدج" : "About Image",
        title: locale === "ar" ? "نصنع أماكن تتمحور حول الحياة التي تحتضنها." : "We shape places around the lives they hold.",
        body: locale === "ar" ? "نؤمن بأن التطوير الجيد يبدأ بالناس ويتطور مع المكان." : "We believe thoughtful development begins with people and grows from a deep understanding of place.",
        image: base.hero.image,
        alt: base.hero.alt ?? "Image Developments community",
        ctaLabel: locale === "ar" ? "اكتشف رحلتنا" : "Explore Our Journey",
      },
      whoWeAre: {
        enabled: true,
        eyebrow: locale === "ar" ? "من نحن" : "Who We Are",
        title: locale === "ar" ? "صناعة مجتمعات متكاملة ومدروسة في مصر" : "Shaping Considered Communities Across Egypt",
        body: locale === "ar" ? "تصنع إيمدج للتطوير العقاري مجتمعات مدروسة تتكامل فيها العمارة والطبيعة وتجربة الحياة اليومية. نبتكر وجهات ترتقي بأسلوب الحياة اليومي، وتصنع روابط تحول الجيران إلى مجتمعات متماسكة ومستدامة." : "Image Developments creates considered communities where architecture, landscape, and everyday experience belong together. We craft destinations that elevate daily life, fostering connections that turn neighbours into enduring communities.",
        approach: locale === "ar" ? "من المخطط العام الأول إلى أصغر تفصيلة في المساحات المشتركة، يوحد نهجنا بين التصميم المتمحور حول الإنسان، والهندسة المستدامة، والحرفية المعمارية لتقديم وجهات ذات قيمة دائمة." : "From the first masterplan to the smallest shared space, our approach unites human-centered design, sustainable engineering, and architectural craftsmanship to deliver places of lasting value.",
        image: base.lifestyle.image,
        alt: locale === "ar" ? "مجتمع معماري متكامل من إيمدج للتطوير العقاري" : "Image Developments architectural community",
        primaryCtaLabel: locale === "ar" ? "استكشف مشاريعنا" : "Explore Our Projects",
        primaryCtaUrl: `/${locale}/projects`,
        brochureCtaLabel: locale === "ar" ? "تحميل البروشور" : "Download Brochure",
      },
      visionMission: {
        enabled: true,
        visionEyebrow: locale === "ar" ? "رؤيتنا" : "Our Vision",
        visionTitle: locale === "ar" ? "إعادة تعريف أسلوب الحياة العصري من خلال العمارة والطبيعة" : "Redefining Modern Living Through Architecture & Nature",
        visionBody: locale === "ar" ? "أن نكون المطور العقاري الأكثر تميزاً وابتكاراً في مصر، عبر ابتكار وجهات استثنائية تستجيب فيها العمارة لاحتياجات الإنسان، وتمنح الطبيعة نبضاً للحياة اليومية، وتزدهر فيها المجتمعات عبر الأجيال." : "To be Egypt's most thoughtful developer, recognized for creating enduring destinations where architecture responds to human emotion, landscape breathes life into daily routines, and communities flourish across generations.",
        missionEyebrow: locale === "ar" ? "رسالتنا" : "Our Mission",
        missionTitle: locale === "ar" ? "ابتكار مساحات مستدامة تصنعها الرؤية الواضحة والنزاهة" : "Crafting Enduring Spaces with Purpose and Integrity",
        missionBody: locale === "ar" ? "تصميم وتسليم وجهات عمرانية ومخططات متكاملة تتناغم فيها الكتلة المعمارية مع الطبيعة المنفتحة، ملتزمين بأعلى معايير الحرفية المعمارية، والبنية التحتية المستدامة، والقيمة المجتمعية طويلة الأمد." : "To design and deliver master-planned destinations that harmonize built form with open landscape, adhering to the highest standards of architectural craft, sustainable infrastructure, and long-term community value.",
        image: base.hero.image,
        alt: locale === "ar" ? "الرؤية والحرفية في إيمدج للتطوير العقاري" : "Image Developments vision and craft",
        ctaLabel: locale === "ar" ? "استكشف مشاريعنا" : "Explore Our Projects",
        ctaUrl: `/${locale}/projects`,
      },
      achievements: {
        enabled: true,
        eyebrow: locale === "ar" ? "إنجازاتنا" : "Our Achievements",
        title: locale === "ar" ? "سجل حافل من التميز والإنجاز المعماري" : "A Proven Track Record of Architectural Excellence",
        description: locale === "ar" ? "ما يقارب عقدين من التطوير المدروس في أنحاء مصر، مقدمين مخططات عمرانية رائدة ووجهات سكنية وتجارية تدوم." : "Nearly two decades of thoughtful development across Egypt, delivering transformative masterplans and enduring destinations.",
        ctaLabel: locale === "ar" ? "استعرض سجل إنجازاتنا" : "View Our Track Record",
        ctaUrl: `/${locale}/projects`,
      },
      leadership: {
        enabled: true,
        eyebrow: locale === "ar" ? "القيادة التنفيذية" : "Executive Leadership",
        title: locale === "ar" ? "الرؤية والخبرة وراء مسيرة إيمدج" : "The Vision and Expertise Behind Image",
        description: locale === "ar" ? "يجمع فريق قيادتنا متعدد التخصصات عقوداً من الخبرة في العمارة، والتخطيط العمراني، والهندسة، والتطوير العقاري المستدام." : "Our multidisciplinary leadership team brings together decades of expertise in architecture, urban planning, engineering, and sustainable development.",
        ctaLabel: locale === "ar" ? "تواصل مع فريقنا" : "Contact Our Team",
        ctaUrl: `/${locale}/contact`,
        members: [],
      },
      blocks: [],
    },
  };

  const home = await prisma.homepage.findUnique({
    where: { id: "homepage" },
    include: {
      aboutContentBlocks: { orderBy: { sortOrder: "asc" } },
      teamMembers: { where: { visible: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!home) throw new Error("CMS is not seeded. Run `pnpm db:seed`.");

  return {
    ...base,
    aboutPage: {
      hero: {
        enabled: home.aboutHeroEnabled,
        eyebrow: pick(locale, home.aboutHeroEyebrowEn, home.aboutHeroEyebrowAr),
        title: pick(locale, home.aboutHeroTitleEn, home.aboutHeroTitleAr),
        body: pick(locale, home.aboutHeroBodyEn, home.aboutHeroBodyAr),
        image: home.aboutHeroImageUrl ?? base.hero.image,
        alt: pick(locale, home.aboutHeroImageAltEn, home.aboutHeroImageAltAr),
        ctaLabel: pick(locale, home.aboutHeroCtaLabelEn ?? "Explore Our Journey", home.aboutHeroCtaLabelAr ?? "اكتشف رحلتنا"),
      },
      whoWeAre: {
        enabled: home.aboutWhoWeAreEnabled,
        eyebrow: pick(locale, home.aboutWhoWeAreEyebrowEn, home.aboutWhoWeAreEyebrowAr),
        title: pick(locale, home.aboutWhoWeAreTitleEn, home.aboutWhoWeAreTitleAr),
        body: pick(locale, home.aboutWhoWeAreBodyEn, home.aboutWhoWeAreBodyAr),
        approach: pick(locale, home.aboutWhoWeAreApproachEn ?? "", home.aboutWhoWeAreApproachAr ?? "") || undefined,
        image: home.aboutWhoWeAreImageUrl ?? base.lifestyle.image,
        alt: pick(locale, home.aboutWhoWeAreImageAltEn ?? "", home.aboutWhoWeAreImageAltAr ?? "") || undefined,
        primaryCtaLabel: pick(locale, home.aboutWhoWeArePrimaryCtaEn ?? (locale === "ar" ? "استكشف مشاريعنا" : "Explore Our Projects"), home.aboutWhoWeArePrimaryCtaAr ?? "استكشف مشاريعنا"),
        primaryCtaUrl: home.aboutWhoWeArePrimaryCtaUrl || `/${locale}/projects`,
        brochureCtaLabel: pick(locale, home.aboutWhoWeAreBrochureCtaEn ?? (locale === "ar" ? "تحميل البروشور" : "Download Brochure"), home.aboutWhoWeAreBrochureCtaAr ?? "تحميل البروشور"),
      },
      visionMission: {
        enabled: home.aboutVisionMissionEnabled,
        visionEyebrow: pick(locale, home.aboutVisionEyebrowEn, home.aboutVisionEyebrowAr),
        visionTitle: pick(locale, home.aboutVisionTitleEn, home.aboutVisionTitleAr),
        visionBody: pick(locale, home.aboutVisionBodyEn, home.aboutVisionBodyAr),
        missionEyebrow: pick(locale, home.aboutMissionEyebrowEn, home.aboutMissionEyebrowAr),
        missionTitle: pick(locale, home.aboutMissionTitleEn, home.aboutMissionTitleAr),
        missionBody: pick(locale, home.aboutMissionBodyEn, home.aboutMissionBodyAr),
        image: home.aboutVisionMissionImageUrl ?? base.hero.image,
        alt: pick(locale, home.aboutVisionMissionImageAltEn ?? "", home.aboutVisionMissionImageAltAr ?? "") || undefined,
        ctaLabel: pick(locale, home.aboutVisionMissionCtaEn ?? (locale === "ar" ? "استكشف مشاريعنا" : "Explore Our Projects"), home.aboutVisionMissionCtaAr ?? "استكشف مشاريعنا"),
        ctaUrl: home.aboutVisionMissionCtaUrl || `/${locale}/projects`,
      },
      achievements: {
        enabled: home.aboutAchievementsEnabled,
        eyebrow: pick(locale, home.aboutAchievementsEyebrowEn, home.aboutAchievementsEyebrowAr),
        title: pick(locale, home.aboutAchievementsTitleEn, home.aboutAchievementsTitleAr),
        description: pick(locale, home.aboutAchievementsDescriptionEn ?? "", home.aboutAchievementsDescriptionAr ?? ""),
        ctaLabel: pick(locale, home.aboutAchievementsCtaEn ?? (locale === "ar" ? "استعرض سجل إنجازاتنا" : "View Our Track Record"), home.aboutAchievementsCtaAr ?? "استعرض سجل إنجازاتنا"),
        ctaUrl: home.aboutAchievementsCtaUrl || `/${locale}/projects`,
      },
      leadership: {
        enabled: home.aboutLeadershipEnabled,
        eyebrow: pick(locale, home.aboutLeadershipEyebrowEn, home.aboutLeadershipEyebrowAr),
        title: pick(locale, home.aboutLeadershipTitleEn, home.aboutLeadershipTitleAr),
        description: pick(locale, home.aboutLeadershipDescriptionEn ?? "", home.aboutLeadershipDescriptionAr ?? ""),
        ctaLabel: pick(locale, home.aboutLeadershipCtaEn ?? (locale === "ar" ? "تواصل مع فريقنا" : "Contact Our Team"), home.aboutLeadershipCtaAr ?? "تواصل مع فريقنا"),
        ctaUrl: home.aboutLeadershipCtaUrl || `/${locale}/contact`,
        members: home.teamMembers.map(member => ({
          id: member.id,
          name: pick(locale, member.nameEn, member.nameAr),
          role: pick(locale, member.roleEn, member.roleAr),
          bio: pick(locale, member.bioEn, member.bioAr),
          image: member.imageUrl,
          alt: pick(locale, member.imageAltEn, member.imageAltAr),
        })),
      },
      blocks: home.aboutContentBlocks.map(block => ({
        id: block.id,
        enabled: block.enabled,
        eyebrow: pick(locale, block.eyebrowEn, block.eyebrowAr),
        title: pick(locale, block.titleEn, block.titleAr),
        body: pick(locale, block.bodyEn, block.bodyAr),
        image: block.imageUrl ?? undefined,
        alt: pick(locale, block.imageAltEn ?? "", block.imageAltAr ?? "") || undefined,
      })),
    },
  };
});

export const getTeamPageContent = cache(async (locale: Locale): Promise<TeamPageContent> => {
  const base = await getHomepageContent(locale);
  if (!process.env.DATABASE_URL) return { ...base, teamPage: { eyebrow: locale === "ar" ? "الفريق وراء إيمدج" : "The people behind Image", title: locale === "ar" ? "منظورات مختلفة. رؤية واحدة." : "Different perspectives. One shared vision.", intro: locale === "ar" ? "تعرف على الأشخاص الذين يصنعون أماكن مدروسة." : "Meet the people shaping thoughtful places for how Egypt lives next.", members: [] } };
  const home = await prisma.homepage.findUnique({ where: { id: "homepage" }, include: { teamMembers: { where: { visible: true }, orderBy: { sortOrder: "asc" } } } });
  if (!home) throw new Error("CMS is not seeded. Run `pnpm db:seed`.");
  return { ...base, teamPage: { eyebrow: pick(locale, home.teamEyebrowEn, home.teamEyebrowAr), title: pick(locale, home.teamTitleEn, home.teamTitleAr), intro: pick(locale, home.teamIntroEn, home.teamIntroAr), members: home.teamMembers.map(member => ({ id: member.id, name: pick(locale, member.nameEn, member.nameAr), role: pick(locale, member.roleEn, member.roleAr), bio: pick(locale, member.bioEn, member.bioAr), image: member.imageUrl, alt: pick(locale, member.imageAltEn, member.imageAltAr) })) } };
});

export const getPartnersPageContent = cache(async (locale: Locale): Promise<PartnersPageContent> => {
  const base = await getHomepageContent(locale);
  if (!process.env.DATABASE_URL) return { ...base, partnersPage: { eyebrow: locale === "ar" ? "شركاؤنا" : "Our partners", title: locale === "ar" ? "نبني معاً. لنصنع أثراً يدوم." : "Built together. Made to last.", intro: locale === "ar" ? "شراكات مدروسة تصنع أماكن ذات قيمة دائمة." : "Thoughtful collaborations that create places with lasting value.", partners: [] } };
  const home = await prisma.homepage.findUnique({ where: { id: "homepage" }, include: { partners: { where: { visible: true }, orderBy: { sortOrder: "asc" } } } });
  if (!home) throw new Error("CMS is not seeded. Run `pnpm db:seed`.");
  return { ...base, partnersPage: { eyebrow: pick(locale, home.partnersEyebrowEn, home.partnersEyebrowAr), title: pick(locale, home.partnersTitleEn, home.partnersTitleAr), intro: pick(locale, home.partnersIntroEn, home.partnersIntroAr), partners: home.partners.map(partner => ({ id: partner.id, name: pick(locale, partner.nameEn, partner.nameAr), description: pick(locale, partner.descriptionEn ?? "", partner.descriptionAr ?? "") || undefined, logo: partner.logoUrl, alt: pick(locale, partner.logoAltEn, partner.logoAltAr), website: partner.websiteUrl ?? undefined })) } };
});

export const getPolicyPageContent = cache(async (locale: Locale): Promise<PolicyPageContent> => {
  const base = await getHomepageContent(locale);
  if (!process.env.DATABASE_URL) return { ...base, policyPage: { eyebrow: locale === "ar" ? "سياستنا" : "Our policy", title: locale === "ar" ? "مبادئ واضحة لكل تعامل." : "Clear principles for every interaction.", intro: locale === "ar" ? "توضح هذه الصفحة سياستنا الحالية." : "This page explains our current policy.", lastUpdated: "", seoTitle: locale === "ar" ? "السياسة — إيمدج للتطوير العقاري" : "Policy — Image Developments", seoDescription: locale === "ar" ? "اطلع على سياستنا الحالية." : "Read our current policy.", sections: [] } };
  const policy = await prisma.policyPage.findUnique({ where: { id: "policypage" }, include: { documents: { where: { visible: true }, orderBy: { sortOrder: "asc" } } } });
  if (!policy) throw new Error("Policy CMS content is not seeded. Run the latest database migration.");
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  const title = pick(locale, policy.heroTitleEn, policy.heroTitleAr); const intro = pick(locale, policy.heroBodyEn, policy.heroBodyAr); const latest = policy.documents.reduce((date, item) => item.updatedAt > date ? item.updatedAt : date, policy.updatedAt);
  return { ...base, policyPage: { eyebrow: pick(locale, policy.heroEyebrowEn, policy.heroEyebrowAr), title, intro, lastUpdated: fmt.format(latest), seoTitle: `${title} — Image Developments`, seoDescription: intro, sections: policy.documents.map(document => ({ id: document.slug, title: pick(locale, document.titleEn, document.titleAr), body: [pick(locale, document.summaryEn, document.summaryAr), pick(locale, document.contentEn, document.contentAr)].filter(Boolean).join("\n\n") })) } };
});

export const getTermsPageContent = cache(async (locale: Locale): Promise<TermsPageContent> => {
  const base = await getHomepageContent(locale);
  if (!process.env.DATABASE_URL) return { ...base, termsPage: { eyebrow: locale === "ar" ? "الشروط" : "Terms", title: locale === "ar" ? "شروط الاستخدام" : "Terms of use", intro: locale === "ar" ? "سيتم نشر الشروط المعتمدة هنا." : "Approved terms will be published here.", lastUpdated: "", seoTitle: locale === "ar" ? "الشروط — إيمدج للتطوير العقاري" : "Terms — Image Developments", seoDescription: locale === "ar" ? "شروط استخدام الموقع." : "Website terms of use.", sections: [] } };
  const terms = await prisma.termsPage.findUnique({ where: { id: "termspage" }, include: { sections: { where: { visible: true }, orderBy: { sortOrder: "asc" } } } });
  if (!terms) throw new Error("Terms CMS content is not seeded. Run the latest database migration.");
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  const title = pick(locale, terms.heroTitleEn, terms.heroTitleAr); const intro = pick(locale, terms.heroBodyEn, terms.heroBodyAr); const latest = terms.sections.reduce((date, item) => item.updatedAt > date ? item.updatedAt : date, terms.updatedAt);
  return { ...base, termsPage: { eyebrow: pick(locale, terms.heroEyebrowEn, terms.heroEyebrowAr), title, intro, lastUpdated: fmt.format(latest), seoTitle: `${title} — Image Developments`, seoDescription: intro, sections: terms.sections.map(section => ({ id: section.slug, title: pick(locale, section.titleEn, section.titleAr), body: pick(locale, section.contentEn, section.contentAr) })) } };
});

export const getHistoryPageContent = cache(async (locale: Locale): Promise<HistoryPageContent> => getAboutPageContent(locale));

export const getContactPageContent = cache(async (locale: Locale): Promise<ContactPageContent> => {
  const base = await getHomepageContent(locale);
  if (!process.env.DATABASE_URL) return { ...base, contactPage: { eyebrow: locale === "ar" ? "تواصل معنا" : "Contact us", title: locale === "ar" ? "ابدأ حواراً معنا." : "Start a conversation.", intro: locale === "ar" ? "أخبرنا كيف يمكننا مساعدتك." : "Tell us how we can help.", seoTitle: locale === "ar" ? "تواصل معنا — إيمدج للتطوير العقاري" : "Contact us — Image Developments", seoDescription: locale === "ar" ? "تواصل مع فريق إيمدج." : "Contact the Image Developments team." } };
  const page = await prisma.contactPage.findUnique({ where: { id: "contactpage" } }); if (!page) throw new Error("Contact CMS content is not seeded. Run the latest database migration.");
  const title = pick(locale, page.heroTitleEn, page.heroTitleAr); const intro = pick(locale, page.heroBodyEn, page.heroBodyAr);
  return { ...base, contactPage: { eyebrow: pick(locale, page.heroEyebrowEn, page.heroEyebrowAr), title, intro, seoTitle: `${title} — Image Developments`, seoDescription: intro } };
});

export function fallbackMedia(copy: HomeContent) { return { hero: copy.hero.image ?? siteMedia.hero, detail: copy.about.milestones[0]?.image ?? siteMedia.detail, lifestyle: copy.lifestyle.image ?? siteMedia.lifestyle }; }
