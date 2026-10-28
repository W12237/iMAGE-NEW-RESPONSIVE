"use client";

import { useState } from "react";
import { Bilingual, Field } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media-field";
import type { UploadedMedia } from "@/app/admin/actions";

type MagazinePage = {
  id: string;
  year: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  imageUrl: string;
  imageAltEn: string;
  imageAltAr: string;
};

const blankPage = (): MagazinePage => ({
  id: `new-${crypto.randomUUID()}`,
  year: "",
  titleEn: "",
  titleAr: "",
  bodyEn: "",
  bodyAr: "",
  imageUrl: "",
  imageAltEn: "",
  imageAltAr: "",
});

export function AboutMagazineEditor({ initialPages, assets }: { initialPages: MagazinePage[]; assets: UploadedMedia[] }) {
  const [pages, setPages] = useState(initialPages);

  function addPage(source?: MagazinePage) {
    setPages((current) => [...current, source ? { ...source, id: `new-${crypto.randomUUID()}` } : blankPage()]);
  }

  function movePage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= pages.length) return;
    setPages((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removePage(id: string) {
    setPages((current) => current.filter((page) => page.id !== id));
  }

  return <div className="magazine-editor">
    <div className="magazine-toolbar">
      <div><h2>Magazine pages</h2><p className="hint">Add as many pages as you need. Their order below is their order on the website.</p></div>
      <button type="button" className="secondary" onClick={() => addPage()}>+ Add magazine page</button>
    </div>
    {pages.length === 0 && <div className="panel empty">No magazine pages yet. Add your first page to show the About timeline.</div>}
    {pages.map((item, index) => <section className="panel magazine-panel" key={item.id}>
      <input type="hidden" name="aboutItemId" value={item.id}/>
      <input type="hidden" name={`aboutSort_${item.id}`} value={index}/>
      <div className="section-title magazine-title">
        <div><span className="admin-kicker">Page {index + 1} of {pages.length}</span><h2>Magazine page {index + 1}</h2></div>
        <div className="magazine-actions">
          <button type="button" className="secondary compact" disabled={index === 0} onClick={() => movePage(index, -1)}>↑ Up</button>
          <button type="button" className="secondary compact" disabled={index === pages.length - 1} onClick={() => movePage(index, 1)}>↓ Down</button>
          <button type="button" className="secondary compact" onClick={() => addPage(item)}>Duplicate</button>
          <button type="button" className="media-remove compact" onClick={() => removePage(item.id)}>Remove</button>
        </div>
      </div>
      <Field name={`aboutYear_${item.id}`} label="Year" value={item.year} required/>
      <Bilingual base={`aboutItemTitle_${item.id}`} label="Title" en={item.titleEn} ar={item.titleAr} required/>
      <Bilingual base={`aboutItemBody_${item.id}`} label="Story" en={item.bodyEn} ar={item.bodyAr} textarea required/>
      <MediaField name={`aboutImage_${item.id}`} label="Image" value={item.imageUrl} assets={assets} kind="IMAGE" required/>
      <Bilingual base={`aboutImageAlt_${item.id}`} label="Image alt text" en={item.imageAltEn} ar={item.imageAltAr} required/>
    </section>)}
    <button type="button" className="secondary magazine-add-bottom" onClick={() => addPage()}>+ Add another magazine page</button>
  </div>;
}
