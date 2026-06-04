import { requireUser, db, getFlash } from "../../lib/server";
import { Layout } from "../../lib/ui.jsx";
import { today, ucfirst } from "../../lib/helpers";
export const dynamic = "force-dynamic";

async function deleteAction(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u || !(u.role === "family" || u.role === "admin")) redirect("/login");
  const id = Number(formData.get("delete"));
  const [rows] = await db().query("SELECT family_id FROM meal_requirements WHERE id = ?", [id]);
  const row = rows[0];
  if (row && (u.role === "admin" || row.family_id == u.family_id)) {
    await db().query("DELETE FROM meal_requirements WHERE id = ?", [id]);
    await setFlash("Order removed");
  }
  redirect("/order");
}

async function saveAction(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../lib/server");
  const { redirect } = await import("next/navigation");
  const { today } = await import("../../lib/helpers");
  const u = await currentUser();
  if (!u || !(u.role === "family" || u.role === "admin")) redirect("/login");

  const date = String(formData.get("date") || "") || today();
  const meal_type = String(formData.get("meal_type") || "");
  const menu_id = Number(formData.get("menu_item_id") || 0) || null;
  const custom = String(formData.get("custom_dish") || "").trim();
  const people = Math.max(1, Number(formData.get("people") || 1));
  const spice = String(formData.get("spice_level") || "Medium");
  const special = String(formData.get("special_request") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const fam = u.role === "admin" ? Number(formData.get("family_id")) : u.family_id;

  if (!menu_id && !custom) {
    await setFlash("Please select a dish or write a custom request", "error");
    redirect("/order");
  } else {
    await db().query(
      "INSERT INTO meal_requirements (date, family_id, user_id, meal_type, menu_item_id, custom_dish, people, spice_level, special_request, notes) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [date, fam, u.id, meal_type, menu_id, custom || null, people, spice, special || null, notes || null]
    );
    await setFlash("Order added");
    redirect("/");
  }
}

export default async function OrderPage({ searchParams }) {
  const u = await requireUser();
  if (!(u.role === "family" || u.role === "admin")) {
    const { redirect } = await import("next/navigation");
    redirect("/");
  }
  const flash = await getFlash();
  const conn = db();
  const sp = (await searchParams) || {};
  const preselect_menu = Number(sp.menu_id || 0);

  const [menu] = await conn.query("SELECT * FROM menu_items WHERE is_active = 1 ORDER BY cuisine, category, name");
  const [families] = await conn.query("SELECT * FROM families ORDER BY name");

  const grouped = {};
  for (const m of menu) (grouped[m.cuisine] ||= []).push(m);

  const [existing] = await conn.query(
    `SELECT mr.*, m.name AS dish, m.color_theme, m.photo
     FROM meal_requirements mr
     LEFT JOIN menu_items m ON mr.menu_item_id = m.id
     WHERE mr.family_id = ? AND mr.date = ?
     ORDER BY FIELD(mr.meal_type,'Breakfast','Lunch','Snacks','Dinner')`,
    [u.family_id || 0, today()]
  );

  return (
    <Layout title="Add Requirement" subtitle="New request" user={u} flash={flash} active="/order">
      <form action={saveAction}>
        <input type="hidden" name="save" value="1" />

        {u.role === "admin" && (
          <div className="field">
            <label>Family</label>
            <select name="family_id" required>
              {families.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="row2">
          <div className="field">
            <label>Date</label>
            <input type="date" name="date" defaultValue={today()} required />
          </div>
          <div className="field">
            <label>Meal</label>
            <select name="meal_type" required defaultValue="Lunch">
              <option>Breakfast</option>
              <option>Lunch</option>
              <option>Snacks</option>
              <option>Dinner</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Choose dish (grouped by cuisine)</label>
          <select name="menu_item_id" defaultValue={preselect_menu ? String(preselect_menu) : ""}>
            <option value="">— choose dish —</option>
            {Object.entries(grouped).map(([cuisine, items]) => (
              <optgroup label={cuisine} key={cuisine}>
                {items.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}{m.diet_tags ? ` · ${m.diet_tags}` : ""}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <span className="hint">Or write a custom dish below</span>
        </div>

        <div className="field">
          <label>Custom dish (optional)</label>
          <input type="text" name="custom_dish" placeholder="e.g. Tom Yum soup" />
        </div>

        <div className="row2">
          <div className="field">
            <label>People</label>
            <input type="number" name="people" min="1" max="20" defaultValue="3" required />
          </div>
          <div className="field">
            <label>Spice level</label>
            <select name="spice_level" defaultValue="Medium">
              <option>Mild</option>
              <option>Medium</option>
              <option>Spicy</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Special request</label>
          <input type="text" name="special_request" placeholder="e.g. less oil, no onion" />
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea name="notes" rows="2"></textarea>
        </div>

        <button type="submit" className="btn">Save requirement</button>
        <a href="/" className="btn secondary mt-8">Cancel</a>
      </form>

      {existing.length > 0 && (
        <div className="section">
          <div className="section-h"><span className="lead">Today's orders so far</span></div>
          {existing.map((o) => (
            <div className="card" key={o.id}>
              <div className="card-row">
                <div className="grow">
                  <div className="card-name">{o.dish || o.custom_dish}</div>
                  <div className="card-meta">{o.meal_type} · {o.people} ppl</div>
                </div>
                {o.status === "pending" ? (
                  <form action={deleteAction} style={{ margin: 0 }}>
                    <button type="submit" name="delete" value={o.id} className="btn ghost small" data-confirm="Remove this order?" style={{ color: "var(--danger)" }}>Remove</button>
                  </form>
                ) : (
                  <span className="pill ok">{ucfirst(o.status)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
