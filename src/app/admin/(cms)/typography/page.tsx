import { ActionForm } from "@/components/admin/action-form";
import { TypographyFields } from "@/components/admin/typography-fields";
import { saveTypography } from "../../actions";

const fields=[
  {key:"opening",label:"Homepage — Opening experience"},{key:"homeHero",label:"Homepage — Hero"},{key:"projects",label:"Homepage / Developments — Projects"},{key:"aboutTimeline",label:"Homepage / About — Timeline"},{key:"lifestyle",label:"Homepage — Lifestyle"},{key:"stats",label:"Homepage — Statistics"},{key:"journal",label:"Homepage / Journal — Stories"},{key:"closing",label:"Global — Contact section"},{key:"footer",label:"Global — Footer wordmark"},
  {key:"aboutHero",label:"About page — Hero"},{key:"aboutBlocks",label:"About page — Content sections"},{key:"teamHero",label:"Team page — Hero"},{key:"teamRoster",label:"Team page — Team cards"},{key:"partnersHero",label:"Partners page — Hero"},{key:"partnersGrid",label:"Partners page — Partner cards"},{key:"policyHero",label:"Policy page — Hero"},{key:"policyDocuments",label:"Policy page — Documents"},{key:"termsHero",label:"Terms page — Hero"},{key:"termsDocuments",label:"Terms page — Sections"},{key:"contactHero",label:"Contact page — Hero"},{key:"contactForm",label:"Contact page — Contact details and form"},
];

export default function TypographyAdmin(){return <><header className="page-head"><div><p>Design controls</p><h1>Global font defaults</h1><span>Site-wide heading sizes. To style one section on one page, use Page builder → Style — it overrides these values.</span></div></header><ActionForm action={saveTypography} className="admin-form" submitLabel="Save Font Sizes"><TypographyFields fields={fields}/></ActionForm></>}
