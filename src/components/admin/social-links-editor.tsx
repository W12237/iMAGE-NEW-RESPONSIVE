"use client";

import { useState } from "react";

export type EditableSocialLink = { id: string; name: string; url: string; svgIcon: string };

const blankLink = (): EditableSocialLink => ({ id: `new-${crypto.randomUUID()}`, name: "", url: "", svgIcon: "" });

export function SocialLinksEditor({ initialLinks }: { initialLinks: EditableSocialLink[] }) {
  const [links, setLinks] = useState(initialLinks);
  const update = (id: string, key: "name" | "url" | "svgIcon", value: string) => setLinks(current => current.map(link => link.id === id ? { ...link, [key]: value } : link));
  function move(index: number, direction: -1 | 1) { const target=index+direction;if(target<0||target>=links.length)return;setLinks(current=>{const next=[...current];[next[index],next[target]]=[next[target],next[index]];return next}) }
  return <section className="panel social-editor"><div className="section-title social-editor-title"><div><h2>Social links</h2><p className="hint">Add any network with its name, public URL, and complete SVG markup. The order here is used in the footer.</p></div><button type="button" className="secondary" onClick={()=>setLinks(current=>[...current,blankLink()])}>+ Add social link</button></div>{links.length===0&&<p className="empty">No social links yet.</p>}{links.map((link,index)=><div className="social-editor-row" key={link.id}><input type="hidden" name="socialId" value={link.id}/><label>Name<input name={`socialName_${link.id}`} value={link.name} onChange={event=>update(link.id,"name",event.target.value)} placeholder="TikTok" required/></label><label>URL<input name={`socialUrl_${link.id}`} value={link.url} onChange={event=>update(link.id,"url",event.target.value)} placeholder="https://tiktok.com/@account" type="url" required/></label><label className="social-svg-field">SVG icon<textarea name={`socialSvg_${link.id}`} value={link.svgIcon} onChange={event=>update(link.id,"svgIcon",event.target.value)} placeholder={'<svg viewBox="0 0 24 24">…</svg>'} required/></label><div className="social-editor-actions"><button type="button" className="secondary compact" disabled={index===0} onClick={()=>move(index,-1)}>↑ Up</button><button type="button" className="secondary compact" disabled={index===links.length-1} onClick={()=>move(index,1)}>↓ Down</button><button type="button" className="media-remove compact" onClick={()=>setLinks(current=>current.filter(item=>item.id!==link.id))}>Remove</button></div></div>)}</section>;
}
