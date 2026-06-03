export const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
export const PHOTO = (p) => (p ? `https://avanith.com/kitchen/${p}` : null);

function I({ d }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}
const ICONS = {
  Home: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5",
  Cuisine: "M4 7h16M4 12h16M4 17h10",
  Week: "M4 5h16v16H4zM4 9h16M8 3v4M16 3v4",
  Shop: "M3 4h2l2.5 12h11l2-8H6.5M9 20a1 1 0 1 0 0 .01M18 20a1 1 0 1 0 0 .01",
  Money: "M12 3v18M8 7h6a2.5 2.5 0 0 1 0 5H8m0 0h7a2.5 2.5 0 0 1 0 5H8",
  AI: "M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4zM18 14l.8 2 .2.8 2-.8-2 .8-.2.8z",
};

export function TopBar() {
  return (
    <div className="topbar">
      <span className="globe">&#x1F310;</span>
      <div className="lang">
        <button className="langbtn on">English</button>
        <button className="langbtn">&#x0BA4;&#x0BAE;&#x0BBF;&#x0BB4;&#x0BCD;</button>
      </div>
    </div>
  );
}

export function PageHeader({ label, title, initial }) {
  return (
    <div className="headcard">
      <div>
        <div className="eyebrow">{label}</div>
        <h1 className="h1 serif">{title}</h1>
      </div>
      <div className="avatar">{initial}</div>
    </div>
  );
}

export function BottomNav({ active }) {
  const tabs = [["/", "Home"], ["/cuisine", "Cuisine"], ["/week", "Week"], ["/shop", "Shop"], ["/money", "Money"], ["/ai", "AI"]];
  return (
    <nav className="bnav">
      {tabs.map(([href, label]) => (
        <a key={href} href={href} className={active === label ? "on" : ""}>
          <I d={ICONS[label]} />{label}
        </a>
      ))}
    </nav>
  );
}

export function Fab({ href = "#" }) {
  return <a className="fab" href={href}>+</a>;
}

export function Shell({ active, initial = "K", children, fab }) {
  return (
    <>
      <TopBar />
      <main className="container">{children}</main>
      {fab && <Fab href={fab} />}
      <BottomNav active={active} />
    </>
  );
}
