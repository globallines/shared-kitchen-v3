import { redirect } from "next/navigation";
import { currentUser, db } from "../../lib/server";
import { Shell, PageHeader } from "../../lib/ui";
export const dynamic = "force-dynamic";

export default async function Shop() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const [items] = await db().query("SELECT item_name,category,qty_needed,is_purchased FROM shopping_list ORDER BY is_purchased ASC,id DESC LIMIT 100");
  const todo = items.filter((i) => !i.is_purchased);
  const done = items.filter((i) => i.is_purchased);
  const Row = (i, k) => (
    <div className="row" key={k}>
      <div><div className="t" style={{ textDecoration: i.is_purchased ? "line-through" : "none", color: i.is_purchased ? "var(--muted)" : "var(--ink)" }}>{i.item_name}</div>
        <div className="s">{i.category || ""}{i.qty_needed ? ` · ${i.qty_needed}` : ""}</div></div>
      <span style={{ fontSize: 18 }}>{i.is_purchased ? "✅" : "🛒"}</span>
    </div>
  );
  return (
    <Shell active="Shop" fab="/shop">
      <PageHeader label="GROCERIES" title="Shopping list" initial={user.name[0]} />
      <div className="sectlabel">To buy <span style={{ color: "var(--green)" }}>{todo.length}</span></div>
      <div className="card">{todo.length === 0 ? <div className="empty"><div className="ic">&#x2705;</div>Nothing pending.</div> : todo.map(Row)}</div>
      {done.length > 0 && (<>
        <div className="sectlabel">Purchased <span>{done.length}</span></div>
        <div className="card">{done.map(Row)}</div>
      </>)}
    </Shell>
  );
}
