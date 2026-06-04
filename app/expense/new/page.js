import { requireUser, db, getFlash } from "../../../lib/server";
import { redirect } from "next/navigation";
import { Layout } from "../../../lib/ui.jsx";
import { today, roleLabel, APP_CURRENCY } from "../../../lib/helpers";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_MB = 5;

async function addExpense(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../../lib/server");
  const { fmtMoney, today } = await import("../../../lib/helpers");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u || !["cook", "driver", "admin"].includes(u.role)) redirect("/login");

  const date = String(formData.get("date") || "") || today();
  const cat = String(formData.get("category") || "");
  const item = String(formData.get("item_name") || "").trim();
  const qty = String(formData.get("quantity") || "").trim();
  const amount = parseFloat(formData.get("amount")) || 0;
  const notes = String(formData.get("notes") || "").trim();
  const by = u.role === "admin" ? (Number(formData.get("purchased_by")) || u.id) : u.id;

  // bill_image upload skipped (remote media); stored as null
  const bill = null;

  if (!item || amount <= 0) {
    await setFlash("Item name and amount required", "error");
    redirect("/expense/new");
  } else {
    await db().query(
      "INSERT INTO expenses (date, purchased_by, category, item_name, quantity, amount, notes, bill_image) VALUES (?,?,?,?,?,?,?,?)",
      [date, by, cat, item, qty || null, amount, notes || null, bill]
    );
    await setFlash("Expense added: " + fmtMoney(amount));
    redirect("/expenses");
  }
}

export default async function ExpenseNew() {
  const u = await requireUser();
  if (!["cook", "driver", "admin"].includes(u.role)) redirect("/");
  const flash = await getFlash();

  const [staff] = await db().query(
    "SELECT * FROM users WHERE role IN ('cook','driver','admin') AND is_active = 1 ORDER BY name"
  );

  return (
    <Layout title="Add Expense" user={u} flash={flash} active="/expenses">
      <form action={addExpense}>
        <div className="row2">
          <div className="field">
            <label>Date</label>
            <input type="date" name="date" defaultValue={today()} required />
          </div>
          <div className="field">
            <label>Amount ({APP_CURRENCY})</label>
            <input type="number" name="amount" step="0.01" min="0" required placeholder="0" />
          </div>
        </div>

        <div className="field">
          <label>Category</label>
          <select name="category" required>
            {["Vegetables", "Chicken", "Mutton", "Fish", "Rice", "Dal", "Oil", "Spices", "Milk", "Other"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Item name</label>
          <input type="text" name="item_name" required placeholder="e.g. Tomatoes, Chicken thigh, Rice 5kg" />
        </div>

        <div className="field">
          <label>Quantity (optional)</label>
          <input type="text" name="quantity" placeholder="e.g. 2 kg, 1 dozen, 500g" />
        </div>

        {u.role === "admin" && (
          <div className="field">
            <label>Purchased by</label>
            <select name="purchased_by" required>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({roleLabel(s.role)})</option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label>Notes</label>
          <textarea name="notes" rows="2" placeholder="Optional notes"></textarea>
        </div>

        <div className="field">
          <label>Bill photo (optional)</label>
          <input type="file" name="bill" accept="image/*" capture="environment" />
          <span className="hint">Max {MAX_UPLOAD_MB}MB · jpg/png/webp</span>
        </div>

        <button type="submit" className="btn">Save expense</button>
        <a href="/expenses" className="btn secondary mt-8">Cancel</a>
      </form>
    </Layout>
  );
}
