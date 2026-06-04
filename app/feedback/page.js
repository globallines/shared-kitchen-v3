import { requireUser, db, getFlash } from "../../lib/server";
import { Layout } from "../../lib/ui.jsx";
import { fmtDateShort } from "../../lib/helpers";
export const dynamic = "force-dynamic";

export default async function Feedback() {
  const u = await requireUser();
  const flash = await getFlash();
  const conn = db();

  const [byItem] = await conn.query(`
    SELECT m.id, m.name, m.category,
        COUNT(f.id) AS cnt,
        AVG(f.rating) AS avg_rating
    FROM feedback f
    JOIN menu_items m ON f.menu_item_id = m.id
    GROUP BY m.id
    ORDER BY cnt DESC
  `);

  const [recent] = await conn.query(`
    SELECT f.*, u.name AS user_name, m.name AS dish, fa.name AS family_name
    FROM feedback f
    JOIN users u ON f.user_id = u.id
    LEFT JOIN families fa ON f.family_id = fa.id
    LEFT JOIN menu_items m ON f.menu_item_id = m.id
    ORDER BY f.created_at DESC
    LIMIT 30
  `);

  return (
    <Layout title="Reviews" user={u} flash={flash} active="/feedback">
      {byItem.length > 0 && (
        <div className="section">
          <div className="section-h"><span className="lead">By dish — average rating</span></div>
          <div className="list">
            {byItem.map((b) => {
              const r = Math.round(Number(b.avg_rating));
              return (
                <div className="card" key={b.id}>
                  <div className="card-row">
                    <div className="grow">
                      <div className="card-name">{b.name}</div>
                      <div className="card-meta">{b.category} · {Number(b.cnt)} review{Number(b.cnt) > 1 ? "s" : ""}</div>
                    </div>
                    <div className="text-right">
                      <div style={{ color: "#f59e0b", fontSize: "16px" }}>
                        {"★".repeat(r)}{"☆".repeat(5 - r)}
                      </div>
                      <div className="small">{Number(b.avg_rating).toFixed(1)} / 5</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-h"><span className="lead">Recent feedback</span></div>
        {recent.length === 0 ? (
          <div className="card"><div className="empty"><div className="ico">★</div>No feedback yet.<br /><span className="small">Families will rate dishes after meals are marked prepared.</span></div></div>
        ) : (
          <div className="list">
            {recent.map((f) => (
              <div className="card" key={f.id}>
                <div className="card-row">
                  <div className="grow">
                    <div className="card-name">{f.dish || "Custom dish"}</div>
                    <div className="card-meta">{f.user_name} · {f.family_name} · {fmtDateShort(f.date)}</div>
                    {f.improvement && (
                      <div className="card-meta mt-4" style={{ color: "var(--accent)" }}>{f.improvement}</div>
                    )}
                    {f.comment && (
                      <div className="mt-4">{f.comment}</div>
                    )}
                  </div>
                  <div style={{ color: "#f59e0b", fontSize: "14px" }}>{"★".repeat(Number(f.rating))}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
