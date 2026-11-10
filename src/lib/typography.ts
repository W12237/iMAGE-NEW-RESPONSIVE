/**
 * Image Developments - Responsive Typography System
 * Implements 4-tier inheritance, role-specific safe ranges,
 * bounded fluid clamp interpolation, and bidirectional locale support.
 */

export type TypographyRole =
  | "heroHeading"
  | "sectionHeading"
  | "cardTitle"
  | "body"
  | "meta"
  | "tag";

export type TypographyScope =
  | "global"
  | "home_projects"
  | "home_hero"
  | "home_living"
  | "about_who_we_are"
  | "journal";

export type SupportedLocale = "en" | "ar";

export interface TypographyRoleConfig {
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
  safeMinMobile: number;
  safeMaxMobile: number;
  safeMinDesktop: number;
  safeMaxDesktop: number;
  minLineHeight: number;
  maxLineHeight: number;
}

export const TYPOGRAPHY_ROLES: Record<TypographyRole, TypographyRoleConfig> = {
  heroHeading: {
    labelEn: "Hero / Main Heading",
    labelAr: "عنوان الواجهة الرئيسي",
    descriptionEn: "Top-level impactful statement for heroes and monographs.",
    descriptionAr: "العبارة الرئيسية البارزة في واجهات الصفحات.",
    safeMinMobile: 24,
    safeMaxMobile: 64,
    safeMinDesktop: 36,
    safeMaxDesktop: 120,
    minLineHeight: 0.95,
    maxLineHeight: 1.5,
  },
  sectionHeading: {
    labelEn: "Section Heading",
    labelAr: "عنوان القسم",
    descriptionEn: "Architectural H2 title introducing content sections.",
    descriptionAr: "عنوان المستوى الثاني للأقسام الرئيسية.",
    safeMinMobile: 20,
    safeMaxMobile: 44,
    safeMinDesktop: 26,
    safeMaxDesktop: 64,
    minLineHeight: 1.05,
    maxLineHeight: 1.6,
  },
  cardTitle: {
    labelEn: "Card Title",
    labelAr: "عنوان البطاقة / المشروع",
    descriptionEn: "Project names and editorial article card titles.",
    descriptionAr: "عناوين بطاقات المشاريع والمقالات التحريرية.",
    safeMinMobile: 16,
    safeMaxMobile: 32,
    safeMinDesktop: 18,
    safeMaxDesktop: 36,
    minLineHeight: 1.15,
    maxLineHeight: 1.6,
  },
  body: {
    labelEn: "Body / Description",
    labelAr: "النص الوصفي / الفقرة",
    descriptionEn: "Curated architectural narratives and supporting copy.",
    descriptionAr: "الفقرات التعريفية والنصوص الوصفية في مختلف الأقسام.",
    safeMinMobile: 14,
    safeMaxMobile: 22,
    safeMinDesktop: 15,
    safeMaxDesktop: 24,
    minLineHeight: 1.3,
    maxLineHeight: 2.1,
  },
  meta: {
    labelEn: "Small Label / Metadata",
    labelAr: "التصنيف والبيانات المساعدة",
    descriptionEn: "Section eyebrows, dates, location tags, and indexes.",
    descriptionAr: "العبارات التمهيدية وتصنيفات المشاريع والتواريخ.",
    safeMinMobile: 10,
    safeMaxMobile: 16,
    safeMinDesktop: 11,
    safeMaxDesktop: 18,
    minLineHeight: 1.2,
    maxLineHeight: 1.8,
  },
  tag: {
    labelEn: "Button / Tag Text",
    labelAr: "نص الأزرار والوسوم",
    descriptionEn: "Interactive location tags, filter pills, and button labels.",
    descriptionAr: "وسوم المواقع التفاعلية وأزرار الإجراءات الرئيسية.",
    safeMinMobile: 12,
    safeMaxMobile: 18,
    safeMinDesktop: 13,
    safeMaxDesktop: 20,
    minLineHeight: 1.1,
    maxLineHeight: 1.6,
  },
};

export const APPROVED_FONT_WEIGHTS = [
  { value: 300, labelEn: "300 — Light", labelAr: "٣٠٠ — خفيف (Light)" },
  { value: 400, labelEn: "400 — Regular", labelAr: "٤٠٠ — عادي (Regular)" },
  { value: 500, labelEn: "500 — Medium", labelAr: "٥٠٠ — متوسط (Medium)" },
  { value: 600, labelEn: "600 — SemiBold", labelAr: "٦٠٠ — شبه عريض (SemiBold)" },
  { value: 700, labelEn: "700 — Bold", labelAr: "٧٠٠ — عريض (Bold)" },
];

