import { requireUser, db, getFlash } from "../../../lib/server";
import { Layout, DishPhoto } from "../../../lib/ui.jsx";
import { fmtDate } from "../../../lib/helpers";
export const dynamic = "force-dynamic";

// Basic nutrition lookup (port of $NUTRI_DB / nutri_lookup)
const NUTRI_DB = {
  "rice": [130, 2.7, 28, 0.3, 0.4],
  "basmati rice": [121, 3.5, 25, 0.4, 0.4],
  "brown rice": [111, 2.6, 23, 0.9, 1.8],
  "chicken": [165, 31, 0, 3.6, 0],
  "mutton": [294, 25, 0, 21, 0],
  "fish": [206, 22, 0, 12, 0],
  "egg": [155, 13, 1.1, 11, 0],
  "paneer": [265, 18, 1.2, 21, 0],
  "tofu": [76, 8, 1.9, 4.8, 0.3],
  "toor dal": [343, 22, 63, 1.5, 15],
  "urad dal": [341, 25, 59, 1.6, 18],
  "dal": [343, 22, 63, 1.5, 15],
  "oil": [884, 0, 0, 100, 0],
  "olive oil": [884, 0, 0, 100, 0],
  "ghee": [900, 0, 0, 100, 0],
  "mixed vegetables": [65, 2.5, 13, 0.3, 4],
  "vegetables": [50, 2, 10, 0.3, 3],
  "onion": [40, 1.1, 9, 0.1, 1.7],
  "tomato": [18, 0.9, 3.9, 0.2, 1.2],
  "potato": [77, 2, 17, 0.1, 2.2],
  "pasta": [131, 5, 25, 1.1, 1.8],
  "milk": [60, 3.2, 4.8, 3.3, 0],
  "curd": [60, 3.5, 4.7, 3.3, 0],
  "butter": [717, 0.8, 0.1, 81, 0],
};

function nutriLookup(name) {
  const k = String(name || "").toLowerCase().trim();
  if (NUTRI_DB[k]) return NUTRI_DB[k];
  for (const [key, v] of Object.entries(NUTRI_DB)) {
    if (k.includes(key) || key.includes(k)) return v;
  }
  return null;
}

// round to N decimals like PHP round()
const rnd = (x, d = 0) => {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
};

async function addComment(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u) redirect("/login");
  const id = Number(formData.get("id")) || 0;
  const comment = String(formData.get("comment") || "").trim();
  const rating = Number(formData.get("rating")) || null;
  if (comment) {
    await db().query(
      "INSERT INTO recipe_comments (recipe_id, user_id, comment, rating) VALUES (?,?,?,?)",
      [id, u.id, comment, rating]
    );
    await setFlash("Comment added");
  }
  redirect(`/recipe/${id}`);
}

async function addToPlan(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../../lib/server");
  const { tomorrow } = await import("../../../lib/helpers");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u) redirect("/login");
  const id = Number(formData.get("id")) || 0;
  const title = String(formData.get("title") || "");
  if (u.family_id) {
    await db().query(
      "INSERT INTO menu_plans (date, family_id, meal_type, custom_dish, people, status, created_by) VALUES (?, ?, 'Lunch', ?, 4, 'requested', ?)",
      [tomorrow(), u.family_id, title, u.id]
    );
    await setFlash(`Added "${title}" to tomorrow's plan!`);
    redirect("/plan");
  } else {
    await setFlash("Family role required to add to plan", "error");
    redirect(`/recipe/${id}`);
  }
}

async function deleteRecipe(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u) redirect("/login");
  const id = Number(formData.get("id")) || 0;
  const [[r]] = await db().query("SELECT created_by FROM recipes WHERE id = ?", [id]);
  if (!r) redirect("/recipes");
  if (u.role === "admin" || r.created_by == u.id) {
    await db().query("DELETE FROM recipes WHERE id = ?", [id]);
    await setFlash("Recipe deleted");
    redirect("/recipes");
  }
  redirect(`/recipe/${id}`);
}

