import { redirect } from "next/navigation";
import { currentUser, db } from "../../lib/server";
import { wrap, card, Title, Nav } from "../../lib/ui";
export const dynamic = "force-dynamic";

export default async function AI() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const [recipes] = await db().query(
    "SELECT id, name, kcal, servings, created_at FROM ai_recipes ORDER BY created_at DESC, id DESC LIMIT 100"
  );
  return (
    <div style={wrap}>
      <Title>AI Recipes</Title>
      <div style={{ color: "#9aa39d", fontSize: 13, marginBottom: 14 }}>{recipes.length} generated recipes</div>
      <div style={{ display: "grid", gap: 10 }}>
        {recipes.map((r) => (
          <div key={r.id} style={card}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>✨ {r.name}</div>
            <div style={{ fontSize: 12, color: "#9aa39d", marginTop: 4 }}>
              {r.servings ? `${r.servings} servings` : ""}{r.kcal ? ` · ${r.kcal} kcal` : ""}
              {` · ${new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
            </div>
          </div>
        ))}
      </div>
      <Nav active="AI" />
    </div>
  );
}
