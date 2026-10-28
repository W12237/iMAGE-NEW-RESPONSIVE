import { prisma } from "@/lib/prisma";
import { LeadExport } from "@/components/admin/lead-export";
import { deleteLead, updateLead } from "../../actions";

const statuses=["NEW","CONTACTED","QUALIFIED","CLOSED"];
export default async function LeadsPage(){
  const leads=await prisma.contactSubmission.findMany({orderBy:{createdAt:"desc"}});
  const exportLeads=leads.map(lead=>({createdAt:lead.createdAt.toISOString(),name:lead.name,email:lead.email,phone:lead.phone??"",subject:lead.subject,message:lead.message,status:lead.status,notes:lead.notes??""}));
  return <><header className="page-head leads-page-head"><div><p>Sales</p><h1>Leads</h1><span>Follow up on enquiries submitted from every page of the website.</span></div><LeadExport leads={exportLeads}/></header><div className="table-wrap"><table><thead><tr><th>Date</th><th>Contact</th><th>Project</th><th>Message</th><th>Follow-up</th><th className="lead-row-actions"/></tr></thead><tbody>{leads.map(lead=><tr key={lead.id}><td>{lead.createdAt.toLocaleString("en-GB")}</td><td><b>{lead.name}</b><small><a href={`mailto:${lead.email}`}>{lead.email}</a><br/><a href={`tel:${lead.phone}`}>{lead.phone}</a></small></td><td>{lead.subject}</td><td className="lead-message">{lead.message}</td><td><form action={updateLead} className="lead-followup"><input type="hidden" name="id" value={lead.id}/><select name="status" defaultValue={lead.status}>{statuses.map(status=><option key={status}>{status}</option>)}</select><textarea name="notes" defaultValue={lead.notes??""} placeholder="Follow-up notes" rows={2}/><button>Save</button></form></td><td className="lead-row-actions"><form action={deleteLead}><input type="hidden" name="id" value={lead.id}/><button className="danger">Delete</button></form></td></tr>)}</tbody></table>{!leads.length&&<p className="empty">No leads yet.</p>}</div></>;
}
