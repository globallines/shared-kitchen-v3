import { requireUser, db, getFlash } from "../../lib/server";
import { Layout, DishPhoto, DietPills } from "../../lib/ui.jsx";
import { tomorrow, fmtDate, ucfirst } from "../../lib/helpers";
export const dynamic = "force-dynamic";

function _guess_category(name) {
  const n = String(name).toLowerCase();
  if (/chicken/.test(n)) return "Chicken";
  if (/mutton|lamb/.test(n)) return "Mutton";
  if (/fish/.test(n)) return "Fish";
  if (/dal|lentil|chickpea/.test(n)) return "Dal";
  if (/rice|wheat|flour/.test(n)) return "Rice";
  if (/oil|ghee|butter/.test(n)) return "Oil";
  if (/milk|paneer|curd|yogurt/.test(n)) return "Milk";
  if (/onion|tomato|potato|veg|carrot|beans|garlic|ginger|chilli/.test(n)) return "Vegetables";
  if (/masala|spice|salt|pepper|cumin|turmeric/.test(n)) return "Spices";
  return "Other";
}

async function addPlanAction(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u) redirect("/login");
  const plan_date = String(formData.get("plan_date") || "");
  const fam = u.role === "admin" ? Number(formData.get("family_id")) : u.family_id;
  const meal = String(formData.get("meal_type") || "");
  const menu_id = Number(formData.get("menu_item_id") || 0) || null;
  const custom = String(formData.get("custom_dish") || "").trim();
  const people = Math.max(1, Number(formData.get("people")));
  const notes = String(formData.get("notes") || "").trim();

  if (fam && (menu_id || custom)) {
    await db().query(
      "INSERT INTO menu_plans (date, family_id, meal_type, menu_item_id, custom_dish, people, notes, status, created_by) VALUES (?,?,?,?,?,?,?,'requested',?)",
      [plan_date, fam, meal, menu_id, custom || null, people, notes || null, u.id]
    );
    await setFlash("Plan added");
  }
  redirect("/plan?date=" + plan_date);
}

async function confirmAction(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u) redirect("/login");
  const plan_date = String(formData.get("plan_date") || "");
  const pid = Number(formData.get("confirm"));
  await db().query("UPDATE menu_plans SET status = 'confirmed' WHERE id = ?", [pid]);
  await setFlash("Plan confirmed");
  redirect("/plan?date=" + plan_date);
}

async function deletePlanAction(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u) redirect("/login");
  const plan_date = String(formData.get("plan_date") || "");
  const pid = Number(formData.get("delete"));
  await db().query("DELETE FROM menu_plans WHERE id = ?", [pid]);
  await setFlash("Plan removed");
  redirect("/plan?date=" + plan_date);
}

async function genShoppingAction(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u || !(u.role === "admin" || u.role === "cook")) redirect("/login");
  const plan_date = String(formData.get("plan_date") || "");

  await db().query("DELETE FROM shopping_list WHERE plan_date = ?", [plan_date]);

  const [plans] = await db().query(
    `SELECT mp.*, m.ingredients
     FROM menu_plans mp
     LEFT JOIN menu_items m ON mp.menu_item_id = m.id
     WHERE mp.date = ? AND mp.status IN ('confirmed','requested')`,
    [plan_date]
  );

  const items = {};
  for (const p of plans) {
    if (p.ingredients) {
      for (let ing of String(p.ingredients).split(",")) {
        ing = ing.trim();
        if (!ing) continue;
        if (!items[ing]) items[ing] = { count: 0, people: 0 };
        items[ing].count++;
        items[ing].people += Number(p.people);
      }
    }
  }

  for (const [name, info] of Object.entries(items)) {
    const cat = _guess_category(name);
    const qty = `for ~${info.people} people`;
    await db().query(
      "INSERT INTO shopping_list (plan_date, item_name, category, qty_needed, notes) VALUES (?,?,?,?,?)",
      [plan_date, name, cat, qty, `needed for ${info.count} dishes`]
    );
  }

  await db().query("UPDATE menu_plans SET status = 'shopping' WHERE date = ? AND status IN ('confirmed','requested')", [plan_date]);

  await setFlash("Shopping list generated with " + Object.keys(items).length + " items");
  redirect("/shopping?date=" + plan_date);
}

