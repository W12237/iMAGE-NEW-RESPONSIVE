"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { hexToRgb, normalizeRgb, rgbToHex } from "@/lib/colors";
import { getPageSectionLayout, PAGE_SECTION_LAYOUTS, type PageSectionLayout, withPageSectionLayout } from "@/lib/page-section-layouts";
import { LABEL_BLOCKS, SIZE_LIMITS, supportsLabel, type BlockSettings } from "@/lib/block-settings";
import { CUSTOM_BLOCK, getBuiltinBlock, isBuiltinKind, missingBuiltinBlocks, type BuiltinBlockDefinition } from "@/lib/page-blocks";

export type EditablePageSection={id:string;page:string;kind:string;layout:PageSectionLayout;eyebrowEn:string;eyebrowAr:string;titleEn:string;titleAr:string;bodyEn:string;bodyAr:string;imageUrl:string;imageAltEn:string;imageAltAr:string;ctaLabelEn:string;ctaLabelAr:string;ctaUrl:string;backgroundRgb:string;settings:BlockSettings;visible:boolean};

const pages=[
  {key:"home",label:"Homepage"},{key:"about",label:"About us"},{key:"history",label:"History"},{key:"developments",label:"Projects"},{key:"journal",label:"Journal"},{key:"team",label:"Team"},{key:"partners",label:"Partners"},{key:"policy",label:"Policy"},{key:"terms",label:"Terms"},{key:"contact",label:"Contact"},
] as const;

const blank=(page:string):EditablePageSection=>({id:crypto.randomUUID(),page,kind:CUSTOM_BLOCK,layout:"TEXT",eyebrowEn:"",eyebrowAr:"",titleEn:"",titleAr:"",bodyEn:"",bodyAr:"",imageUrl:"",imageAltEn:"",imageAltAr:"",ctaLabelEn:"",ctaLabelAr:"",ctaUrl:"",backgroundRgb:"255, 255, 255",settings:{},visible:true});
const builtin=(page:string,kind:string):EditablePageSection=>({...blank(page),kind});

