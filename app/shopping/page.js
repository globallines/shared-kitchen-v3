import { requireUser, db, getFlash } from "../../lib/server";
import { Layout } from "../../lib/ui.jsx";
import { tomorrow, fmtMoney, APP_CURRENCY } from "../../lib/helpers";
export const dynamic = "force-dynamic";

async function toggleAction(formData) {
  "use server";
  const { db, currentUser } = await import("../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u) redirect("/login");
  const date = String(formData.get("date") || "");
  const id = Number(formData.get("toggle"));
  const [rows] = await db().query("SELECT is_purchased FROM shopping_list WHERE id = ?", [id]);
  const row = rows[0];
  if (row) {
    const next = row.is_purchased ? 0 : 1;
    await db().query("UPDATE shopping_list SET is_purchased = ?, purchased_by = ? WHERE id = ?", [next, u.id, id]);
  }
  redirect("/shopping?date=" + date);
}

async function saveActualAction(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../lib/server");
  const { redirect } = await import("next/navigation");
  const { fmtMoney } = await import("../../lib/helpers");
  const u = await currentUser();
  if (!u) redirect("/login");
  const date = String(formData.get("date") || "");
  const id = Number(formData.get("save_actual"));
  const qty = String(formData.get("actual_qty") || "").trim();
  const amt = Number(formData.get("actual_amount") || 0);
  await db().query(
    "UPDATE shopping_list SET actual_qty = ?, actual_amount = ?, is_purchased = 1, purchased_by = ? WHERE id = ?",
    [qty || null, amt || null, u.id, id]
  );

  if (amt > 0) {
    const [rows] = await db().query("SELECT * FROM shopping_list WHERE id = ?", [id]);
    const sl = rows[0];
    await db().query(
      "INSERT INTO expenses (date, purchased_by, category, item_name, quantity, amount, notes) VALUES (?,?,?,?,?,?,?)",
      [date, u.id, sl.category || "Other", sl.item_name, qty || "", amt, "Auto-added from shopping list"]
    );
  }
  await setFlash("Marked purchased · " + fmtMoney(amt));
  redirect("/shopping?date=" + date);
}

async function addItemAction(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u) redirect("/login");
  const date = String(formData.get("date") || "");
  const name = String(formData.get("item_name") || "").trim();
  const cat = String(formData.get("category") || "");
  const qty = String(formData.get("qty_needed") || "").trim();
  if (name) {
    await db().query(
      "INSERT INTO shopping_list (plan_date, item_name, category, qty_needed) VALUES (?,?,?,?)",
      [date, name, cat, qty || null]
    );
    await setFlash("Added to list");
  }
  redirect("/shopping?date=" + date);
}

async function clearAction(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u || !(u.role === "admin" || u.role === "cook")) redirect("/login");
  const date = String(formData.get("date") || "");
  await db().query("DELETE FROM shopping_list WHERE plan_date = ?", [date]);
  await setFlash("List cleared");
  redirect("/shopping?date=" + date);
}

