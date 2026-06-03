import { redirect } from "next/navigation";
import { verifyLogin, setSession } from "../../lib/server";
export const dynamic = "force-dynamic";

async function loginAction(formData) {
  "use server";
  const u = (formData.get("username") || "").toString().trim();
  const p = (formData.get("password") || "").toString();
  const user = await verifyLogin(u, p);
  if (!user) redirect("/login?e=1");
  await setSession(user);
  redirect("/");
}

export default async function Login({ searchParams }) {
  const sp = await searchParams;
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <h1 className="serif" style={{ fontSize: 38, color: "var(--green)", margin: 0 }}>Shared Kitchen</h1>
          <p style={{ color: "var(--muted)", marginTop: 6 }}>Two families. One cook. Zero confusion.</p>
        </div>
        {sp?.e && <div className="warn" style={{ background: "#fee2e2", color: "#b91c1c" }}>Invalid username or password</div>}
        <form action={loginAction}>
          <label className="eyebrow">Username</label>
          <input name="username" autoFocus autoCapitalize="none" className="search" style={{ background: "#fff", padding: "13px 16px", margin: "6px 0 14px" }} placeholder="e.g. karthi" />
          <label className="eyebrow">Password</label>
          <input name="password" type="password" className="search" style={{ background: "#fff", padding: "13px 16px", margin: "6px 0 16px" }} />
          <button className="btn btn-block" type="submit">Sign in</button>
        </form>
      </div>
    </main>
  );
}
