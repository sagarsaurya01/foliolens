# Recon map: MProfit (Web + mobile)

Scope: the core portfolio-tracking loop — import/enter transactions across asset classes, organise them into portfolios and family groups, see a live-valued dashboard (current value, gain/loss, XIRR, allocation), and produce capital-gains + performance reports.
For: Sagar's own build, to be rebranded. Clean-room — rebuild what it does, not its code/brand/data feeds.
Date: 2026-10-23

NOTE: recon is from PUBLIC sources only (marketing site, help centre, app listings, a published walkthrough). I did not and cannot create or use an MProfit login. Deeper mapping would need Sagar driving his own account.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | features page | https://www.mprofit.in/features/ | asset classes, import, capital gains |
| 2 | help centre | https://help.mprofit.in/support/solutions | Cloud, Tutorials, Import Guides; import flows |
| 3 | walkthrough (3rd-party) | nooreshtech.co.in (2023) | best source for actual section/report names |
| 4 | review sites | saasworthy, softwaresuggest | feature cross-check, pricing hints |
| 5 | pricing | https://www.mprofit.in/pricing | gated: "request pricing" form, no public prices |
| 6 | segments | investors / family-offices / wealth-managers / CA pages | who it's for, which features matter |

## Core loop

Get your transactions in (auto-import broker/RTA statements, or enter manually) → MProfit prices them live and tracks corporate actions → you see what your portfolio is worth, the gain, and the XIRR → at year-end you pull a capital-gains report in ITR format for tax filing.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Sign up / Log in | /login | auth | form, Google | empty, error |
| S02 | Portfolio dashboard | /dashboard | current value, today's & total gain, allocation donut, top holdings | value cards, allocation chart, holdings table | empty, filled, loading prices |
| S03 | Portfolios list | /portfolios | all portfolios (broker/advisor-wise) + consolidated | portfolio cards, "new" | empty, filled |
| S04 | Portfolio detail / holdings | /portfolios/:id | holdings table: qty, avg cost, LTP, value, unrealised G/L, % | sortable table, asset-type filter | empty, filled |
| S05 | Add / import transactions | modal or /import | manual entry + file import (contract note, CAS) | buy/sell form, file upload, broker picker | manual, import preview, error |
| S06 | Transaction list | /portfolios/:id/txns | every txn with edit/delete, charges | table, filters, edit | empty, filled |
| S07 | Corporate actions | /corporate-actions | dividends, splits, bonus, merger/demerger applied | list, apply/confirm | pending, applied |
| S08 | Capital gains report | /reports/capital-gains | realised G/L by FY, STCG/LTCG/intra-day, ITR + 112A export | FY picker, table, export buttons | empty, filled |
| S09 | Performance reports | /reports | Summary, XIRR, Historical Valuation, Holding Period, Unrealised G/L | report picker, table/chart, export | — |
| S10 | Groups (family) | /groups | individual + family-level grouping, consolidated value | group tree, members | empty, filled |
| S11 | Reconciliation | /reconcile | match MProfit holdings vs broker/demat statement | diff table | matched, mismatched |
| S12 | Account / settings | /account | profile, default currency, plan | form | — |

## Flows

