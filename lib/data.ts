// In-memory data layer for Milestone 0. Signatures match the future Supabase
// layer so replica-backend swaps the body without touching screens. Prices are
// seeded here; the live layer (AMFI NAV + NSE bhav) replaces getPrice() only.
import { Txn, deriveHoldings, xirr, CashFlow } from "./finance";

export type Security = {
  id: string;
  symbol: string | null;
  name: string;
  assetClass: "equity" | "mf" | "bond" | "gold" | "cash";
};
export type Portfolio = {
  id: string;
  userId: string;
  name: string;
  broker: string | null;
  kind: "investment" | "trading";
};
export type User = { id: string; name: string; email: string };

type DB = {
  users: User[];
  securities: Security[];
  portfolios: Portfolio[];
  txns: (Txn & { portfolioId: string })[];
  prices: Record<string, number>; // securityId -> latest price paise
};

const g = globalThis as unknown as { __mpdb?: DB };

function seed(): DB {
  const users: User[] = [{ id: "u1", name: "Sagar Pathak", email: "sagar@demo.in" }];
  const securities: Security[] = [
    { id: "s1", symbol: "RELIANCE", name: "Reliance Industries Ltd", assetClass: "equity" },
    { id: "s2", symbol: "INFY", name: "Infosys Ltd", assetClass: "equity" },
    { id: "s3", symbol: null, name: "Parag Parikh Flexi Cap Fund - Direct Growth", assetClass: "mf" },
  ];
  const portfolios: Portfolio[] = [
    { id: "p1", userId: "u1", name: "Zerodha - Long Term", broker: "Zerodha", kind: "investment" },
  ];
  // seeded transactions: a couple of buys and one partial sell
  const txns: (Txn & { portfolioId: string })[] = [
    { id: "t1", portfolioId: "p1", securityId: "s1", type: "buy", tradeDate: "2024-06-10", quantity: 20, pricePaise: 285000, chargesPaise: 2000 },
    { id: "t2", portfolioId: "p1", securityId: "s2", type: "buy", tradeDate: "2024-09-01", quantity: 30, pricePaise: 150000, chargesPaise: 1800 },
    { id: "t3", portfolioId: "p1", securityId: "s3", type: "buy", tradeDate: "2025-01-15", quantity: 120.5, pricePaise: 7200, chargesPaise: 0 },
    { id: "t4", portfolioId: "p1", securityId: "s1", type: "sell", tradeDate: "2025-11-20", quantity: 5, pricePaise: 312000, chargesPaise: 1500 },
  ];
  const prices: Record<string, number> = {
    s1: 306500, // Reliance LTP ₹3065.00
    s2: 162300, // Infosys ₹1623.00
    s3: 8450, // PPFCF NAV ₹84.50
  };
  return { users, securities, portfolios, txns, prices };
}
function db(): DB {
  if (!g.__mpdb) g.__mpdb = seed();
  return g.__mpdb;
}
let idc = 1000;
const newId = (p: string) => `${p}${++idc}`;

// ---- reads ----
export const getUsers = () => db().users;
export const getUser = (id: string) => db().users.find((u) => u.id === id) ?? null;
export const getSecurities = () => db().securities;
export const getSecurity = (id: string) => db().securities.find((s) => s.id === id) ?? null;
export const getPortfoliosForUser = (userId: string) =>
  db().portfolios.filter((p) => p.userId === userId);
export const getPortfolio = (id: string) => db().portfolios.find((p) => p.id === id) ?? null;
export const getTxns = (portfolioId: string) =>
  db().txns.filter((t) => t.portfolioId === portfolioId);

// price layer — the ONLY thing the live feed replaces
export const getPrice = (securityId: string): number | null =>
  db().prices[securityId] ?? null;

// ---- writes ----
export function createPortfolio(userId: string, name: string, broker: string | null, kind: "investment" | "trading") {
  const p: Portfolio = { id: newId("p"), userId, name, broker, kind };
  db().portfolios.push(p);
  return p;
}
export function addTxn(input: {
  portfolioId: string;
  securityId: string;
  type: "buy" | "sell";
  tradeDate: string;
  quantity: number;
  pricePaise: number;
  chargesPaise: number;
}) {
  const t = { id: newId("t"), chargesPaise: 0, ...input };
  db().txns.push(t);
  return t;
}

// ---- derived: a portfolio's holdings valued live ----
export type ValuedHolding = {
  security: Security;
  quantity: number;
  avgCostPaise: number;
  investedPaise: number;
  pricePaise: number | null;
  valuePaise: number;
  gainPaise: number;
  gainPct: number;
};

export function valuePortfolio(portfolioId: string) {
  const txns = getTxns(portfolioId);
  const { holdings } = deriveHoldings(txns);
  const valued: ValuedHolding[] = holdings.map((h) => {
    const security = getSecurity(h.securityId)!;
    const price = getPrice(h.securityId);
    const valuePaise = price != null ? Math.round(h.quantity * price) : 0;
    const gainPaise = valuePaise - h.investedPaise;
    return {
      security,
      quantity: h.quantity,
      avgCostPaise: h.avgCostPaise,
      investedPaise: h.investedPaise,
      pricePaise: price,
      valuePaise,
      gainPaise,
      gainPct: h.investedPaise > 0 ? gainPaise / h.investedPaise : 0,
    };
  });
  const investedPaise = valued.reduce((a, h) => a + h.investedPaise, 0);
  const valuePaise = valued.reduce((a, h) => a + h.valuePaise, 0);
  const gainPaise = valuePaise - investedPaise;

  // XIRR: buys/charges are outflows, sells inflows, plus current value today.
  const flows: CashFlow[] = [];
  for (const t of txns) {
    const gross = t.quantity * t.pricePaise;
    if (t.type === "buy") flows.push({ date: t.tradeDate, amountPaise: -(gross + t.chargesPaise) });
    else if (t.type === "sell") flows.push({ date: t.tradeDate, amountPaise: gross - t.chargesPaise });
  }
  const today = new Date().toISOString().slice(0, 10);
  if (valuePaise > 0) flows.push({ date: today, amountPaise: valuePaise });
  const rate = xirr(flows);

  return { valued, investedPaise, valuePaise, gainPaise, xirr: rate };
}

// consolidated across all of a user's portfolios (for the dashboard)
export function userDashboard(userId: string) {
  const portfolios = getPortfoliosForUser(userId);
  let invested = 0, value = 0;
  const perPortfolio = portfolios.map((p) => {
    const v = valuePortfolio(p.id);
    invested += v.investedPaise;
    value += v.valuePaise;
    return { portfolio: p, ...v };
  });
  // allocation by asset class
  const byClass: Record<string, number> = {};
  for (const pp of perPortfolio)
    for (const h of pp.valued)
      byClass[h.security.assetClass] = (byClass[h.security.assetClass] ?? 0) + h.valuePaise;

  // consolidated XIRR across every portfolio's flows
  const allFlows: CashFlow[] = [];
  for (const p of portfolios) {
    for (const t of getTxns(p.id)) {
      const gross = t.quantity * t.pricePaise;
      if (t.type === "buy") allFlows.push({ date: t.tradeDate, amountPaise: -(gross + t.chargesPaise) });
      else if (t.type === "sell") allFlows.push({ date: t.tradeDate, amountPaise: gross - t.chargesPaise });
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  if (value > 0) allFlows.push({ date: today, amountPaise: value });

  return {
    perPortfolio,
    investedPaise: invested,
    valuePaise: value,
    gainPaise: value - invested,
    gainPct: invested > 0 ? (value - invested) / invested : 0,
    byClass,
    xirr: xirr(allFlows),
  };
}
