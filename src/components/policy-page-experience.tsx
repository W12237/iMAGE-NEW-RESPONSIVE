import type { ReactNode } from "react";
import type { PolicyPageContent } from "@/content/home";
import { SiteHeader } from "./site-header";
import { Footer } from "./homepage-experience";
import { PageBlocks, pageBlocksFor } from "./page-blocks";
import { GlobalContactForm } from "./contact-form";

const urlPattern=/(https?:\/\/[^\s]+)/;
function linkedText(text:string):ReactNode[]{return text.split(urlPattern).map((part,index)=>urlPattern.test(part)?<a key={index} href={part} target="_blank" rel="noopener noreferrer">{part}</a>:part)}
function PolicyBody({body}:{body:string}){
  const blocks=body.trim().split(/\n\s*\n/).filter(Boolean);
  return <div className="policy-rich-copy">{blocks.map((block,index)=>{const lines=block.split("\n").map(line=>line.trim()).filter(Boolean);const list=lines.length>0&&lines.every(line=>/^[-*]\s+/.test(line));return list?<ul key={index}>{lines.map((line,item)=><li key={item}>{linkedText(line.replace(/^[-*]\s+/,""))}</li>)}</ul>:<p key={index}>{lines.map((line,item)=><span key={item}>{linkedText(line)}{item<lines.length-1&&<br/>}</span>)}</p>})}</div>;
}

export function PolicyPageExperience({copy}:{copy:PolicyPageContent}){
  const updatedLabel=copy.locale==="ar"?"آخر تحديث":"Last updated";
  const contentsLabel=copy.locale==="ar"?"المحتويات":"Contents";
  return <><SiteHeader copy={copy} page="policy"/><main className="policy-page"><PageBlocks blocks={pageBlocksFor(copy,"policy")} builtins={{POLICY_HERO:<><header id="top" className="policy-hero stage-pad"><div className="policy-hero-orbit"/><div className="policy-hero-copy"><p><span>01</span>{copy.policyPage.eyebrow}</p><h1>{copy.policyPage.title}</h1><div className="policy-hero-meta"><p>{copy.policyPage.intro}</p>{copy.policyPage.lastUpdated&&<span>{updatedLabel}<strong>{copy.policyPage.lastUpdated}</strong></span>}</div></div></header></>,POLICY_BODY:<><section className="policy-layout stage-pad"><aside className="policy-toc"><span>02</span><p>{contentsLabel}</p><nav>{copy.policyPage.sections.map((section,index)=><a href={`#policy-${section.id}`} key={section.id}><b>{String(index+1).padStart(2,"0")}</b>{section.title}</a>)}</nav></aside><div className="policy-content">{copy.policyPage.sections.length?copy.policyPage.sections.map((section,index)=><article id={`policy-${section.id}`} className="policy-section" key={section.id}><span>{String(index+1).padStart(2,"0")}</span><div><h2>{section.title}</h2><PolicyBody body={section.body}/></div></article>):<p className="policy-empty">{copy.locale==="ar"?"سيتم نشر تفاصيل السياسة قريباً.":"Policy details will be published soon."}</p>}</div></section></>,CONTACT_FORM:<GlobalContactForm copy={copy}/>}}/></main><Footer copy={copy} page="policy"/></>;
}
