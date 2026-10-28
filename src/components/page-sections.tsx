"use client";

import Image from "next/image";
import { Fragment, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import type { PageSectionContent } from "@/content/home";
import { normalizePageSectionLayout, type PageSectionLayout } from "../lib/page-section-layouts";
import { Reveal } from "./motion-reveal";
import { blockStyleAttributes } from "../lib/block-settings";

const legacyLayouts=new Set<PageSectionLayout>(["TEXT","IMAGE_LEFT","IMAGE_RIGHT","FULL_IMAGE"]);

export function PageSections({sections=[],startIndex=0}:{sections?:PageSectionContent[];startIndex?:number}){
  if(!sections.length)return null;
  return <div className="custom-sections">{sections.map((section,localIndex)=>{
    const index=startIndex+localIndex;
    const layout=normalizePageSectionLayout(section.layout);
    const normalizedSection={...section,layout};
    const node=legacyLayouts.has(layout)?<LegacySection section={normalizedSection} index={index}/>:<EditorialSection section={normalizedSection} index={index}/>;
    const {style,data,active}=blockStyleAttributes(section.settings);
    return active?<div key={section.id} className="pb-block" style={style as CSSProperties} {...data}>{node}</div>:<Fragment key={section.id}>{node}</Fragment>;
  })}</div>;
}

function LegacySection({section,index}:{section:PageSectionContent;index:number}){
  const image=section.image&&<div className="custom-section-media"><Image src={section.image} alt={section.imageAlt} fill sizes="(max-width: 800px) 100vw, 50vw"/></div>;
  const safeCta=safeCtaUrl(section.ctaUrl);
  const pathname=usePathname();
  const arrow=pathname?.startsWith("/ar")?"←":"→";
  return <section className={`custom-section custom-section--${section.layout.toLowerCase().replace("_","-")} stage-pad`} style={{backgroundColor:`rgb(${section.backgroundRgb})`}}>
    {section.layout==="FULL_IMAGE"&&image}
    <div className="custom-section-grid">{section.layout==="IMAGE_LEFT"&&image}<Reveal className="custom-section-copy"><span>{String(index+1).padStart(2,"0")}</span>{section.eyebrow&&<p className="kicker">{section.eyebrow}</p>}<h2>{section.title}</h2>{section.body&&<div className="custom-section-body">{section.body.split(/\n\s*\n/).map((p,i)=><p key={i}>{p}</p>)}</div>}{section.ctaLabel&&safeCta&&<a className="outline-cta" href={safeCta}>{section.ctaLabel}<b>{arrow}</b></a>}</Reveal>{section.layout==="IMAGE_RIGHT"&&image}</div>
  </section>;
}

function EditorialSection({section,index}:{section:PageSectionContent;index:number}){
  const layout=section.layout;
  const slug=layout.toLowerCase().replaceAll("_","-");
  const image=section.image&&<div className="custom-section-media"><Image src={section.image} alt={section.imageAlt} fill sizes="(max-width: 800px) 100vw, 60vw"/></div>;
  const copy=<SectionCopy section={section} index={index}/>;
  return <section className={`custom-section custom-section--${slug} stage-pad`} style={{backgroundColor:`rgb(${section.backgroundRgb})`}}>
    {layout==="EDITORIAL_PORTRAIT"&&<div className="custom-section-editorial-grid">{image}{copy}</div>}
    {layout==="OVERLAP_FEATURE"&&<div className={`custom-section-overlap-frame${image?"":" is-image-empty"}`}>{image}{copy}</div>}
    {layout==="MAGAZINE_FEATURE"&&<div className={`custom-section-magazine-grid${image?"":" is-image-empty"}`}>{copy}{image}</div>}
    {layout==="IMMERSIVE_BANNER"&&<div className={`custom-section-banner-frame${image?"":" is-image-empty"}`}>{image}{copy}</div>}
  </section>;
}

function SectionCopy({section,index}:{section:PageSectionContent;index:number}){
  const safeCta=safeCtaUrl(section.ctaUrl);
  const pathname=usePathname();
  const arrow=pathname?.startsWith("/ar")?"←":"→";
  return <Reveal className="custom-section-copy"><span>{String(index+1).padStart(2,"0")}</span>{section.eyebrow&&<p className="kicker">{section.eyebrow}</p>}<h2>{section.title}</h2>{section.body&&<div className="custom-section-body">{section.body.split(/\n\s*\n/).map((paragraph,paragraphIndex)=><p key={paragraphIndex}>{paragraph}</p>)}</div>}{section.ctaLabel&&safeCta&&<a className="outline-cta" href={safeCta}>{section.ctaLabel}<b>{arrow}</b></a>}</Reveal>;
}

function safeCtaUrl(url?:string){
  return url&&/^(?:https?:\/\/|mailto:|tel:|\/|#)/i.test(url)?url:undefined;
}
