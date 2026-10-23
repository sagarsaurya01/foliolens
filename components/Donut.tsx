// Asset-allocation donut with the total value in the centre (MProfit style).
// Pure SVG, no deps. Segments from a label→value map.
import { formatINR } from "@/lib/finance";

const PALETTE = ["#2f5d50", "#8a9a5b", "#c9a86a", "#7fa6c9", "#9b7fb8", "#d78b6a"];

export default function Donut({
  data,
  centerLabel = "Current value",
}: {
  data: { label: string; value: number }[]; // value in paise
  centerLabel?: string;
}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const size = 180;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Asset allocation">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {total === 0 ? (
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e7e4dc" strokeWidth={stroke} />
          ) : (
            data.map((d, i) => {
              const frac = d.value / total;
              const dash = frac * c;
              const seg = (
                <circle
                  key={d.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={PALETTE[i % PALETTE.length]}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return seg;
            })
          )}
        </g>
        <text x="50%" y="46%" textAnchor="middle" className="fill-ink" style={{ fontSize: 18, fontWeight: 700 }}>
          {formatINR(total)}
        </text>
        <text x="50%" y="57%" textAnchor="middle" className="fill-muted" style={{ fontSize: 11 }}>
          {centerLabel}
        </text>
      </svg>

      <ul className="space-y-1.5 text-sm">
        {data.map((d, i) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <li key={d.label} className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
              <span className="text-ink">{d.label}</span>
              <span className="ml-auto text-muted">{pct.toFixed(1)}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
