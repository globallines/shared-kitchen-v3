import { requireUser, db, getFlash } from "../../lib/server";
import { Layout } from "../../lib/ui.jsx";
import { CUISINES, cuisineSlug } from "../../lib/helpers";
export const dynamic = "force-dynamic";

export default async function Cuisine() {
  const u = await requireUser();
  const flash = await getFlash();
  const conn = db();

  // Count dishes per cuisine
  const counts = {};
  const [rows] = await conn.query("SELECT cuisine, COUNT(*) AS c FROM menu_items WHERE is_active = 1 GROUP BY cuisine");
  for (const r of rows) counts[r.cuisine] = r.c;

  return (
    <Layout title="Cuisines" subtitle="Explore" user={u} flash={flash} active="/cuisine">
      <div className="cuisine-grid">
        {CUISINES.map((c) => {
          const slug = cuisineSlug(c);
          const cnt = counts[c] ?? 0;
          return (
            <a href={`/cuisine/${encodeURIComponent(c)}`} className={`cuisine-tile fi-c-${slug}`} key={c}>
              <div className="label-overlay">
                {c}
                {cnt ? <span style={{ opacity: 0.7, fontSize: "11px", fontWeight: 500, display: "block" }}>· {cnt} dishes</span> : null}
              </div>
            </a>
          );
        })}
      </div>

      <div className="section mt-16">
        <div className="section-h"><span className="lead">All recipes</span></div>
        <a href="/recipes" className="btn secondary">📖 Browse recipe library</a>
      </div>
    </Layout>
  );
}
