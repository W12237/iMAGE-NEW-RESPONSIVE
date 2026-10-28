import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/content/home";
import { getPolicyPageContent } from "@/lib/content";
import { PolicyPageExperience } from "@/components/policy-page-experience";

export const dynamic="force-dynamic";
export function generateStaticParams(){return[{locale:"en"},{locale:"ar"}]}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const{locale}=await params;if(locale!=="en"&&locale!=="ar")return{};const copy=await getPolicyPageContent(locale);return{title:copy.policyPage.seoTitle,description:copy.policyPage.seoDescription}}
export default async function PolicyPage({params}:{params:Promise<{locale:string}>}){const{locale}=await params;if(locale!=="en"&&locale!=="ar")notFound();const copy=await getPolicyPageContent(locale as Locale);return <PolicyPageExperience copy={copy}/>}
