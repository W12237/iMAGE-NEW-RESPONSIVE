"use client";

import { useState } from "react";
import { Bilingual, Check } from "./fields";
import { MediaField } from "./media-field";
import type { UploadedMedia } from "@/app/admin/actions";

type Block={id:string;enabled:boolean;eyebrowEn:string;eyebrowAr:string;titleEn:string;titleAr:string;bodyEn:string;bodyAr:string;imageUrl:string|null;imageAltEn:string|null;imageAltAr:string|null};
const blank=():Block=>({id:`new-${crypto.randomUUID()}`,enabled:true,eyebrowEn:"",eyebrowAr:"",titleEn:"",titleAr:"",bodyEn:"",bodyAr:"",imageUrl:"",imageAltEn:"",imageAltAr:""});

export function AboutContentEditor({initialBlocks,assets}:{initialBlocks:Block[];assets:UploadedMedia[]}){
  const [blocks,setBlocks]=useState(initialBlocks);
  const add=(source?:Block)=>setBlocks(current=>[...current,source?{...source,id:`new-${crypto.randomUUID()}`}:blank()]);
  const move=(index:number,direction:-1|1)=>setBlocks(current=>{const target=index+direction;if(target<0||target>=current.length)return current;const next=[...current];[next[index],next[target]]=[next[target],next[index]];return next});
  return <div className="magazine-editor"><div className="magazine-toolbar"><div><h2>Flexible page sections</h2><p className="hint">Add, remove, duplicate, hide, or reorder sections. Images are optional.</p></div><button type="button" className="secondary" onClick={()=>add()}>+ Add section</button></div>
    {blocks.length===0&&<div className="panel empty">No extra sections yet. The hero and timeline will still appear.</div>}
    {blocks.map((block,index)=><section className="panel magazine-panel" key={block.id}><input type="hidden" name="aboutBlockId" value={block.id}/><div className="section-title magazine-title"><div><span className="admin-kicker">Section {index+1}</span><h2>{block.titleEn||"Untitled section"}</h2></div><div className="magazine-actions"><button type="button" className="secondary compact" disabled={index===0} onClick={()=>move(index,-1)}>↑ Up</button><button type="button" className="secondary compact" disabled={index===blocks.length-1} onClick={()=>move(index,1)}>↓ Down</button><button type="button" className="secondary compact" onClick={()=>add(block)}>Duplicate</button><button type="button" className="media-remove compact" onClick={()=>setBlocks(current=>current.filter(item=>item.id!==block.id))}>Remove</button></div></div>
      <Check name={`aboutBlockEnabled_${block.id}`} label="Visible" checked={block.enabled}/><Bilingual base={`aboutBlockEyebrow_${block.id}`} label="Eyebrow" en={block.eyebrowEn} ar={block.eyebrowAr} required/><Bilingual base={`aboutBlockTitle_${block.id}`} label="Title" en={block.titleEn} ar={block.titleAr} required/><Bilingual base={`aboutBlockBody_${block.id}`} label="Body" en={block.bodyEn} ar={block.bodyAr} textarea required/><MediaField name={`aboutBlockImage_${block.id}`} label="Image (optional)" value={block.imageUrl??""} assets={assets} kind="IMAGE"/><Bilingual base={`aboutBlockImageAlt_${block.id}`} label="Image alt text (required when an image is used)" en={block.imageAltEn??""} ar={block.imageAltAr??""}/>
    </section>)}
  </div>;
}
