import type { PageSectionLayout } from "@/lib/page-section-layouts";

export type Locale = "en" | "ar";
export type PageSectionContent = { id:string; kind?:string; settings?:import("../lib/block-settings").BlockSettings; layout:PageSectionLayout; eyebrow:string; title:string; body:string; image?:string; imageAlt:string; ctaLabel?:string; ctaUrl?:string; backgroundRgb:string };
export type NavItemContent = {
  id?: string;
  label: string;
  href: string;
  external?: boolean;
  group?: "primary" | "secondary";
  previewImage?: string;
  previewImageAr?: string;
  focalPoint?: string;
};

export type HomeContent = {
  locale: Locale; dir: "ltr" | "rtl"; nav: NavItemContent[];
  backgrounds: { opening: string; hero: string; about: string; projects: string; lifestyle: string; stats: string; journal: string; closing: string; footer: string };
  opening?: { enabled: boolean; headline: string; desktopVideo?: string; mobileVideo?: string; poster?: string };
  projectsOpening?: { enabled: boolean; headline: string };
  projectsHero?: { enabled?: boolean; eyebrow?: string; title?: string; description?: string; imageUrl?: string; image?: string; mobileImageUrl?: string; focalPoint?: string; imageAlt?: string; primaryCta?: string; secondaryCta?: string };
  hero: { enabled?: boolean; eyebrow: string; title: string[]; note: string; scroll: string; image?: string; mobileImage?: string; desktopVideo?: string; mobileVideo?: string; poster?: string; alt?: string };
  about: { enabled: boolean; eyebrow: string; title: string; intro: string; milestones: { id: string; year: string; title: string; body: string; image: string; alt: string }[] };
  projects: {
    id?: string;
    slug?: string;
    name: string;
    location: string;
    promise: string;
    image: string;
    alt?: string;
    ctaUrl?: string;
    ctaLabel?: string;
    projectType?: string;
    progressStatus?: string;
    brochureUrl?: string;
  }[];
  projectsSection?: {
    heading: string;
    description?: string;
    exploreLabel: string;
    enquireLabel: string;
    viewAllLabel: string;
    spacing: "compact" | "standard" | "spacious";
    theme: "light" | "warm" | "dark";
    imagePosition: "start" | "end";
  };
  inquiryProjects: { id: string; name: string }[];
  openingProjects?: { name: string; location: string; image: string }[];
  openingProject?: { name: string; location: string; image: string; images?: string[] };
  lifestyle: { enabled?: boolean; eyebrow: string; title: string; image?: string; alt?: string; ctaLabel?: string; ctaUrl?: string };
  stats: CompanyStatItem[];
  statsSection?: StatsSectionContent;
  newsJournalSection?: HomeJournalSectionContent;
  journal: { enabled?: boolean; eyebrow: string; title: string; stories: { slug?: string; date: string; title: string; image: string; alt?: string }[] };
  closing: {
    enabled?: boolean;
    eyebrow: string;
    title: string;
    description?: string;
    formHeading?: string;
    submitLabel?: string;
    successMessage?: string;
    cta?: string;
    url?: string;
  };
  visibility?: { projects: boolean; stats: boolean }; sectionOrder?: string[];
  settings?: {
    email: string;
    phone: string;
    hotline?: string;
    workingHours?: string;
    companyBrochureUrl?: string;
    address: string;
    mapUrl?: string;
    description?: string;
    footerExploreHeading?: string;
    footerProjectsHeading?: string;
    footerContactHeading?: string;
    callbackEnabled?: boolean;
    callbackLabel?: string;
    menuImage: string;
    menuImageAlt: string;
    menuImageFocalPoint?: string;
    socials: { label: string; url: string; svgIcon?: string }[];
    seoTitle: string;
    seoDescription: string;
  };
  common: { projects: string; explore: string; menu: string; close: string; language: string; contact: string; rights: string; statsHeading?: string };
  customSections?: PageSectionContent[];
  pageSectionsByPage?: Record<string,PageSectionContent[]>;
};

