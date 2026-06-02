import { redirect } from "next/navigation";
import { currentUser, db } from "../../lib/server";
import { wrap, card, Title, Nav } from "../../lib/ui";
export const dynamic = "force-dynamic";

const COLORS = { Veg: "#15803d", Chicken: "#b45309", Mutton: "#b91c1c", Fish: "#0369a1", Egg: "#a16207", Snacks: "#7c3aed", Breakfast: "#be185d", Other: "#5b6b63" };

export default async function Cuisine() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const [dishes] = await db().query(
    "SELECT id, name, category, cuisine, kcal FROM menu_items WHERE is_active = 1 ORDER BY name LIMIT 300"
  );
  return (
    <div style={wrap}>
      <Title>Cuisine</Title>
      <div style={{ color: "#9aa39d", fontSize: 13, marginBottom: 14 }}>{dishes.length} dishes</div>
      <div style={{ display: "grid", gap: 10 }}>
        {dishes.map((d) => (
          <div key={d.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: "#9aa39d" }}>{d.cuisine}{d.kcal ? ` · ${d.kcal} kcal` : ""}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: COLORS[d.category] || "#5b6b63",
              background: "#faf7f2", border: "1px solid #e8e4dc", borderRadius: 999, padding: "4px 10px" }}>{d.category}</span>
          </div>
        ))}
      </div>
      <Nav active="Cuisine" />
    </div>
  );
}
