# Architecture: MProfit clone (working name "FolioLens")

From `recon.md` + `features.csv`. Date: 2026-10-23.

> This clone and Sagar's **family investment system** share a goal — that system's
> stated target is "replace mprofit". Reuse its verified price endpoints and the
> `portfolio-extract` statement-reading knowledge rather than rebuilding them.

## Stack

| layer | choice | why |
| --- | --- | --- |
| web app | Next.js (App Router) + TypeScript | same as SplitMate / Dussehra — one deploy method |
| styling | Tailwind + tokens | fast, rebrand-safe |
| database | Supabase (Postgres) | same backend family; RLS for per-user isolation |
| data access | Supabase client + raw SQL for holdings/gains | the gains math is SQL/code, keep it explicit |
| auth | Supabase Auth (email + Google) | built in |
| pricing jobs | Vercel Cron (daily) | pull AMFI NAV + NSE bhav into `price_quotes` |
| charts | lightweight (Recharts or inline SVG) | allocation donut, value trend |
| hosting | Vercel | Next.js native |

One database. Single-user + family in v1 (not the wealth-manager multi-client tier).

## Schema

Full SQL in `replica/schema.sql`. 7 tables: `profiles, groups, portfolios, securities, transactions, corporate_actions, price_quotes`.

**The money model — the parts to get exactly right:**
- Money = integer **paise**; quantities `numeric` (MF units are fractional).
- **Holdings are derived**, never stored: per (portfolio, security), sum signed quantity and keep FIFO cost lots in code; `current_value = qty × latest price`.
- **Capital gains = FIFO lot matching.** Each sell consumes oldest buys first. Then:
  - term by asset class + holding period (equity/equity-MF LTCG > 12 months; debt MF and others differ; intra-day separate);
  - **grandfathering**: equity bought on/before **2018-01-31** uses cost = max(actual cost, 31-Jan-2018 FMV), capped at sale price — the rule MProfit sells on, and the easiest to get wrong;
  - corporate actions adjust qty and cost basis before matching.
- **Prices are cached, not stored on holdings.** Daily job fills `price_quotes`.

**Reused price endpoints (verified in Sagar's system):**
- MF NAV: `https://portal.amfiindia.com/spages/NAVAll.txt` — the `portal.` subdomain matters (`www.` returns a stub); ~18k schemes, semicolon-delimited, Plan+Option columns settle direct/regular & growth/IDCW by ISIN.
- Equity: `https://nsearchives.nseindia.com/products/content/sec_bhavdata_full_DDMMYYYY.csv` — needs a Mozilla user-agent; previous trading day only.

## API (server actions / route handlers)

| action | does | who | flow |
| --- | --- | --- | --- |
| signIn / signUp | Supabase Auth | public | auth |
| createPortfolio | new portfolio (broker, kind) | user | S03 |
| addTransaction | buy/sell/dividend/… with charges | owner | F01 |
| listHoldings | derive holdings + live value for a portfolio | owner | S04 |
| dashboard | consolidated value, today/total gain, XIRR, allocation | owner | S02 |
| capitalGains | FIFO realised gains for an FY, STCG/LTCG/intra-day | owner | F04 |
| importStatement | parse CAS/broker file → preview → confirm txns | owner | F02 |
| applyCorporateAction | adjust qty/cost | owner | F03 |
| refreshPrices (cron) | pull AMFI + NSE into price_quotes | system | — |

Imports and broker APIs use only public endpoints / the user's own keys — never MProfit's parsers or feeds.

## The parts that bite

- **FIFO + Indian tax rules** — grandfathering, STCG/LTCG split by asset class, bonus/split cost basis, buyback. This is the product; unit-test it hard.
- **XIRR** — needs the full dated cash-flow series per portfolio; solve with Newton's method, guard non-convergence.
- **Pricing gaps** — a symbol with no quote (new listing, holiday); show "price pending", never a wrong zero.
- **Corporate action ordering** — apply actions before matching sells dated after them.
- **MF identity** — match by ISIN (direct vs regular, growth vs IDCW are different securities).
- **Reconciliation** — the user's demat says X, your derived holding says Y; surface the diff, don't auto-fix.

## Build order

**Milestone 0 — vertical slice (~1–1.5 hr target):**
sign in → create a portfolio → add a buy and a sell → see live-valued holdings → dashboard with invested, current value, total gain and XIRR. Uses a small seeded price set (no live feed yet) so it runs offline, with the price layer's real function signature.
Screens S01, S03, S04, S02. Tables: profiles, portfolios, securities, transactions, price_quotes.

**Milestone 1 — must-haves:** live pricing job (AMFI + NSE), allocation chart, multi-portfolio consolidation, more asset classes, transaction edit/delete.

**Milestone 2 — the real value:** capital-gains report (FIFO, grandfathering, 112A/ITR export), corporate actions, historical valuation.

**Milestone 3 — should/could:** CAS/broker import (reuse `portfolio-extract`), family grouping, reconciliation, Excel/PDF export, goals.

## Summary

Stack: Next.js + Supabase + Tailwind on Vercel. Tables: 7. Routes: ~9. Riskiest: (1) FIFO capital-gains with grandfathering, (2) XIRR convergence, (3) pricing gaps. Reuses Sagar's AMFI/NSE endpoints and portfolio-extract. Next: `/replica-design`, or build Milestone 0 directly.
