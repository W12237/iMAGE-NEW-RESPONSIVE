import { prisma } from "@/lib/prisma";
import { FontSizeField } from "./fields";

export async function TypographyFields({fields}:{fields:{key:string;label:string}[]}){
  const settings=await prisma.typographySetting.findMany({where:{key:{in:fields.map(field=>field.key)}}});
  const values=new Map(settings.map(setting=>[setting.key,setting.fontSize]));
  return <section className="panel"><h2>Section font sizes</h2><p className="hint">Control the main heading size for each section. Empty fields keep the responsive design default.</p><div className="bilingual">{fields.map(field=><FontSizeField key={field.key} sectionKey={field.key} label={field.label} value={values.get(field.key)}/>)}</div></section>;
}
