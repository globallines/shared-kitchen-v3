import { redirect } from "next/navigation";
import { currentUser, db } from "../../lib/server";
import { wrap, card, Title, Nav } from "../../lib/ui";
export const dynamic = "force-dynamic";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function Week() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const conn = db();
  const [[w]] = await conn.query("SELECT MAX(week_start_date) d FROM weekly_menu");
  let rows = [];
  if (w && w.d) {
    [rows] = await conn.query(
      `SELECT wm.day_of_week, wm.meal_type, mi.name FROM weekly_menu wm
       JOIN menu_items mi ON mi.id = wm.menu_item_id
       WHERE wm.week_start_date = ? ORDER BY wm.day_of_week, wm.sort_order`,
      [w.d]
    );
  }
  const byDay = {};
  rows.forEach((r) => { (byDay[r.day_of_week] = byDay[r.day_of_week] || []).push(r); });
  return (
    <div style={wrap}>
      <Title>This Week</Title>
      {(!w || !w.d) && <div style={{ ...card, color: "#9aa39d" }}>No weekly menu set yet.</div>}
      {w && w.d && (
        <div style={{ color: "#9aa39d", fontSize: 13, marginBottom: 14 }}>
          Week of {new Date(w.d).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
        </div>
      )}
      <div style={{ display: "grid", gap: 10 }}>
        {Object.keys(byDay).map((d) => (
          <div key={d} style={card}>
            <div style={{ fontWeight: 700, color: "#0f4c3a", marginBottom: 8 }}>{DAYS[d]}</div>
            {byDay[d].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0" }}>
                <span>{r.name}</span>
                <span style={{ color: "#9aa39d", fontSize: 12 }}>{r.meal_type}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <Nav active="Week" />
    </div>
  );
}
