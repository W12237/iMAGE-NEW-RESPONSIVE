import type { Metadata } from "next";
import "./globals.css";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Image Developments — Places with perspective",
  description: "Image Developments creates considered communities across Egypt.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let css="";
  if(process.env.DATABASE_URL){try{const settings=await prisma.typographySetting.findMany();css=`:root{${settings.filter(item=>/^[a-z][a-zA-Z0-9]*$/.test(item.key)).map(item=>`--font-${item.key}:${item.fontSize}px`).join(";")}}`}catch{/* Keep design defaults until the migration is applied. */}}
  return <>{css && <style precedence="default" href="db-typography">{css}</style>}{children}</>;
}
