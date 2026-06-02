import { redirect } from "next/navigation";
import { currentUser, db } from "../../lib/server";
import { wrap, card, Title, Nav } from "../../lib/ui";
export const dynamic = "force-dynamic";

export default async function Shop() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const [items] = await db().query(
    "SELECT item_name, category, qty_needed, is_purchased FROM shopping_list ORDER BY is_purchased ASC, id DESC LIMIT 100"
  );
  const todo = items.filter((i) => !i.is_purchased);
  const done = items.filter((i) => i.is_purchased);
  const Row = (i, k) => (
    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: k ? "1px solid #f0ece3" : 0 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, textDecoration: i.is_purchased ? "line-through" : "none", color: i.is_purchased ? "#9aa39d" : "#1c2b25" }}>{i.item_name}</div>
        <div style={{ fontSize: 12, color: "#9aa39d" }}>{i.category || ""}{i.qty_needed ? ` · ${i.qty_needed}` : ""}</div>
      </div>
      <span>{i.is_purchased ? "✅" : "🛒"}</span>
    </div>
  );
  return (
    <div style={wrap}>
      <Title>Shopping List</Title>
      <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>To buy ({todo.length})</div>
        {todo.length === 0 && <div style={{ color: "#9aa39d", fontSize: 14 }}>Nothing pending.</div>}
        {todo.map(Row)}
      </div>
      {done.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Purchased ({done.length})</div>
          {done.map(Row)}
        </div>
      )}
      <Nav active="Shop" />
    </div>
  );
}
