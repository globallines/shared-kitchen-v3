import { requireUser, db, getFlash } from "../../../lib/server";
import { redirect } from "next/navigation";
import { Layout } from "../../../lib/ui.jsx";
import { today, APP_CURRENCY } from "../../../lib/helpers";
export const dynamic = "force-dynamic";

async function recordPayment(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../../lib/server");
  const { fmtMoney } = await import("../../../lib/helpers");
  const { redirect } = await import("next/navigation");
  const { today } = await import("../../../lib/helpers");
  const u = await currentUser();
  if (!u || u.role !== "admin") redirect("/login");

  const date = String(formData.get("date") || "") || today();
  const fam = Number(formData.get("family_id")) || 0;
  const amount = parseFloat(formData.get("amount")) || 0;
  const mode = String(formData.get("mode") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!fam || amount <= 0) {
    await setFlash("Family and amount required", "error");
    redirect("/payment/new");
  } else {
    await db().query(
      "INSERT INTO payments (date, family_id, amount, mode, notes, recorded_by) VALUES (?,?,?,?,?,?)",
      [date, fam, amount, mode || null, notes || null, u.id]
    );
    await setFlash("Payment recorded: " + fmtMoney(amount));
    redirect("/expenses?tab=payments");
  }
}

export default async function PaymentNew() {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/");
  const flash = await getFlash();

  const [families] = await db().query("SELECT * FROM families ORDER BY name");

  return (
    <Layout title="Record Payment" user={u} flash={flash} active="/expenses">
      <form action={recordPayment}>
        <div className="field">
          <label>Family paying</label>
          <select name="family_id" required>
            {families.map((f) => (
              <option key={f.id} value={f.id}>{f.name} ({f.head_name})</option>
            ))}
          </select>
        </div>

        <div className="row2">
          <div className="field">
            <label>Date</label>
            <input type="date" name="date" defaultValue={today()} required />
          </div>
          <div className="field">
            <label>Amount ({APP_CURRENCY})</label>
            <input type="number" name="amount" step="0.01" min="0" required />
          </div>
        </div>

        <div className="field">
          <label>Payment mode</label>
          <select name="mode">
            <option value="">— select —</option>
            <option>Cash</option>
            <option>UPI</option>
            <option>Bank transfer</option>
            <option>Cheque</option>
            <option>Other</option>
          </select>
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea name="notes" rows="2"></textarea>
        </div>

        <button type="submit" className="btn">Record payment</button>
        <a href="/expenses?tab=payments" className="btn secondary mt-8">Cancel</a>
      </form>
    </Layout>
  );
}
