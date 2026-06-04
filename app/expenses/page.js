import { requireUser, db, getFlash } from "../../lib/server";
import { redirect } from "next/navigation";
import { Layout } from "../../lib/ui.jsx";
import { fmtMoney, fmtDateShort, thisMonth, monthLabel, PHOTO_BASE } from "../../lib/helpers";
export const dynamic = "force-dynamic";

async function deleteExpense(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u || u.role !== "admin") redirect("/expenses");
  const id = Number(formData.get("delete_expense"));
  await db().query("DELETE FROM expenses WHERE id = ?", [id]);
  await setFlash("Expense deleted");
  redirect("/expenses");
}

async function deletePayment(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u || u.role !== "admin") redirect("/expenses");
  const id = Number(formData.get("delete_payment"));
  await db().query("DELETE FROM payments WHERE id = ?", [id]);
  await setFlash("Payment deleted");
  redirect("/expenses?tab=payments");
}

export default async function Expenses({ searchParams }) {
  const u = await requireUser();
  const flash = await getFlash();
  const sp = (await searchParams) || {};
  const tab = sp.tab || "expenses";
  const month = sp.month || thisMonth();
  const conn = db();

  return (
    <Layout title="Money" user={u} flash={flash} active="/expenses">
      <div className="tabs">
        <a href={`/expenses?tab=expenses&month=${month}`} className={tab === "expenses" ? "active" : ""}>Expenses</a>
        <a href={`/expenses?tab=payments&month=${month}`} className={tab === "payments" ? "active" : ""}>Payments</a>
        <a href="/settlement" className="">Settlement</a>
      </div>

      <form method="get" style={{ marginBottom: "14px" }}>
        <input type="hidden" name="tab" value={tab} />
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Month</label>
          <input type="month" name="month" defaultValue={month} />
        </div>
      </form>

      {tab === "expenses"
        ? await renderExpenses(conn, u, month)
        : await renderPayments(conn, u, month)}
    </Layout>
  );
}

async function renderExpenses(conn, u, month) {
  const [list] = await conn.query(
    "SELECT e.*, u.name AS buyer FROM expenses e JOIN users u ON e.purchased_by = u.id WHERE DATE_FORMAT(e.date,'%Y-%m') = ? ORDER BY e.date DESC, e.id DESC",
    [month]
  );
  const total = list.reduce((s, e) => s + Number(e.amount), 0);

  const byCat = {};
  for (const e of list) byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount);
  const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div className="stat-grid">
        <div className="stat"><span className="label">Total</span><span className="value">{fmtMoney(total)}</span></div>
        <div className="stat"><span className="label">Each share</span><span className="value">{fmtMoney(total / 2)}</span></div>
      </div>

      {catEntries.length > 0 && (
        <div className="section">
          <div className="section-h"><span className="lead">By category</span></div>
          <div className="card">
            {catEntries.map(([cat, amt]) => (
              <div className="kv" key={cat}><span className="k">{cat}</span><span className="v">{fmtMoney(amt)}</span></div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-h">
          <span className="lead">All expenses · {monthLabel(month)}</span>
          {["cook", "driver", "admin"].includes(u.role) && (
            <a href="/expense/new" className="btn ghost small">+ Add</a>
          )}
        </div>
        {list.length === 0 ? (
          <div className="card"><div className="empty">No expenses recorded for this month.</div></div>
        ) : (
          <div className="list">
            {list.map((e) => (
              <div className="card" key={e.id}>
                <div className="card-row">
                  <div className="grow">
                    <div className="card-name">{e.item_name}</div>
                    <div className="card-meta">
                      {e.category} · {e.quantity} · {fmtDateShort(e.date)} · by {e.buyer}
                    </div>
                    {e.notes && <div className="card-meta mt-4">{e.notes}</div>}
                    {e.bill_image && (
                      <a href={`${PHOTO_BASE}${e.bill_image}`} target="_blank" className="small mt-4" style={{ display: "inline-block" }}>📎 View bill</a>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="strong">{fmtMoney(e.amount)}</div>
                    {u.role === "admin" && (
                      <form action={deleteExpense} style={{ marginTop: "6px" }}>
                        <button type="submit" name="delete_expense" value={e.id} className="btn ghost small" data-confirm="Delete this expense?" style={{ color: "var(--danger)", fontSize: "11px", padding: "2px 6px" }}>Delete</button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {["cook", "driver", "admin"].includes(u.role) && (
        <a href="/expense/new" className="fab">+</a>
      )}
    </>
  );
}

async function renderPayments(conn, u, month) {
  const [list] = await conn.query(
    "SELECT p.*, f.name AS family_name, u.name AS by_name FROM payments p JOIN families f ON p.family_id = f.id JOIN users u ON p.recorded_by = u.id WHERE DATE_FORMAT(p.date,'%Y-%m') = ? ORDER BY p.date DESC, p.id DESC",
    [month]
  );

  const totals = { "Family A": 0, "Family B": 0 };
  for (const p of list) totals[p.family_name] = (totals[p.family_name] || 0) + Number(p.amount);

  return (
    <>
      <div className="stat-grid">
        <div className="stat"><span className="label">Family A paid</span><span className="value">{fmtMoney(totals["Family A"] || 0)}</span></div>
        <div className="stat"><span className="label">Family B paid</span><span className="value">{fmtMoney(totals["Family B"] || 0)}</span></div>
      </div>

      <div className="section">
        <div className="section-h">
          <span className="lead">All payments · {monthLabel(month)}</span>
          {u.role === "admin" && (
            <a href="/payment/new" className="btn ghost small">+ Add</a>
          )}
        </div>
        {list.length === 0 ? (
          <div className="card"><div className="empty">No payments this month.</div></div>
        ) : (
          <div className="list">
            {list.map((p) => (
              <div className="card" key={p.id}>
                <div className="card-row">
                  <div className="grow">
                    <div className="card-name">{p.family_name} paid</div>
                    <div className="card-meta">
                      {fmtDateShort(p.date)}
                      {p.mode ? ` · ${p.mode}` : ""}
                      {" · recorded by "}{p.by_name}
                    </div>
                    {p.notes && <div className="card-meta mt-4">{p.notes}</div>}
                  </div>
                  <div className="text-right">
                    <div className="strong" style={{ color: "var(--ok)" }}>{fmtMoney(p.amount)}</div>
                    {u.role === "admin" && (
                      <form action={deletePayment} style={{ marginTop: "6px" }}>
                        <button type="submit" name="delete_payment" value={p.id} className="btn ghost small" data-confirm="Delete this payment?" style={{ color: "var(--danger)", fontSize: "11px", padding: "2px 6px" }}>Delete</button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {u.role === "admin" && (
        <a href="/payment/new" className="fab">+</a>
      )}
    </>
  );
}
