import { requireUser, db, getFlash } from "../../../lib/server";
import { redirect } from "next/navigation";
import { Layout } from "../../../lib/ui.jsx";
export const dynamic = "force-dynamic";

async function createUser(formData) {
  "use server";
  const { db, currentUser, setFlash } = await import("../../../lib/server");
  const { redirect } = await import("next/navigation");
  const bcrypt = (await import("bcryptjs")).default;
  const u = await currentUser();
  if (!u || u.role !== "admin") redirect("/");

  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  const role = formData.get("role");
  const family_id = role === "family" ? Number(formData.get("family_id")) : null;
  const phone = String(formData.get("phone") || "").trim();

  const [exist] = await db().query("SELECT id FROM users WHERE username = ?", [username]);
  if (exist.length) {
    await setFlash("Username already exists", "error");
    redirect("/user/new");
  } else if (!username || !password || !name) {
    await setFlash("Username, password and name are required", "error");
    redirect("/user/new");
  } else if (password.length < 4) {
    await setFlash("Password must be at least 4 characters", "error");
    redirect("/user/new");
  } else {
    const hash = await bcrypt.hash(password, 10);
    await db().query(
      "INSERT INTO users (username, password_hash, name, role, family_id, phone) VALUES (?,?,?,?,?,?)",
      [username, hash, name, role, family_id, phone || null]
    );
    await setFlash("User created");
    redirect("/manage?tab=users");
  }
}

export default async function UserNew() {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/");
  const flash = await getFlash();
  const [families] = await db().query("SELECT * FROM families ORDER BY name");

  return (
    <Layout title="New User" user={u} flash={flash} active="/user/new">
      <form action={createUser}>
        <div className="field">
          <label>Full name</label>
          <input type="text" name="name" required placeholder="e.g. Anita Sharma" />
        </div>

        <div className="field">
          <label>Username (for login)</label>
          <input type="text" name="username" required pattern="[a-zA-Z0-9_]+" placeholder="lowercase, no spaces" />
          <span className="hint">Letters, numbers, underscores only</span>
        </div>

        <div className="field">
          <label>Password</label>
          <input type="text" name="password" required minLength="4" placeholder="min 4 characters" />
          <span className="hint">Tell the user their password — they can change it later</span>
        </div>

        <div className="field">
          <label>Role</label>
          <select name="role" id="roleSel" required defaultValue="">
            <option value="">— select role —</option>
            <option value="family">Family member</option>
            <option value="cook">Cook</option>
            <option value="driver">Driver / Purchaser</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="field" id="famWrap" style={{ display: "none" }}>
          <label>Which family?</label>
          <select name="family_id">
            {families.map((f) => (
              <option value={f.id} key={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Phone (optional)</label>
          <input type="tel" name="phone" placeholder="+91 ..." />
        </div>

        <button type="submit" className="btn">Create user</button>
        <a href="/manage?tab=users" className="btn secondary mt-8">Cancel</a>
      </form>
    </Layout>
  );
}
