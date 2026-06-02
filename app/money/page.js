import { redirect } from "next/navigation";
import { currentUser, db } from "../../lib/server";
import { wrap, card, Title, Nav, rupee } from "../../lib/ui";
export const dynamic = "force-dynamic";

export default async function Money() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const conn = db();
  const [[{ exp }]] = await conn.query("SELECT COALESCE(SUM(amount),0) exp FROM expenses");
  const [[{ pay }]] = await conn.query("SELECT COALESCE(SUM(amount),0) pay FROM payments");
  const [[{ mexp }]] = await conn.query("SELECT COALESCE(SUM(amount),0) mexp FROM expenses WHERE date >= DATE_FORMAT(CURDATE(),'%Y-%m-01')");
  const [expenses] = await conn.query(
    `SELECT e.item_name, e.amount, e.category, e.date, u.name buyer FROM expenses e
     LEFT JOIN users u ON u.id = e.purchased_by ORDER BY e.date DESC, e.id DESC LIMIT 15`
  );
  const [payments] = await conn.query(
    `SELECT p.amount, p.mode, p.date, f.name fam FROM payments p
     LEFT JOIN families f ON f.id = p.family_id ORDER BY p.date DESC, p.id DESC LIMIT 10`
  );
  return (
    <div style={wrap}>
      <Title>Money</Title>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={card}><div style={{ fontSize: 12, color: "#9aa39d" }}>Total spent</div><div style={{ fontSize: 22, fontWeight: 800, color: "#b91c1c" }}>{rupee(exp)}</div></div>
        <div style={card}><div style={{ fontSize: 12, color: "#9aa39d" }}>Total paid in</div><div style={{ fontSize: 22, fontWeight: 800, color: "#15803d" }}>{rupee(pay)}</div></div>
      </div>
      <div style={{ ...card, marginBottom: 12, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#9aa39d" }}>This month's spend</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#0f4c3a" }}>{rupee(mexp)}</div>
      </div>
      <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Recent expenses</div>
        {expenses.map((e, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: i ? "1px solid #f0ece3" : 0 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{e.item_name}</div>
              <div style={{ fontSize: 12, color: "#9aa39d" }}>{e.category} · {e.buyer || "—"} · {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
            </div>
            <div style={{ fontWeight: 700, color: "#b91c1c" }}>{rupee(e.amount)}</div>
          </div>
        ))}
      </div>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Payments</div>
        {payments.length === 0 && <div style={{ color: "#9aa39d", fontSize: 14 }}>No payments recorded.</div>}
        {payments.map((p, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: i ? "1px solid #f0ece3" : 0 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{p.fam || "—"}</div>
              <div style={{ fontSize: 12, color: "#9aa39d" }}>{p.mode || ""} · {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
            </div>
            <div style={{ fontWeight: 700, color: "#15803d" }}>{rupee(p.amount)}</div>
          </div>
        ))}
      </div>
      <Nav active="Money" />
    </div>
  );
}
