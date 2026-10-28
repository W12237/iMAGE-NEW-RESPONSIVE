import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ActionForm } from "@/components/admin/action-form";
import { Field } from "@/components/admin/fields";
import { deleteMedia, uploadMedia } from "../../actions";

export default async function Media() {
  const assets = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" } });
  return <>
    <header className="page-head"><div><p>Library</p><h1>Media</h1><span>CMS-managed images and video for the public experience.</span></div></header>
    <ActionForm action={uploadMedia} className="admin-form"><section className="panel"><h2>Upload media</h2><label>Image or video<input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" required/></label><div className="bilingual"><Field name="altEn" label="Alt text — English"/><Field name="altAr" label="Alt text — العربية" dir="rtl"/></div><p className="hint">JPEG, PNG, WebP or AVIF up to 8 MB; MP4 or WebM up to 80 MB.</p></section></ActionForm>
    <section className="media-grid">{assets.map(a=><article key={a.id}><div>{a.kind === "VIDEO" ? <video src={a.url} controls muted playsInline preload="metadata"/> : <Image src={a.url} alt={a.altEn??""} fill sizes="240px"/>}</div><b>{a.filename}</b><code>{a.url}</code><small>{a.mimeType} · {Math.round(a.size/1024)} KB</small><ActionForm action={deleteMedia} submitLabel="Delete unused media"><input type="hidden" name="id" value={a.id}/></ActionForm></article>)}</section>
    {!assets.length&&<p className="empty">No uploaded media yet.</p>}
  </>;
}
