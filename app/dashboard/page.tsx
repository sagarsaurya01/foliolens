import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { currentUser } from "@/lib/session";
import { userDashboard } from "@/lib/data";
import { formatINR, formatPct } from "@/lib/finance";

const CLASS_LABEL: Record<string, string> = {
  equity: "Equity", mf: "Mutual funds", bond: "Bonds", gold: "Gold", cash: "Cash",
};

export default function DashboardPage() {
  const me = currentUser();
  if (!me) redirect("/login");
  const d = userDashboard(me.id);
  const empty = d.perPortfolio.length === 0;
  const gainColor = d.gainPaise >= 0 ? "text-gain" : "text-loss";

  return (
    <>
      <Nav user={me} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-ink">Dashboard</h1>
          <Link href="/portfolios" className="btn">+ Add investment</Link>
        </div>

        {empty ? (
          <div className="card text-center text-sm text-muted">
            <p className="mb-3">No portfolios yet.</p>
            <Link href="/portfolios" className="btn">Create a portfolio</Link>
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-3 sm:grid-cols-4">
              <div className="card">
                <p className="label">Current value</p>
                <p className="mt-1 text-2xl font-bold text-ink">{formatINR(d.valuePaise)}</p>
              </div>
              <div className="card">
                <p className="label">Invested</p>
                <p className="mt-1 text-2xl font-bold text-ink">{formatINR(d.investedPaise)}</p>
              </div>
              <div className="card">
                <p className="label">Total gain</p>
                <p className={`mt-1 text-2xl font-bold ${gainColor}`}>
                  {formatINR(d.gainPaise)}
                </p>
                <p className={`text-xs font-semibold ${gainColor}`}>{formatPct(d.gainPct)}</p>
              </div>
              <div className="card">
                <p className="label">XIRR</p>
                <p className="mt-1 text-2xl font-bold text-ink">
                  {d.xirr != null ? formatPct(d.xirr) : "—"}
                </p>
                <p className="text-xs text-muted">annualised</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <section>
                <h2 className="label mb-2">Allocation</h2>
                <div className="card space-y-2">
                  {Object.entries(d.byClass).map(([cls, val]) => {
                    const pct = d.valuePaise > 0 ? val / d.valuePaise : 0;
                    return (
                      <div key={cls}>
                        <div className="flex justify-between text-sm">
                          <span className="text-ink">{CLASS_LABEL[cls] ?? cls}</span>
                          <span className="text-muted">{(pct * 100).toFixed(1)}%</span>
                        </div>
                        <div className="mt-1 h-2 rounded bg-brand-soft">
                          <div className="h-2 rounded bg-brand" style={{ width: `${pct * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className="label mb-2">Portfolios</h2>
                <ul className="space-y-2">
                  {d.perPortfolio.map((pp) => {
                    const c = pp.gainPaise >= 0 ? "text-gain" : "text-loss";
                    return (
                      <li key={pp.portfolio.id}>
                        <Link href={`/portfolios/${pp.portfolio.id}`} className="card flex items-center justify-between hover:border-brand">
                          <div>
                            <p className="font-semibold text-ink">{pp.portfolio.name}</p>
                            <p className="text-xs text-muted">{pp.portfolio.broker ?? "—"}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-ink">{formatINR(pp.valuePaise)}</p>
                            <p className={`text-xs font-semibold ${c}`}>{formatINR(pp.gainPaise)}</p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          </>
        )}
      </main>
    </>
  );
}
