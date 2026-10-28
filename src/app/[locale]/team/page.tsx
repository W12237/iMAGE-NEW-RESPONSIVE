import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/content/home";
import { getTeamPageContent } from "@/lib/content";
import { TeamPageExperience } from "@/components/team-page-experience";

export const dynamic="force-dynamic";
export function generateStaticParams(){return[{locale:"en"},{locale:"ar"}]}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const{locale}=await params;if(locale!=="en"&&locale!=="ar")return{};const copy=await getTeamPageContent(locale);return{title:`${copy.teamPage.eyebrow} — Image Developments`,description:copy.teamPage.intro}}
export default async function TeamPage({params}:{params:Promise<{locale:string}>}){const{locale}=await params;if(locale!=="en"&&locale!=="ar")notFound();const copy=await getTeamPageContent(locale as Locale);return <TeamPageExperience copy={copy}/>}
