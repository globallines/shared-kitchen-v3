import { requireUser, db, getFlash } from "../../lib/server";
import { Layout } from "../../lib/ui.jsx";
import { fmtMoney, thisMonth, monthLabel } from "../../lib/helpers";
export const dynamic = "force-dynamic";

export default async function Settlement({ searchParams }) {
  const u = await requireUser();
  const flash = await getFlash();
  const sp = (await searchParams) || {};
  const month = sp.month || thisMonth();
  const conn = db();

  const [[{ s: total }]] = await conn.query("SELECT COALESCE(SUM(amount),0) s FROM expenses WHERE DATE_FORMAT(date,'%Y-%m') = ?", [month]);
  const share = total / 2;

  const [[{ s: a }]] = await conn.query("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE family_id = 1 AND DATE_FORMAT(date,'%Y-%m') = ?", [month]);
  const [[{ s: b }]] = await conn.query("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE family_id = 2 AND DATE_FORMAT(date,'%Y-%m') = ?", [month]);

  const balA = a - share;
  const balB = b - share;

  const [cats] = await conn.query("SELECT category, SUM(amount) AS amt, COUNT(*) AS cnt FROM expenses WHERE DATE_FORMAT(date,'%Y-%m') = ? GROUP BY category ORDER BY amt DESC", [month]);

  return (
    <Layout title="Settlement" user={u} flash={flash} active="/expenses">
      <form method="get" style={{ marginBottom: "14px" }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Month</label>
          <input type="month" name="month" defaultValue={month} />
        </div>
      </form>

      <div className="card">
        <h3 style={{ marginBottom: "10px" }}>{monthLabel(month)}</h3>
        <div className="kv"><span className="k">Total expenses</span><span className="v">{fmtMoney(total)}</span></div>
        <div className="kv"><span className="k">Each family's share (÷2)</span><span className="v">{fmtMoney(share)}</span></div>
      </div>

      <div className="section">
        <div className="section-h"><span className="lead">Family A — Karthi</span></div>
        <div className="card">
          <div className="kv"><span className="k">Share to pay</span><span className="v">{fmtMoney(share)}</span></div>
          <div className="kv"><span className="k">Already paid</span><span className="v">{fmtMoney(a)}</span></div>
          <hr className="dashed" />
          <div className="kv">
            <span className="k strong">{balA >= 0 ? "Excess paid" : "Balance due"}</span>
            <span className={"v " + (balA >= 0 ? "ok" : "danger")} style={{ fontSize: "18px" }}>
              {fmtMoney(Math.abs(balA))}
            </span>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-h"><span className="lead">Family B — Raj</span></div>
        <div className="card">
          <div className="kv"><span className="k">Share to pay</span><span className="v">{fmtMoney(share)}</span></div>
          <div className="kv"><span className="k">Already paid</span><span className="v">{fmtMoney(b)}</span></div>
          <hr className="dashed" />
          <div className="kv">
            <span className="k strong">{balB >= 0 ? "Excess paid" : "Balance due"}</span>
            <span className={"v " + (balB >= 0 ? "ok" : "danger")} style={{ fontSize: "18px" }}>
              {fmtMoney(Math.abs(balB))}
            </span>
          </div>
        </div>
      </div>

      {cats.length > 0 && (
        <div className="section">
          <div className="section-h"><span className="lead">Where the money went</span></div>
          <div className="card">
            {cats.map((c) => (
              <div className="kv" key={c.category}>
                <span className="k">{c.category} <span className="small">({Number(c.cnt)})</span></span>
                <span className="v">{fmtMoney(c.amt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
