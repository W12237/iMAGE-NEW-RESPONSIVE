import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/content/home";
import { getContactPageContent } from "@/lib/content";
import { ContactPageExperience } from "@/components/contact-page-experience";
export const dynamic="force-dynamic";
export function generateStaticParams(){return[{locale:"en"},{locale:"ar"}]}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const{locale}=await params;if(locale!=="en"&&locale!=="ar")return{};const copy=await getContactPageContent(locale);return{title:copy.contactPage.seoTitle,description:copy.contactPage.seoDescription}}
export default async function ContactPage({params}:{params:Promise<{locale:string}>}){const{locale}=await params;if(locale!=="en"&&locale!=="ar")notFound();const copy=await getContactPageContent(locale as Locale);return <ContactPageExperience copy={copy}/>}
