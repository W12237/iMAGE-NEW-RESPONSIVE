import { prisma } from "@/lib/prisma";
import { ActionForm } from "@/components/admin/action-form";
import { PageSectionsEditor } from "@/components/admin/page-sections-editor";
import { normalizePageSectionLayout } from "@/lib/page-section-layouts";
import { normalizeBlockKind } from "@/lib/page-blocks";
import { parseBlockSettings } from "@/lib/block-settings";
import { savePageSections } from "../../actions";
export default async function SectionsAdmin(){const[sections,images]=await Promise.all([prisma.pageSection.findMany({orderBy:[{page:"asc"},{sortOrder:"asc"}]}),prisma.mediaAsset.findMany({where:{kind:"IMAGE"},orderBy:{createdAt:"desc"},select:{url:true}})]);return <><header className="page-head"><div><p>All public pages</p><h1>Page builder</h1><span>Build every page from sections: reorder, hide, remove, or add built-in and custom sections.</span></div></header><ActionForm action={savePageSections} className="admin-form" submitLabel="Save page layouts"><PageSectionsEditor imageUrls={images.map(x=>x.url)} initialSections={sections.map(x=>({...x,kind:normalizeBlockKind(x.kind),settings:parseBlockSettings(x.settings),layout:normalizePageSectionLayout(x.layout),imageUrl:x.imageUrl??"",ctaUrl:x.ctaUrl??""}))}/></ActionForm></>}
