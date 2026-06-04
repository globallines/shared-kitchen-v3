import { requireUser, db, getFlash } from "../../../lib/server";
import { Layout, DishPhoto, DietPills } from "../../../lib/ui.jsx";
import { fmtDate } from "../../../lib/helpers";
export const dynamic = "force-dynamic";

export default async function DishView({ params }) {
  const u = await requireUser();
  const flash = await getFlash();
  const conn = db();

  const p = await params;
  const id = Number(p.id) || 0;

  const [[m]] = await conn.query("SELECT * FROM menu_items WHERE id = ?", [id]);

  if (!m) {
    return (
      <Layout title="Not found" user={u} flash={flash} active="/cuisine">
        <div className="empty"><div className="ico">?</div>Dish not found.</div>
      </Layout>
    );
  }

  // Past feedback for this dish (aggregate)
  const [[fbAgg]] = await conn.query(
    "SELECT AVG(rating) AS avg_rating, COUNT(*) AS cnt FROM feedback WHERE menu_item_id = ?",
    [id]
  );

  // Recent feedback comments
  const [fbList] = await conn.query(
    `SELECT f.*, u.name AS user_name, fa.name AS family_name
     FROM feedback f
     JOIN users u ON f.user_id = u.id
     LEFT JOIN families fa ON f.family_id = fa.id
     WHERE f.menu_item_id = ?
     ORDER BY f.created_at DESC
     LIMIT 10`,
    [id]
  );

  // Times ordered (popularity)
  const [[{ c: ordCount }]] = await conn.query(
    "SELECT COUNT(*) c FROM meal_requirements WHERE menu_item_id = ?",
    [id]
  );

  const hasFb = fbAgg && Number(fbAgg.cnt) > 0;
  const ings = m.ingredients
    ? String(m.ingredients).split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <Layout title={m.name} subtitle="Dish" user={u} flash={flash} active="/cuisine">
      <DishPhoto name={m.name} colorTheme={m.color_theme || "fi-default"} photo={m.photo} size="large" />

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
        <span className="pill">{m.cuisine}</span>
        <span className="pill">{m.category}</span>
        {hasFb && (
          <span className="pill warn">
            {"★".repeat(Math.round(Number(fbAgg.avg_rating)))}
            {" "}
            {Number(fbAgg.avg_rating).toFixed(1)}
            {" "}
            ({Number(fbAgg.cnt)})
          </span>
        )}
      </div>

      {m.diet_tags && <DietPills tags={m.diet_tags} />}

      {m.description && (
        <div className="card mt-12 mb-12">
          <div className="card-name" style={{ marginBottom: "6px" }}>About this dish</div>
          <div style={{ whiteSpace: "pre-line" }}>{m.description}</div>
        </div>
      )}

      {["family", "admin"].includes(u.role) && (
        <div className="btn-row mb-16">
          <a href={`/order?menu_id=${m.id}`} className="btn">＋ Order today</a>
          <a href={`/plan?menu_id=${m.id}`} className="btn secondary">＋ Plan tomorrow</a>
        </div>
      )}

      {m.ingredients && (
        <div className="section">
          <div className="section-h"><span className="lead">Ingredients</span></div>
          <div className="card">
            {ings.map((ing, i) => (
              <div className="kv" key={i}><span className="k">• {ing}</span><span className="v"></span></div>
            ))}
          </div>
          {(u.role === "admin" || u.role === "cook") && (
            <div className="small mt-8 muted">These ingredients are used to auto-generate the shopping list.</div>
          )}
        </div>
      )}

      <div className="section">
        <div className="section-h">
          <span className="lead">Stats</span>
        </div>
        <div className="stat-grid three">
          <div className="stat">
            <span className="label">Times ordered</span>
            <span className="value">{ordCount}</span>
          </div>
          <div className="stat">
            <span className="label">Avg rating</span>
            <span className="value small">
              {hasFb ? `${Number(fbAgg.avg_rating).toFixed(1)} / 5` : "—"}
            </span>
          </div>
          <div className="stat">
            <span className="label">Reviews</span>
            <span className="value">{fbAgg ? Number(fbAgg.cnt) : 0}</span>
          </div>
        </div>
      </div>

      {fbList.length > 0 ? (
        <div className="section">
          <div className="section-h"><span className="lead">Recent feedback</span></div>
          <div className="list">
            {fbList.map((f) => (
              <div className="card" key={f.id}>
                <div className="card-row">
                  <div className="grow">
                    <div className="strong">{f.user_name}
                      {f.family_name && <> · <span className="small">{f.family_name}</span></>}
                    </div>
                    <div className="small mb-4">{fmtDate(f.created_at)}</div>
                    {f.improvement && (
                      <div className="card-meta mt-4" style={{ color: "var(--accent)" }}>Suggestion: {f.improvement}</div>
                    )}
                    {f.comment && (
                      <div className="mt-4" style={{ whiteSpace: "pre-line" }}>{f.comment}</div>
                    )}
                  </div>
                  <div style={{ color: "#f59e0b", fontSize: "14px", whiteSpace: "nowrap" }}>
                    {"★".repeat(Number(f.rating) || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="section">
          <div className="card">
            <div className="empty" style={{ padding: "18px" }}>
              <div className="small">No feedback yet for this dish.</div>
            </div>
          </div>
        </div>
      )}

      {u.role === "admin" && (
        <div className="section">
          <a href={`/menu/${m.id}/edit`} className="btn ghost small" style={{ display: "inline-flex" }}>Edit this dish</a>
        </div>
      )}

      <a href={`/cuisine/${encodeURIComponent(m.cuisine)}`} className="small mt-12" style={{ display: "inline-block" }}>← Back to {m.cuisine}</a>
    </Layout>
  );
}
