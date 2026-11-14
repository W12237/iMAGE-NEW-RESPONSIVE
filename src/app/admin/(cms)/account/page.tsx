import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AccountSettingsForm } from "@/components/admin/account-settings-form";

export const metadata = {
  title: "Account Settings — Image Developments CMS",
};

export default async function AccountSettingsPage() {
  const sessionUser = await requireAdmin();

  // Fetch the latest fresh user record from the database
  const user = await prisma.adminUser.findUniqueOrThrow({
    where: { id: sessionUser.id },
  });

  return (
    <>
      <header className="page-head">
        <div>
          <p className="admin-kicker">Security & Credentials / الأمان وبيانات الدخول</p>
          <h1>Account Settings / إعدادات الحساب</h1>
          <span>Manage your administrator login username, credentials, and password securely.</span>
        </div>
      </header>

      <AccountSettingsForm
        currentEmail={user.email}
        currentUsername={user.username}
        createdAt={user.createdAt}
        updatedAt={user.updatedAt}
      />
    </>
  );
}

