export const wrap = { maxWidth: 560, margin: "0 auto", padding: "20px 16px 90px" };
export const card = { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 16, padding: 16 };
export const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export function Title({ children }) {
  return <h1 style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#0f4c3a", fontSize: 24, margin: "0 0 16px" }}>{children}</h1>;
}

export function Nav({ active }) {
  const tabs = [["/", "🏠", "Home"], ["/cuisine", "🍽️", "Cuisine"], ["/week", "📅", "Week"], ["/shop", "🛒", "Shop"], ["/money", "💰", "Money"], ["/ai", "✨", "AI"]];
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e8e4dc",
      display: "flex", justifyContent: "space-around", padding: "10px 0", fontSize: 11 }}>
      {tabs.map(([href, ic, label]) => (
        <a key={href} href={href} style={{ textDecoration: "none", textAlign: "center",
          color: active === label ? "#0f4c3a" : "#9aa39d", fontWeight: active === label ? 700 : 400 }}>
          <div style={{ fontSize: 20 }}>{ic}</div>{label}
        </a>
      ))}
    </nav>
  );
}
