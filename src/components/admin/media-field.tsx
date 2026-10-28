"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { uploadHomepageMedia, type UploadedMedia } from "@/app/admin/actions";

const sizeLabel=(size:number)=>size>=1024*1024?`${(size/1024/1024).toFixed(1)} MB`:`${Math.max(1,Math.round(size/1024))} KB`;

export function MediaField({name,label,value="",assets:initialAssets,kind,required=false}:{name:string;label:string;value?:string;assets:UploadedMedia[];kind:"IMAGE"|"VIDEO";required?:boolean}){
  const initial=initialAssets.find(asset=>asset.url===value);
  const [selected,setSelected]=useState<UploadedMedia|undefined>(initial);
  const [externalValue,setExternalValue]=useState(initial?"":value);
  const [assets,setAssets]=useState(initialAssets);
  const [message,setMessage]=useState<string>();const [error,setError]=useState<string>();
  const [libraryOpen,setLibraryOpen]=useState(false);const [uploading,startUpload]=useTransition();
  const inputRef=useRef<HTMLInputElement>(null);const currentValue=selected?.url||externalValue;
  const accept=kind==="VIDEO"?"video/mp4,video/webm":"image/jpeg,image/png,image/webp,image/avif";

  function chooseFile(file?:File){
    if(!file)return;setError(undefined);setMessage(undefined);
    const allowed=kind==="VIDEO"?["video/mp4","video/webm"]:["image/jpeg","image/png","image/webp","image/avif"];
    const maxMb=kind==="VIDEO"?80:8;
    if(!allowed.includes(file.type)){setError(kind==="VIDEO"?"Unsupported format. Choose an MP4 or WebM video.":"Unsupported format. Choose a JPEG, PNG, WebP, or AVIF image.");return}
    if(file.size>maxMb*1024*1024){setError(kind==="VIDEO"?"Maximum video size is 80 MB.":"Maximum image size is 8 MB.");return}
    const data=new FormData();data.set("file",file);
    startUpload(async()=>{try{const result=await uploadHomepageMedia(data,kind);if(result.error){setError(result.error);return}if(result.asset){setSelected(result.asset);setExternalValue("");setAssets(current=>[result.asset!,...current.filter(asset=>asset.id!==result.asset!.id)]);setMessage("Upload complete. Selected for this field — save this page to publish this assignment.")}}catch{setError("Upload failed. Check your connection and try again.")}finally{if(inputRef.current)inputRef.current.value=""}});
  }
  function remove(){setSelected(undefined);setExternalValue("");setMessage("Assignment removed — save this page to persist the change.");setError(undefined)}

  return <div className="media-field">
    <input type="hidden" name={name} value={currentValue} required={required}/>
    <div className="media-field-heading"><strong>{label}</strong><span className={`media-kind ${kind.toLowerCase()}`}>{kind}</span></div>
    {currentValue?<div className="media-preview">{kind==="VIDEO"?<video src={currentValue} controls muted playsInline preload="metadata"/>:<Image src={currentValue} alt="" fill sizes="520px"/>}</div>:<p className="media-empty">No {kind.toLowerCase()} selected.</p>}
    {currentValue&&<div className="media-meta"><b>{selected?.filename||"Existing media"}</b><span>{selected?`${selected.mimeType} · ${sizeLabel(selected.size)}`:currentValue}</span></div>}
    <div className="media-actions"><button type="button" className="secondary" disabled={uploading} onClick={()=>inputRef.current?.click()}>{uploading?"Uploading…":currentValue?`Replace ${kind==="VIDEO"?"Video":"Image"}`:`Upload ${kind==="VIDEO"?"Video":"Image"}`}</button><button type="button" className="secondary" disabled={uploading} onClick={()=>setLibraryOpen(true)}>Choose From Media Library</button>{currentValue&&<button type="button" className="media-remove" disabled={uploading} onClick={remove}>Remove</button>}</div>
    <input ref={inputRef} className="visually-hidden" tabIndex={-1} type="file" accept={accept} onChange={event=>chooseFile(event.target.files?.[0])}/>
    {uploading&&<p className="media-status" role="status">Uploading… Please keep this page open.</p>}{message&&<p className="media-status success" role="status">{message}</p>}{error&&<p className="media-status error" role="alert">{error}</p>}
    {libraryOpen&&<div className="media-library-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setLibraryOpen(false)}}><div className="media-library-dialog" role="dialog" aria-modal="true" aria-label={`Choose ${label}`}><div className="section-title"><div><h3>Choose From Media Library</h3><p className="hint">Showing compatible {kind.toLowerCase()} media only.</p></div><button type="button" className="media-remove" onClick={()=>setLibraryOpen(false)}>Close</button></div><div className="media-library-options">{assets.length?assets.map(asset=><button type="button" key={asset.id} className={asset.url===currentValue?"selected":""} onClick={()=>{setSelected(asset);setExternalValue("");setMessage("Media selected — save this page to publish this assignment.");setError(undefined);setLibraryOpen(false)}}><span className="media-library-thumb">{kind==="VIDEO"?<video src={asset.url} muted playsInline preload="metadata"/>:<Image src={asset.url} alt="" fill sizes="200px"/>}</span><b>{asset.filename}</b><span>{asset.mimeType} · {sizeLabel(asset.size)}</span></button>):<p className="empty">No compatible media yet. Close this window and use Upload.</p>}</div></div></div>}
  </div>;
}
