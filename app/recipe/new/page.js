import { requireUser, getFlash } from "../../../lib/server";
import { redirect } from "next/navigation";
import { Layout } from "../../../lib/ui.jsx";
import { CUISINES, DIET_TAGS, FOOD_COLORS } from "../../../lib/helpers";
export const dynamic = "force-dynamic";

async function createRecipe(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../../lib/server");
  const { autoColor } = await import("../../../lib/helpers");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u) redirect("/login");

  const title = String(formData.get("title") || "").trim();
  const cat = formData.get("category");
  const cuisine = formData.get("cuisine");
  const diff = formData.get("difficulty");
  const time = Number(formData.get("time_min")) || 0;
  const serv = Math.max(1, Number(formData.get("servings")) || 0);
  const desc = String(formData.get("description") || "").trim();
  const steps = String(formData.get("steps") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const video = String(formData.get("video_url") || "").trim();
  const color = formData.get("color_theme") || autoColor(cat, cuisine);
  const diets = formData.getAll("diet_tags").filter(Boolean);
  const dietStr = diets.join(",");
  // photo upload skipped
  const photo = null;

  if (!title) {
    await setFlash("Title required", "error");
    redirect("/recipe/new");
  } else {
    const [res] = await db().query(
      "INSERT INTO recipes (title, category, cuisine, difficulty, time_min, servings, description, steps, notes, video_url, photo, color_theme, diet_tags, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [title, cat || null, cuisine || null, diff, time, serv, desc || null, steps || null, notes || null, video || null, photo, color, dietStr || null, u.id]
    );
    const rid = res.insertId;

    const names = formData.getAll("ing_name");
    const qtys = formData.getAll("ing_qty");
    const units = formData.getAll("ing_unit");
    for (let i = 0; i < names.length; i++) {
      const n = String(names[i] || "").trim();
      if (!n) continue;
      await db().query(
        "INSERT INTO recipe_ingredients (recipe_id, name, qty, unit, sort_order) VALUES (?,?,?,?,?)",
        [rid, n, parseFloat(qtys[i] ?? 0) || 0, units[i] ?? "g", i]
      );
    }

    await setFlash("Recipe saved");
    redirect(`/recipe/${rid}`);
  }
}

const ingRowHTML = `
        <input type="text" name="ing_name[]" placeholder="Ingredient" style="padding:10px;border:1px solid var(--line);border-radius:8px;">
        <input type="number" name="ing_qty[]" step="0.01" placeholder="Qty" style="padding:10px;border:1px solid var(--line);border-radius:8px;">
        <select name="ing_unit[]" style="padding:10px;border:1px solid var(--line);border-radius:8px;">
            <option>g</option><option>kg</option><option>ml</option><option>l</option>
            <option>tsp</option><option>tbsp</option><option>cup</option><option>pcs</option>
        </select>`;

const addIngScript = `
function addIng() {
    const wrap = document.getElementById('ings');
    const row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1fr;gap:6px;margin-bottom:6px;';
    row.innerHTML = \`${ingRowHTML}\`;
    wrap.appendChild(row);
}`;

export default async function RecipeNew() {
  const u = await requireUser();
  const flash = await getFlash();

  return (
    <Layout title="New Recipe" user={u} flash={flash} active="/cuisine">
      <form action={createRecipe}>
        <div className="field">
          <label>Recipe title</label>
          <input type="text" name="title" required placeholder="e.g. Healthy Veg Pulao" />
        </div>

        <div className="row2">
          <div className="field">
            <label>Category</label>
            <select name="category" defaultValue="Breakfast">
              {["Breakfast", "Lunch", "Dinner", "Snacks", "Veg", "Chicken", "Mutton", "Fish", "Egg", "Other"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Cuisine</label>
            <select name="cuisine" defaultValue="Indian">
              {CUISINES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="row3">
          <div className="field">
            <label>Difficulty</label>
            <select name="difficulty" defaultValue="Easy"><option>Easy</option><option>Medium</option><option>Hard</option></select>
          </div>
          <div className="field">
            <label>Time (min)</label>
            <input type="number" name="time_min" defaultValue="30" min="1" />
          </div>
          <div className="field">
            <label>Servings</label>
            <input type="number" name="servings" defaultValue="4" min="1" />
          </div>
        </div>

        <div className="field">
          <label>Description</label>
          <textarea name="description" rows="2"></textarea>
        </div>

        <div className="field">
          <label>Diet tags (tap to select)</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {DIET_TAGS.map((tag) => (
              <label className="chip diet-chip" style={{ cursor: "pointer" }} key={tag}>
                <input type="checkbox" name="diet_tags" value={tag} style={{ display: "none" }} />
                {tag}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Color theme (for the photo placeholder)</label>
          <select name="color_theme">
            {Object.entries(FOOD_COLORS).map(([cls, name]) => (
              <option value={cls} key={cls}>{name}</option>
            ))}
          </select>
          <span className="hint">Used until you upload a real photo</span>
        </div>

        <div className="field">
          <label>Video link (YouTube etc.)</label>
          <input type="url" name="video_url" placeholder="https://youtube.com/watch?v=..." />
        </div>

        <div className="field">
          <label>Photo (optional)</label>
          <input type="file" name="photo" accept="image/*" />
        </div>

        <hr />
        <h3>Ingredients</h3>
        <p className="small mb-12">Add each ingredient. Nutrition is auto-calculated.</p>

        <div id="ings">
          {[0, 1, 2, 3, 4].map((i) => (
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "6px", marginBottom: "6px" }} key={i}>
              <input type="text" name="ing_name" placeholder="Ingredient" style={{ padding: "10px", border: "1px solid var(--line)", borderRadius: "8px" }} />
              <input type="number" name="ing_qty" step="0.01" placeholder="Qty" style={{ padding: "10px", border: "1px solid var(--line)", borderRadius: "8px" }} />
              <select name="ing_unit" defaultValue="g" style={{ padding: "10px", border: "1px solid var(--line)", borderRadius: "8px" }}>
                <option>g</option><option>kg</option><option>ml</option><option>l</option>
                <option>tsp</option><option>tbsp</option><option>cup</option><option>pcs</option>
              </select>
            </div>
          ))}
        </div>
        <button type="button" className="btn secondary small" onClick="addIng()">+ Add another</button>

        <hr />
        <div className="field">
          <label>Cooking steps</label>
          <textarea name="steps" rows="6" placeholder="Step by step..."></textarea>
        </div>

        <div className="field">
          <label>Tips / notes</label>
          <textarea name="notes" rows="2"></textarea>
        </div>

        <button type="submit" className="btn">Save recipe</button>
        <a href="/recipes" className="btn secondary mt-8">Cancel</a>
      </form>

      <script dangerouslySetInnerHTML={{ __html: addIngScript }} />
    </Layout>
  );
}
