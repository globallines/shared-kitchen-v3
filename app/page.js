import { redirect } from "next/navigation";
import { currentUser, clearSession, db } from "../lib/server";

export const dynamic = "force-dynamic";

async function logoutAction() {
  "use server";
  await clearSession();
  redirect("/login");
}

const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

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
  const [[{ t: monthSpend }]] = await conn.query(
    "SELECT COALESCE(SUM(amount),0) t FROM expenses WHERE date >= DATE_FORMAT(CURDATE(),'%Y-%m-01')"
  );
  const [recent] = await conn.query(
    "SELECT item_name, amount, category, date FROM expenses ORDER BY date DESC, id DESC LIMIT 5"
  );

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 90px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 13, color: "#9aa39d" }}>Welcome back,</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0f4c3a" }}>{user.name}</div>
          <div style={{ fontSize: 12, color: "#9aa39d", textTransform: "capitalize" }}>{user.role.replace("_", " ")} &middot; {famName}</div>
        </div>
        <form action={logoutAction}>
          <button style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#5b6b63", cursor: "pointer" }}>Sign out</button>
        </form>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <Card label="This month's spend" value={rupee(monthSpend)} accent="#0f4c3a" />
        <Card label="Active dishes" value={dishes} accent="#b45309" />
      </div>

      <section style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 16, padding: 18 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 12px", color: "#1c2b25" }}>Recent expenses</h2>
        {recent.length === 0 && <div style={{ color: "#9aa39d", fontSize: 14 }}>No expenses yet.</div>}
        {recent.map((e, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: i ? "1px solid #f0ece3" : 0 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{e.item_name}</div>
              <div style={{ fontSize: 12, color: "#9aa39d" }}>{e.category} &middot; {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
            </div>
            <div style={{ fontWeight: 700, color: "#0f4c3a" }}>{rupee(e.amount)}</div>
          </div>
        ))}
      </section>

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e8e4dc",
        display: "flex", justifyContent: "space-around", padding: "10px 0", fontSize: 11, color: "#9aa39d" }}>
        {[["🏠","Home"],["🍽️","Cuisine"],["📅","Week"],["🛒","Shop"],["💰","Money"],["✨","AI"]].map(([ic, t], i) => (
          <div key={i} style={{ textAlign: "center", color: i === 0 ? "#0f4c3a" : "#9aa39d", fontWeight: i === 0 ? 700 : 400 }}>
            <div style={{ fontSize: 20 }}>{ic}</div>{t}
          </div>
        ))}
      </nav>
    </div>
  );
}

function Card({ label, value, accent }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 16, padding: 16 }}>
      <div style={{ fontSize: 12, color: "#9aa39d", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent }}>{value}</div>
    </div>
  );
}