export function PageSectionsEditor({initialSections,imageUrls}:{initialSections:EditablePageSection[];imageUrls:string[]}){
  const[items,setItems]=useState(initialSections);
  const[activePage,setActivePage]=useState<(typeof pages)[number]["key"]>("home");
  const[openIds,setOpenIds]=useState<Set<string>>(()=>new Set());
  const pageItems=useMemo(()=>items.map((item,index)=>({item,index})).filter(({item})=>item.page===activePage),[items,activePage]);
  const available=missingBuiltinBlocks(activePage,pageItems.map(({item})=>item.kind));
  const toggleOpen=(id:string,open?:boolean)=>setOpenIds(current=>{const next=new Set(current);if(open??!next.has(id))next.add(id);else next.delete(id);return next});
  const update=(index:number,patch:Partial<EditablePageSection>)=>setItems(current=>current.map((item,itemIndex)=>itemIndex===index?{...item,...patch}:item));
  /** Inserts after the last block of the active page, i.e. at the bottom of that page. */
  const insert=(entry:EditablePageSection)=>setItems(current=>{const lastIndex=current.reduce((last,item,index)=>item.page===entry.page?index:last,-1);const next=[...current];next.splice(lastIndex+1,0,entry);return next});
  const addCustom=()=>{const entry=blank(activePage);insert(entry);toggleOpen(entry.id,true)};
  const addBlock=(value:string)=>{if(!value)return;if(value===CUSTOM_BLOCK)addCustom();else insert(builtin(activePage,value))};
  const duplicate=(index:number)=>setItems(current=>{const source=current[index];const copy={...source,id:crypto.randomUUID(),titleEn:`${source.titleEn} (copy)`,titleAr:`${source.titleAr} (نسخة)`};const next=[...current];next.splice(index+1,0,copy);return next});
  const remove=(index:number)=>setItems(current=>current.filter((_,itemIndex)=>itemIndex!==index));
  const move=(visibleIndex:number,direction:number)=>setItems(current=>{const targetVisibleIndex=visibleIndex+direction;if(targetVisibleIndex<0||targetVisibleIndex>=pageItems.length)return current;const from=pageItems[visibleIndex].index;const to=pageItems[targetVisibleIndex].index;const next=[...current];[next[from],next[to]]=[next[to],next[from]];return next});

  const activeLabel=pages.find(page=>page.key===activePage)?.label;
  const previewPath=activePage==="home"?"/en":`/en/${activePage}`;

  return <section className="panel page-sections-manager">
    <div className="section-title"><div><h2>Page builder</h2><p className="hint">Every section of every page, top to bottom. Add, remove, hide and reorder built-in sections and your own custom sections, then save once. Built-in sections keep their content in their own CMS screen.</p></div><div className="page-section-toolbar"><Link className="secondary" href={previewPath} target="_blank">Preview {activeLabel}</Link><AddMenu available={available} onAdd={addBlock}/></div></div>
    <nav className="page-section-tabs" aria-label="Choose a page">{pages.map(page=>{const count=items.filter(item=>item.page===page.key).length;return <button type="button" className={activePage===page.key?"active":""} aria-pressed={activePage===page.key} onClick={()=>setActivePage(page.key)} key={page.key}><span>{page.label}</span><b>{count}</b></button>})}</nav>
    <input type="hidden" name="pageSections" value={JSON.stringify(items)}/>
    <datalist id="section-media-options">{imageUrls.map(url=><option value={url} key={url}/>)}</datalist>
    <div className="page-section-summary"><strong>{activeLabel}</strong><span>{pageItems.length} section{pageItems.length===1?"":"s"} · shown on the website in this order</span></div>
    <div className="page-builder-fixed">Header · fixed on every page</div>
    <div className="repeat-list">{pageItems.map(({item:x,index},visibleIndex)=>{
      const definition=isBuiltinKind(x.kind)?getBuiltinBlock(x.page,x.kind):undefined;
      const open=openIds.has(x.id);const styleOpen=openIds.has(`${x.id}:style`);const styled=Object.keys(x.settings??{}).length>0;
      const style=styleOpen&&<StylePanel kind={x.kind} value={x.settings??{}} onChange={settings=>update(index,{settings})}/>;
      const controls=<div><button type="button" onClick={()=>move(visibleIndex,-1)} disabled={!visibleIndex} aria-label="Move section up">↑</button><button type="button" onClick={()=>move(visibleIndex,1)} disabled={visibleIndex===pageItems.length-1} aria-label="Move section down">↓</button>{!definition&&<button type="button" onClick={()=>toggleOpen(x.id)} aria-expanded={open}>{open?"Close":"Edit"}</button>}<button type="button" onClick={()=>toggleOpen(`${x.id}:style`)} aria-expanded={styleOpen}>{styleOpen?"Close style":"Style"}{styled?" •":""}</button>{!definition&&<button type="button" onClick={()=>duplicate(index)}>Duplicate</button>}<button type="button" className="danger" onClick={()=>remove(index)}>Remove</button></div>;
      const visibility=<label className="check"><input type="checkbox" checked={x.visible} onChange={event=>update(index,{visible:event.target.checked})}/><span>Visible on website</span></label>;
      if(definition)return <article className={`repeat-card page-builder-builtin ${x.visible?"":"is-hidden"}`} key={x.id}>
        <div className="repeat-head"><div className="page-section-name"><span>{String(visibleIndex+1).padStart(2,"0")}</span><strong>{definition.label}</strong><em className="page-builder-badge">Built-in</em>{!x.visible&&<em>Hidden</em>}</div>{controls}</div>
        <p className="hint">{definition.description} <Link href={definition.editHref}>Edit its content →</Link></p>
        {style}
        {visibility}
      </article>;
      return <article className={`repeat-card ${x.visible?"":"is-hidden"}`} key={x.id}>
        <div className="repeat-head"><div className="page-section-name"><span>{String(visibleIndex+1).padStart(2,"0")}</span><strong>{x.titleEn||`New section ${visibleIndex+1}`}</strong><em className="page-builder-badge">{getPageSectionLayout(x.layout).label}</em>{!x.visible&&<em>Hidden</em>}</div>{controls}</div>
        {open?<>
          <div className="bilingual"><label>Page<select value={x.page} onChange={event=>update(index,{page:event.target.value})}>{pages.map(page=><option key={page.key} value={page.key}>{page.label}</option>)}</select></label><label>Layout<select value={x.layout} onChange={event=>update(index,withPageSectionLayout(x,event.target.value as PageSectionLayout))}>{PAGE_SECTION_LAYOUTS.map(layout=><option key={layout.id} value={layout.id}>{layout.label}</option>)}</select><small className="hint">{getPageSectionLayout(x.layout).description} {getPageSectionLayout(x.layout).imageGuidance}</small></label></div>
          <Bi label="Eyebrow" a={x.eyebrowEn} b={x.eyebrowAr} setA={value=>update(index,{eyebrowEn:value})} setB={value=>update(index,{eyebrowAr:value})}/>
          <Bi label="Heading" a={x.titleEn} b={x.titleAr} required setA={value=>update(index,{titleEn:value})} setB={value=>update(index,{titleAr:value})}/>
          <Bi label="Body" a={x.bodyEn} b={x.bodyAr} area setA={value=>update(index,{bodyEn:value})} setB={value=>update(index,{bodyAr:value})}/>
          <label>Image URL<input list="section-media-options" value={x.imageUrl} onChange={event=>update(index,{imageUrl:event.target.value})}/></label>
          <Bi label="Image alt" a={x.imageAltEn} b={x.imageAltAr} setA={value=>update(index,{imageAltEn:value})} setB={value=>update(index,{imageAltAr:value})}/>
          <Bi label="Button label" a={x.ctaLabelEn} b={x.ctaLabelAr} setA={value=>update(index,{ctaLabelEn:value})} setB={value=>update(index,{ctaLabelAr:value})}/>
          <div className="bilingual"><label>Button URL<input value={x.ctaUrl} placeholder="/en/contact or https://…" onChange={event=>update(index,{ctaUrl:event.target.value})}/></label><label>Background color<span className="color-field"><input type="color" value={rgbToHex(x.backgroundRgb)} onChange={event=>update(index,{backgroundRgb:hexToRgb(event.target.value)})}/><input value={x.backgroundRgb} aria-label="Background RGB" placeholder="255, 255, 255" onBlur={()=>update(index,{backgroundRgb:normalizeRgb(x.backgroundRgb)})} onChange={event=>update(index,{backgroundRgb:event.target.value})}/></span><small className="hint">RGB, rgb(…), or hex. Blank uses white.</small></label></div>
        </>:<RequiredHeadings x={x} onOpen={()=>toggleOpen(x.id,true)}/>}
        {style}
        {visibility}
      </article>;
    })}</div>
    {!pageItems.length&&<div className="empty page-sections-empty"><p>This page is empty. Add a section to start building it.</p><AddMenu available={available} onAdd={addBlock}/></div>}
    <div className="page-builder-fixed">Footer · fixed on every page</div>
  </section>;
}

