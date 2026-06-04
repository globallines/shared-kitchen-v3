import { requireUser, db, getFlash } from "../../../lib/server";
import { redirect } from "next/navigation";
import { Layout } from "../../../lib/ui.jsx";
import { fmtDate } from "../../../lib/helpers";
export const dynamic = "force-dynamic";

async function submitFeedback(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../../lib/server");
  const { today } = await import("../../../lib/helpers");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u || !["family", "admin"].includes(u.role)) redirect("/login");

  const reqId = Number(formData.get("req_id")) || 0;
  const reqMenuItemId = formData.get("req_menu_item_id");
  const reqFamilyId = formData.get("req_family_id");
  const reqDate = formData.get("req_date");
  const rating = Number(formData.get("rating")) || 0;
  const comment = String(formData.get("comment") || "").trim();
  const improvement = String(formData.get("improvement") || "").trim();

  if (rating < 1 || rating > 5) {
    await setFlash("Please give a star rating", "error");
    redirect(reqId ? `/feedback/new?req=${reqId}` : "/feedback/new");
  } else {
    await db().query(
      "INSERT INTO feedback (requirement_id, menu_item_id, user_id, family_id, date, rating, comment, improvement) VALUES (?,?,?,?,?,?,?,?)",
      [
        reqId || null,
        reqMenuItemId ? Number(reqMenuItemId) : null,
        u.id,
        u.family_id || (reqFamilyId ? Number(reqFamilyId) : 1),
        reqDate || today(),
        rating,
        comment || null,
        improvement || null,
      ]
    );
    await setFlash("Thank you for the feedback!");
    redirect("/");
  }
}

export default async function FeedbackNew({ searchParams }) {
  const u = await requireUser();
  if (!["family", "admin"].includes(u.role)) redirect("/");
  const flash = await getFlash();
  const sp = (await searchParams) || {};
  const reqId = Number(sp.req) || 0;

  let req = null;
  if (reqId) {
    const [rows] = await db().query(`
      SELECT mr.*, m.name AS dish, f.name AS family_name
      FROM meal_requirements mr
      LEFT JOIN menu_items m ON mr.menu_item_id = m.id
      LEFT JOIN families f ON mr.family_id = f.id
      WHERE mr.id = ?
    `, [reqId]);
    req = rows[0] || null;
  }

  return (
    <Layout title="Add Feedback" user={u} flash={flash} active="/feedback">
      {req && (
        <div className="card mb-12">
          <div className="card-name">{req.dish || req.custom_dish}</div>
          <div className="card-meta">{req.meal_type} · {fmtDate(req.date)} · {req.family_name}</div>
        </div>
      )}

      <form action={submitFeedback} className="card">
        <input type="hidden" name="req_id" value={reqId || ""} />
        <input type="hidden" name="req_menu_item_id" value={req?.menu_item_id ?? ""} />
        <input type="hidden" name="req_family_id" value={req?.family_id ?? ""} />
        <input type="hidden" name="req_date" value={req?.date ?? ""} />

        <div className="field">
          <label>How was the dish?</label>
          <div className="stars" data-input="rating" style={{ fontSize: "32px", gap: "8px" }}>
            <span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span>
          </div>
          <input type="hidden" name="rating" value="" required />
        </div>

        <div className="field">
          <label>Suggestion for next time</label>
          <select name="improvement">
            <option value="">— none —</option>
            <option>Less spicy</option>
            <option>More spicy</option>
            <option>More salt</option>
            <option>Less salt</option>
            <option>Less oil</option>
            <option>Cook longer</option>
            <option>Better taste needed</option>
            <option>Smaller portion</option>
            <option>Larger portion</option>
            <option>Other (see comment)</option>
          </select>
        </div>

        <div className="field">
          <label>Additional comment (optional)</label>
          <textarea name="comment" rows="3" placeholder="What was good or what could be better"></textarea>
        </div>

        <button type="submit" className="btn">Submit feedback</button>
        <a href="/" className="btn secondary mt-8">Cancel</a>
      </form>
    </Layout>
  );
}