export type HomeJournalArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  coverImageUrl: string;
  coverImageAlt: string;
  focalPoint?: string;
  publicationDate: string;
  rawDate: string;
  category: string;
  categoryLabel?: string;
  href: string;
};

export type HomeJournalSectionContent = {
  enabled: boolean;
  label: string;
  heading: string;
  description?: string;
  ctaLabel: string;
  ctaUrl: string;
  mode: "AUTO" | "MANUAL";
  categoryFilter?: string;
  articlesCount: number;
  articles: HomeJournalArticle[];
};

export const JOURNAL_CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  ALL: { en: "All", ar: "الكل" },
  ARCHITECTURE: { en: "Architecture", ar: "عمارة وتصميم" },
  CONSTRUCTION: { en: "Construction", ar: "إنشاءات وتطوير" },
  EVENTS: { en: "Events", ar: "فعاليات ومناسبات" },
  COMMUNITY: { en: "Community", ar: "مجتمع وحياة" },
  DESIGN: { en: "Design", ar: "تصميم داخلي" },
  NEWS: { en: "News", ar: "أخبار ومستجدات" },
};

export type CompanyStatItem = {
  id?: string;
  value: string;
  unit?: string;
  label: string;
  visible?: boolean;
  sortOrder?: number;
};

export type StatsSectionContent = {
  enabled: boolean;
  label?: string;
  heading: string;
  description?: string;
  supportingText?: string;
  imageUrl?: string;
  imageAlt?: string;
  focalPoint?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  stats: CompanyStatItem[];
};

export type KeyFactItem = {
  label: string;
  value: string;
};

export type HighlightItem = {
  title: string;
  description: string;
  icon?: string;
  image?: string;
};

export type UnitTypeItem = {
  id: string;
  name: string;
  area: string;
  finishing: string;
  payment: string;
  image?: string;
};

export type NearbyLocationItem = {
  name: string;
  distance: string;
  type?: string;
};

export type ConstructionUpdateItem = {
  date: string;
  title: string;
  imageUrl?: string;
  isVideo?: boolean;
};

export type ProjectDetailData = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription?: string;
  location: string;
  coverImageUrl: string;
  coverImageAlt: string;
  gallery: string[];
  logoUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  projectType: string;
  progressStatus: string;
  masterPlanUrl?: string;
  brochureUrl?: string;
  videoTourUrl?: string;
  latitude?: number;
  longitude?: number;
  mapUrl?: string;
  keyFacts: KeyFactItem[];
  highlights: HighlightItem[];
  unitTypes: UnitTypeItem[];
  nearbyLocations: NearbyLocationItem[];
  constructionUpdates: ConstructionUpdateItem[];
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  status?: string;
};

export type ProjectDetailPageContent = HomeContent & {
  project: ProjectDetailData;
  otherProjects: Array<{
    id: string;
    slug: string;
    name: string;
    location: string;
    image: string;
    projectType: string;
  }>;
};

export type CareerJobItem = {
  id: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  description: string;
  requirements: string;
};

export type CareersPageContent = HomeContent & {
  careersPage: {
    hero: { eyebrow: string; title: string; intro: string; image: string };
    lifeAtImage: { eyebrow: string; title: string; body: string; images: string[] };
    jobs: CareerJobItem[];
    seoTitle: string;
    seoDescription: string;
  };
};

export type NewsStoryItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  rawDate?: string;
  image: string;
  alt: string;
  category: "NEWS" | "EVENTS" | "CONSTRUCTION" | string;
  projectId?: string;
  author?: string;
  focalPoint?: string;
  tags?: string[];
};

export type JournalClosingCta = {
  enabled: boolean;
  heading: string;
  text: string;
  buttonLabel: string;
  buttonLink: string;
  secondary: boolean;
};

