import { requireUser, db, getFlash } from "../../lib/server";
import { Layout, DishPhoto, DietPills } from "../../lib/ui.jsx";
import { DIET_TAGS } from "../../lib/helpers";
export const dynamic = "force-dynamic";

export default async function Recipes({ searchParams }) {
  const u = await requireUser();
  const flash = await getFlash();
  const conn = db();

  const sp = (await searchParams) || {};
  const cuisine = sp.cuisine || "";
  const diet = sp.diet || "";
  const q = (sp.q || "").trim();

  const where = ["1=1"];
  const params = [];
  if (cuisine) { where.push("r.cuisine = ?"); params.push(cuisine); }
  if (diet) { where.push("r.diet_tags LIKE ?"); params.push("%" + diet + "%"); }
  if (q) { where.push("(r.title LIKE ? OR r.description LIKE ?)"); params.push(`%${q}%`); params.push(`%${q}%`); }

  const sql = "SELECT r.*, u.name AS author FROM recipes r JOIN users u ON r.created_by = u.id WHERE " + where.join(" AND ") + " ORDER BY r.created_at DESC";
  const [recipes] = await conn.query(sql, params);

  const [cuisineRows] = await conn.query("SELECT DISTINCT cuisine FROM recipes WHERE cuisine IS NOT NULL ORDER BY cuisine");
  const cuisinesUsed = cuisineRows.map((r) => r.cuisine);

  // Mirrors recipe_url_with(): merge current q/cuisine/diet with overrides, drop empties.
  function recipeUrlWith(over) {
    const merged = { q, cuisine, diet, ...over };
    const usp = new URLSearchParams();
    for (const k of ["q", "cuisine", "diet"]) {
      if (merged[k]) usp.set(k, merged[k]);
    }
    const qs = usp.toString();
    return "/recipes" + (qs ? "?" + qs : "");
  }

  return (
    <Layout title="Recipes" subtitle="Library" user={u} flash={flash} active="/cuisine">
      <form method="get" className="mb-12">
        {cuisine && <input type="hidden" name="cuisine" value={cuisine} />}
        {diet && <input type="hidden" name="diet" value={diet} />}
        <div className="field" style={{ marginBottom: "8px" }}>
          <input type="search" name="q" defaultValue={q} placeholder="🔍 Search recipes..." />
        </div>
      </form>

      <div className="chips" style={{ marginBottom: "6px" }}>
        <a href={recipeUrlWith({ cuisine: "" })} className={"chip " + (!cuisine ? "on" : "")}>All cuisines</a>
        {cuisinesUsed.map((c) => (
          <a href={recipeUrlWith({ cuisine: c })} className={"chip " + (cuisine === c ? "on" : "")} key={c}>{c}</a>
        ))}
      </div>

      <div className="chips" style={{ marginBottom: "14px" }}>
        {DIET_TAGS.map((tag) => (
          <a href={recipeUrlWith({ diet: diet === tag ? "" : tag })} className={"chip diet-chip " + (diet === tag ? "on" : "")} key={tag}>{tag}</a>
        ))}
      </div>

      <div className="section">
        <div className="section-h">
          <span className="lead">{recipes.length} recipe{recipes.length !== 1 ? "s" : ""}</span>
          <a href="/recipe/new">+ New</a>
        </div>

        {!recipes.length ? (
          <div className="card"><div className="empty">No recipes match your filters.<br /><a href="/recipes" className="btn small mt-12" style={{ display: "inline-flex" }}>Clear filters</a></div></div>
        ) : (
          recipes.map((r) => (
            <a href={`/recipe/${r.id}`} className="card-link" key={r.id}>
              <div className="card">
                <DishPhoto name={r.title} colorTheme={r.color_theme || "fi-default"} photo={r.photo} />
                <div className="card-row">
                  <div className="grow">
                    <div className="card-name">{r.title}</div>
                    <div className="card-meta">
                      {r.cuisine} · {r.difficulty} · {r.time_min} min · {r.servings} servings
                    </div>
                    <DietPills tags={r.diet_tags} />
                    <div className="small mt-4">by {r.author}</div>
                  </div>
                  {r.video_url && (
                    <span className="pill warn">▶</span>
                  )}
                </div>
              </div>
            </a>
          ))
        )}
      </div>

      <a href="/recipe/new" className="fab">+</a>
    </Layout>
  );
}
