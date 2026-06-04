import { redirect } from "next/navigation";
import { verifyLogin, setSession, currentUser } from "../../lib/server";
export const dynamic = "force-dynamic";

async function loginAction(formData) {
  "use server";
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const u = await verifyLogin(username, password);
  if (!u) redirect("/login?e=1");
  await setSession(u);
  redirect("/");
}

export default async function Login({ searchParams }) {
  const u = await currentUser();
  if (u) redirect("/");
  const sp = (await searchParams) || {};
  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Shared Kitchen</h1>
        <p className="lead">Two families. One cook. Zero confusion.</p>
        {sp.e && <div className="flash error">Invalid username or password</div>}
        <form method="post" action={loginAction} autoComplete="on">
          <div className="field">
            <label>Username</label>
            <input name="username" required autoComplete="username" placeholder="e.g. karthi" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" name="password" required autoComplete="current-password" placeholder="•••••" />
          </div>
          <button type="submit" className="btn">Sign in</button>
        </form>
      </div>
    </div>
  );
}
