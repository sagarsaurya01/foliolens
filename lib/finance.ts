// Core finance math. Money is integer paise. Quantities are plain numbers
// (MF units are fractional). Holdings and realised gains are DERIVED here from
// the transaction list — never stored.

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
export function formatINR(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const s = (Math.abs(paise) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}₹${s}`;
}
export function formatPct(x: number): string {
  const sign = x > 0 ? "+" : "";
  return `${sign}${(x * 100).toFixed(2)}%`;
}

export type Txn = {
  id: string;
  securityId: string;
  type: "buy" | "sell" | "dividend";
  tradeDate: string; // YYYY-MM-DD
  quantity: number;
  pricePaise: number; // per unit
  chargesPaise: number;
};

export type Holding = {
  securityId: string;
  quantity: number;
  investedPaise: number; // remaining cost of open lots (incl. buy charges)
  avgCostPaise: number; // per unit
};

export type RealisedGain = {
  securityId: string;
  quantity: number;
  costPaise: number;
  proceedsPaise: number;
  gainPaise: number;
  buyDate: string;
  sellDate: string;
};

type Lot = { qty: number; costPerUnit: number; date: string };

/**
 * Walk transactions in date order, matching sells against buys FIFO.
 * Returns open holdings + realised gains. Charges: buy charges add to cost,
 * sell charges reduce proceeds.
 */
export function deriveHoldings(txns: Txn[]): {
  holdings: Holding[];
  realised: RealisedGain[];
} {
  const lots: Record<string, Lot[]> = {};
  const realised: RealisedGain[] = [];
  const ordered = [...txns].sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));

  for (const t of ordered) {
    if (!lots[t.securityId]) lots[t.securityId] = [];
    if (t.type === "buy") {
      const totalCost = t.quantity * t.pricePaise + t.chargesPaise;
      lots[t.securityId].push({
        qty: t.quantity,
        costPerUnit: totalCost / t.quantity,
        date: t.tradeDate,
      });
    } else if (t.type === "sell") {
      let remaining = t.quantity;
      const grossPerUnit = t.pricePaise;
      // spread sell charges across units sold
      const chargePerUnit = t.quantity > 0 ? t.chargesPaise / t.quantity : 0;
      const queue = lots[t.securityId];
      while (remaining > 1e-9 && queue.length > 0) {
        const lot = queue[0];
        const take = Math.min(remaining, lot.qty);
        const costPaise = Math.round(take * lot.costPerUnit);
        const proceedsPaise = Math.round(take * (grossPerUnit - chargePerUnit));
        realised.push({
          securityId: t.securityId,
          quantity: take,
          costPaise,
          proceedsPaise,
          gainPaise: proceedsPaise - costPaise,
          buyDate: lot.date,
          sellDate: t.tradeDate,
        });
        lot.qty -= take;
        remaining -= take;
        if (lot.qty <= 1e-9) queue.shift();
      }
      // if remaining > 0 the user sold more than held — ignore excess (UI blocks it)
    }
    // dividends don't change holdings quantity in this slice
  }

  const holdings: Holding[] = Object.entries(lots)
    .map(([securityId, queue]) => {
      const quantity = queue.reduce((a, l) => a + l.qty, 0);
      const investedPaise = Math.round(queue.reduce((a, l) => a + l.qty * l.costPerUnit, 0));
      return {
        securityId,
        quantity,
        investedPaise,
        avgCostPaise: quantity > 1e-9 ? Math.round(investedPaise / quantity) : 0,
      };
    })
    .filter((h) => h.quantity > 1e-9);

  return { holdings, realised };
}

// ---- XIRR (annualised return) ----
// Newton's method on dated cash flows. Outflows (buys, charges) negative,
// inflows (sells, dividends, current portfolio value) positive.
export type CashFlow = { date: string; amountPaise: number };

function yearFraction(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (365 * 24 * 3600 * 1000);
}

export function xirr(flows: CashFlow[]): number | null {
  if (flows.length < 2) return null;
  const cf = flows
    .map((f) => ({ t: new Date(f.date), a: f.amountPaise }))
    .sort((x, y) => x.t.getTime() - y.t.getTime());
  const hasNeg = cf.some((f) => f.a < 0);
  const hasPos = cf.some((f) => f.a > 0);
  if (!hasNeg || !hasPos) return null;
  const t0 = cf[0].t;

  const npv = (r: number) =>
    cf.reduce((s, f) => s + f.a / Math.pow(1 + r, yearFraction(t0, f.t)), 0);
  const dNpv = (r: number) =>
    cf.reduce((s, f) => {
      const y = yearFraction(t0, f.t);
      return s - (y * f.a) / Math.pow(1 + r, y + 1);
    }, 0);

  let r = 0.1;
  for (let i = 0; i < 100; i++) {
    const v = npv(r);
    const d = dNpv(r);
    if (Math.abs(d) < 1e-9) break;
    const next = r - v / d;
    if (!isFinite(next)) break;
    if (Math.abs(next - r) < 1e-7) return next;
    r = next <= -0.9999 ? -0.9999 : next;
  }
  return isFinite(r) ? r : null;
}
