import { redirect } from "next/navigation";
import { verifyLogin, setSession } from "../../lib/server";

export const dynamic = "force-dynamic";

async function loginAction(formData) {
  "use server";
  const username = (formData.get("username") || "").toString().trim();
  const password = (formData.get("password") || "").toString();
  const user = await verifyLogin(username, password);
  if (!user) redirect("/login?e=1");
  await setSession(user);
  redirect("/");
}

export default async function Login({ searchParams }) {
  const sp = await searchParams;
  const err = sp?.e;
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <form action={loginAction} style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 18,
        padding: "36px 30px", width: "100%", maxWidth: 380, boxShadow: "0 8px 30px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: 40, textAlign: "center" }}>&#x1F373;</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#0f4c3a", textAlign: "center", margin: "8px 0 22px" }}>
          Shared Kitchen
        </h1>
        {err && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 12px", borderRadius: 8, fontSize: 14, marginBottom: 14 }}>
          Invalid username or password
        </div>}
        <label style={{ fontSize: 13, color: "#5b6b63", fontWeight: 600 }}>Username</label>
        <input name="username" autoFocus autoCapitalize="none" style={inp} />
        <label style={{ fontSize: 13, color: "#5b6b63", fontWeight: 600 }}>Password</label>
        <input name="password" type="password" style={inp} />
        <button type="submit" style={{ width: "100%", background: "#0f4c3a", color: "#fff", border: 0,
          padding: "12px", borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: "pointer", marginTop: 6 }}>
          Sign in
        </button>
      </form>
    </main>
  );
}
const inp = { width: "100%", boxSizing: "border-box", padding: "11px 12px", margin: "6px 0 14px",
  border: "1px solid #d9d3c7", borderRadius: 8, fontSize: 15, background: "#faf7f2" };
