import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/content/home";
import { getAboutPageContent } from "@/lib/content";
import { AboutPageExperience } from "@/components/about-page-experience";

export const dynamic = "force-dynamic";
export function generateStaticParams(){return [{locale:"en"},{locale:"ar"}]}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const {locale}=await params;if(locale!=="en"&&locale!=="ar")return{};const copy=await getAboutPageContent(locale);return{title:`${copy.aboutPage.hero.eyebrow} — Image Developments`,description:copy.aboutPage.hero.body}}
export default async function AboutPage({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(locale!=="en"&&locale!=="ar")notFound();const copy=await getAboutPageContent(locale as Locale);return <AboutPageExperience copy={copy}/>}
