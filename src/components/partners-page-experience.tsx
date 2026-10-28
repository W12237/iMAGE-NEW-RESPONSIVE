"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { PartnersPageContent } from "@/content/home";
import { SiteHeader } from "./site-header";
import { Footer } from "./homepage-experience";
import { PageBlocks, pageBlocksFor } from "./page-blocks";
import { GlobalContactForm } from "./contact-form";
import { Reveal } from "./motion-reveal";

export function PartnersPageExperience({copy}:{copy:PartnersPageContent}) {
  const reduce=useReducedMotion();
  const heroImage=copy.lifestyle.image??copy.projects[0]?.image??copy.hero.image;
  return <><SiteHeader copy={copy} page="partners"/><main className="partners-page"><PageBlocks blocks={pageBlocksFor(copy,"partners")} builtins={{PARTNERS_HERO:<><section className="partners-hero stage-pad">
    {heroImage&&<motion.div className="partners-hero-media" initial={{scale:reduce?1:1.06}} animate={{scale:1}} transition={{duration:reduce?0:1.4,ease:[.2,.7,.2,1]}}><Image src={heroImage} alt="" fill priority sizes="100vw"/></motion.div>}
    <div className="partners-hero-shade"/>
    <div className="partners-hero-copy"><p><span>01</span>{copy.partnersPage.eyebrow}</p><h1>{copy.partnersPage.title}</h1><div><span>{copy.locale==="ar"?"معاً":"Together"}</span><p>{copy.partnersPage.intro}</p></div></div>
  </section></>,PARTNERS_DIRECTORY:<><section className="partners-directory stage-pad" aria-label={copy.partnersPage.eyebrow}>
    <div className="partners-directory-head"><span>02</span><p>{copy.locale==="ar"?"شركات نثق بها":"Companies we trust"}</p><strong>{String(copy.partnersPage.partners.length).padStart(2,"0")}</strong></div>
    {copy.partnersPage.partners.length?<div className={`partners-grid ${copy.partnersPage.partners.length===1?"partners-grid--single":""}`}>{copy.partnersPage.partners.map((partner,index)=>{const content=<><div className="partner-logo"><Image src={partner.logo} alt={partner.alt} fill sizes="(max-width: 800px) 70vw, 30vw"/></div><div className="partner-meta"><span>{String(index+1).padStart(2,"0")}</span><div><h2>{partner.name}</h2>{partner.description&&<p>{partner.description}</p>}</div>{partner.website&&<b aria-hidden="true">{copy.locale === "ar" ? "←" : "→"}</b>}</div></>;return <Reveal className="partner-card" delay={(index%3)*.06} key={partner.id}>{partner.website?<a href={partner.website} target="_blank" rel="noopener noreferrer" aria-label={`${partner.name} ${copy.locale === "ar" ? "←" : "→"}`}>{content}</a>:<div>{content}</div>}</Reveal>})}</div>:<p className="partners-empty">{copy.locale==="ar"?"سيتم الإعلان عن شركائنا قريباً.":"Our partner network will be announced soon."}</p>}
  </section></>,CONTACT_FORM:<GlobalContactForm copy={copy}/>}}/></main><Footer copy={copy} page="partners"/></>;
}
