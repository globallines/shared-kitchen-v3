import { redirect } from "next/navigation";
import { currentUser, db } from "../../lib/server";
import { Shell, PageHeader, rupee } from "../../lib/ui";
import { addExpense, recordPayment } from "./actions";
export const dynamic = "force-dynamic";

const CATEGORIES = ["Vegetables", "Chicken", "Mutton", "Fish", "Rice", "Dal", "Oil", "Spices", "Milk", "Other"];

export default async function Money({ searchParams }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const sp = (await searchParams) || {};
  const conn = db();
  const today = new Date().toISOString().slice(0, 10);
  const [[{ m }]] = await conn.query("SELECT COALESCE(SUM(amount),0) m FROM expenses WHERE date>=DATE_FORMAT(CURDATE(),'%Y-%m-01')");
  const [[{ tot }]] = await conn.query("SELECT COALESCE(SUM(amount),0) tot FROM expenses");
  const [[{ pay }]] = await conn.query("SELECT COALESCE(SUM(amount),0) pay FROM payments");
  const [exp] = await conn.query("SELECT e.item_name,e.amount,e.category,e.date,u.name buyer FROM expenses e LEFT JOIN users u ON u.id=e.purchased_by ORDER BY e.date DESC,e.id DESC LIMIT 12");
  const [families] = await conn.query("SELECT id,name FROM families ORDER BY id");
  const monthName = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }).toUpperCase();

  const banner =
    sp.ok === "expense" ? { cls: "ok", txt: "✅ Expense added." } :
    sp.ok === "payment" ? { cls: "ok", txt: "✅ Payment recorded." } :
    sp.err === "expense" ? { cls: "err", txt: "⚠️ Enter an item name and a valid amount." } :
    sp.err === "payment" ? { cls: "err", txt: "⚠️ Enter a valid amount and family." } : null;

  return (
    <Shell active="Money" fab="/money">
      <PageHeader label={monthName} title="My account" initial={user.name[0]} />

      {banner && <div className={`flash ${banner.cls}`}>{banner.txt}</div>}

      <div className="stats">
        <div className="card stat"><div className="lbl">Month spend</div><div className="val" style={{ color: "var(--green)" }}>{rupee(m)}</div><div className="sub">all families</div></div>
        <div className="card stat"><div className="lbl">Paid in</div><div className="val" style={{ color: "#b4651a" }}>{rupee(pay)}</div><div className="sub">total received</div></div>
      </div>

      <details className="disc" open={sp.err === "expense"}>
        <summary><span>&#x2795; Add expense</span><span className="chev">&#8964;</span></summary>
        <form action={addExpense} className="form">
          <div className="frow">
            <label>Item<input name="item_name" placeholder="e.g. Tomatoes 1kg" required /></label>
            <label>Amount (₹)<input name="amount" type="number" step="0.01" min="0" placeholder="0" inputMode="decimal" required /></label>
          </div>
          <div className="frow">
            <label>Category<select name="category" defaultValue="Vegetables">{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
            <label>Date<input name="date" type="date" defaultValue={today} /></label>
          </div>
          <div className="frow">
            <label>Quantity (optional)<input name="quantity" placeholder="e.g. 1kg, 2 packs" /></label>
          </div>
          <label>Notes (optional)<input name="notes" placeholder="Anything to remember" /></label>
          <button className="btn btn-primary btn-block" type="submit">Save expense</button>
        </form>
      </details>

      <details className="disc" open={sp.err === "payment"}>
        <summary><span>&#x1F4B0; Record payment</span><span className="chev">&#8964;</span></summary>
        <form action={recordPayment} className="form">
          <div className="frow">
            <label>Amount (₹)<input name="amount" type="number" step="0.01" min="0" placeholder="0" inputMode="decimal" required /></label>
            <label>Family<select name="family_id" defaultValue={user.family_id || (families[0] && families[0].id)}>{families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
          </div>
          <div className="frow">
            <label>Mode<select name="mode" defaultValue="UPI"><option>UPI</option><option>Cash</option><option>Bank transfer</option><option>Other</option></select></label>
            <label>Date<input name="date" type="date" defaultValue={today} /></label>
          </div>
          <label>Notes (optional)<input name="notes" placeholder="Reference / remark" /></label>
          <button className="btn btn-primary btn-block" type="submit">Record payment</button>
        </form>
      </details>

      <div className="card" style={{ marginBottom: 14 }}>
        <a className="linkcard" href="/money">
          <div><div className="t">&#x1F9FE; Daily expenses</div><div className="s">All entries &middot; total {rupee(tot)} all-time</div></div>
          <span className="arrow">&#8594;</span>
        </a>
      </div>

      <div className="sectlabel">Recent expenses</div>
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