export type NewsPageContent = HomeContent & {
  newsPage: {
    hero: {
      eyebrow: string;
      title: string;
      intro: string;
      image?: string;
      alt?: string;
      focalPoint?: string;
    };
    featuredStory?: NewsStoryItem;
    allStories: NewsStoryItem[];
    sidebar: {
      enabled: boolean;
      heading: string;
      articles: NewsStoryItem[];
    };
    categories: string[];
    articlesPerPage: number;
    closingCta: JournalClosingCta;
    seoTitle: string;
    seoDescription: string;
  };
};

export type SidebarProjectCard = {
  id: string;
  slug: string;
  name: string;
  location: string;
  projectType: string;
  progressStatus: string;
  image: string;
  imageAlt: string;
  focalPoint?: string;
  href: string;
};

export type SidebarProjectsConfig = {
  enabled: boolean;
  heading: string;
  mode: "AUTO" | "MANUAL";
  projects: SidebarProjectCard[];
  showLocation: boolean;
  showType: boolean;
  showStatus: boolean;
  viewAllLabel: string;
  viewAllHref: string;
};

export type NewsDetailPageContent = HomeContent & {
  article: NewsStoryItem & {
    content: string;
    gallery?: string[];
    status?: string;
    readingTime?: string;
    coverCaption?: string;
    coverCredit?: string;
    constructionDate?: string;
    rawConstructionDate?: string;
    showRelatedProject?: boolean;
    showTableOfContents?: boolean;
    videoUrl?: string;
    cta?: {
      enabled: boolean;
      heading: string;
      text: string;
      buttonLabel: string;
      buttonLink?: string;
      actionType: "ENQUIRY" | "LINK";
    };
    relatedProject?: {
      id: string;
      slug: string;
      name: string;
      location: string;
      projectType: string;
      progressStatus: string;
      shortDescription: string;
      image: string;
      imageAlt: string;
      focalPoint?: string;
      status: string;
    } | null;
  };
  sidebarProjects?: SidebarProjectsConfig;
  relatedStories: NewsStoryItem[];
};

export type ProjectsPageContent = HomeContent & {
  projectsHero: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    description: string;
    imageUrl?: string;
    mobileImageUrl?: string;
    focalPoint: string;
    imageAlt: string;
    primaryCta: string;
    secondaryCta: string;
  };
  allProjects: Array<{
    id: string;
    slug: string;
    name: string;
    location: string;
    promise: string;
    image: string;
    alt?: string;
    ctaUrl?: string;
    ctaLabel?: string;
    focalPoint?: string;
    projectType: string;
    progressStatus: string;
    featured: boolean;
    logoUrl?: string;
  }>;
};

export type AboutPageContent = HomeContent & {
  aboutPage: {
    hero: { enabled: boolean; eyebrow: string; title: string; body: string; image?: string; alt: string };
    blocks: { id: string; enabled: boolean; eyebrow: string; title: string; body: string; image?: string; alt?: string }[];
  };
};

export type TeamPageContent = HomeContent & {
  teamPage: {
    eyebrow: string; title: string; intro: string;
    members: { id: string; name: string; role: string; bio: string; image: string; alt: string }[];
  };
};

export type PartnersPageContent = HomeContent & {
  partnersPage: {
    eyebrow: string; title: string; intro: string;
    partners: { id: string; name: string; description?: string; logo: string; alt: string; website?: string }[];
  };
};

export type PolicyPageContent = HomeContent & {
  policyPage: {
    eyebrow: string; title: string; intro: string; lastUpdated: string;
    seoTitle: string; seoDescription: string;
    sections: { id: string; title: string; body: string }[];
  };
};

export type TermsPageContent = HomeContent & {
  termsPage: {
    eyebrow: string; title: string; intro: string; lastUpdated: string;
    seoTitle: string; seoDescription: string;
    sections: { id: string; title: string; body: string }[];
  };
};

export type HistoryPageContent = AboutPageContent;

export type ContactPageContent = HomeContent & {
  contactPage: { eyebrow: string; title: string; intro: string; seoTitle: string; seoDescription: string };
};

