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
  let css = "";
  if (process.env.DATABASE_URL) {
    try {
      const settings = await prisma.typographySetting.findMany();
      const rules: string[] = [];
      for (const item of settings) {
        if (/^[a-z][a-zA-Z0-9]*$/.test(item.key)) {
          const desktop = item.fontSizeDesktop ?? item.fontSize;
          if (desktop) {
            rules.push(`--font-${item.key}:${desktop}px`);
            rules.push(`--font-${item.key}-desktop:${desktop}px`);
          }
          if (item.fontSizeMobile) {
            rules.push(`--font-${item.key}-mobile:${item.fontSizeMobile}px`);
          }
        } else if (item.key.includes(":")) {
          const safeKey = item.key.replace(/[:_]/g, "-");
          if (item.fontSizeDesktop) {
            rules.push(`--font-${safeKey}-desktop:${item.fontSizeDesktop}px`);
          }
          if (item.fontSizeMobile) {
            rules.push(`--font-${safeKey}-mobile:${item.fontSizeMobile}px`);
          }
        }
      }
      if (rules.length > 0) {
        css = `:root{${rules.join(";")}}`;
      }
    } catch {
      /* Keep design defaults until the migration is applied. */
    }
  }
  return <>{css && <style precedence="default" href="db-typography">{css}</style>}{children}</>;
}
