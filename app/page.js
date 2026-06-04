import { requireUser, db, setFlash, getFlash } from "../lib/server";
import { redirect } from "next/navigation";
import { Layout, DishPhoto, DietPills } from "../lib/ui.jsx";
import { fmtMoney, fmtDateShort, today, tomorrow, thisMonth, monthLabel, ucfirst } from "../lib/helpers";
export const dynamic = "force-dynamic";

async function markAction(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../lib/server");
  const u = await currentUser();
  if (!u || u.role !== "cook") redirect("/");
  const id = Number(formData.get("id"));
  const kind = String(formData.get("kind"));
  if (id && kind === "prepared") {
    await db().query("UPDATE meal_requirements SET status='prepared' WHERE id=?", [id]);
    await setFlash("Marked as prepared");
  } else if (id && kind === "accepted") {
    await db().query("UPDATE meal_requirements SET status='accepted' WHERE id=?", [id]);
    await setFlash("Order accepted");
  }
  redirect("/");
}

export default async function Home() {
  const u = await requireUser();
  const flash = await getFlash();
  const conn = db();
  const t = today(), tom = tomorrow(), month = thisMonth();
  const subtitle = "Today · " + fmtDateShort(t);
  const dishName = (o) => o.dish || o.custom_dish || "Custom";

  // ===== ADMIN =====
  if (u.role === "admin") {
    const [[{ c: reqs }]] = await conn.query("SELECT COUNT(*) c FROM meal_requirements WHERE date=?", [t]);
    const [[{ s: todayTotal }]] = await conn.query("SELECT COALESCE(SUM(amount),0) s FROM expenses WHERE date=?", [t]);
    const [[{ s: monthTotal }]] = await conn.query("SELECT COALESCE(SUM(amount),0) s FROM expenses WHERE DATE_FORMAT(date,'%Y-%m')=?", [month]);
    const share = monthTotal / 2;
    const [[{ s: a }]] = await conn.query("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE family_id=1 AND DATE_FORMAT(date,'%Y-%m')=?", [month]);
    const [[{ s: b }]] = await conn.query("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE family_id=2 AND DATE_FORMAT(date,'%Y-%m')=?", [month]);
    const balA = a - share, balB = b - share;
    const [orders] = await conn.query(
      `SELECT mr.*, f.name AS family_name, m.name AS dish, m.color_theme, m.photo, m.diet_tags
       FROM meal_requirements mr JOIN families f ON mr.family_id=f.id
       LEFT JOIN menu_items m ON mr.menu_item_id=m.id
       WHERE mr.date=? ORDER BY FIELD(mr.meal_type,'Breakfast','Lunch','Snacks','Dinner'), mr.family_id`, [t]);
    return (
      <Layout title="Admin Home" subtitle={subtitle} user={u} flash={flash} active="/">
        <div className="stat-grid">
          <div className="stat"><span className="label">Today orders</span><span className="value">{reqs}</span></div>
          <div className="stat"><span className="label">Today spent</span><span className="value small">{fmtMoney(todayTotal)}</span></div>
          <div className="stat"><span className="label">Month total</span><span className="value small">{fmtMoney(monthTotal)}</span></div>
          <div className="stat"><span className="label">Each share</span><span className="value small">{fmtMoney(share)}</span></div>
        </div>
        {orders.length > 0 && (
          <div className="section">
            <div className="section-h"><span className="lead">Today's menu</span></div>
            {orders.map((o) => (
              <div className="hero-meal" key={o.id}>
                <DishPhoto name={dishName(o)} colorTheme={o.color_theme || "fi-default"} photo={o.photo} size="small" />
                <div className="body">
                  <div className="meal-cap">{o.family_name} · {o.meal_type} · {String(o.status).toUpperCase()}</div>
                  <h3>{dishName(o)}</h3>
                  <div className="meta">{o.people} people · {o.spice_level} spice{o.special_request ? ` · ★ ${o.special_request}` : ""}</div>
                  <DietPills tags={o.diet_tags} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="section">
          <div className="section-h"><span className="lead">Settlement — {monthLabel(month)}</span><a href="/settlement">View →</a></div>
          <div className="card">
            <div className="kv"><span className="k">Family A balance</span><span className={"v " + (balA >= 0 ? "ok" : "danger")}>{balA >= 0 ? "Excess " : ""}{fmtMoney(Math.abs(balA))}{balA < 0 ? " due" : ""}</span></div>
            <div className="kv"><span className="k">Family B balance</span><span className={"v " + (balB >= 0 ? "ok" : "danger")}>{balB >= 0 ? "Excess " : ""}{fmtMoney(Math.abs(balB))}{balB < 0 ? " due" : ""}</span></div>
          </div>
        </div>
        <div className="section">
          <div className="section-h"><span className="lead">Quick links</span></div>
          <div className="btn-row">
            <a href="/expenses" className="btn secondary small">₹ Money</a>
            <a href="/manage" className="btn secondary small">⚙ Setup</a>
          </div>
        </div>
      </Layout>
    );
  }

  // ===== COOK =====
  if (u.role === "cook") {
    const [orders] = await conn.query(
      `SELECT mr.*, f.name AS family_name, m.name AS dish, m.color_theme, m.photo, m.diet_tags, u.name AS user_name
       FROM meal_requirements mr JOIN families f ON mr.family_id=f.id JOIN users u ON mr.user_id=u.id
       LEFT JOIN menu_items m ON mr.menu_item_id=m.id
       WHERE mr.date=? ORDER BY FIELD(mr.meal_type,'Breakfast','Lunch','Snacks','Dinner'), mr.family_id`, [t]);
    const byMeal = {};
    for (const o of orders) (byMeal[o.meal_type] ||= []).push(o);
    const totalPeople = orders.reduce((s, o) => s + Number(o.people), 0);
    const specialCount = orders.filter((o) => o.special_request).length;
    // preload last feedback per menu_item
    const fbByItem = {};
    for (const o of orders) {
      if (o.menu_item_id && !(o.menu_item_id in fbByItem)) {
        const [[fb]] = await conn.query("SELECT comment, improvement, rating FROM feedback WHERE menu_item_id=? ORDER BY date DESC LIMIT 1", [o.menu_item_id]);
        fbByItem[o.menu_item_id] = fb || null;
      }
    }
    return (
      <Layout title="Today's Cooking" subtitle={subtitle} user={u} flash={flash} active="/">
        <div className="stat-grid three">
          <div className="stat"><span className="label">Orders</span><span className="value">{orders.length}</span></div>
          <div className="stat"><span className="label">People</span><span className="value">{totalPeople}</span></div>
          <div className="stat"><span className="label">Special</span><span className="value">{specialCount}</span></div>
        </div>
        {orders.length === 0 ? (
          <div className="card mt-16"><div className="empty"><div className="ico">🍽</div>No orders for today yet.<br /><span className="small">Families will post requirements soon.</span></div></div>
        ) : (
          ["Breakfast", "Lunch", "Snacks", "Dinner"].map((meal) => byMeal[meal] && (
            <div className="section" key={meal}>
              <div className="section-h"><span className="lead">{meal}</span><span className="small">{byMeal[meal].length} orders</span></div>
              {byMeal[meal].map((o) => {
                const fb = o.menu_item_id ? fbByItem[o.menu_item_id] : null;
                return (
                  <div className="card" key={o.id}>
                    <DishPhoto name={dishName(o)} colorTheme={o.color_theme || "fi-default"} photo={o.photo} size="small" />
                    <div className="card-row">
                      <div className="grow">
                        <div className="card-name">{dishName(o)}</div>
                        <div className="card-meta">{o.family_name} · {o.people} ppl · {o.spice_level} · by {o.user_name}</div>
                        <DietPills tags={o.diet_tags} />
                        {o.special_request && <div className="suggest mt-8">★ <b>Special:</b> {o.special_request}</div>}
                        {o.notes && <div className="card-meta mt-8">{o.notes}</div>}
                        {fb && (
                          <div className="suggest primary mt-8">
                            <b>Past feedback:</b> {"★".repeat(Number(fb.rating) || 0)}
                            {fb.improvement ? ` · ${fb.improvement}` : ""}
                            {fb.comment && <><br />{fb.comment}</>}
                          </div>
                        )}
                      </div>
                      <span className={"pill " + (o.status === "prepared" ? "ok" : o.status === "accepted" ? "" : "muted")}>{ucfirst(o.status)}</span>
                    </div>
                    {o.status !== "prepared" && (
                      <div className="btn-row">
                        {o.status === "pending" && (
                          <form action={markAction} style={{ flex: 1 }}>
                            <input type="hidden" name="id" value={o.id} /><input type="hidden" name="kind" value="accepted" />
                            <button type="submit" className="btn secondary small">Accept</button>
                          </form>
                        )}
                        <form action={markAction} style={{ flex: 1 }}>
                          <input type="hidden" name="id" value={o.id} /><input type="hidden" name="kind" value="prepared" />
                          <button type="submit" className="btn small">Mark prepared</button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </Layout>
    );
  }

  // ===== FAMILY =====
  if (u.role === "family") {
    const [myOrders] = await conn.query(
      `SELECT mr.*, m.name AS dish, m.color_theme, m.photo, m.diet_tags
       FROM meal_requirements mr LEFT JOIN menu_items m ON mr.menu_item_id=m.id
       WHERE mr.family_id=? AND mr.date=? ORDER BY FIELD(mr.meal_type,'Breakfast','Lunch','Snacks','Dinner')`, [u.family_id, t]);
    const [tomPlans] = await conn.query(
      `SELECT mp.*, m.name AS dish, m.color_theme, m.photo, m.diet_tags
       FROM menu_plans mp LEFT JOIN menu_items m ON mp.menu_item_id=m.id
       WHERE mp.family_id=? AND mp.date=? ORDER BY FIELD(mp.meal_type,'Breakfast','Lunch','Snacks','Dinner')`, [u.family_id, tom]);
    const [[{ s: monthTotal }]] = await conn.query("SELECT COALESCE(SUM(amount),0) s FROM expenses WHERE DATE_FORMAT(date,'%Y-%m')=?", [month]);
    const share = monthTotal / 2;
    const [[{ s: paid }]] = await conn.query("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE family_id=? AND DATE_FORMAT(date,'%Y-%m')=?", [u.family_id, month]);
    const balance = paid - share;
    const [[{ c: shopN }]] = await conn.query("SELECT COUNT(*) c FROM shopping_list WHERE plan_date=? AND is_purchased=0", [tom]);
    return (
      <Layout title="Kitchen Home" subtitle={subtitle} user={u} flash={flash} active="/">
        {myOrders.length > 0 ? (
          <div className="section">
            <div className="section-h"><span className="lead">★ Today's menu</span><a href="/order">+ Add</a></div>
            {myOrders.map((o) => (
              <div className="hero-meal" key={o.id}>
                <DishPhoto name={dishName(o)} colorTheme={o.color_theme || "fi-default"} photo={o.photo} size="small" />
                <div className="body">
                  <div className="meal-cap">{String(o.meal_type).toUpperCase()} · {String(o.status).toUpperCase()}</div>
                  <h3>{dishName(o)}</h3>
                  <div className="meta">{o.people} ppl · {o.spice_level}{o.special_request ? ` · ${o.special_request}` : ""}</div>
                  <DietPills tags={o.diet_tags} />
                  {o.status === "prepared" && <a href={`/feedback/new?req=${o.id}`} className="btn secondary small mt-12">★ Add feedback</a>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="section">
            <div className="card">
              <div className="empty">
                <div className="ico">🍽</div>
                No orders posted for today yet.<br />
                <a href="/order" className="btn small mt-12" style={{ display: "inline-flex" }}>+ Post a meal request</a>
              </div>
            </div>
          </div>
        )}
        <div className="section">
          <div className="section-h"><span className="lead">Tomorrow's plan</span><a href="/plan">Plan →</a></div>
          {tomPlans.length === 0 ? (
            <a href="/plan" className="card-link">
              <div className="card"><div className="card-row">
                <div className="grow"><div className="card-name">No plans yet</div><div className="card-meta">Tap to plan tomorrow's meals</div></div>
                <span className="pill warn">+</span>
              </div></div>
            </a>
          ) : tomPlans.map((p) => (
            <div className="card" key={p.id}>
              <DishPhoto name={dishName(p)} colorTheme={p.color_theme || "fi-default"} photo={p.photo} size="tiny" />
              <div className="card-row">
                <div className="grow"><div className="card-name">{p.dish || p.custom_dish}</div><div className="card-meta">{p.meal_type} · {p.people} ppl</div></div>
                <span className={"pill " + (p.status === "confirmed" || p.status === "shopping" ? "ok" : "warn")}>{ucfirst(p.status)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="section">
          <div className="section-h"><span className="lead">My month</span></div>
          <div className="stat-grid">
            <div className="stat"><span className="label">My share</span><span className="value small">{fmtMoney(share)}</span><span className="sub">of {fmtMoney(monthTotal)}</span></div>
            <div className="stat"><span className="label">I paid</span><span className="value small">{fmtMoney(paid)}</span><span className="sub" style={{ color: balance >= 0 ? "var(--ok)" : "var(--danger)" }}>{balance >= 0 ? "Excess " : ""}{fmtMoney(Math.abs(balance))}{balance < 0 ? " due" : ""}</span></div>
          </div>
        </div>
        {shopN > 0 && (
          <div className="section">
            <a href="/shopping" className="card-link">
              <div className="card"><div className="card-row">
                <div className="grow"><div className="card-name">🛒 Shopping list</div><div className="card-meta">{shopN} items pending for tomorrow</div></div>
                <span className="pill">{shopN}</span>
              </div></div>
            </a>
          </div>
        )}
        <a href="/order" className="fab" title="Add requirement">+</a>
      </Layout>
    );
  }

  // ===== DRIVER =====
  const [[{ c: pendingCount }]] = await conn.query("SELECT COUNT(*) c FROM shopping_list WHERE plan_date=? AND is_purchased=0", [tom]);
  const [[{ s: myTotal }]] = await conn.query("SELECT COALESCE(SUM(amount),0) s FROM expenses WHERE purchased_by=? AND DATE_FORMAT(date,'%Y-%m')=?", [u.id, month]);
  const [recent] = await conn.query("SELECT * FROM expenses WHERE purchased_by=? ORDER BY date DESC, id DESC LIMIT 5", [u.id]);
  return (
    <Layout title="Driver Home" subtitle={subtitle} user={u} flash={flash} active="/">
      <div className="stat-grid">
        <div className="stat"><span className="label">Items to buy</span><span className="value">{pendingCount}</span><span className="sub">for tomorrow</span></div>
        <div className="stat"><span className="label">My month total</span><span className="value small">{fmtMoney(myTotal)}</span></div>
      </div>
      <div className="section">
        <div className="btn-row">
          <a href="/shopping" className="btn">🛒 Shopping list</a>
          <a href="/expense/new" className="btn secondary">+ Expense</a>
        </div>
      </div>
      <div className="section">
        <div className="section-h"><span className="lead">My recent purchases</span></div>
        {recent.length === 0 ? (
          <div className="card"><div className="empty">No purchases recorded yet.</div></div>
        ) : recent.map((e) => (
          <div className="card" key={e.id}>
            <div className="card-row">
              <div className="grow"><div className="card-name">{e.item_name}</div><div className="card-meta">{e.category} · {e.quantity} · {fmtDateShort(e.date)}</div></div>
              <div className="text-right strong">{fmtMoney(e.amount)}</div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
