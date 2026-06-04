import mysql from "mysql2/promise";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

let _pool;
export function db() {
  if (!_pool) _pool = mysql.createPool({ uri: process.env.DATABASE_URL, dateStrings: true, connectionLimit: 5 });
  return _pool;
}

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const COOKIE = "sk_session";

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return body + "." + sig;
}
function verify(token) {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  if (sig !== expected) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (p.exp && Date.now() > p.exp) return null;
    return p;
  } catch {
    return null;
  }
}

export async function verifyLogin(username, password) {
  const [rows] = await db().query(
    "SELECT id, username, password_hash, name, role, family_id, is_active FROM users WHERE username = ? LIMIT 1",
    [username]
  );
  const u = rows[0];
  if (!u || !u.is_active) return null;
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return null;
  return { id: u.id, name: u.name, role: u.role, family_id: u.family_id };
}

export async function setSession(user) {
  const token = sign({
    uid: user.id, role: user.role, fid: user.family_id, name: user.name,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
  });
  const c = await cookies();
  c.set(COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}
export async function clearSession() {
  const c = await cookies();
  c.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
export async function currentUser() {
  const c = await cookies();
  const p = verify(c.get(COOKIE)?.value);
  if (!p) return null;
  return { id: p.uid, role: p.role, family_id: p.fid, name: p.name };
}

// Full user row (with family_name) — mirrors PHP current_user()
export async function currentUserFull() {
  const u = await currentUser();
  if (!u) return null;
  const [rows] = await db().query(
    "SELECT u.*, f.name AS family_name FROM users u LEFT JOIN families f ON u.family_id=f.id WHERE u.id=? LIMIT 1",
    [u.id]
  );
  return rows[0] || null;
}

export async function requireUser() {
  const u = await currentUserFull();
  if (!u) redirect("/login");
  return u;
}

// Flash messages via short-lived cookie (mirrors PHP $_SESSION flash)
export async function setFlash(msg, type = "ok") {
  const c = await cookies();
  c.set("sk_flash", JSON.stringify({ msg, type }), { httpOnly: true, path: "/", maxAge: 30 });
}
export async function getFlash() {
  const c = await cookies();
  const raw = c.get("sk_flash")?.value;
  if (!raw) return null;
  c.set("sk_flash", "", { httpOnly: true, path: "/", maxAge: 0 });
  try { return JSON.parse(raw); } catch { return null; }
}