export default async function PlanPage({ searchParams }) {
  const u = await requireUser();
  const flash = await getFlash();
  const conn = db();
  const sp = (await searchParams) || {};
  const plan_date = sp.date || tomorrow();
  const preselect_menu = Number(sp.menu_id || 0);

  const [plans] = await conn.query(
    `SELECT mp.*, f.name AS family_name, m.name AS dish, m.color_theme, m.photo, m.diet_tags, u.name AS by_name
     FROM menu_plans mp
     JOIN families f ON mp.family_id = f.id
     JOIN users u ON mp.created_by = u.id
     LEFT JOIN menu_items m ON mp.menu_item_id = m.id
     WHERE mp.date = ?
     ORDER BY mp.family_id, FIELD(mp.meal_type,'Breakfast','Lunch','Snacks','Dinner')`,
    [plan_date]
  );

  const by_family = {};
  for (const p of plans) (by_family[p.family_name] ||= []).push(p);

  const status_counts = { draft: 0, requested: 0, confirmed: 0, shopping: 0, prepared: 0 };
  for (const p of plans) status_counts[p.status]++;

  const [menu_items] = await conn.query("SELECT * FROM menu_items WHERE is_active = 1 ORDER BY cuisine, category, name");
  const grouped_menu = {};
  for (const m of menu_items) (grouped_menu[m.cuisine] ||= []).push(m);
  const [families] = await conn.query("SELECT * FROM families ORDER BY name");

  const canManage = u.role === "admin" || u.role === "cook";
  const canAdd = u.role === "family" || u.role === "admin";

  return (
    <Layout title="Tomorrow Plan" subtitle="Plan ahead" user={u} flash={flash} active="/plan">
      <form method="get" style={{ marginBottom: "14px" }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Plan date</label>
          <input type="date" name="date" defaultValue={plan_date} />
        </div>
      </form>

      <div className="stat-grid three">
        <div className="stat"><span className="label">Plans</span><span className="value">{plans.length}</span></div>
        <div className="stat"><span className="label">Confirmed</span><span className="value">{status_counts.confirmed + status_counts.shopping}</span></div>
        <div className="stat"><span className="label">Pending</span><span className="value">{status_counts.requested}</span></div>
      </div>

      {canManage && (
        <div className="section">
          <form action={genShoppingAction}>
            <input type="hidden" name="plan_date" value={plan_date} />
            <button type="submit" name="gen_shopping" value="1" className="btn" data-confirm="Generate shopping list from all plans?">
              🛒 Generate shopping list
            </button>
          </form>
        </div>
      )}

      {canAdd && (
        <div className="section">
          <div className="section-h"><span className="lead">Add to plan</span></div>
          <form action={addPlanAction} className="card">
            <input type="hidden" name="add_plan" value="1" />
            <input type="hidden" name="plan_date" value={plan_date} />

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
                <label>Meal</label>
                <select name="meal_type" defaultValue="Lunch">
                  <option>Breakfast</option><option>Lunch</option>
                  <option>Snacks</option><option>Dinner</option>
                </select>
              </div>
              <div className="field">
                <label>People</label>
                <input type="number" name="people" min="1" defaultValue="3" />
              </div>
            </div>

            <div className="field">
              <label>Dish (grouped by cuisine)</label>
              <select name="menu_item_id" defaultValue={preselect_menu ? String(preselect_menu) : ""}>
                <option value="">— choose —</option>
                {Object.entries(grouped_menu).map(([cuisine, items]) => (
                  <optgroup label={cuisine} key={cuisine}>
                    {items.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Or custom dish</label>
              <input type="text" name="custom_dish" placeholder="e.g. Tom Yum" />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Notes</label>
              <input type="text" name="notes" placeholder="Optional" />
            </div>

            <button type="submit" className="btn mt-12">+ Add plan</button>
          </form>
        </div>
      )}

      <div className="section">
        <div className="section-h"><span className="lead">Plans for {fmtDate(plan_date)}</span></div>
        {plans.length === 0 ? (
          <div className="card"><div className="empty">No plans yet for this date.</div></div>
        ) : (
          Object.entries(by_family).map(([fam, items]) => (
            <div key={fam}>
              <h4 style={{ margin: "16px 0 10px" }}>{fam}</h4>
              {items.map((p) => (
                <div className="card" key={p.id}>
                  <DishPhoto name={p.dish || p.custom_dish || "Custom"} colorTheme={p.color_theme || "fi-default"} photo={p.photo} size="small" />
                  <div className="card-row">
                    <div className="grow">
                      <div className="card-name">{p.dish || p.custom_dish}</div>
                      <div className="card-meta">{p.meal_type} · {p.people} ppl · by {p.by_name}</div>
                      <DietPills tags={p.diet_tags} />
                      {p.notes && (
                        <div className="card-meta mt-4">{p.notes}</div>
                      )}
                    </div>
                    <span className={"pill " + (p.status === "confirmed" || p.status === "shopping" ? "ok" : (p.status === "requested" ? "warn" : "muted"))}>
                      {ucfirst(p.status)}
                    </span>
                  </div>
                  {p.status === "requested" && (canManage || p.family_id == u.family_id) && (
                    <div className="btn-row">
                      <form action={confirmAction} style={{ flex: 1 }}>
                        <input type="hidden" name="plan_date" value={plan_date} />
                        <button type="submit" name="confirm" value={p.id} className="btn small">✓ Confirm</button>
                      </form>
                      <form action={deletePlanAction} style={{ flex: 1 }}>
                        <input type="hidden" name="plan_date" value={plan_date} />
                        <button type="submit" name="delete" value={p.id} className="btn secondary small" data-confirm="Remove?">Remove</button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
