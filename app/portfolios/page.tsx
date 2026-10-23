import Link from "next/link";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { currentUser } from "@/lib/session";
import { getPortfoliosForUser, valuePortfolio } from "@/lib/data";
import { formatINR } from "@/lib/finance";
import { createPortfolioAction } from "@/app/actions";

export default function PortfoliosPage() {
  const me = currentUser();
  if (!me) redirect("/login");
  const portfolios = getPortfoliosForUser(me.id);

  return (
    <Shell user={me} active="portfolios">
      <h1 className="h-serif mb-6 text-2xl font-bold">Portfolios</h1>

      {portfolios.length === 0 ? (
        <div className="card mb-6 text-sm text-muted">No portfolios yet — create one below.</div>
      ) : (
        <ul className="mb-6 space-y-2">
          {portfolios.map((p) => {
            const v = valuePortfolio(p.id);
            return (
              <li key={p.id}>
                <Link href={`/portfolios/${p.id}`} className="card flex items-center justify-between hover:border-brand">
                  <div>
                    <p className="font-semibold text-ink">{p.name}</p>
                    <p className="text-xs uppercase tracking-wide text-muted">{p.broker ?? "—"} · {p.kind}</p>
                  </div>
                  <span className="font-semibold text-ink">{formatINR(v.valuePaise)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="card max-w-lg">
        <h2 className="h-serif mb-3 text-lg font-bold">New portfolio</h2>
        <form action={createPortfolioAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" name="name" required className="field" placeholder="e.g. Zerodha - Long Term" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="broker">Broker (optional)</label>
              <input id="broker" name="broker" className="field" placeholder="Zerodha" />
            </div>
            <div>
              <label className="label" htmlFor="kind">Type</label>
              <select id="kind" name="kind" className="field">
                <option value="investment">Investment</option>
                <option value="trading">Trading</option>
              </select>
            </div>
          </div>
          <button className="btn" type="submit">Create portfolio</button>
        </form>
      </div>
    </Shell>
  );
}