export interface TypographyValues {
  fontSizeMobile?: number;
  fontSizeDesktop?: number;
  lineHeight?: number;
  fontWeight?: number;
}

export interface ResolvedTypography {
  role: TypographyRole;
  fontSizeMobile: number;
  fontSizeDesktop: number;
  lineHeight: number;
  fontWeight: number;
  isOverridden: boolean;
  inheritedFrom: string;
}

/**
 * Baseline approved design values when no database record or override is configured.
 */
export const BASELINE_TYPOGRAPHY: Record<TypographyRole, Record<SupportedLocale, TypographyValues>> = {
  heroHeading: {
    en: { fontSizeMobile: 38, fontSizeDesktop: 72, lineHeight: 1.05, fontWeight: 300 },
    ar: { fontSizeMobile: 32, fontSizeDesktop: 60, lineHeight: 1.35, fontWeight: 300 },
  },
  sectionHeading: {
    en: { fontSizeMobile: 26, fontSizeDesktop: 40, lineHeight: 1.2, fontWeight: 300 },
    ar: { fontSizeMobile: 24, fontSizeDesktop: 36, lineHeight: 1.35, fontWeight: 400 },
  },
  cardTitle: {
    en: { fontSizeMobile: 20, fontSizeDesktop: 24, lineHeight: 1.3, fontWeight: 500 },
    ar: { fontSizeMobile: 18, fontSizeDesktop: 22, lineHeight: 1.4, fontWeight: 500 },
  },
  body: {
    en: { fontSizeMobile: 16, fontSizeDesktop: 17, lineHeight: 1.7, fontWeight: 400 },
    ar: { fontSizeMobile: 16, fontSizeDesktop: 17, lineHeight: 1.85, fontWeight: 400 },
  },
  meta: {
    en: { fontSizeMobile: 11, fontSizeDesktop: 12, lineHeight: 1.4, fontWeight: 600 },
    ar: { fontSizeMobile: 11, fontSizeDesktop: 12, lineHeight: 1.4, fontWeight: 600 },
  },
  tag: {
    en: { fontSizeMobile: 14, fontSizeDesktop: 15, lineHeight: 1.2, fontWeight: 500 },
    ar: { fontSizeMobile: 13.5, fontSizeDesktop: 14.5, lineHeight: 1.3, fontWeight: 500 },
  },
};

/**
 * Standard break points for bounded fluid interpolation:
 * Mobile breakpoint: 390px
 * Desktop breakpoint: 1280px
 */
export const FLUID_MIN_VIEWPORT = 390;
export const FLUID_MAX_VIEWPORT = 1280;

/**
 * Validate a candidate typography input against role safe ranges.
 * Returns null if valid, or a descriptive error message if invalid.
 */
export function validateTypographyValue(
  role: TypographyRole,
  values: TypographyValues
): string | null {
  const config = TYPOGRAPHY_ROLES[role];
  if (!config) return "Unknown typography role.";

  if (values.fontSizeMobile !== undefined && values.fontSizeMobile !== null) {
    if (
      isNaN(values.fontSizeMobile) ||
      values.fontSizeMobile < config.safeMinMobile ||
      values.fontSizeMobile > config.safeMaxMobile
    ) {
      return `Mobile font size for ${config.labelEn} must be between ${config.safeMinMobile}px and ${config.safeMaxMobile}px.`;
    }
  }

  if (values.fontSizeDesktop !== undefined && values.fontSizeDesktop !== null) {
    if (
      isNaN(values.fontSizeDesktop) ||
      values.fontSizeDesktop < config.safeMinDesktop ||
      values.fontSizeDesktop > config.safeMaxDesktop
    ) {
      return `Desktop font size for ${config.labelEn} must be between ${config.safeMinDesktop}px and ${config.safeMaxDesktop}px.`;
    }
  }

  if (values.lineHeight !== undefined && values.lineHeight !== null) {
    if (
      isNaN(values.lineHeight) ||
      values.lineHeight < config.minLineHeight ||
      values.lineHeight > config.maxLineHeight
    ) {
      return `Line height for ${config.labelEn} must be between ${config.minLineHeight} and ${config.maxLineHeight}.`;
    }
  }

  if (values.fontWeight !== undefined && values.fontWeight !== null) {
    const validWeights = APPROVED_FONT_WEIGHTS.map((w) => w.value);
    if (!validWeights.includes(values.fontWeight)) {
      return `Font weight must be one of approved weights: ${validWeights.join(", ")}.`;
    }
  }

  return null;
}