export const siteMedia = {
  hero: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2400&q=88",
  detail: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=86",
  projects: [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=88",
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2200&q=88",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=2200&q=88",
  ],
  lifestyle: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=2400&q=88",
  news: [
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1500&q=85",
    "https://images.unsplash.com/photo-1600607688960-e095ff83135c?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?auto=format&fit=crop&w=1200&q=85",
  ],
};

const sharedProjects = siteMedia.projects;
const sharedNews = siteMedia.news;
export const content: Record<Locale, HomeContent> = {
  en: {
    locale: "en", dir: "ltr",
    backgrounds: { opening:"255, 255, 255",hero:"255, 255, 255",about:"255, 255, 255",projects:"255, 255, 255",lifestyle:"255, 255, 255",stats:"255, 255, 255",journal:"255, 255, 255",closing:"255, 255, 255",footer:"255, 255, 255" },
    nav: [
      { id: "nav-home", label: "Home", href: "#top", group: "primary", previewImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2400&q=88", focalPoint: "center" },
      { id: "nav-about", label: "About Us", href: "/about", group: "primary", previewImage: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=86", focalPoint: "center" },
      { id: "nav-projects", label: "Projects", href: "/projects", group: "primary", previewImage: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2200&q=88", focalPoint: "center" },
      { id: "nav-careers", label: "Careers", href: "/careers", group: "primary", previewImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=88", focalPoint: "center" },
      { id: "nav-contact", label: "Contact Us", href: "/contact", group: "primary", previewImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=88", focalPoint: "center" },
      { id: "nav-journal", label: "Journal", href: "/journal", group: "secondary", previewImage: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1500&q=85", focalPoint: "center" },
      { id: "nav-history", label: "History", href: "/history", group: "secondary", previewImage: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=2400&q=88", focalPoint: "center" },
      { id: "nav-team", label: "Team", href: "/team", group: "secondary", previewImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=85", focalPoint: "center" },
      { id: "nav-partners", label: "Partners", href: "/partners", group: "secondary", previewImage: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=2200&q=88", focalPoint: "center" },
    ],
    hero: { eyebrow: "Building a new point of view", title: ["Space,", "imagined", "differently."], note: "Thoughtful communities for the way Egypt lives next.", scroll: "Discover" },
    about: { enabled: true, eyebrow: "Our journey", title: "A timeline of places, people and progress.", intro: "From our first idea to the communities taking shape today, every chapter adds a new perspective.", milestones: [{id:"2008",year:"2008",title:"The first perspective",body:"Image Developments began with a belief that real estate should start with how people want to live.",image:siteMedia.detail,alt:"Architectural beginnings"},{id:"2018",year:"2018",title:"Communities take shape",body:"A growing portfolio brought landscape, architecture and everyday life into one considered vision.",image:siteMedia.projects[0],alt:"A growing residential community"},{id:"2025",year:"2025",title:"A new chapter",body:"New destinations carry the same human idea forward, expressed with greater ambition and clarity.",image:siteMedia.projects[1],alt:"A contemporary Image destination"}] },
    projects: [{ name: "Aera", location: "New Cairo", promise: "A quieter expression of city life.", image: sharedProjects[0] }, { name: "Solaya", location: "New Zayed", promise: "Sunlit homes shaped by the landscape.", image: sharedProjects[1] }, { name: "Marea", location: "North Coast", promise: "A horizon made for slower days.", image: sharedProjects[2] }],
    inquiryProjects: [{id:"aera",name:"Aera"},{id:"solaya",name:"Solaya"},{id:"marea",name:"Marea"}],
    lifestyle: { eyebrow: "Beyond the building", title: "The most memorable spaces leave room for life to happen.", ctaLabel: "Discover Our Story", ctaUrl: "/about" },
    stats: [{ value: "18+", label: "Years shaping distinctive places" }, { value: "4.2M", label: "Square metres in development" }, { value: "9,500", label: "Homes thoughtfully envisioned" }],
    statsSection: {
      enabled: true,
      label: "About Image",
      heading: "Shaping places with enduring perspective.",
      description: "For nearly two decades, Image Developments has crafted thoughtful residential and mixed-use environments where architectural craft, landscape, and everyday living belong together.",
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=88",
      imageAlt: "Architectural craft at Image Developments",
      focalPoint: "center",
      ctaLabel: "Discover Our Story",
      ctaUrl: "/about",
      stats: [
        { value: "18+", label: "Years shaping distinctive places" },
        { value: "4.2M", label: "Square metres in development" },
        { value: "9,500", label: "Homes thoughtfully envisioned" },
      ],
    },
    journal: { eyebrow: "From the studio", title: "Ideas shaping tomorrow", stories: [{ date: "18 Sep 2026", title: "Designing shade, breeze and belonging", image: sharedNews[0] }, { date: "02 Aug 2026", title: "The landscape comes first at Solaya", image: sharedNews[1] }, { date: "21 Jun 2026", title: "A new coastal rhythm takes shape", image: sharedNews[2] }] },
    closing: {
      eyebrow: "LET’S TALK",
      title: "Find your next place.",
      description: "Tell us which project interests you, and our team will help you explore the details.",
      formHeading: "Request a Call Back",
      submitLabel: "Request a Call Back",
      successMessage: "Thank you, your enquiry has been received. Our specialized team will be in touch shortly.",
      cta: "Call 17087",
      url: "tel:17087",
    },
    common: { projects: "Projects", explore: "Explore the place", menu: "Open menu", close: "Close menu", language: "العربية", contact: "Get in touch", rights: "© 2026 Image Developments. All rights reserved." },
  },
  ar: {
    locale: "ar", dir: "rtl",
    backgrounds: { opening:"255, 255, 255",hero:"255, 255, 255",about:"255, 255, 255",projects:"255, 255, 255",lifestyle:"255, 255, 255",stats:"255, 255, 255",journal:"255, 255, 255",closing:"255, 255, 255",footer:"255, 255, 255" },
    nav: [
      { id: "nav-home", label: "الرئيسية", href: "#top", group: "primary", previewImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2400&q=88", focalPoint: "center" },
      { id: "nav-about", label: "من نحن", href: "/about", group: "primary", previewImage: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=86", focalPoint: "center" },
      { id: "nav-projects", label: "المشاريع", href: "/projects", group: "primary", previewImage: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2200&q=88", focalPoint: "center" },
      { id: "nav-careers", label: "الوظائف", href: "/careers", group: "primary", previewImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=88", focalPoint: "center" },
      { id: "nav-contact", label: "تواصل معنا", href: "/contact", group: "primary", previewImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=88", focalPoint: "center" },
      { id: "nav-journal", label: "يومياتنا", href: "/journal", group: "secondary", previewImage: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1500&q=85", focalPoint: "center" },
      { id: "nav-history", label: "تاريخنا", href: "/history", group: "secondary", previewImage: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=2400&q=88", focalPoint: "center" },
      { id: "nav-team", label: "فريقنا", href: "/team", group: "secondary", previewImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=85", focalPoint: "center" },
      { id: "nav-partners", label: "شركاؤنا", href: "/partners", group: "secondary", previewImage: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=2200&q=88", focalPoint: "center" },
    ],
    hero: { eyebrow: "نبني منظوراً جديداً", title: ["مساحات", "نتخيلها", "بشكل مختلف."], note: "مجتمعات مدروسة لحياة مصر في الغد.", scroll: "اكتشف" },
    about: { enabled: true, eyebrow: "رحلتنا", title: "مسيرة من الأماكن والناس والتقدم.", intro: "من فكرتنا الأولى إلى المجتمعات التي تتشكل اليوم، يضيف كل فصل منظوراً جديداً.", milestones: [{id:"2008",year:"2008",title:"المنظور الأول",body:"بدأت إيمدج للتطوير العقاري بإيمان بأن العقار يجب أن يبدأ من الطريقة التي يرغب الناس في العيش بها.",image:siteMedia.detail,alt:"البدايات المعمارية"},{id:"2018",year:"2018",title:"مجتمعات تتشكل",body:"جمعت محفظة متنامية بين الطبيعة والعمارة والحياة اليومية ضمن رؤية واحدة مدروسة.",image:siteMedia.projects[0],alt:"مجتمع سكني متنامٍ"},{id:"2025",year:"2025",title:"فصل جديد",body:"تحمل وجهات جديدة الفكرة الإنسانية ذاتها إلى الأمام بطموح ووضوح أكبر.",image:siteMedia.projects[1],alt:"إحدى وجهات إيمدج المعاصرة"}] },
    projects: [{ name: "إيرا", location: "القاهرة الجديدة", promise: "تعبير أكثر هدوءاً عن حياة المدينة.", image: sharedProjects[0] }, { name: "سولايا", location: "زايد الجديدة", promise: "بيوت يغمرها الضوء وتشكلها الطبيعة.", image: sharedProjects[1] }, { name: "ماريا", location: "الساحل الشمالي", promise: "أفق صُنع لأيام أكثر هدوءاً.", image: sharedProjects[2] }],
    inquiryProjects: [{id:"aera",name:"إيرا"},{id:"solaya",name:"سولايا"},{id:"marea",name:"ماريا"}],
    lifestyle: { eyebrow: "أبعد من المباني", title: "أكثر الأماكن حضوراً هي التي تترك للحياة مساحتها.", ctaLabel: "اكتشف قصتنا", ctaUrl: "/about" },
    stats: [{ value: "+18", label: "عاماً من الريادة في صناعة المكان" }, { value: "4.2M", label: "متر مربع قيد التطوير والإنجاز" }, { value: "9,500", label: "منزل صُمم بعناية للحياة" }],
    statsSection: {
      enabled: true,
      label: "عن إيمدج",
      heading: "نصنع مجتمعات مدروسة ذات قيمة تدوم.",
      description: "على مدار ما يقارب عقدين من الزمان، تبتكر إيمدج للتطوير العقاري بيئات سكنية ومختلطة متكاملة تجمع بين الحرفية المعمارية وتناغم الطبيعة لتمنح الحياة معنى أعمق.",
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=88",
      imageAlt: "التميز المعماري في إيمدج للتطوير العقاري",
      focalPoint: "center",
      ctaLabel: "اكتشف قصتنا",
      ctaUrl: "/about",
      stats: [
        { value: "+18", label: "عاماً من الريادة في صناعة المكان" },
        { value: "4.2M", label: "متر مربع قيد التطوير والإنجاز" },
        { value: "9,500", label: "منزل صُمم بعناية للحياة" },
      ],
    },
    journal: { eyebrow: "من الاستوديو", title: "أفكار تشكل الغد", stories: [{ date: "18 سبتمبر 2026", title: "نصمم الظل والنسيم والشعور بالانتماء", image: sharedNews[0] }, { date: "02 أغسطس 2026", title: "في سولايا، تبدأ الحكاية من الطبيعة", image: sharedNews[1] }, { date: "21 يونيو 2026", title: "إيقاع ساحلي جديد يبدأ في الظهور", image: sharedNews[2] }] },
    closing: {
      eyebrow: "لنتحدث",
      title: "اكتشف مكانك القادم",
      description: "أخبرنا بالمشروع الذي يهمك، وسيساعدك فريقنا في التعرف على التفاصيل.",
      formHeading: "طلب معاودة الاتصال",
      submitLabel: "اطلب اتصالاً",
      successMessage: "شكراً لك، تم استلام استفسارك بنجاح. سيتواصل معك فريقنا المختص قريباً.",
      cta: "اتصل على 17087",
      url: "tel:17087",
    },
    common: { projects: "المشاريع", explore: "اكتشف المكان", menu: "افتح القائمة", close: "أغلق القائمة", language: "English", contact: "تواصل معنا", rights: "© 2026 إيمدج للتطوير العقاري. جميع الحقوق محفوظة." },
  },
};
