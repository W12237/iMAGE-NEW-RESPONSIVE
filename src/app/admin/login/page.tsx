import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/session";
import { loginAction } from "../actions";
import { LoginForm } from "@/components/admin/action-form";

export default async function Login({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  if (await getAdmin()) redirect("/admin");
  const params = searchParams ? await searchParams : {};
  return (
    <main className="login-shell">
      <LoginForm action={loginAction} message={params.message} />
    </main>
  );
}
