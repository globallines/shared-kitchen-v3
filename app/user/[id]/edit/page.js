import { requireUser, db, getFlash } from "../../../../lib/server";
import { redirect } from "next/navigation";
import { Layout } from "../../../../lib/ui.jsx";
export const dynamic = "force-dynamic";

async function updateUser(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../../../lib/server");
  const { redirect } = await import("next/navigation");
  const bcrypt = (await import("bcryptjs")).default;
  const u = await currentUser();
  if (!u || u.role !== "admin") redirect("/");

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const role = formData.get("role");
  const family_id = role === "family" ? Number(formData.get("family_id")) : null;
  const phone = String(formData.get("phone") || "").trim();
  const resetPassword = String(formData.get("new_password") || "");

  if (!name) {
    await setFlash("Name required", "error");
    redirect(`/user/${id}/edit`);
  } else {
    await db().query(
      "UPDATE users SET name = ?, role = ?, family_id = ?, phone = ? WHERE id = ?",
      [name, role, family_id, phone || null, id]
    );

    if (resetPassword) {
      if (resetPassword.length < 4) {
        await setFlash("Password updated, but it should be at least 4 characters", "error");
      } else {
        const hash = await bcrypt.hash(resetPassword, 10);
        await db().query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, id]);
        await setFlash("User updated · password reset");
        redirect("/manage?tab=users");
      }
    }
    await setFlash("User updated");
    redirect("/manage?tab=users");
  }
}

export default async function UserEdit({ params }) {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/");
  const flash = await getFlash();
  const { id } = await params;
  const [rows] = await db().query("SELECT * FROM users WHERE id = ?", [Number(id)]);
  const usr = rows[0];

  if (!usr) {
    return (
      <Layout title="Not found" user={u} flash={flash} active="/user/edit">
        <div className="empty">User not found.</div>
      </Layout>
    );
  }

  const [families] = await db().query("SELECT * FROM families ORDER BY name");
  const roles = { family: "Family member", cook: "Cook", driver: "Driver / Purchaser", admin: "Admin" };

  return (
    <Layout title="Edit User" user={u} flash={flash} active="/user/edit">
      <form action={updateUser}>
        <input type="hidden" name="id" value={usr.id} />

        <div className="card mb-12">
          <div className="kv"><span className="k">Username</span><span className="v">@{usr.username}</span></div>
          <div className="small mt-4 muted">Username cannot be changed</div>
        </div>

        <div className="field">
          <label>Full name</label>
          <input type="text" name="name" defaultValue={usr.name} required />
        </div>

        <div className="field">
          <label>Role</label>
          <select name="role" id="roleSel" required defaultValue={usr.role}>
            {Object.entries(roles).map(([k, v]) => (
              <option value={k} key={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className="field" id="famWrap" style={usr.role === "family" ? undefined : { display: "none" }}>
          <label>Which family?</label>
          <select name="family_id" defaultValue={usr.family_id ?? ""}>
            {families.map((f) => (
              <option value={f.id} key={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Phone</label>
          <input type="tel" name="phone" defaultValue={usr.phone || ""} />
        </div>

        <hr />

        <div className="field">
          <label>Reset password (optional)</label>
          <input type="text" name="new_password" placeholder="Leave blank to keep current" />
          <span className="hint">Min 4 characters. Tell the user their new password.</span>
        </div>

        <button type="submit" className="btn">Save changes</button>
        <a href="/manage?tab=users" className="btn secondary mt-8">Cancel</a>
      </form>
    </Layout>
  );
}
