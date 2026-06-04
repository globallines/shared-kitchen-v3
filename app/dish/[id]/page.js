import { redirect, notFound } from "next/navigation";
import { currentUser, db } from "../../../lib/server";
import { Shell } from "../../../lib/ui";
import DishImg from "../../../lib/DishImg";
export const dynamic = "force-dynamic";

function Macro({ label, value, unit }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="macro">
      <div className="mv">{value}{unit}</div>
      <div className="ml">{label}</div>
    </div>
  );
}

export default async function Dish({ params }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [[d]] = await db().query("SELECT * FROM menu_items WHERE id=? LIMIT 1", [Number(id)]);
  if (!d) notFound();

  const tags = (d.diet_tags || "").split(",").map((t) => t.trim()).filter(Boolean);
  const ingredients = (d.ingredients || "").split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);

  return (
    <Shell active="Cuisine">
      <div className="dishhero">
        <DishImg label={d.name} className="ph" />
        <div className="hero-grad" />
        <a className="backfloat" href={`/cuisine/${encodeURIComponent(d.cuisine || "")}`}>&#8592;</a>
        <div className="hero-txt">
          <h2 className="serif">{d.name}</h2>
          {d.tagline && <p>{d.tagline}</p>}
        </div>
      </div>

      <div className="chips" style={{ marginTop: 14 }}>
        {d.cuisine && <span className="chip">{d.cuisine}</span>}
        {d.category && <span className="chip">{d.category}</span>}
        {tags.map((t) => <span className="chip" key={t}>{t}</span>)}
      </div>

      {(d.kcal || d.protein_g || d.carb_g || d.fat_g || d.fiber_g) && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="sectlabel" style={{ margin: "0 0 10px" }}>Nutrition · {d.serving_size || "1 serving"}</div>
          <div className="macros-row">
            <Macro label="Calories" value={d.kcal} unit="" />
            <Macro label="Protein" value={d.protein_g} unit="g" />
            <Macro label="Carbs" value={d.carb_g} unit="g" />
            <Macro label="Fat" value={d.fat_g} unit="g" />
            <Macro label="Fibre" value={d.fiber_g} unit="g" />
          </div>
        </div>
      )}

      {d.description && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="sectlabel" style={{ margin: "0 0 8px" }}>About</div>
          <p className="ptext">{d.description}</p>
        </div>
      )}

      {ingredients.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="sectlabel" style={{ margin: "0 0 8px" }}>Ingredients</div>
          <div className="chips">{ingredients.map((it, i) => <span className="chip" key={i}>{it}</span>)}</div>
        </div>
      )}

      {d.preparation && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="sectlabel" style={{ margin: "0 0 8px" }}>Preparation</div>
          <p className="ptext" style={{ whiteSpace: "pre-wrap" }}>{d.preparation}</p>
        </div>
      )}

      {(d.contributor || d.video_url || d.instagram_url) && (
        <div className="card" style={{ marginTop: 14 }}>
          {d.contributor && <div className="row"><div><div className="t">Contributed by</div><div className="s">{d.contributor}</div></div></div>}
          {d.video_url && <div className="row"><a className="t" style={{ color: "var(--green)" }} href={d.video_url} target="_blank" rel="noreferrer">&#x25B6;&#xFE0E; Watch video</a></div>}
          {d.instagram_url && <div className="row"><a className="t" style={{ color: "var(--green)" }} href={d.instagram_url} target="_blank" rel="noreferrer">&#x1F4F7; Instagram</a></div>}
        </div>
      )}
    </Shell>
  );
}
