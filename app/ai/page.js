import { redirect } from "next/navigation";
import { currentUser, db } from "../../lib/server";
import { Shell, PageHeader, PHOTO } from "../../lib/ui";
export const dynamic = "force-dynamic";

export default async function AI() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const [recipes] = await db().query("SELECT id,name,kcal,servings,photo,created_at FROM ai_recipes ORDER BY created_at DESC,id DESC LIMIT 60");
  return (
    <Shell active="AI" fab="/ai">
      <PageHeader label="GENERATED" title="AI Recipes" initial={user.name[0]} />
      <div className="aibanner">
        <div><h3>&#x2728; Create a recipe</h3><p>From a menu photo, a dish name, or your ingredients.</p></div>
        <div className="acts"><a className="solid" href="/ai">Generate</a></div>
      </div>
      <div className="sectlabel">{recipes.length} recipes</div>
      <div className="grid2">
        {recipes.map((r) => (
          <div className="photocard" key={r.id}>
            {r.photo ? <img src={PHOTO(r.photo)} alt="" /> : <div className="ph">&#x2728;</div>}
            <div className="ov" />
            <div className="cap"><b style={{ fontSize: 14 }}>{r.name}</b><span>{r.kcal ? `${r.kcal} kcal` : (r.servings ? `${r.servings} servings` : "recipe")}</span></div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