export default async function ShoppingPage({ searchParams }) {
  const u = await requireUser();
  const flash = await getFlash();
  const conn = db();
  const sp = (await searchParams) || {};
  const date = sp.date || tomorrow();

  const [items] = await conn.query(
    "SELECT * FROM shopping_list WHERE plan_date = ? ORDER BY is_purchased ASC, category, item_name",
    [date]
  );

  const pending = items.filter((i) => !i.is_purchased);
  const done = items.filter((i) => i.is_purchased);
  const total_spent = items.reduce((s, i) => s + Number(i.actual_amount || 0), 0);

  const canManage = u.role === "admin" || u.role === "cook";

  return (
    <Layout title="Shopping List" user={u} flash={flash} active="/shopping">
      <form method="get" style={{ marginBottom: "14px" }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>For date</label>
          <input type="date" name="date" defaultValue={date} />
        </div>
      </form>

      <div className="stat-grid three">
        <div className="stat"><span className="label">To buy</span><span className="value">{pending.length}</span></div>
        <div className="stat"><span className="label">Bought</span><span className="value">{done.length}</span></div>
        <div className="stat"><span className="label">Spent</span><span className="value small">{fmtMoney(total_spent)}</span></div>
      </div>

      {items.length === 0 ? (
        <div className="card mt-12">
          <div className="empty">
            <div className="ico">🛒</div>
            No shopping list yet.<br />
            <span className="small">Generate one from the Tomorrow Plan page,<br />or add items manually below.</span>
          </div>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="section">
              <div className="section-h"><span className="lead">To buy ({pending.length})</span></div>
              <div className="list">
                {pending.map((i) => (
                  <div className="card" key={i.id}>
                    <div className="card-row">
                      <div className="grow">
                        <div className="card-name">{i.item_name}</div>
                        <div className="card-meta">
                          {i.category}
                          {i.qty_needed ? <> · {i.qty_needed}</> : null}
                        </div>
                      </div>
                    </div>
                    <details style={{ marginTop: "10px" }}>
                      <summary className="btn small secondary" style={{ cursor: "pointer" }}>✓ Mark bought</summary>
                      <form action={saveActualAction} style={{ marginTop: "10px" }}>
                        <input type="hidden" name="date" value={date} />
                        <div className="row2">
                          <div className="field" style={{ marginBottom: "8px" }}>
                            <label>Actual quantity</label>
                            <input type="text" name="actual_qty" placeholder="e.g. 2 kg" />
                          </div>
                          <div className="field" style={{ marginBottom: "8px" }}>
                            <label>Amount paid ({APP_CURRENCY})</label>
                            <input type="number" name="actual_amount" step="0.01" min="0" required />
                          </div>
                        </div>
                        <button type="submit" name="save_actual" value={i.id} className="btn small">Save &amp; mark bought</button>
                      </form>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div className="section">
              <div className="section-h"><span className="lead">Bought ({done.length})</span></div>
              <div className="list">
                {done.map((i) => (
                  <div className="card" key={i.id} style={{ opacity: 0.7 }}>
                    <div className="card-row">
                      <div className="grow">
                        <div className="card-name" style={{ textDecoration: "line-through" }}>{i.item_name}</div>
                        <div className="card-meta">
                          {i.actual_qty || i.qty_needed}
                          {i.actual_amount ? <> · {fmtMoney(i.actual_amount)}</> : null}
                        </div>
                      </div>
                      <form action={toggleAction} style={{ margin: 0 }}>
                        <input type="hidden" name="date" value={date} />
                        <button type="submit" name="toggle" value={i.id} className="btn ghost small">Undo</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="section">
        <div className="section-h"><span className="lead">Add manual item</span></div>
        <form action={addItemAction} className="card">
          <input type="hidden" name="add_item" value="1" />
          <input type="hidden" name="date" value={date} />
          <div className="field">
            <label>Item name</label>
            <input type="text" name="item_name" required placeholder="e.g. Coriander leaves" />
          </div>
          <div className="row2">
            <div className="field">
              <label>Category</label>
              <select name="category">
                {["Vegetables", "Chicken", "Mutton", "Fish", "Rice", "Dal", "Oil", "Spices", "Milk", "Other"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Quantity</label>
              <input type="text" name="qty_needed" placeholder="e.g. 1 bunch" />
            </div>
          </div>
          <button type="submit" className="btn small">+ Add item</button>
        </form>
      </div>

      {canManage && items.length > 0 && (
        <div className="section">
          <form action={clearAction}>
            <input type="hidden" name="date" value={date} />
            <button type="submit" name="clear" value="1" className="btn ghost small" data-confirm="Clear entire shopping list?" style={{ color: "var(--danger)" }}>Clear list</button>
          </form>
        </div>
      )}
    </Layout>
  );
}
