// ONE-TIME data import page. Protected by the SESSION_SECRET value.
// Refuses to run once the users table has data. Remove this page after use.
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";

async function importAction(formData) {
  "use server";
  const crypto = await import("crypto");
  const mysql = (await import("mysql2/promise")).default;
  const { dbConfig } = await import("../../lib/server");

  const key = String(formData.get("key") || "");
  const secret = process.env.SESSION_SECRET || "";
  const a = Buffer.from(key), b = Buffer.from(secret);
  if (!secret || a.length !== b.length || !crypto.timingSafeEqual(a, b)) redirect("/setup-import?err=" + encodeURIComponent("Wrong key."));

  const file = formData.get("file");
  if (!file || typeof file.text !== "function" || !file.size) redirect("/setup-import?err=" + encodeURIComponent("Choose the .sql file first."));
  const sql = await file.text();

  let msg = "", ok = false;
  let conn;
  try {
    conn = await mysql.createConnection({ ...dbConfig(), multipleStatements: true });
    let existing = 0;
    try {
      const [[r]] = await conn.query("SELECT COUNT(*) c FROM users");
      existing = Number(r.c);
    } catch { existing = 0; } // table does not exist yet
    if (existing > 0) {
      msg = `The database already has ${existing} users. Import refused so nothing is overwritten.`;
    } else {
      await conn.query(sql);
      const [tables] = await conn.query("SHOW TABLES");
      const [[u]] = await conn.query("SELECT COUNT(*) c FROM users");
      msg = `Import finished: ${tables.length} tables, ${u.c} users.`;
      ok = true;
    }
  } catch (e) {
    msg = "Import failed: " + String(e && e.message ? e.message : e).slice(0, 400);
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
  redirect(`/setup-import?${ok ? "ok" : "err"}=` + encodeURIComponent(msg));
}

export default async function SetupImport({ searchParams }) {
  const sp = (await searchParams) || {};
  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Import data</h1>
        <p className="lead">One-time setup. Upload the kitchen .sql file.</p>
        {sp.ok && <div className="flash ok">{sp.ok}</div>}
        {sp.err && <div className="flash error">{sp.err}</div>}
        <form action={importAction}>
          <div className="field">
            <label>Setup key (your SESSION_SECRET value)</label>
            <input type="password" name="key" required autoComplete="off" />
          </div>
          <div className="field">
            <label>SQL file</label>
            <input type="file" name="file" accept=".sql" required />
          </div>
          <button type="submit" className="btn">Import</button>
        </form>
        {sp.ok && <p className="small mt-12"><a href="/login">Go to sign in →</a></p>}
      </div>
    </div>
  );
}
