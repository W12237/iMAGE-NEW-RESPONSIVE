import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/content/home";
import { getPartnersPageContent } from "@/lib/content";
import { PartnersPageExperience } from "@/components/partners-page-experience";

export const dynamic="force-dynamic";
export function generateStaticParams(){return[{locale:"en"},{locale:"ar"}]}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const{locale}=await params;if(locale!=="en"&&locale!=="ar")return{};const copy=await getPartnersPageContent(locale);return{title:`${copy.partnersPage.eyebrow} — Image Developments`,description:copy.partnersPage.intro}}
export default async function PartnersPage({params}:{params:Promise<{locale:string}>}){const{locale}=await params;if(locale!=="en"&&locale!=="ar")notFound();const copy=await getPartnersPageContent(locale as Locale);return <PartnersPageExperience copy={copy}/>}
