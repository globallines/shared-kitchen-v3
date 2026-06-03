import { redirect } from "next/navigation";
import { currentUser, clearSession, db } from "../lib/server";
import { Shell, PageHeader, rupee, PHOTO } from "../lib/ui";
import DishImg from "../lib/DishImg";
export const dynamic = "force-dynamic";

async function logoutAction() { "use server"; await clearSession(); redirect("/login"); }

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const conn = db();
  let famName = "All families";
  if (user.family_id) {
    const [[f]] = await conn.query("SELECT name FROM families WHERE id=?", [user.family_id]);
    if (f) famName = f.name;
  }
  const [[hero]] = await conn.query("SELECT name, photo FROM menu_items WHERE photo IS NOT NULL AND is_active=1 ORDER BY RAND() LIMIT 1");
  const [[{ c: dishes }]] = await conn.query("SELECT COUNT(*) c FROM menu_items WHERE is_active=1");
  const [[{ t: monthSpend }]] = await conn.query("SELECT COALESCE(SUM(amount),0) t FROM expenses WHERE date>=DATE_FORMAT(CURDATE(),'%Y-%m-01')");
  const [recent] = await conn.query("SELECT item_name, amount, category, date FROM expenses ORDER BY date DESC, id DESC LIMIT 6");
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const hr = now.getHours();
  const greet = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";

  return (
    <Shell active="Home" fab="/money">
      <PageHeader label={`TODAY · ${now.toLocaleDateString("en-IN", { day: "numeric", month: "short" }).toUpperCase()}`} title="Kitchen Home" initial={user.name[0]} />

      <div className="hero">
        <DishImg label={hero?.name || "kitchen"} />
        <div className="hero-grad" />
        {hero?.name && <span className="hero-pill">&#x1F37D;&#xFE0F; {hero.name}</span>}
        <div className="hero-txt">
          <h2 className="serif">{greet}, {user.name}</h2>
          <p>{dateStr}</p>
        </div>
      </div>

      <div className="stats">
        <div className="card stat"><div className="lbl">This month</div><div className="val" style={{ color: "var(--green)" }}>{rupee(monthSpend)}</div><div className="sub">{famName}</div></div>
        <div className="card stat"><div className="lbl">Active dishes</div><div className="val" style={{ color: "#b4651a" }}>{dishes}</div><div className="sub">on the menu</div></div>
      </div>

      <div className="sectlabel">Recent activity</div>
      <div className="card">
        {recent.length === 0 && <div className="empty"><div className="ic">&#x1F4CB;</div>No expenses yet.</div>}
        {recent.map((e, i) => (
          <div className="row" key={i}>
            <div><div className="t">{e.item_name}</div><div className="s">{e.category} &middot; {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div></div>
            <div style={{ fontWeight: 700, color: "var(--green)" }}>{rupee(e.amount)}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <form action={logoutAction}><button className="btn btn-ghost btn-block">Sign out</button></form>
      </div>
    </Shell>
  );
}
