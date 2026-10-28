import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/content/home";
import { getHistoryPageContent } from "@/lib/content";
import { HistoryPageExperience } from "@/components/history-page-experience";
export const dynamic="force-dynamic";
export function generateStaticParams(){return[{locale:"en"},{locale:"ar"}]}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const{locale}=await params;if(locale!=="en"&&locale!=="ar")return{};const copy=await getHistoryPageContent(locale);return{title:`${copy.about.eyebrow} — Image Developments`,description:copy.about.intro}}
export default async function HistoryPage({params}:{params:Promise<{locale:string}>}){const{locale}=await params;if(locale!=="en"&&locale!=="ar")notFound();const copy=await getHistoryPageContent(locale as Locale);return <HistoryPageExperience copy={copy}/>}
