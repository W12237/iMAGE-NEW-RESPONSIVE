export const PAGE_SECTION_LAYOUTS=[
  {id:"TEXT",label:"Text only",description:"Centered editorial copy with no required image.",imageGuidance:"Image not used."},
  {id:"IMAGE_LEFT",label:"Image left",description:"Balanced two-column section with media before the copy.",imageGuidance:"Image recommended."},
  {id:"IMAGE_RIGHT",label:"Image right",description:"Balanced two-column section with copy before the media.",imageGuidance:"Image recommended."},
  {id:"FULL_IMAGE",label:"Full-image background",description:"Tall immersive image with copy layered above it.",imageGuidance:"Image strongly recommended."},
  {id:"EDITORIAL_PORTRAIT",label:"Editorial Portrait",description:"Arched portrait media with restrained editorial copy and generous whitespace.",imageGuidance:"Portrait or vertically cropped image recommended."},
  {id:"OVERLAP_FEATURE",label:"Overlap Feature",description:"Wide media with a layered forest content panel for a high-priority feature.",imageGuidance:"Wide landscape image recommended."},
  {id:"MAGAZINE_FEATURE",label:"Magazine Feature",description:"Headline-led editorial grid for longer stories and structured content.",imageGuidance:"Landscape image recommended but optional."},
  {id:"IMMERSIVE_BANNER",label:"Immersive Banner",description:"Medium-height cinematic chapter divider with aligned overlay copy.",imageGuidance:"Wide landscape image recommended."},
] as const;

export type PageSectionLayout=(typeof PAGE_SECTION_LAYOUTS)[number]["id"];

const PAGE_SECTION_LAYOUT_IDS=new Set<string>(PAGE_SECTION_LAYOUTS.map(layout=>layout.id));

export function isPageSectionLayout(value:unknown):value is PageSectionLayout{
  return typeof value==="string"&&PAGE_SECTION_LAYOUT_IDS.has(value);
}

export function normalizePageSectionLayout(value:unknown):PageSectionLayout{
  return isPageSectionLayout(value)?value:"TEXT";
}

export function getPageSectionLayout(value:unknown):(typeof PAGE_SECTION_LAYOUTS)[number]{
  const id=normalizePageSectionLayout(value);
  return PAGE_SECTION_LAYOUTS.find(layout=>layout.id===id)??PAGE_SECTION_LAYOUTS[0];
}

export function withPageSectionLayout<T extends {layout:PageSectionLayout}>(item:T,layout:PageSectionLayout):T{
  return {...item,layout};
}
