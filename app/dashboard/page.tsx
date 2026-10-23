import Link from "next/link";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import Donut from "@/components/Donut";
import { currentUser } from "@/lib/session";
import { userDashboard } from "@/lib/data";
import { formatINR, formatPct } from "@/lib/finance";

const CLASS_LABEL: Record<string, string> = {
  equity: "Equity", mf: "Mutual funds", bond: "Bonds", gold: "Gold", cash: "Cash",
};

function Tri({ v }: { v: number }) {
  if (v === 0) return <span className="text-muted">—</span>;
  return <span className={v > 0 ? "text-gain" : "text-loss"}>{v > 0 ? "▲" : "▼"}</span>;
}

export default function DashboardPage() {
  const me = currentUser();
  if (!me) redirect("/login");
  const d = userDashboard(me.id);
  const empty = d.perPortfolio.length === 0;
  const gc = d.gainPaise >= 0 ? "text-gain" : "text-loss";

  const allocation = Object.entries(d.byClass)
    .map(([cls, value]) => ({ label: CLASS_LABEL[cls] ?? cls, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <Shell user={me} active="dashboard">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="h-serif text-2xl font-bold">Dashboard</h1>
        <Link href="/portfolios" className="btn">+ Add investment</Link>
      </div>

      {empty ? (
        <div className="card text-center text-sm text-muted">
          <p className="mb-3">No portfolios yet.</p>
          <Link href="/portfolios" className="btn">Create a portfolio</Link>
        </div>
      ) : (
        <>
          {/* summary row */}
          <div className="mb-6 grid gap-3 sm:grid-cols-4">
            <div className="card"><p className="label">Current value</p><p className="mt-1 text-2xl font-bold text-ink">{formatINR(d.valuePaise)}</p></div>
            <div className="card"><p className="label">Invested</p><p className="mt-1 text-2xl font-bold text-ink">{formatINR(d.investedPaise)}</p></div>
            <div className="card"><p className="label">Total gain</p><p className={`mt-1 text-2xl font-bold ${gc}`}>{formatINR(d.gainPaise)}</p><p className={`text-xs font-semibold ${gc}`}>{formatPct(d.gainPct)}</p></div>
            <div className="card"><p className="label">Portfolio XIRR</p><p className="mt-1 text-2xl font-bold text-ink">{d.xirr != null ? formatPct(d.xirr) : "—"}</p><p className="text-xs text-muted">annualised</p></div>
          </div>

          {/* allocation */}
          <section className="card mb-6">
            <h2 className="h-serif mb-4 text-lg font-bold">Asset Allocation</h2>
            <Donut data={allocation} />
          </section>

          {/* portfolios table */}
          <section className="card p-0">
            <h2 className="h-serif px-4 pb-2 pt-4 text-lg font-bold">Portfolios</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="border-y border-line">
                  <tr>
                    <th className="th">Portfolio</th>
                    <th className="th text-right">Amount invested</th>
                    <th className="th text-right">Unrealised gain</th>
                    <th className="th text-right">Current value</th>
                  </tr>
                </thead>
                <tbody>
                  {d.perPortfolio.map((pp) => (
                    <tr key={pp.portfolio.id} className="border-b border-line last:border-0 hover:bg-brand-soft/40">
                      <td className="td">
                        <Link href={`/portfolios/${pp.portfolio.id}`} className="font-medium text-ink hover:text-brand">
                          {pp.portfolio.name}
                        </Link>
                        <div className="text-xs text-muted">{pp.portfolio.broker ?? "—"}</div>
                      </td>
                      <td className="td text-right">{formatINR(pp.investedPaise)}</td>
                      <td className={`td text-right font-medium ${pp.gainPaise >= 0 ? "text-gain" : "text-loss"}`}>
                        <Tri v={pp.gainPaise} /> {formatINR(pp.gainPaise)}
                      </td>
                      <td className="td text-right font-semibold">{formatINR(pp.valuePaise)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line bg-app/60">
                    <td className="td font-semibold">Total</td>
                    <td className="td text-right font-semibold">{formatINR(d.investedPaise)}</td>
                    <td className={`td text-right font-semibold ${gc}`}>{formatINR(d.gainPaise)}</td>
                    <td className="td text-right font-semibold">{formatINR(d.valuePaise)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      )}
    </Shell>
  );
}
