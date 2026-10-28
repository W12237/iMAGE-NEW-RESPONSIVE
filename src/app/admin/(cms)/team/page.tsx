import { prisma } from "@/lib/prisma";
import { ActionForm } from "@/components/admin/action-form";
import { Bilingual } from "@/components/admin/fields";
import { TeamMembersEditor } from "@/components/admin/team-members-editor";
import { saveTeam } from "../../actions";

export default async function TeamAdmin(){const[home,members,images]=await Promise.all([prisma.homepage.findUniqueOrThrow({where:{id:"homepage"}}),prisma.teamMember.findMany({where:{homepageId:"homepage"},orderBy:{sortOrder:"asc"}}),prisma.mediaAsset.findMany({where:{kind:"IMAGE"},orderBy:{createdAt:"desc"},select:{id:true,url:true,filename:true,mimeType:true,size:true,kind:true}})]);return <><header className="page-head"><div><p>Standalone page</p><h1>Team page</h1><span>Manage the bilingual introduction and every team profile.</span></div></header><ActionForm action={saveTeam} className="admin-form" submitLabel="Save Team Page"><section className="panel"><h2>Page introduction</h2><Bilingual base="teamEyebrow" label="Eyebrow" en={home.teamEyebrowEn} ar={home.teamEyebrowAr} required/><Bilingual base="teamTitle" label="Heading" en={home.teamTitleEn} ar={home.teamTitleAr} textarea required/><Bilingual base="teamIntro" label="Introduction" en={home.teamIntroEn} ar={home.teamIntroAr} textarea required/></section><TeamMembersEditor initialMembers={members} assets={images}/></ActionForm></>}
