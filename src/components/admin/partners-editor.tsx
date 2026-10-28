"use client";
import { useEffect, useState } from "react";
import { Bilingual, Check } from "./fields";
import { MediaField } from "./media-field";
import type { UploadedMedia } from "@/app/admin/actions";

type Partner={id:string;nameEn:string;nameAr:string;descriptionEn:string|null;descriptionAr:string|null;logoUrl:string;logoAltEn:string;logoAltAr:string;websiteUrl:string|null;visible:boolean};
const blank=():Partner=>({id:`new-${crypto.randomUUID()}`,nameEn:"",nameAr:"",descriptionEn:"",descriptionAr:"",logoUrl:"",logoAltEn:"",logoAltAr:"",websiteUrl:"",visible:true});

export function PartnersEditor({initialPartners,assets}:{initialPartners:Partner[];assets:UploadedMedia[]}){
  const[partners,setPartners]=useState(initialPartners);

  useEffect(()=>{
    setPartners(initialPartners);
  },[initialPartners]);

  const move=(i:number,d:-1|1)=>setPartners(current=>{
    const t=i+d;
    if(t<0||t>=current.length)return current;
    const next=[...current];
    [next[i],next[t]]=[next[t],next[i]];
    return next;
  });

  return <div className="magazine-editor">
    <div className="magazine-toolbar">
      <div>
        <h2>Partners</h2>
        <p className="hint">Add partner logos, optional descriptions and website links, then arrange their display order.</p>
      </div>
      <button type="button" className="secondary" onClick={()=>setPartners(c=>[...c,blank()])}>+ Add partner</button>
    </div>
    {partners.length===0&&<div className="panel empty">No partners yet. Click "+ Add partner" above to add one.</div>}
    {partners.map((partner,index)=><section className="panel magazine-panel" key={partner.id}>
      <input type="hidden" name="partnerId" value={partner.id}/>
      <div className="section-title magazine-title">
        <div>
          <span className="admin-kicker">Partner {index+1}</span>
          <h2>{partner.nameEn||partner.nameAr||"New partner"}</h2>
        </div>
        <div className="magazine-actions">
          <button type="button" className="secondary compact" disabled={!index} onClick={()=>move(index,-1)}>↑ Up</button>
          <button type="button" className="secondary compact" disabled={index===partners.length-1} onClick={()=>move(index,1)}>↓ Down</button>
          <button type="button" className="media-remove compact" onClick={()=>setPartners(c=>c.filter(x=>x.id!==partner.id))}>Remove</button>
        </div>
      </div>
      <Check name={`partnerVisible_${partner.id}`} label="Visible" checked={partner.visible}/>
      <Bilingual base={`partnerName_${partner.id}`} label="Partner name" en={partner.nameEn} ar={partner.nameAr} required arRequired={false}/>
      <Bilingual base={`partnerDescription_${partner.id}`} label="Short description (optional)" en={partner.descriptionEn??""} ar={partner.descriptionAr??""} textarea/>
      <MediaField name={`partnerLogo_${partner.id}`} label="Logo" value={partner.logoUrl} assets={assets} kind="IMAGE" required/>
      <Bilingual base={`partnerLogoAlt_${partner.id}`} label="Logo alt text (optional)" en={partner.logoAltEn} ar={partner.logoAltAr} required={false}/>
      <label>Website URL (optional)<input type="text" name={`partnerWebsite_${partner.id}`} defaultValue={partner.websiteUrl??""} placeholder="https://example.com"/></label>
    </section>)}
  </div>;
}
