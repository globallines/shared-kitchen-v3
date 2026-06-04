import { redirect, notFound } from "next/navigation";
import { currentUser, db } from "../../../lib/server";
import { Shell, PageHeader } from "../../../lib/ui";
import { updateExpense, deleteExpense } from "../actions";
export const dynamic = "force-dynamic";

const CATEGORIES = ["Vegetables", "Chicken", "Mutton", "Fish", "Rice", "Dal", "Oil", "Spices", "Milk", "Other"];

export default async function EditExpense({ params, searchParams }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const sp = (await searchParams) || {};
  const [[e]] = await db().query("SELECT * FROM expenses WHERE id=? LIMIT 1", [Number(id)]);
  if (!e) notFound();
  const dateVal = new Date(e.date).toISOString().slice(0, 10);

  return (
    <Shell active="Money">
      <PageHeader label="EDIT" title="Expense" initial={user.name[0]} />
      <a className="backlink" href="/money">&#8592; Back to money</a>
      {sp.err && <div className="flash err">⚠️ Enter an item name and a valid amount.</div>}

      <form action={updateExpense} className="card form" style={{ paddingTop: 16 }}>
        <input type="hidden" name="id" value={e.id} />
        <div className="frow">
          <label>Item<input name="item_name" defaultValue={e.item_name} required /></label>
          <label>Amount (₹)<input name="amount" type="number" step="0.01" min="0" defaultValue={Number(e.amount)} inputMode="decimal" required /></label>
        </div>
        <div className="frow">
          <label>Category<select name="category" defaultValue={e.category}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
          <label>Date<input name="date" type="date" defaultValue={dateVal} /></label>
        </div>
        <label>Quantity (optional)<input name="quantity" defaultValue={e.quantity || ""} /></label>
        <label>Notes (optional)<input name="notes" defaultValue={e.notes || ""} /></label>
        <button className="btn btn-primary btn-block" type="submit">Save changes</button>
      </form>

      <form action={deleteExpense} style={{ marginTop: 12 }}>
        <input type="hidden" name="id" value={e.id} />
        <button className="btn btn-danger btn-block" type="submit">Delete this expense</button>
      </form>
    </Shell>
  );
}
