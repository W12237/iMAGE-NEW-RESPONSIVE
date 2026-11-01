/**
 * Page-builder registry. Every public page is an ordered list of blocks stored
 * in `PageSection`. A block is either a CUSTOM section (content lives on the row)
 * or a BUILT-IN section whose content stays in its own CMS screen; the row only
 * controls its position and visibility on the page.
 */
export const CUSTOM_BLOCK = "CUSTOM";
export const CONTACT_FORM_BLOCK = "CONTACT_FORM";

export type BuiltinBlockDefinition = { key: string; label: string; description: string; editHref: string };

const contactForm = (): BuiltinBlockDefinition => ({ key: CONTACT_FORM_BLOCK, label: "Contact form", description: "The site-wide enquiry form shown before the footer.", editHref: "/admin/contact" });

export const BUILTIN_BLOCKS = {
  home: [
    { key: "HOME_HERO", label: "Hero", description: "Full-screen video or image with the main headline.", editHref: "/admin/homepage" },
    { key: "HOME_PROJECTS", label: "Featured projects", description: "Showcase of published, featured developments.", editHref: "/admin/projects" },
    { key: "HOME_LIVING", label: "Living story", description: "Parallax lifestyle images with key stats.", editHref: "/admin/homepage" },
    { key: "HOME_STATS", label: "News & Journal", description: "Featured stories, ideas, and editorial updates.", editHref: "/admin/homepage" },
    { key: "HOME_JOURNAL", label: "Journal highlights", description: "Featured news stories.", editHref: "/admin/news" },
    contactForm(),
  ],
  about: [
    { key: "ABOUT_HERO", label: "Hero", description: "About-page hero image and introduction.", editHref: "/admin/about" },
    { key: "ABOUT_WHO_WE_ARE", label: "Who We Are", description: "Company introduction, business activities, and approach.", editHref: "/admin/about" },
    { key: "ABOUT_TIMELINE", label: "Our Journey", description: "Horizontal scrolling milestones.", editHref: "/admin/about" },
    { key: "ABOUT_VISION_MISSION", label: "Vision & Mission", description: "Company vision and mission statements.", editHref: "/admin/about" },
    { key: "ABOUT_ACHIEVEMENTS", label: "Our Achievements", description: "Key achievement figures and track record.", editHref: "/admin/about" },
    { key: "ABOUT_LEADERSHIP", label: "Leadership", description: "Executive leadership profiles.", editHref: "/admin/team" },
    { key: "ABOUT_BLOCKS", label: "Content blocks", description: "Alternating text and image blocks.", editHref: "/admin/about" },
    contactForm(),
  ],
  history: [
    { key: "HISTORY_HERO", label: "Hero", description: "History headline and hero image.", editHref: "/admin/about" },
    { key: "HISTORY_TIMELINE", label: "Milestones", description: "Year-by-year chapters.", editHref: "/admin/about" },
    { key: "HISTORY_STORIES", label: "Story blocks", description: "About content blocks in the history style.", editHref: "/admin/about" },
    contactForm(),
  ],
  developments: [
    { key: "DEVELOPMENTS_HERO", label: "Hero", description: "Lead project image with the page title.", editHref: "/admin/projects" },
    { key: "DEVELOPMENTS_PROJECTS", label: "Projects showcase", description: "All featured developments.", editHref: "/admin/projects" },
    contactForm(),
  ],
  journal: [
    { key: "JOURNAL_HERO", label: "Hero", description: "Journal title.", editHref: "/admin/news" },
    { key: "JOURNAL_LIST", label: "Stories grid", description: "All published stories.", editHref: "/admin/news" },
    contactForm(),
  ],
  team: [
    { key: "TEAM_HERO", label: "Hero", description: "Team title, introduction and image.", editHref: "/admin/team" },
    { key: "TEAM_ROSTER", label: "Team members", description: "Grid of team profiles.", editHref: "/admin/team" },
    contactForm(),
  ],
  partners: [
    { key: "PARTNERS_HERO", label: "Hero", description: "Partners title and introduction.", editHref: "/admin/partners" },
    { key: "PARTNERS_DIRECTORY", label: "Partner logos", description: "Grid of partner companies.", editHref: "/admin/partners" },
    contactForm(),
  ],
  policy: [
    { key: "POLICY_HERO", label: "Hero", description: "Policy title, introduction and date.", editHref: "/admin/policy" },
    { key: "POLICY_BODY", label: "Policy document", description: "Table of contents and policy sections.", editHref: "/admin/policy" },
    contactForm(),
  ],
  terms: [
    { key: "TERMS_HERO", label: "Hero", description: "Terms title, introduction and date.", editHref: "/admin/terms" },
    { key: "TERMS_BODY", label: "Terms document", description: "Table of contents and terms sections.", editHref: "/admin/terms" },
    contactForm(),
  ],
  contact: [
    { key: "CONTACT_HERO", label: "Hero", description: "Contact title and introduction.", editHref: "/admin/contact" },
    { key: "CONTACT_DETAILS", label: "Contact details & form", description: "Email, phone, address and the enquiry form.", editHref: "/admin/contact" },
  ],
} satisfies Record<string, BuiltinBlockDefinition[]>;

export type BlockPage = keyof typeof BUILTIN_BLOCKS;
export const BLOCK_PAGES = Object.keys(BUILTIN_BLOCKS) as BlockPage[];

export function isBlockPage(page: unknown): page is BlockPage {
  return typeof page === "string" && Object.prototype.hasOwnProperty.call(BUILTIN_BLOCKS, page);
}

export function builtinBlocksFor(page: string): BuiltinBlockDefinition[] {
  return isBlockPage(page) ? BUILTIN_BLOCKS[page] : [];
}

export function getBuiltinBlock(page: string, kind: string): BuiltinBlockDefinition | undefined {
  return builtinBlocksFor(page).find(block => block.key === kind);
}

/** True when `kind` is CUSTOM or a built-in that belongs to `page`. */
export function isValidBlockKind(page: string, kind: unknown): kind is string {
  return kind === CUSTOM_BLOCK || (typeof kind === "string" && !!getBuiltinBlock(page, kind));
}

export function normalizeBlockKind(kind: unknown): string {
  return typeof kind === "string" && kind ? kind : CUSTOM_BLOCK;
}

export function isBuiltinKind(kind: string) { return kind !== CUSTOM_BLOCK }

/** Built-ins of `page` that are not yet on the page (each built-in may appear once). */
export function missingBuiltinBlocks(page: string, presentKinds: Iterable<string>): BuiltinBlockDefinition[] {
  const present = new Set(presentKinds);
  return builtinBlocksFor(page).filter(block => !present.has(block.key));
}
