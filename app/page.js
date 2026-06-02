import { redirect } from "next/navigation";
import { currentUser, clearSession, db } from "../lib/server";
import { wrap, card, Nav, rupee } from "../lib/ui";
export const dynamic = "force-dynamic";

async function logoutAction() {
  "use server";
  await clearSession();
  redirect("/login");
}

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const conn = db();
  let famName = "All families";
  if (user.family_id) {
    const [[f]] = await conn.query("SELECT name FROM families WHERE id = ?", [user.family_id]);
    if (f) famName = f.name;
  }
  const [[{ c: dishes }]] = await conn.query("SELECT COUNT(*) c FROM menu_items WHERE is_active = 1");
  const [[{ t: monthSpend }]] = await conn.query("SELECT COALESCE(SUM(amount),0) t FROM expenses WHERE date >= DATE_FORMAT(CURDATE(),'%Y-%m-01')");
  const [recent] = await conn.query("SELECT item_name, amount, category, date FROM expenses ORDER BY date DESC, id DESC LIMIT 5");

  return (
    <div style={wrap}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 13, color: "#9aa39d" }}>Welcome back,</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0f4c3a" }}>{user.name}</div>
          <div style={{ fontSize: 12, color: "#9aa39d", textTransform: "capitalize" }}>{user.role.replace("_", " ")} · {famName}</div>
        </div>
        <form action={logoutAction}>
          <button style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#5b6b63", cursor: "pointer" }}>Sign out</button>
        </form>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={card}><div style={{ fontSize: 12, color: "#9aa39d", marginBottom: 6 }}>This month&apos;s spend</div><div style={{ fontSize: 26, fontWeight: 800, color: "#0f4c3a" }}>{rupee(monthSpend)}</div></div>
        <div style={card}><div style={{ fontSize: 12, color: "#9aa39d", marginBottom: 6 }}>Active dishes</div><div style={{ fontSize: 26, fontWeight: 800, color: "#b45309" }}>{dishes}</div></div>
      </div>
      <section style={card}>
        <h2 style={{ fontSize: 15, margin: "0 0 12px", color: "#1c2b25" }}>Recent expenses</h2>
        {recent.map((e, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: i ? "1px solid #f0ece3" : 0 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{e.item_name}</div>
              <div style={{ fontSize: 12, color: "#9aa39d" }}>{e.category} · {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
            </div>
            <div style={{ fontWeight: 700, color: "#0f4c3a" }}>{rupee(e.amount)}</div>
          </div>
        ))}
      </section>
      <Nav active="Home" />
    </div>
  );
}
