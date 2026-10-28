/**
 * Per-section style settings edited in the page builder (Shopify-style section
 * settings). Stored as JSON in PageSection.settings. Every field is optional;
 * an unset field keeps the design's responsive default.
 */
export type BlockSettings={
  /** Headings (h1–h3) on desktop and tablet, px. */
  headingSize?:number;
  /** Headings on phones (≤800px), px. */
  headingSizeMobile?:number;
  /** Paragraph and list text, px. */
  bodySize?:number;
  /** Small uppercase labels / eyebrows, px. */
  labelSize?:number;
  /** Replaces the section label text where the section supports it. */
  labelEn?:string;
  labelAr?:string;
};

export const SIZE_LIMITS={min:10,max:240};
const SIZE_KEYS=["headingSize","headingSizeMobile","bodySize","labelSize"] as const;
const TEXT_KEYS=["labelEn","labelAr"] as const;

/** Built-in sections whose label text can be replaced from the page builder. */
export const LABEL_BLOCKS:Record<string,{en:string;ar:string}>={
  HOME_PROJECTS:{en:"Projects",ar:"المشاريع"},
  DEVELOPMENTS_PROJECTS:{en:"Projects",ar:"المشاريع"},
};

export function supportsLabel(kind:string){return Object.prototype.hasOwnProperty.call(LABEL_BLOCKS,kind)}

/** Accepts a JSON string or object; drops anything invalid. */
export function parseBlockSettings(raw:unknown):BlockSettings{
  let value:unknown=raw;
  if(typeof raw==="string"){try{value=JSON.parse(raw||"{}")}catch{return{}}}
  if(!value||typeof value!=="object"||Array.isArray(value))return{};
  const input=value as Record<string,unknown>;const out:BlockSettings={};
  for(const key of SIZE_KEYS){
    const raw=input[key];if(raw===""||raw===null||raw===undefined)continue;
    const n=Number(raw);if(Number.isInteger(n)&&n>=SIZE_LIMITS.min&&n<=SIZE_LIMITS.max)out[key]=n;
  }
  for(const key of TEXT_KEYS){const text=String(input[key]??"").trim().slice(0,120);if(text)out[key]=text}
  return out;
}

export function serializeBlockSettings(settings:BlockSettings){return JSON.stringify(parseBlockSettings(settings))}

/** Label override for the given locale, if one is set. */
export function blockLabel(settings:BlockSettings|undefined,locale:string){
  return (locale==="ar"?settings?.labelAr:settings?.labelEn)||undefined;
}

/** Attributes for the `.pb-block` wrapper that applies the settings through CSS variables. */
export function blockStyleAttributes(settings:BlockSettings|undefined){
  const style:Record<string,string>={};const data:Record<string,string>={};
  const set=(key:keyof BlockSettings,variable:string,attr:string)=>{const v=settings?.[key];if(typeof v==="number"){style[variable]=`${v}px`;data[attr]=""}};
  set("headingSize","--pb-heading","data-heading");
  set("headingSizeMobile","--pb-heading-mobile","data-heading-mobile");
  set("bodySize","--pb-body","data-body");
  set("labelSize","--pb-label","data-label");
  return{style,data,active:Object.keys(style).length>0};
}
