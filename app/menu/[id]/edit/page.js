import { requireUser, db, getFlash } from "../../../../lib/server";
import { redirect } from "next/navigation";
import { Layout, DishPhoto } from "../../../../lib/ui.jsx";
import { CUISINES, DIET_TAGS, FOOD_COLORS } from "../../../../lib/helpers";
export const dynamic = "force-dynamic";

async function updateMenu(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u || u.role !== "admin") redirect("/");

  const id = Number(formData.get("id"));
  const [rows] = await db().query("SELECT * FROM menu_items WHERE id = ?", [id]);
  const m = rows[0];
  if (!m) { await setFlash("Item not found", "error"); redirect("/manage?tab=menu"); }

  const diets = formData.getAll("diet_tags").filter(Boolean);
  const dietStr = diets.join(",");
  const color = formData.get("color_theme") || m.color_theme;
  // photo upload skipped
  const newPhoto = null;

  let sql = "UPDATE menu_items SET name=?, category=?, cuisine=?, description=?, ingredients=?, diet_tags=?, color_theme=?, is_active=?";
  const params = [
    String(formData.get("name") || "").trim(),
    formData.get("category"),
    formData.get("cuisine"),
    String(formData.get("description") || "").trim() || null,
    String(formData.get("ingredients") || "").trim() || null,
    dietStr || null,
    color,
    formData.get("is_active") ? 1 : 0,
  ];
  if (newPhoto) {
    sql += ", photo=?";
    params.push(newPhoto);
  }
  sql += " WHERE id=?";
  params.push(id);
  await db().query(sql, params);
  await setFlash("Saved");
  redirect("/manage?tab=menu");
}

export default async function MenuEdit({ params }) {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/");
  const flash = await getFlash();
  const { id } = await params;
  const [rows] = await db().query("SELECT * FROM menu_items WHERE id = ?", [Number(id)]);
  const m = rows[0];
  if (!m) { await (await import("../../../../lib/server")).setFlash("Item not found", "error"); redirect("/manage?tab=menu"); }

  const currentDiets = String(m.diet_tags || "").split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <Layout title="Edit Menu Item" user={u} flash={flash} active="/menu/edit">
      <DishPhoto name={m.name} colorTheme={m.color_theme || "fi-default"} photo={m.photo} />

      <form action={updateMenu}>
        <input type="hidden" name="id" value={m.id} />

        <div className="field">
          <label>Dish name</label>
          <input type="text" name="name" required defaultValue={m.name} />
        </div>

        <div className="row2">
          <div className="field">
            <label>Category</label>
            <select name="category" required defaultValue={m.category}>
              {["Veg", "Chicken", "Mutton", "Fish", "Egg", "Snacks", "Breakfast", "Other"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Cuisine</label>
            <select name="cuisine" defaultValue={m.cuisine}>
              {CUISINES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Description</label>
          <textarea name="description" rows="2" defaultValue={m.description || ""}></textarea>
        </div>

        <div className="field">
          <label>Ingredients (comma-separated)</label>
          <textarea name="ingredients" rows="2" defaultValue={m.ingredients || ""}></textarea>
          <span className="hint">Used for shopping list</span>
        </div>

        <div className="field">
          <label>Diet tags</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {DIET_TAGS.map((tag) => {
              const checked = currentDiets.includes(tag);
              return (
                <label className={"chip diet-chip" + (checked ? " on" : "")} style={{ cursor: "pointer" }} key={tag}>
                  <input type="checkbox" name="diet_tags" value={tag} defaultChecked={checked} style={{ display: "none" }} />
                  {tag}
                </label>
              );
            })}
          </div>
        </div>

        <div className="field">
          <label>Color theme</label>
          <select name="color_theme" defaultValue={m.color_theme}>
            {Object.entries(FOOD_COLORS).map(([cls, name]) => (
              <option value={cls} key={cls}>{name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Replace photo (optional)</label>
          <input type="file" name="photo" accept="image/*" />
        </div>

        <div className="field">
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="checkbox" name="is_active" value="1" defaultChecked={!!m.is_active} style={{ width: "auto" }} />
            Active (visible in menu)
          </label>
        </div>

        <button type="submit" className="btn">Save changes</button>
        <a href="/manage?tab=menu" className="btn secondary mt-8">Cancel</a>
      </form>
    </Layout>
  );
}
