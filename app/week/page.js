import { redirect } from "next/navigation";
import { currentUser, db } from "../../lib/server";
import { Shell, PageHeader } from "../../lib/ui";
export const dynamic = "force-dynamic";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDER = { Breakfast: 0, Lunch: 1, Snacks: 2, Dinner: 3 };

export default async function Week() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const conn = db();
  const [[w]] = await conn.query("SELECT MAX(week_start_date) d FROM weekly_menu");
  let rows = [];
  if (w?.d) [rows] = await conn.query(
    "SELECT wm.day_of_week,wm.meal_type,mi.name FROM weekly_menu wm JOIN menu_items mi ON mi.id=wm.menu_item_id WHERE wm.week_start_date=? ORDER BY wm.day_of_week,wm.sort_order", [w.d]);
  const byDay = {};
  rows.forEach((r) => { (byDay[r.day_of_week] ||= []).push(r); });
  const todayDow = new Date().getDay();
  const range = w?.d ? `Week of ${new Date(w.d).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}` : "";
  return (
    <Shell active="Week" fab="/week">
      <PageHeader label={range.toUpperCase()} title="Weekly menu" initial={user.name[0]} />
      <a className="btn btn-wa btn-block" href="/week" style={{ marginBottom: 14 }}>&#x1F4AC; Share week on WhatsApp</a>
      {!w?.d && <div className="card"><div className="empty"><div className="ic">&#x1F4C5;</div>No weekly menu set yet.</div></div>}
      {Object.keys(byDay).sort((a, b) => a - b).map((d) => (
        <div className={"daycard" + (Number(d) === todayDow ? " today" : "")} key={d}>
          <div className="dayname">{DAYS[d]}{Number(d) === todayDow && <span style={{ fontSize: 11, color: "#b4651a" }}>TODAY</span>}</div>
          {byDay[d].sort((a, b) => (ORDER[a.meal_type] ?? 9) - (ORDER[b.meal_type] ?? 9)).map((r, i) => (
            <div className="meal" key={i}><span>{r.name}</span><span className="mt">{r.meal_type}</span></div>
          ))}
        </div>
      ))}
    </Shell>
  );
}
