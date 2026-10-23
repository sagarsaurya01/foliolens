import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { currentUser } from "@/lib/session";
import { getPortfolio, valuePortfolio, getSecurities } from "@/lib/data";
import { formatINR, formatPct } from "@/lib/finance";
import { addTxnAction } from "@/app/actions";

export default function PortfolioPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const me = currentUser();
  if (!me) redirect("/login");
  const p = getPortfolio(params.id);
  if (!p || p.userId !== me.id) notFound();

  const v = valuePortfolio(p.id);
  const securities = getSecurities();
  const today = new Date().toISOString().slice(0, 10);
  const gc = v.gainPaise >= 0 ? "text-gain" : "text-loss";

  return (
    <Shell user={me} active="portfolios">
        <div className="mb-4">
          <Link href="/portfolios" className="text-sm text-muted hover:text-ink">&larr; Portfolios</Link>
          <h1 className="h-serif mt-1 text-2xl font-bold">{p.name}</h1>
          <p className="text-xs uppercase tracking-wide text-muted">{p.broker ?? "—"} · {p.kind}</p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <div className="card"><p className="label">Value</p><p className="mt-1 text-xl font-bold text-ink">{formatINR(v.valuePaise)}</p></div>
          <div className="card"><p className="label">Invested</p><p className="mt-1 text-xl font-bold text-ink">{formatINR(v.investedPaise)}</p></div>
          <div className="card"><p className="label">Gain</p><p className={`mt-1 text-xl font-bold ${gc}`}>{formatINR(v.gainPaise)}</p></div>
          <div className="card"><p className="label">XIRR</p><p className="mt-1 text-xl font-bold text-ink">{v.xirr != null ? formatPct(v.xirr) : "—"}</p></div>
        </div>

        <section className="mb-6">
          <h2 className="h-serif mb-2 text-lg font-bold">Holdings</h2>
          {v.valued.length === 0 ? (
            <div className="card text-sm text-muted">No open holdings. Add a buy below.</div>
          ) : (
            <div className="card overflow-x-auto p-0">
              <table className="w-full border-collapse">
                <thead className="border-b border-line">
                  <tr>
                    <th className="th">Security</th>
                    <th className="th text-right">Qty</th>
                    <th className="th text-right">Avg cost</th>
                    <th className="th text-right">LTP</th>
                    <th className="th text-right">Invested</th>
                    <th className="th text-right">Value</th>
                    <th className="th text-right">Gain</th>
                  </tr>
                </thead>
                <tbody>
                  {v.valued.map((h) => {
                    const c = h.gainPaise >= 0 ? "text-gain" : "text-loss";
                    return (
                      <tr key={h.security.id} className="border-b border-line last:border-0">
                        <td className="td">
                          <div className="font-medium text-ink">{h.security.symbol ?? h.security.name}</div>
                          {h.security.symbol && <div className="text-xs text-muted">{h.security.name}</div>}
                        </td>
                        <td className="td text-right">{h.quantity.toLocaleString("en-IN")}</td>
                        <td className="td text-right">{formatINR(h.avgCostPaise)}</td>
                        <td className="td text-right">{h.pricePaise != null ? formatINR(h.pricePaise) : "price pending"}</td>
                        <td className="td text-right">{formatINR(h.investedPaise)}</td>
                        <td className="td text-right font-medium">{formatINR(h.valuePaise)}</td>
                        <td className={`td text-right font-medium ${c}`}>
                          {formatINR(h.gainPaise)}<div className="text-xs">{formatPct(h.gainPct)}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card max-w-2xl" id="add">
          <h2 className="h-serif mb-3 text-lg font-bold">Add a transaction</h2>
          {searchParams.error === "input" && (
            <p className="mb-3 text-sm text-loss">Pick a security and enter a positive quantity and price.</p>
          )}
          <form action={addTxnAction} className="space-y-4">
            <input type="hidden" name="portfolioId" value={p.id} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="type">Type</label>
                <select id="type" name="type" className="field">
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="tradeDate">Date</label>
                <input id="tradeDate" name="tradeDate" type="date" className="field" defaultValue={today} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="securityId">Security</label>
              <select id="securityId" name="securityId" className="field">
                {securities.map((s) => (
                  <option key={s.id} value={s.id}>{s.symbol ? `${s.symbol} — ${s.name}` : s.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label" htmlFor="quantity">Quantity</label>
                <input id="quantity" name="quantity" type="number" step="0.0001" min="0" required className="field" placeholder="10" />
              </div>
              <div>
                <label className="label" htmlFor="price">Price (₹)</label>
                <input id="price" name="price" type="number" step="0.01" min="0" required className="field" placeholder="2850.00" />
              </div>
              <div>
                <label className="label" htmlFor="charges">Charges (₹)</label>
                <input id="charges" name="charges" type="number" step="0.01" min="0" className="field" placeholder="20.00" defaultValue="0" />
              </div>
            </div>
            <button className="btn" type="submit">Add transaction</button>
          </form>
        </section>
    </Shell>
  );
}
