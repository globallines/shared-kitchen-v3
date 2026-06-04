"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser, db } from "../../lib/server";

const CATEGORIES = ["Vegetables", "Chicken", "Mutton", "Fish", "Rice", "Dal", "Oil", "Spices", "Milk", "Other"];

export async function addExpense(formData) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const item_name = String(formData.get("item_name") || "").trim();
  const amount = Number(formData.get("amount"));
  let category = String(formData.get("category") || "Other");
  if (!CATEGORIES.includes(category)) category = "Other";
  const date = String(formData.get("date") || "").trim() || new Date().toISOString().slice(0, 10);
  const quantity = String(formData.get("quantity") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!item_name || !(amount > 0)) redirect("/money?err=expense");

  await db().query(
    "INSERT INTO expenses (date, purchased_by, category, item_name, quantity, amount, notes) VALUES (?,?,?,?,?,?,?)",
    [date, user.id, category, item_name, quantity, amount, notes]
  );
  revalidatePath("/money");
  revalidatePath("/");
  redirect("/money?ok=expense");
}

export async function updateExpense(formData) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const id = Number(formData.get("id"));
  const item_name = String(formData.get("item_name") || "").trim();
  const amount = Number(formData.get("amount"));
  let category = String(formData.get("category") || "Other");
  if (!CATEGORIES.includes(category)) category = "Other";
  const date = String(formData.get("date") || "").trim() || new Date().toISOString().slice(0, 10);
  const quantity = String(formData.get("quantity") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!id || !item_name || !(amount > 0)) redirect(`/money/${id}?err=1`);

  await db().query(
    "UPDATE expenses SET date=?, category=?, item_name=?, quantity=?, amount=?, notes=? WHERE id=?",
    [date, category, item_name, quantity, amount, notes, id]
  );
  revalidatePath("/money");
  revalidatePath("/");
  redirect("/money?ok=updated");
}

export async function deleteExpense(formData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const id = Number(formData.get("id"));
  if (id) await db().query("DELETE FROM expenses WHERE id=?", [id]);
  revalidatePath("/money");
  revalidatePath("/");
  redirect("/money?ok=deleted");
}

export async function recordPayment(formData) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const amount = Number(formData.get("amount"));
  const family_id = Number(formData.get("family_id")) || user.family_id;
  const date = String(formData.get("date") || "").trim() || new Date().toISOString().slice(0, 10);
  const mode = String(formData.get("mode") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!(amount > 0) || !family_id) redirect("/money?err=payment");

  await db().query(
    "INSERT INTO payments (date, family_id, amount, mode, notes, recorded_by) VALUES (?,?,?,?,?,?)",
    [date, family_id, amount, mode, notes, user.id]
  );
  revalidatePath("/money");
  redirect("/money?ok=payment");
}
