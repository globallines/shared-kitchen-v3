import { requireUser, db, getFlash } from "../../../../lib/server";
import { redirect } from "next/navigation";
import { Layout } from "../../../../lib/ui.jsx";
export const dynamic = "force-dynamic";

async function updateFamily(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../../../lib/server");
  const { redirect } = await import("next/navigation");
  const u = await currentUser();
  if (!u || u.role !== "admin") redirect("/");

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const head = String(formData.get("head_name") || "").trim();
  if (!name) {
    await setFlash("Name required", "error");
    redirect(`/family/${id}/edit`);
  } else {
    await db().query("UPDATE families SET name = ?, head_name = ? WHERE id = ?", [name, head || null, id]);
    await setFlash("Family updated");
    redirect("/manage?tab=families");
  }
}

export default async function FamilyEdit({ params }) {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/");
  const flash = await getFlash();
  const { id } = await params;
  const [rows] = await db().query("SELECT * FROM families WHERE id = ?", [Number(id)]);
  const fam = rows[0];

  if (!fam) {
    return (
      <Layout title="Not found" user={u} flash={flash} active="/family/edit">
        <div className="empty">Family not found.</div>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Family" user={u} flash={flash} active="/family/edit">
      <form action={updateFamily}>
        <input type="hidden" name="id" value={fam.id} />
        <div className="field">
          <label>Family name</label>
          <input type="text" name="name" defaultValue={fam.name} required />
        </div>
        <div className="field">
          <label>Head of family</label>
          <input type="text" name="head_name" defaultValue={fam.head_name || ""} />
        </div>
        <button type="submit" className="btn">Save changes</button>
        <a href="/manage?tab=families" className="btn secondary mt-8">Cancel</a>
      </form>
    </Layout>
  );
}
