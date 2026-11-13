import { prisma } from "@/lib/prisma";
import { FontSizeField } from "./fields";

export async function TypographyFields({
  fields,
}: {
  fields: { key: string; label: string }[];
}) {
  const settings = await prisma.typographySetting.findMany({
    where: { key: { in: fields.map((field) => field.key) } },
  });
  const map = new Map(settings.map((setting) => [setting.key, setting]));

  return (
    <section className="panel">
      <h2>Section font sizes</h2>
      <p className="hint">
        Control the main heading size for each section across desktop and mobile devices. Empty fields retain the responsive design default.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
        {fields.map((field) => {
          const s = map.get(field.key);
          return (
            <FontSizeField
              key={field.key}
              sectionKey={field.key}
              label={field.label}
              value={s?.fontSizeDesktop ?? s?.fontSize ?? undefined}
              mobileValue={s?.fontSizeMobile ?? undefined}
            />
          );
        })}
      </div>
    </section>
  );
}
