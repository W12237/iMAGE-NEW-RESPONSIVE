"use client";

import Image from "next/image";
import type { HomeContent } from "@/content/home";
import { SiteHeader } from "./site-header";
import { Footer } from "./homepage-experience";
import { PageBlocks, pageBlockLabel, pageBlocksFor } from "./page-blocks";
import { GlobalContactForm } from "./contact-form";
import { ProjectShowcase } from "./project-showcase";
import { SmoothScroll } from "./smooth-scroll";

export function DevelopmentsPageExperience({copy}:{copy:HomeContent}) {
  const lead=copy.projects[0];
  return <><SmoothScroll/><SiteHeader copy={copy} page="developments"/><main className="developments-page"><PageBlocks blocks={pageBlocksFor(copy,"developments")} builtins={{DEVELOPMENTS_HERO:<><header id="top" className="developments-hero stage-pad">
    {lead&&<div className="developments-hero-media"><Image src={lead.image} alt={lead.alt??lead.name} fill priority sizes="100vw"/></div>}
    <div className="developments-hero-shade"/>
    <div className="developments-hero-copy"><p><span>01</span>{copy.common.projects}</p><h1>{copy.locale==="ar"?"أماكن صُممت للحياة.":"Places shaped for living."}</h1><p>{copy.locale==="ar"?"استكشف مجتمعاتنا ووجهاتنا المختارة.":"Explore our selected communities and destinations."}</p></div>
  </header></>,DEVELOPMENTS_PROJECTS:<><ProjectShowcase copy={copy} label={pageBlockLabel(pageBlocksFor(copy,"developments"),"DEVELOPMENTS_PROJECTS",copy.locale)}/></>,CONTACT_FORM:<GlobalContactForm copy={copy}/>}}/></main><Footer copy={copy} page="developments"/></>;
}