/**
 * Resolves typography for a role, scope, and locale following explicit inheritance:
 * 1. Section override for that locale (`${scope}:${role}:${locale}`)
 * 2. Section override generic (`${scope}:${role}:all`)
 * 3. Global locale default (`global:${role}:${locale}`)
 * 4. Global generic default (`global:${role}:all`)
 * 5. Baseline design system constant
 */
export function resolveTypography(
  role: TypographyRole,
  scope: TypographyScope,
  locale: SupportedLocale,
  records: Map<string, TypographyValues> | Record<string, TypographyValues>
): ResolvedTypography {
  const get = (k: string): TypographyValues | undefined => {
    if (records instanceof Map) return records.get(k);
    return records[k];
  };

  const baseline = BASELINE_TYPOGRAPHY[role][locale];

  const sectionLocale = scope !== "global" ? get(`${scope}:${role}:${locale}`) : undefined;
  const sectionGeneric = scope !== "global" ? get(`${scope}:${role}:all`) : undefined;
  const globalLocale = get(`global:${role}:${locale}`);
  const globalGeneric = get(`global:${role}:all`);

  const resolveProp = <K extends keyof TypographyValues>(prop: K): { val: number; from: string } => {
    if (sectionLocale?.[prop] !== undefined && sectionLocale[prop] !== null) {
      return { val: sectionLocale[prop] as number, from: `Section (${locale})` };
    }
    if (sectionGeneric?.[prop] !== undefined && sectionGeneric[prop] !== null) {
      return { val: sectionGeneric[prop] as number, from: "Section" };
    }
    if (globalLocale?.[prop] !== undefined && globalLocale[prop] !== null) {
      return { val: globalLocale[prop] as number, from: `Global (${locale})` };
    }
    if (globalGeneric?.[prop] !== undefined && globalGeneric[prop] !== null) {
      return { val: globalGeneric[prop] as number, from: "Global" };
    }
    return { val: baseline[prop] as number, from: "Default" };
  };

  const mobileRes = resolveProp("fontSizeMobile");
  const desktopRes = resolveProp("fontSizeDesktop");
  const lhRes = resolveProp("lineHeight");
  const weightRes = resolveProp("fontWeight");

  const isOverridden = scope !== "global" && (Boolean(sectionLocale) || Boolean(sectionGeneric));
  const inheritedFrom = isOverridden
    ? sectionLocale
      ? `Section (${locale.toUpperCase()})`
      : "Section"
    : globalLocale
      ? `Global (${locale.toUpperCase()})`
      : globalGeneric
        ? "Global"
        : "Design System Default";

  return {
    role,
    fontSizeMobile: mobileRes.val,
    fontSizeDesktop: desktopRes.val,
    lineHeight: lhRes.val,
    fontWeight: weightRes.val,
    isOverridden,
    inheritedFrom,
  };
}

/**
 * Computes a bounded fluid CSS clamp expression between 390px (mobile) and 1280px (desktop).
 * Correctly handles mobile < desktop and mobile > desktop, producing rem-friendly clamp math.
 */
export function computeFluidClamp(
  mobilePx: number,
  desktopPx: number,
  minVw: number = FLUID_MIN_VIEWPORT,
  maxVw: number = FLUID_MAX_VIEWPORT
): string {
  if (mobilePx === desktopPx) {
    return `${mobilePx}px`;
  }

  const min = Math.min(mobilePx, desktopPx);
  const max = Math.max(mobilePx, desktopPx);

  // Slope calculation: (desktop - mobile) / (maxVw - minVw)
  const slope = (desktopPx - mobilePx) / (maxVw - minVw);
  const yIntercept = mobilePx - slope * minVw;

  const slopeVw = Number((slope * 100).toFixed(4));
  const yInterceptRem = Number((yIntercept / 16).toFixed(4));

  const preferred =
    yInterceptRem === 0
      ? `${slopeVw}vw`
      : `${yInterceptRem}rem + ${slopeVw}vw`;

  return `clamp(${min}px, ${preferred}, ${max}px)`;
}

/**
 * Generates inline CSS style object for a resolved typography configuration.
 */
export function getFluidTypographyStyle(
  resolved: ResolvedTypography,
  locale: SupportedLocale
): React.CSSProperties {
  return {
    fontSize: computeFluidClamp(resolved.fontSizeMobile, resolved.fontSizeDesktop),
    lineHeight: resolved.lineHeight,
    fontWeight: resolved.fontWeight,
    letterSpacing: locale === "ar" ? "0 !important" : undefined,
  };
}

