import { requireAdmin } from "@/lib/session";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="admin-shell">
      <AdminSidebar userEmail={user.email} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
