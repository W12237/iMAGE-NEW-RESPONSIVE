"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { TeamPageContent } from "@/content/home";
import { SiteHeader } from "./site-header";
import { Footer } from "./homepage-experience";
import { PageBlocks, pageBlocksFor } from "./page-blocks";
import { GlobalContactForm } from "./contact-form";
import { Reveal } from "./motion-reveal";

export function TeamPageExperience({copy}:{copy:TeamPageContent}) {
  const reduce=useReducedMotion();
  const heroImage=copy.hero.image??copy.teamPage.members[0]?.image;
  return <><SiteHeader copy={copy} page="team"/><main className="team-page"><PageBlocks blocks={pageBlocksFor(copy,"team")} builtins={{TEAM_HERO:<><section id="top" className="team-hero stage-pad">
    {heroImage&&<motion.div className="team-hero-media" initial={{scale:reduce?1:1.06}} animate={{scale:1}} transition={{duration:reduce?0:1.4,ease:[.2,.7,.2,1]}}><Image src={heroImage} alt="" fill priority sizes="100vw"/></motion.div>}
    <div className="team-hero-shade"/>
    <div className="team-hero-copy"><p><span>01</span>{copy.teamPage.eyebrow}</p><h1>{copy.teamPage.title}</h1><div className="team-hero-intro"><span>{copy.locale==="ar"?"فريقنا":"Our team"}</span><p>{copy.teamPage.intro}</p></div></div>
  </section></>,TEAM_ROSTER:<><section className="team-roster stage-pad" aria-label={copy.teamPage.eyebrow}>
    <div className="team-roster-head"><span>02</span><p>{copy.locale==="ar"?"الأشخاص الذين يصنعون رؤيتنا":"The people shaping our perspective"}</p><strong>{String(copy.teamPage.members.length).padStart(2,"0")}</strong></div>
    {copy.teamPage.members.length?<div className={`team-grid ${copy.teamPage.members.length===1?"team-grid--single":""}`}>{copy.teamPage.members.map((member,index)=><Reveal className={`team-card team-card--${index%3}`} delay={(index%3)*.07} key={member.id}><div className="team-portrait"><Image src={member.image} alt={member.alt} fill sizes="(max-width: 800px) 100vw, 50vw"/></div><div className="team-card-meta"><span>{String(index+1).padStart(2,"0")}</span><div><h2>{member.name}</h2><p>{member.role}</p></div></div><p className="team-bio">{member.bio}</p></Reveal>)}</div>:<p className="team-empty">{copy.locale==="ar"?"سيتم الإعلان عن أعضاء الفريق قريباً.":"Team profiles will be announced soon."}</p>}
  </section></>,CONTACT_FORM:<GlobalContactForm copy={copy}/>}}/></main><Footer copy={copy} page="team"/></>;
}
