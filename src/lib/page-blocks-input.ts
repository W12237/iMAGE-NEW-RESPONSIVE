import { normalizeRgb } from "./colors";
import { parseBlockSettings, supportsLabel } from "./block-settings";
import { isPageSectionLayout } from "./page-section-layouts";
import { CUSTOM_BLOCK, isBlockPage, isValidBlockKind } from "./page-blocks";

export type PageBlockRow={id:string;page:string;kind:string;layout:string;eyebrowEn:string;eyebrowAr:string;titleEn:string;titleAr:string;bodyEn:string;bodyAr:string;imageUrl:string|null;imageAltEn:string;imageAltAr:string;ctaLabelEn:string;ctaLabelAr:string;ctaUrl:string|null;backgroundRgb:string;settings:string;visible:boolean;sortOrder:number};

const text=(value:unknown)=>String(value??"").trim();

/**
 * Validates the CMS page-builder payload. Order in the array is the order on
 * the page. Built-in blocks keep only position and visibility; each built-in
 * may appear once per page. Custom blocks need a layout and both headings.
 */
export function parsePageBlocksInput(input:unknown):{rows:PageBlockRow[]}|{error:string}{
  if(!Array.isArray(input))return{error:"The section data is invalid."};
  const rows:PageBlockRow[]=[];const positions=new Map<string,number>();const builtinsSeen=new Set<string>();
  for(const value of input){
    if(!value||typeof value!=="object")return{error:"A section is invalid."};
    const x=value as Record<string,unknown>;
    const page=String(x.page??"");const kind=x.kind===undefined?CUSTOM_BLOCK:String(x.kind);
    if(!isBlockPage(page)||!isValidBlockKind(page,kind))return{error:"A section belongs to an unknown page or has an unknown type."};
    const rawId=String(x.id??"");const id=/^[a-zA-Z0-9_-]{8,}$/.test(rawId)?rawId:crypto.randomUUID();
    const sortOrder=positions.get(page)??0;positions.set(page,sortOrder+1);
    const visible=Boolean(x.visible);
    const parsedSettings=parseBlockSettings(x.settings);
    if(!supportsLabel(kind)){delete parsedSettings.labelEn;delete parsedSettings.labelAr}
    const settings=JSON.stringify(parsedSettings);
    if(kind!==CUSTOM_BLOCK){
      const key=`${page}:${kind}`;
      if(builtinsSeen.has(key))return{error:"A built-in section can only appear once on a page."};
      builtinsSeen.add(key);
      rows.push({id,page,kind,layout:"TEXT",eyebrowEn:"",eyebrowAr:"",titleEn:"",titleAr:"",bodyEn:"",bodyAr:"",imageUrl:null,imageAltEn:"",imageAltAr:"",ctaLabelEn:"",ctaLabelAr:"",ctaUrl:null,backgroundRgb:"255, 255, 255",settings,visible,sortOrder});
      continue;
    }
    const layout=String(x.layout??"");const titleEn=text(x.titleEn);const titleAr=text(x.titleAr);
    if(!isPageSectionLayout(layout)||!titleEn||!titleAr)return{error:"Every custom section needs a valid layout, and English and Arabic headings."};
    rows.push({id,page,kind,layout,eyebrowEn:text(x.eyebrowEn),eyebrowAr:text(x.eyebrowAr),titleEn,titleAr,bodyEn:text(x.bodyEn),bodyAr:text(x.bodyAr),imageUrl:text(x.imageUrl)||null,imageAltEn:text(x.imageAltEn),imageAltAr:text(x.imageAltAr),ctaLabelEn:text(x.ctaLabelEn),ctaLabelAr:text(x.ctaLabelAr),ctaUrl:text(x.ctaUrl)||null,backgroundRgb:normalizeRgb(x.backgroundRgb),settings,visible,sortOrder});
  }
  if(new Set(rows.map(row=>row.id)).size!==rows.length)return{error:"The section list contains duplicate IDs. Refresh and try again."};
  return{rows};
}