export default async function RecipeView({ params }) {
  const u = await requireUser();
  const flash = await getFlash();
  const conn = db();

  const p = await params;
  const id = Number(p.id) || 0;

  const [[r]] = await conn.query(
    "SELECT r.*, u.name AS author FROM recipes r JOIN users u ON r.created_by = u.id WHERE r.id = ?",
    [id]
  );

  if (!r) {
    return (
      <Layout title="Not found" user={u} flash={flash} active="/cuisine">
        <div className="empty">Recipe not found.</div>
      </Layout>
    );
  }

  const [ingredients] = await conn.query(
    "SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY sort_order, id",
    [id]
  );

  const [comments] = await conn.query(
    "SELECT c.*, u.name FROM recipe_comments c JOIN users u ON c.user_id = u.id WHERE recipe_id = ? ORDER BY c.created_at DESC",
    [id]
  );

  // Nutrition totals
  const nutTotal = [0, 0, 0, 0, 0];
  const unknown = [];
  for (const ing of ingredients) {
    const vals = nutriLookup(ing.name);
    if (!vals) { unknown.push(ing.name); continue; }
    let g = parseFloat(ing.qty) || 0;
    if (ing.unit === "kg" || ing.unit === "l") g *= 1000;
    const factor = g / 100;
    for (let i = 0; i < vals.length; i++) nutTotal[i] += vals[i] * factor;
  }
  const serv = Math.max(1, Number(r.servings) || 0);
  const nutPer = nutTotal.map((x) => x / serv);

  const dietTags = r.diet_tags
    ? String(r.diet_tags).split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <Layout title={r.title} subtitle="Recipe" user={u} flash={flash} active="/cuisine">
      <DishPhoto name={r.title} colorTheme={r.color_theme || "fi-default"} photo={r.photo} size="large" />

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
        <span className="pill">{r.cuisine}</span>
        <span className="pill">{r.difficulty}</span>
        <span className="pill">{r.time_min} min</span>
        {dietTags.map((tag, i) => (
          <span className="pill diet" key={i}>{tag}</span>
        ))}
      </div>

      {r.description && (
        <div className="card mb-12" style={{ whiteSpace: "pre-line" }}>{r.description}</div>
      )}

      {ingredients.length > 0 && (
        <div className="stat-grid mb-12">
          <div className="stat"><span className="label">Calories</span><span className="value">{rnd(nutPer[0])}</span><span className="sub">kcal/serving</span></div>
          <div className="stat"><span className="label">Protein</span><span className="value">{rnd(nutPer[1], 1)}g</span><span className="sub">per serving</span></div>
        </div>
      )}

      {u.role === "family" && (
        <form action={addToPlan} className="mb-12">
          <input type="hidden" name="id" value={r.id} />
          <input type="hidden" name="title" value={r.title} />
          <button type="submit" className="btn">＋ Add to Tomorrow Plan</button>
        </form>
      )}

      {r.video_url && (
        <a href={r.video_url} target="_blank" className="btn secondary mb-12">▶ Watch video</a>
      )}

      {ingredients.length > 0 && (
        <>
          <div className="section">
            <div className="section-h"><span className="lead">Ingredients</span></div>
            <div className="card">
              {ingredients.map((ing) => (
                <div className="kv" key={ing.id}>
                  <span className="k">{ing.name}</span>
                  <span className="v">{parseFloat(ing.qty)} {ing.unit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-h"><span className="lead">Full nutrition (approx)</span></div>
            <div className="card">
              <h4 className="mb-8">Per serving (1 of {serv})</h4>
              <div className="stat-grid">
                <div className="stat"><span className="label">Carbs</span><span className="value small">{rnd(nutPer[2], 1)}g</span></div>
                <div className="stat"><span className="label">Fat</span><span className="value small">{rnd(nutPer[3], 1)}g</span></div>
              </div>
              <hr className="dashed" />
              <div className="kv"><span className="k">Total recipe</span><span className="v">{rnd(nutTotal[0])} kcal</span></div>
              <div className="kv"><span className="k">Fiber per serving</span><span className="v">{rnd(nutPer[4], 1)}g</span></div>
              {unknown.length > 0 && (
                <div className="suggest mt-8"><b>Note:</b> No data for: {unknown.join(", ")}.</div>
              )}
            </div>
            <div className="disclaimer">Nutrition values are approximate, for general wellness only. Not medical advice.</div>
          </div>
        </>
      )}

      {r.steps && (
        <div className="section">
          <div className="section-h"><span className="lead">Cooking steps</span></div>
          <div className="card"><div style={{ whiteSpace: "pre-line", lineHeight: "1.7" }}>{r.steps}</div></div>
        </div>
      )}

      {r.notes && (
        <div className="section">
          <div className="section-h"><span className="lead">Tips</span></div>
          <div className="card"><div style={{ whiteSpace: "pre-line" }}>{r.notes}</div></div>
        </div>
      )}

      <div className="section">
        <div className="section-h"><span className="lead">Comments ({comments.length})</span></div>
        <form action={addComment} className="card">
          <input type="hidden" name="id" value={r.id} />
          <div className="field">
            <label>Your rating</label>
            <div className="stars" data-input="rating">
              <span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span>
            </div>
            <input type="hidden" name="rating" defaultValue="" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <textarea name="comment" rows="2" placeholder="Share your tip or feedback..." required></textarea>
          </div>
          <button type="submit" className="btn small mt-12">Post comment</button>
        </form>

        {comments.length > 0 && (
          <div className="list mt-12">
            {comments.map((c) => (
              <div className="card" key={c.id}>
                <div className="card-row">
                  <div className="grow">
                    <div className="strong">{c.name} {c.rating ? <span style={{ color: "#f59e0b", fontSize: "13px" }}>{"★".repeat(Number(c.rating))}</span> : null}</div>
                    <div className="small mb-4">{fmtDate(c.created_at)}</div>
                    <div style={{ whiteSpace: "pre-line" }}>{c.comment}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(u.role === "admin" || r.created_by == u.id) && (
        <form action={deleteRecipe} className="mt-12">
          <input type="hidden" name="id" value={r.id} />
          <button type="submit" className="btn ghost small" data-confirm="Delete this recipe?" style={{ color: "var(--danger)" }}>Delete recipe</button>
        </form>
      )}
    </Layout>
  );
}
