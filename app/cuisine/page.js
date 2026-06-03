import { redirect } from "next/navigation";
import { currentUser, db } from "../../lib/server";
import { Shell, PageHeader, PHOTO } from "../../lib/ui";
import DishImg from "../../lib/DishImg";
export const dynamic = "force-dynamic";

export default async function Cuisine() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const [groups] = await db().query(
    "SELECT cuisine, COUNT(*) c, MAX(photo) photo FROM menu_items WHERE is_active=1 AND cuisine IS NOT NULL AND cuisine<>'' GROUP BY cuisine ORDER BY c DESC"
  );
  const chips = ["chicken", "dal", "rice", "paneer", "fish", "egg"];
  return (
    <Shell active="Cuisine" fab="/ai">
      <PageHeader label="EXPLORE" title="Cuisines" initial={user.name[0]} />

      <div className="aibanner">
        <div><h3>&#x2728; AI Recipe Assistant</h3><p>Generate any recipe from a menu photo or text.</p></div>
        <div className="acts"><a href="/ai">Generate</a><a className="solid" href="/ai">Library</a></div>
      </div>

      <input className="search" placeholder="Search dishes or ingredients (chicken, dal, paneer…)" />
      <div className="chips">
        <span className="chip fav">&#x2665; My favourites</span>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>Try:</span>
        {chips.map((c) => <a key={c} className="chip" href="/cuisine">{c}</a>)}
      </div>

      <div className="grid2">
        {groups.map((g) => (
          <a className="photocard" key={g.cuisine} href="/cuisine">
            <DishImg label={g.cuisine} />
            <div className="ov" />
            <div className="cap"><b>{g.cuisine}</b><span>{g.c} dishes</span></div>
          </a>
        ))}
      </div>
    </Shell>
  );
}
