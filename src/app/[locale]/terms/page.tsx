import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/content/home";
import { getTermsPageContent } from "@/lib/content";
import { TermsPageExperience } from "@/components/terms-page-experience";
export const dynamic="force-dynamic";
export function generateStaticParams(){return[{locale:"en"},{locale:"ar"}]}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const{locale}=await params;if(locale!=="en"&&locale!=="ar")return{};const copy=await getTermsPageContent(locale);return{title:copy.termsPage.seoTitle,description:copy.termsPage.seoDescription}}
export default async function TermsPage({params}:{params:Promise<{locale:string}>}){const{locale}=await params;if(locale!=="en"&&locale!=="ar")notFound();const copy=await getTermsPageContent(locale as Locale);return <TermsPageExperience copy={copy}/>}
