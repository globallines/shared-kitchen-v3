// Shared UI — faithful port of includes/layout.php + helpers.php render funcs
import { PHOTO_BASE, avatarInitial } from "./helpers";

export function DishPhoto({ name, colorTheme = "fi-default", photo = null, size = "" }) {
  const cls = "food-img " + colorTheme + (size ? " " + size : "");
  const style = photo
    ? { backgroundImage: `url('${PHOTO_BASE}${photo}')`, backgroundSize: "cover", backgroundPosition: "center" }
    : undefined;
  return (
    <div className={cls} style={style}>
      <div className="food-img-label">{name}</div>
    </div>
  );
}

export function DietPills({ tags }) {
  if (!tags) return null;
  const list = String(tags).split(",").map((t) => t.trim()).filter(Boolean);
  if (!list.length) return null;
  return (
    <div className="diet-tags-row">
      {list.map((t, i) => <span className="pill diet" key={i}>{t}</span>)}
    </div>
  );
}

export function Pill({ kind = "", children }) {
  return <span className={"pill" + (kind ? " " + kind : "")}>{children}</span>;
}

// Bottom nav — same for all roles (Home/Cuisine/Plan/Shop/Rate)
const NAV_TABS = [
  ["/", "Home", "⌂"],
  ["/cuisine", "Cuisine", "☷"],
  ["/plan", "Plan", "＋"],
  ["/shopping", "Shop", "🛒"],
  ["/feedback", "Rate", "★"],
];

// map a route to its active nav key
function activeKey(active) {
  const map = {
    "/": "/", "/order": "/plan", "/plan": "/plan",
    "/cuisine": "/cuisine", "/recipes": "/cuisine",
    "/shopping": "/shopping", "/feedback": "/feedback",
  };
  return map[active] || active;
}

export function Layout({ title = "", subtitle = "", user, flash, active = "/", children }) {
  const ak = activeKey(active);
  return (
    <div className="app">
      {user && (
        <div className="topbar">
          <div className="title">
            <span className="small">{subtitle || "Shared Kitchen"}</span>
            <h2>{title || "Home"}</h2>
          </div>
          <div className="right">
            {user.role === "admin" && (
              <a href="/manage" className="gear" title="Setup">⚙</a>
            )}
            <a href="/logout" style={{ textDecoration: "none" }} title={`${user.name} · Sign out`}>
              <div className="avatar">{avatarInitial(user.name)}</div>
            </a>
          </div>
        </div>
      )}
      <main>
        {flash && (
          <div className={"flash " + (flash.type === "error" ? "error" : "ok")}>{flash.msg}</div>
        )}
        {children}
      </main>
      {user && (
        <nav className="bottomnav">
          {NAV_TABS.map(([href, label, ico]) => (
            <a key={href} href={href} className={ak === href ? "active" : ""}>
              <span className="ico">{ico}</span>
              <span>{label}</span>
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}

// Star rating display (read-only)
export function Stars({ n = 0 }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={"star" + (i <= n ? " on" : "")}>★</span>
      ))}
    </span>
  );
}
