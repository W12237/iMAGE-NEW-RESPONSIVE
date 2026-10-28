import { NavigationEditor } from "@/components/admin/navigation-editor";
import { prisma } from "@/lib/prisma";
import { saveNavigation } from "../../actions";

export default async function Navigation() {
  const [items, globalSettings, assets] = await Promise.all([
    prisma.navigationItem.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.globalSettings.findUnique({ where: { id: "global" } }),
    prisma.mediaAsset.findMany({
      where: { kind: "IMAGE" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <header className="page-head">
        <div>
          <p>Global content</p>
          <h1>Navigation & Menu Preview</h1>
          <span>
            Manage primary links, expandable secondary links, and their individual hover/focus preview images.
          </span>
        </div>
      </header>

      <form action={saveNavigation} className="admin-form">
        <NavigationEditor
          initialItems={items}
          globalSettings={
            globalSettings
              ? {
                  menuMediaUrl: globalSettings.menuMediaUrl,
                  menuMediaAltEn: globalSettings.menuMediaAltEn,
                  menuMediaAltAr: globalSettings.menuMediaAltAr,
                  menuMediaFocalPoint: globalSettings.menuMediaFocalPoint,
                }
              : undefined
          }
          assets={assets.map((a) => ({
            id: a.id,
            url: a.url,
            filename: a.filename,
            mimeType: a.mimeType,
            size: a.size,
            kind: a.kind,
            createdAt: a.createdAt,
            altEn: a.altEn,
            altAr: a.altAr,
          }))}
        />
        <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
          <button className="primary" type="submit">
            Save navigation
          </button>
        </div>
      </form>
    </>
  );
}
