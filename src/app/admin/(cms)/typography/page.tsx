import { prisma } from "@/lib/prisma";
import { TypographyManager } from "@/components/admin/typography-manager";

export default async function TypographyAdmin() {
  const settings = await prisma.typographySetting.findMany({
    orderBy: { key: "asc" },
  });

  return (
    <>
      <header className="page-head">
        <div>
          <p>Design Controls</p>
          <h1>Typography & Responsive Scale</h1>
          <span>
            Manage fluid typography across mobile (390px) and desktop (1280px) viewports with approved brand font weights and real-time live preview.
          </span>
        </div>
      </header>

      <TypographyManager initialSettings={settings} />
    </>
  );
}
