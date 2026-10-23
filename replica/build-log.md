# Build log — FolioLens (MProfit clone)

Working name: **FolioLens** (placeholder own-brand; replica-brand finalises). Teal, not MProfit's colours.

## Milestone 0 — vertical slice (2026-10-23)

| screen | status | notes |
| --- | --- | --- |
| S01 Login | done | email sign-in against seed user; Google stubbed |
| S02 Dashboard | done | value, invested, total gain, XIRR, allocation bars, per-portfolio list |
| S03 Portfolios list + create | done | name, broker, investment/trading |
| S04 Portfolio detail | done | holdings table (qty, avg cost, LTP, invested, value, gain), add-transaction form |

**Verified in the browser** (localhost:3200), signed in as Sagar, against seeded
transactions (3 buys + 1 FIFO sell of Reliance) and seeded prices:
- Dashboard: value ₹1,04,847.25, invested ₹96,459.00, gain ₹8,388.25 (+8.70%),
  allocation 90.3% equity / 9.7% MF. All tie out by hand.
- Holdings avg cost correctly folds in buy charges (Reliance ₹2,851 = ₹2,850 + ₹20/20).
- FIFO sell of 5 Reliance left 15 held at the original lot cost.
- Added a live buy (5 Reliance @ ₹3,000 + ₹10): quantity → 20, avg blended to
  ₹2,888.75, invested/value/gain/XIRR all recomputed consistently. No console errors.

**Finance engine** (`lib/finance.ts`): integer paise, FIFO lot matching for holdings
+ realised gains, XIRR via Newton's method. **Derived, never stored.**

**Data layer** (`lib/data.ts`): in-memory + seeded, Supabase-shaped signatures.
`getPrice()` is the ONLY function the live AMFI/NSE feed replaces.

### Harder than expected
- Nothing blocking. Browser screenshots occasionally time out when the app window
  is hidden; retrying or using get_page_text works.

### Not in this milestone (by design)
- Capital-gains report (FIFO realised gains are already computed in `deriveHoldings`,
  just not surfaced as an ITR/112A report — that's Milestone 2 with grandfathering).
- Live pricing job (AMFI + NSE), allocation donut chart, corporate actions,
  CAS/broker import, family grouping, reconciliation.
- Real auth + persistence (Supabase) — replica-backend.

## Next
`/replica-backend` for Supabase + the daily price job, then the capital-gains report.
