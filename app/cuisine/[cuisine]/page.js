import { redirect } from "next/navigation";
import { currentUser, db } from "../../../lib/server";
import { Shell, PageHeader } from "../../../lib/ui";
import DishImg from "../../../lib/DishImg";
export const dynamic = "force-dynamic";

export default async function CuisineDishes({ params }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { cuisine } = await params;
  const name = decodeURIComponent(cuisine);
  const [dishes] = await db().query(
    "SELECT id,name,category,tagline,kcal,protein_g,diet_tags FROM menu_items WHERE is_active=1 AND cuisine=? ORDER BY name",
    [name]
  );
  return (
    <Shell active="Cuisine">
      <PageHeader label="CUISINE" title={name} initial={user.name[0]} />
      <a className="backlink" href="/cuisine">&#8592; All cuisines</a>
      <div className="sectlabel">{dishes.length} dishes</div>
      {dishes.length === 0 && <div className="card"><div className="empty"><div className="ic">&#x1F37D;&#xFE0F;</div>No dishes here yet.</div></div>}
      <div className="grid2">
        {dishes.map((d) => (
          <a className="photocard" key={d.id} href={`/dish/${d.id}`}>
            <DishImg label={d.name} />
            <div className="ov" />
            <div className="cap">
              <b style={{ fontSize: 14 }}>{d.name}</b>
              <span>{d.kcal ? `${d.kcal} kcal` : d.category}{d.protein_g ? ` · ${d.protein_g}g protein` : ""}</span>
            </div>
          </a>
        ))}
      </div>
    </Shell>
  );
}
