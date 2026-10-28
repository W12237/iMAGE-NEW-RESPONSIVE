import type { CSSProperties, ReactNode } from "react";
import type { PageSectionContent } from "@/content/home";
import { CUSTOM_BLOCK } from "../lib/page-blocks";
import { blockLabel, blockStyleAttributes, type BlockSettings } from "../lib/block-settings";
import { PageSections } from "./page-sections";

type Run={type:"builtin";kind:string;id:string;settings?:BlockSettings}|{type:"custom";id:string;sections:PageSectionContent[];startIndex:number};

/** Groups consecutive custom sections so they share one `.custom-sections` wrapper. */
export function planPageBlocks(blocks:PageSectionContent[]):Run[]{
  const runs:Run[]=[];let customIndex=0;
  for(const block of blocks){
    const kind=block.kind??CUSTOM_BLOCK;
    if(kind===CUSTOM_BLOCK){
      const last=runs[runs.length-1];
      if(last?.type==="custom")last.sections.push(block);
      else runs.push({type:"custom",id:block.id,sections:[block],startIndex:customIndex});
      customIndex++;
    }else runs.push({type:"builtin",kind,id:block.id,settings:block.settings});
  }
  return runs;
}

/**
 * Renders a page as an ordered list of blocks. `builtins` maps each built-in
 * block key to its rendered section. When `blocks` is undefined (no database),
 * the built-ins render in their default order.
 */
export function PageBlocks({blocks,builtins}:{blocks?:PageSectionContent[];builtins:Record<string,ReactNode>}){
  if(!blocks)return <>{Object.entries(builtins).map(([key,node])=><BlockSlot key={key}>{node}</BlockSlot>)}</>;
  return <>{planPageBlocks(blocks).map(run=>run.type==="custom"
    ?<PageSections key={run.id} sections={run.sections} startIndex={run.startIndex}/>
    :<BlockStyle key={run.id} settings={run.settings}>{builtins[run.kind]??null}</BlockStyle>)}</>;
}

function BlockSlot({children}:{children:ReactNode}){return <>{children}</>}

/** Applies a section's style settings via CSS variables on a `display:contents` wrapper. */
export function BlockStyle({settings,children}:{settings?:BlockSettings;children:ReactNode}){
  const {style,data,active}=blockStyleAttributes(settings);
  if(!active)return <>{children}</>;
  return <div className="pb-block" style={style as CSSProperties} {...data}>{children}</div>;
}

/** Label override for a built-in on this page, e.g. the projects section title. */
export function pageBlockLabel(blocks:PageSectionContent[]|undefined,kind:string,locale:string){
  return blockLabel(blocks?.find(block=>block.kind===kind)?.settings,locale);
}

/** Blocks for one page: undefined without a database (render defaults), otherwise the saved list. */
export function pageBlocksFor(copy:{customSections?:PageSectionContent[];pageSectionsByPage?:Record<string,PageSectionContent[]>},page:string):PageSectionContent[]|undefined{
  if(copy.customSections)return copy.customSections;
  return copy.pageSectionsByPage?(copy.pageSectionsByPage[page]??[]):undefined;
}
