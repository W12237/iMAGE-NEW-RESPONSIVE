import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/session";
import { loginAction } from "../actions";
import { LoginForm } from "@/components/admin/action-form";
export default async function Login(){if(await getAdmin())redirect("/admin");return <main className="login-shell"><LoginForm action={loginAction}/></main>}