```
F01 Track an investment end to end (core loop)
    S05 add/import a buy -> S04 holding appears, live-valued -> S02 dashboard updates
    happy path clicks: ~4 (new txn, asset, qty+price, save)
    edge: sell more than held, price feed missing for a symbol, duplicate import rows

F02 Import a broker/CAS statement
    S05 upload file -> parse & map -> preview -> confirm -> txns created in S06
    edge: unknown format, partial parse, already-imported overlap

F03 Corporate action
    S07 a split/bonus/dividend -> apply -> holdings + cost basis adjust in S04
    edge: action dated before a sell, merger with ratio

F04 Year-end capital gains
    S08 pick FY -> realised gains computed (FIFO) STCG/LTCG/intra-day -> export ITR / 112A
    edge: grandfathering (31-Jan-2018), buyback, bonus-stripping

F05 Family consolidation
    S10 group members' portfolios -> S02 consolidated value & allocation across the family
    edge: same security held by two members, inter-member transfer
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Value card | current value, today's gain, total gain, XIRR | up (green), down (red) | S02,S04 |
| Holdings table | sortable, asset-type filtered | empty, loading price, filled | S02,S04 |
| Allocation chart | donut by asset class / by holding | — | S02,S10 |
| Transaction form | buy, sell, dividend, bonus | valid, invalid | S05,S06 |
| File import | drag-drop, broker picker, column map | parsing, preview, error | S05 |
| Report table | summary / gains / valuation | empty, filled | S08,S09 |
| Export buttons | Excel, PDF, CSV, ITR, 112A | — | S08,S09 |
| FY picker | — | — | S08,S09 |

## Inferred data model

```
User       id, name, email, default_currency, plan   | confidence: high
Portfolio  id, user_id, name, broker/advisor, type (investment|trading), group_id
           evidence: "multiple portfolios, broker-wise", consolidated view | high
Group      id, user_id, name, level (individual|family|custom), member_portfolio_ids
           evidence: Portfolio Grouping section | high
Security   id, symbol, name, asset_class (equity|mf|bond|fd|nps|pms|aif|gold|reit|invit),
           isin, exchange, current_price, price_as_of
           evidence: asset classes list, live valuation | high
Transaction id, portfolio_id, security_id, type (buy|sell|dividend|bonus|split|
           merger|interest|expense), trade_date, quantity, price, charges, amount
           evidence: txn updates, charges, corporate actions | high
Holding    (derived) portfolio_id, security_id, qty, avg_cost, invested, current_value,
           unrealised_gl   -- computed from transactions + price, NEVER stored | high
CorporateAction id, security_id, type, ex_date, ratio/amount, applied_at | high
CapitalGain (derived) per sell lot: buy_date, sell_date, qty, cost, proceeds,
           term (intra|short|long), gain -- FIFO matching | high
PriceQuote security_id, date, close  (for historical valuation) | medium
```

Relationships: User 1-n Portfolio; Group 1-n Portfolio; Portfolio 1-n Transaction; Security 1-n Transaction; Transaction → derived Holdings / CapitalGains.

## Feature matrix

See `features.csv`. Must: 11, should: 7, could: 5, skip: 5.

## Out of scope (cannot or should not be cloned)

- **The 700–5,000 broker/RTA auto-import parsers** — that library is MProfit's moat, built over years. A clone starts with manual entry + a few common formats (Zerodha, CAMS/KFintech CAS) and grows. Flag as the single biggest effort.
- **Live & historical price feeds** — a licensed data cost. Use free/public endpoints Sagar already has (AMFI NAV, NSE) in v1; this overlaps his family-investment system.
- **MProfit brand** — name, logo, colours, copy.
- **Their broker API integrations** (Zerodha etc.) — add later with the user's own API keys only.
- **Wealth-manager / multi-client SaaS tier** — a different product; v1 is single-user + family.

## Size

Screens 12, flows 5, entities ~9. Hard parts: (1) **FIFO capital-gains with Indian tax rules** — grandfathering, STCG/LTCG/intra-day, 112A — the real value and the easiest to get wrong; (2) **statement import parsing**; (3) **live + historical pricing**; (4) corporate-action cost-basis adjustments. **Size: L** overall. A working first slice (manual buy/sell → live-valued holdings → dashboard with XIRR) is an **S**, the ~1–1.5 hr target.

## Reuse note

This overlaps heavily with Sagar's existing work: the `portfolio-*` skills, the family investment system, and verified AMFI/NSE price endpoints. The clone should reuse that pricing + extraction knowledge rather than rebuild it.

## Next step

`/replica-architect` — Next.js + Supabase (same as SplitMate/Dussehra), turn this model into SQL with holdings and capital-gains derived (never stored), and order the build: manual buy/sell → live-valued holdings → dashboard (value, gain, XIRR). Capital-gains report and import come next.
