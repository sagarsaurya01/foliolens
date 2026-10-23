# Design tokens — FolioLens (from MProfit's real UI, clean-room)

Observed from MProfit's public product screenshots (homepage hero,
asset-allocation.webp). We copy the *layout and visual hierarchy*, not their
exact colours, logo or wordmark.

## MProfit's actual look (reference)
- Left **dark slate sidebar** with an account/family switcher at top, nav below.
- Main area is **cream / off-white**, not stark white.
- **Serif** section headings ("Asset Allocation", "Portfolio XIRR"); clean sans for data.
- **Donut** asset-allocation chart with the total value in the centre; muted legend.
- **Holdings table**: Portfolio | Amount Invested | Today's Gain | Unrealised Gain | Current Value, with small asset-type icons and green ▲ up / red ▼ down.
- Big **XIRR** number with a benchmark (Nifty50) comparison.
- Soft rounded cards, gentle shadows, an outer warm/tan frame.

## Our tokens (own brand — a deep green, not MProfit's bright green)
- bg (app): #f6f4ee (warm cream)
- surface (cards): #ffffff
- sidebar: #242a33 (dark slate), sidebar text #cbd2dc, active #ffffff on #313a46
- brand (deep forest green): #2f5d50 ; brand-dark #244a40 ; brand-soft #e7f0ec
- gain: #1f9d6b ; loss: #d1495b
- ink #1c2430 ; muted #6b7280 ; line #e7e4dc
- headings: serif stack (Georgia, 'Times New Roman', serif)
- allocation palette (muted, 6): #2f5d50 #8a9a5b #c9a86a #7fa6c9 #9b7fb8 #d78b6a
- radius: cards 14px
