import { requireUser, getFlash } from "../../../lib/server";
import { redirect } from "next/navigation";
import { Layout } from "../../../lib/ui.jsx";
import { CUISINES, DIET_TAGS, FOOD_COLORS, autoColor } from "../../../lib/helpers";
export const dynamic = "force-dynamic";

async function createMenu(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../../lib/server");
  const { autoColor } = await import("../../../lib/helpers");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u || u.role !== "admin") redirect("/");

  const name = String(formData.get("name") || "").trim();
  const cat = formData.get("category");
  const cui = formData.get("cuisine");
  const desc = String(formData.get("description") || "").trim();
  const ings = String(formData.get("ingredients") || "").trim();
  const diets = formData.getAll("diet_tags").filter(Boolean);
  const dietStr = diets.join(",");
  const color = formData.get("color_theme") || autoColor(cat, cui);
  // photo upload skipped
  const photo = null;

  if (!name) {
    await setFlash("Name required", "error");
    redirect("/menu/new");
  } else {
    await db().query(
      "INSERT INTO menu_items (name, category, cuisine, description, ingredients, diet_tags, color_theme, photo) VALUES (?,?,?,?,?,?,?,?)",
      [name, cat, cui, desc || null, ings || null, dietStr || null, color, photo]
    );
    await setFlash("Menu item added");
    redirect("/manage?tab=menu");
  }
}

export default async function MenuNew() {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/");
  const flash = await getFlash();

  return (
    <Layout title="New Menu Item" user={u} flash={flash} active="/menu/new">
      <form action={createMenu}>
        <div className="field">
          <label>Dish name</label>
          <input type="text" name="name" required placeholder="e.g. Palak Paneer" />
        </div>

        <div className="row2">
          <div className="field">
            <label>Category</label>
            <select name="category" required defaultValue="Veg">
              {["Veg", "Chicken", "Mutton", "Fish", "Egg", "Snacks", "Breakfast", "Other"].map((c) => (
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

        <div className="field">
          <label>Short description</label>
          <textarea name="description" rows="2" placeholder="One-line description"></textarea>
        </div>

        <div className="field">
          <label>Ingredients (comma-separated)</label>
          <textarea name="ingredients" rows="2" placeholder="e.g. spinach, paneer, onion, tomato, masala"></textarea>
          <span className="hint">Used to auto-generate the shopping list</span>
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
          <label>Color theme</label>
          <select name="color_theme">
            {Object.entries(FOOD_COLORS).map(([cls, name]) => (
              <option value={cls} key={cls}>{name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Photo (optional)</label>
          <input type="file" name="photo" accept="image/*" />
          <span className="hint">If no photo, the color theme will show with the dish name</span>
        </div>

        <button type="submit" className="btn">Add menu item</button>
        <a href="/manage?tab=menu" className="btn secondary mt-8">Cancel</a>
      </form>
    </Layout>
  );
}
