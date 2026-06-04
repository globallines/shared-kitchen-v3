import { requireUser, db, getFlash } from "../../lib/server";
import { redirect } from "next/navigation";
import { Layout } from "../../lib/ui.jsx";
import { roleLabel } from "../../lib/helpers";
export const dynamic = "force-dynamic";

async function deleteUser(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u || u.role !== "admin") redirect("/");
  const id = Number(formData.get("delete_user"));
  if (id != u.id) {
    await db().query("UPDATE users SET is_active = 0 WHERE id = ?", [id]);
    await setFlash("User deactivated");
  } else {
    await setFlash("Cannot deactivate your own account", "error");
  }
  redirect("/manage?tab=users");
}

async function activateUser(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u || u.role !== "admin") redirect("/");
  await db().query("UPDATE users SET is_active = 1 WHERE id = ?", [Number(formData.get("activate_user"))]);
  await setFlash("User activated");
  redirect("/manage?tab=users");
}

async function deleteMenu(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u || u.role !== "admin") redirect("/");
  await db().query("UPDATE menu_items SET is_active = 0 WHERE id = ?", [Number(formData.get("delete_menu"))]);
  await setFlash("Menu item hidden");
  redirect("/manage?tab=menu");
}

async function activateMenu(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u || u.role !== "admin") redirect("/");
  await db().query("UPDATE menu_items SET is_active = 1 WHERE id = ?", [Number(formData.get("activate_menu"))]);
  await setFlash("Menu item activated");
  redirect("/manage?tab=menu");
}

export default async function Manage({ searchParams }) {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/");
  const flash = await getFlash();
  const sp = (await searchParams) || {};
  const tab = sp.tab || "users";
  const conn = db();

  return (
    <Layout title="Setup" user={u} flash={flash} active="/manage">
      <div className="tabs">
        <a href="/manage?tab=users" className={tab === "users" ? "active" : ""}>Users</a>
        <a href="/manage?tab=families" className={tab === "families" ? "active" : ""}>Families</a>
        <a href="/manage?tab=menu" className={tab === "menu" ? "active" : ""}>Menu</a>
      </div>
      {tab === "users" && (await renderUsers(conn, u))}
      {tab === "families" && (await renderFamilies(conn))}
      {tab === "menu" && (await renderMenu(conn))}
    </Layout>
  );
}

async function renderUsers(conn, u) {
  const [users] = await conn.query(
    "SELECT u.*, f.name AS family_name FROM users u LEFT JOIN families f ON u.family_id = f.id ORDER BY u.is_active DESC, u.role, u.name"
  );
  return (
    <>
      <div className="section">
        <div className="section-h">
          <span className="lead">All users ({users.length})</span>
          <a href="/user/new" className="btn ghost small">+ New user</a>
        </div>
        <div className="list">
          {users.map((usr) => (
            <div className="card" style={!usr.is_active ? { opacity: 0.5 } : undefined} key={usr.id}>
              <div className="card-row">
                <div className="grow">
                  <div className="card-name">{usr.name}
                    {!usr.is_active && <span className="pill muted">inactive</span>}
                  </div>
                  <div className="card-meta">
                    @{usr.username} · {roleLabel(usr.role)}
                    {usr.family_name ? ` · ${usr.family_name}` : ""}
                  </div>
                  {usr.phone && <div className="small">{usr.phone}</div>}
                </div>
                <div className="text-right">
                  <a href={`/user/${usr.id}/edit`} className="btn ghost small">Edit</a>
                  {usr.id != u.id && (
                    usr.is_active ? (
                      <form action={deleteUser} style={{ display: "inline" }}>
                        <button type="submit" name="delete_user" value={usr.id} className="btn ghost small" data-confirm={`Deactivate ${usr.name}?`} style={{ color: "var(--danger)" }}>×</button>
                      </form>
                    ) : (
                      <form action={activateUser} style={{ display: "inline" }}>
                        <button type="submit" name="activate_user" value={usr.id} className="btn ghost small" style={{ color: "var(--ok)" }}>↺</button>
                      </form>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <a href="/user/new" className="fab">+</a>
    </>
  );
}

async function renderFamilies(conn) {
  const [fams] = await conn.query(
    "SELECT f.*, COUNT(u.id) AS member_count FROM families f LEFT JOIN users u ON u.family_id = f.id AND u.is_active = 1 GROUP BY f.id ORDER BY f.name"
  );
  return (
    <div className="section">
      <div className="section-h"><span className="lead">Families ({fams.length})</span></div>
      <div className="list">
        {fams.map((f) => (
          <div className="card" key={f.id}>
            <div className="card-row">
              <div className="grow">
                <div className="card-name">{f.name}</div>
                <div className="card-meta">
                  Head: {f.head_name || "—"} · {f.member_count} members
                </div>
              </div>
              <a href={`/family/${f.id}/edit`} className="btn ghost small">Edit</a>
            </div>
          </div>
        ))}
      </div>
      <p className="small mt-12 muted">Note: System works best with exactly 2 families (for 50/50 cost split).</p>
    </div>
  );
}

async function renderMenu(conn) {
  const [items] = await conn.query("SELECT * FROM menu_items ORDER BY is_active DESC, category, name");
  const byCat = {};
  for (const i of items) (byCat[i.category] ||= []).push(i);
  return (
    <>
      <div className="section">
        <div className="section-h">
          <span className="lead">Menu items ({items.length})</span>
          <a href="/menu/new" className="btn ghost small">+ New</a>
        </div>
        {Object.entries(byCat).map(([cat, list]) => (
          <div key={cat}>
            <h4 style={{ margin: "14px 0 8px" }}>{cat}</h4>
            <div className="list">
              {list.map((m) => (
                <div className="card" style={!m.is_active ? { opacity: 0.5 } : undefined} key={m.id}>
                  <div className="card-row">
                    <div className="grow">
                      <div className="card-name">{m.name}
                        {!m.is_active && <span className="pill muted">hidden</span>}
                      </div>
                      <div className="card-meta">{m.cuisine}</div>
                      {m.ingredients && (
                        <div className="small mt-4">{m.ingredients.length > 80 ? m.ingredients.slice(0, 77) + "..." : m.ingredients}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <a href={`/menu/${m.id}/edit`} className="btn ghost small">Edit</a>
                      {m.is_active ? (
                        <form action={deleteMenu} style={{ display: "inline" }}>
                          <button type="submit" name="delete_menu" value={m.id} className="btn ghost small" data-confirm="Hide this dish?" style={{ color: "var(--danger)" }}>×</button>
                        </form>
                      ) : (
                        <form action={activateMenu} style={{ display: "inline" }}>
                          <button type="submit" name="activate_menu" value={m.id} className="btn ghost small" style={{ color: "var(--ok)" }}>↺</button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <a href="/menu/new" className="fab">+</a>
    </>
  );
}