/** Collapsed custom card: keeps the required headings in the form so browser validation still catches blanks. */
function RequiredHeadings({x,onOpen}:{x:EditablePageSection;onOpen:()=>void}){
  const missing=!x.titleEn.trim()||!x.titleAr.trim();
  return <p className="hint">{x.bodyEn?`${x.bodyEn.slice(0,140)}${x.bodyEn.length>140?"…":""}`:"Custom content section."}{missing&&<> <button type="button" className="secondary" onClick={onOpen}>Add the English and Arabic heading</button></>}</p>;
}

/** Shopify-style section settings: font sizes and, where supported, the section label. */
function StylePanel({kind,value,onChange}:{kind:string;value:BlockSettings;onChange:(value:BlockSettings)=>void}){
  const setSize=(key:"headingSize"|"headingSizeMobile"|"bodySize"|"labelSize",raw:string)=>{const next={...value};const n=Number(raw);if(raw===""||!Number.isFinite(n))delete next[key];else next[key]=Math.round(n);onChange(next)};
  const setText=(key:"labelEn"|"labelAr",text:string)=>{const next={...value};if(text)next[key]=text;else delete next[key];onChange(next)};
  const size=(key:"headingSize"|"headingSizeMobile"|"bodySize"|"labelSize",label:string,hint:string)=><label>{label}<input type="number" min={SIZE_LIMITS.min} max={SIZE_LIMITS.max} placeholder="Design default" value={value[key]??""} onChange={event=>setSize(key,event.target.value)}/><small className="hint">{hint}</small></label>;
  const defaults=LABEL_BLOCKS[kind];
  return <div className="page-builder-style">
    <p className="page-builder-style-title">Section style <small className="hint">Pixels. Leave blank to keep the design default. Applies to this section only.</small></p>
    {supportsLabel(kind)&&<div className="bilingual"><label>Section label — English<input value={value.labelEn??""} placeholder={defaults?.en} onChange={event=>setText("labelEn",event.target.value)}/></label><label>Section label — العربية<input dir="rtl" value={value.labelAr??""} placeholder={defaults?.ar} onChange={event=>setText("labelAr",event.target.value)}/></label></div>}
    <div className="bilingual">{size("headingSize","Heading size — desktop","Titles and names in this section.")}{size("headingSizeMobile","Heading size — mobile","Phones up to 800px wide.")}</div>
    <div className="bilingual">{size("bodySize","Body text size","Paragraphs and lists.")}{size("labelSize","Label size","Small uppercase labels, e.g. “02 Selected developments”.")}</div>
    {Object.keys(value).length>0&&<button type="button" className="secondary" onClick={()=>onChange({})}>Reset to design defaults</button>}
  </div>;
}

function AddMenu({available,onAdd}:{available:BuiltinBlockDefinition[];onAdd:(value:string)=>void}){
  return <select className="secondary page-builder-add" value="" aria-label="Add a section" onChange={event=>{onAdd(event.target.value);event.target.value=""}}>
    <option value="">+ Add section…</option>
    <option value={CUSTOM_BLOCK}>Custom section (choose from 8 layouts)</option>
    {available.length>0&&<optgroup label="Built-in sections removed from this page">{available.map(block=><option key={block.key} value={block.key}>{block.label}</option>)}</optgroup>}
  </select>;
}

function Bi({label,a,b,setA,setB,area=false,required=false}:{label:string;a:string;b:string;setA:(value:string)=>void;setB:(value:string)=>void;area?:boolean;required?:boolean}){return <div className="bilingual"><label>{label} — English{area?<textarea value={a} required={required} onChange={event=>setA(event.target.value)}/>:<input value={a} required={required} onChange={event=>setA(event.target.value)}/>}</label><label>{label} — العربية{area?<textarea dir="rtl" value={b} required={required} onChange={event=>setB(event.target.value)}/>:<input dir="rtl" value={b} required={required} onChange={event=>setB(event.target.value)}/>}</label></div>}
