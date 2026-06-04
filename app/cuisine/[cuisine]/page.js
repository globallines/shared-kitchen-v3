import { requireUser, db, getFlash } from "../../../lib/server";
import { Layout, DishPhoto, DietPills } from "../../../lib/ui.jsx";
import { DIET_TAGS } from "../../../lib/helpers";
export const dynamic = "force-dynamic";

export default async function CuisineView({ params, searchParams }) {
  const u = await requireUser();
  const flash = await getFlash();
  const conn = db();

  const p = await params;
  const sp = (await searchParams) || {};
  const cuisine = p.cuisine ? decodeURIComponent(p.cuisine) : "Indian";
  const dietFilter = sp.diet || "";

  const where = ["is_active = 1", "cuisine = ?"];
  const dishParams = [cuisine];
  if (dietFilter) {
    where.push("diet_tags LIKE ?");
    dishParams.push("%" + dietFilter + "%");
  }
  const sql = "SELECT * FROM menu_items WHERE " + where.join(" AND ") + " ORDER BY category, name";
  const [dishes] = await conn.query(sql, dishParams);

  // Also recipes from this cuisine
  const recSql = "SELECT * FROM recipes WHERE cuisine = ? " + (dietFilter ? "AND diet_tags LIKE ?" : "") + " ORDER BY created_at DESC LIMIT 10";
  const recParams = [cuisine];
  if (dietFilter) recParams.push("%" + dietFilter + "%");
  const [recipes] = await conn.query(recSql, recParams);

  const base = `/cuisine/${encodeURIComponent(cuisine)}`;

  return (
    <Layout title={cuisine} subtitle="Cuisine" user={u} flash={flash} active="/cuisine">
      <div className="chips" style={{ marginBottom: "6px" }}>
        <a href={base} className={"chip " + (!dietFilter ? "on" : "")}>All</a>
        {DIET_TAGS.map((tag) => (
          <a href={`${base}?diet=${encodeURIComponent(tag)}`} className={"chip diet-chip " + (dietFilter === tag ? "on" : "")} key={tag}>{tag}</a>
        ))}
      </div>

      {!dishes.length && !recipes.length && (
        <div className="card mt-12">
          <div className="empty">
            <div className="ico">🍽</div>
            No dishes found{dietFilter ? ` for "${dietFilter}"` : ""}.<br />
            {dietFilter && (
              <a href={base} className="btn small mt-12" style={{ display: "inline-flex" }}>Clear filter</a>
            )}
          </div>
        </div>
      )}

      {dishes.length > 0 && (
        <div className="section">
          <div className="section-h"><span className="lead">Dishes ({dishes.length})</span></div>
          {dishes.map((d) => (
            <div className="card" key={d.id}>
              <a href={`/dish/${d.id}`} className="card-link" style={{ display: "block" }}>
                <DishPhoto name={d.name} colorTheme={d.color_theme || "fi-default"} photo={d.photo} />
                <div className="card-row">
                  <div className="grow">
                    <div className="card-name">{d.name}</div>
                    <div className="card-meta">
                      {d.category}
                      {d.description ? ` · ${d.description}` : ""}
                    </div>
                    <DietPills tags={d.diet_tags} />
                  </div>
                  <div className="small" style={{ whiteSpace: "nowrap", color: "var(--primary)" }}>View →</div>
                </div>
              </a>
              {["family", "admin"].includes(u.role) && (
                <div className="btn-row">
                  <a href={`/order?menu_id=${d.id}`} className="btn small">＋ Order today</a>
                  <a href={`/plan?menu_id=${d.id}`} className="btn secondary small">＋ Plan tomorrow</a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {recipes.length > 0 && (
        <div className="section">
          <div className="section-h"><span className="lead">Recipes ({recipes.length})</span></div>
          {recipes.map((r) => (
            <a href={`/recipe/${r.id}`} className="card-link" key={r.id}>
              <div className="card">
                <DishPhoto name={r.title} colorTheme={r.color_theme || "fi-default"} photo={r.photo} size="small" />
                <div className="card-row">
                  <div className="grow">
                    <div className="card-name">{r.title}</div>
                    <div className="card-meta">{r.difficulty} · {r.time_min} min · {r.servings} servings</div>
                    <DietPills tags={r.diet_tags} />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </Layout>
  );
}
