import { redirect } from "next/navigation";
import { currentUser, db } from "../../lib/server";
import { Shell, PageHeader, rupee } from "../../lib/ui";
export const dynamic = "force-dynamic";

export default async function Money() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const conn = db();
  const [[{ m }]] = await conn.query("SELECT COALESCE(SUM(amount),0) m FROM expenses WHERE date>=DATE_FORMAT(CURDATE(),'%Y-%m-01')");
  const [[{ tot }]] = await conn.query("SELECT COALESCE(SUM(amount),0) tot FROM expenses");
  const [[{ pay }]] = await conn.query("SELECT COALESCE(SUM(amount),0) pay FROM payments");
  const [exp] = await conn.query("SELECT e.item_name,e.amount,e.category,e.date,u.name buyer FROM expenses e LEFT JOIN users u ON u.id=e.purchased_by ORDER BY e.date DESC,e.id DESC LIMIT 12");
  const monthName = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }).toUpperCase();
  return (
    <Shell active="Money" fab="/money">
      <PageHeader label={monthName} title="My account" initial={user.name[0]} />
      <div className="stats">
        <div className="card stat"><div className="lbl">Month spend</div><div className="val" style={{ color: "var(--green)" }}>{rupee(m)}</div><div className="sub">all families</div></div>
        <div className="card stat"><div className="lbl">Paid in</div><div className="val" style={{ color: "#b4651a" }}>{rupee(pay)}</div><div className="sub">total received</div></div>
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        <a className="linkcard" href="/money">
          <div><div className="t">&#x1F9FE; Daily expenses</div><div className="s">All entries &middot; total {rupee(tot)} all-time</div></div>
          <span className="arrow">&#8594;</span>
        </a>
      </div>
      <div className="sectlabel">Recent expenses <a className="addlink" href="/money">+ Add</a></div>
      <div className="card">
        {exp.length === 0 && <div className="empty"><div className="ic">&#x1F4CB;</div>No expenses yet.</div>}
        {exp.map((e, i) => (
          <div className="row" key={i}>
            <div><div className="t">{e.item_name}</div><div className="s">{e.category} &middot; {e.buyer || "—"} &middot; {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div></div>
            <div style={{ fontWeight: 700, color: "var(--green)" }}>{rupee(e.amount)}</div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
