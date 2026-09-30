"use client";

import { useState } from "react";

const W = 600;
const H = 180;
const PAD = { t: 12, r: 12, b: 24, l: 40 };

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p) * p;
}

/**
 * Single-series line chart with a crosshair tooltip.
 * One series per chart (never a dual axis) — compare measures with separate charts.
 */
const FORMATS = {
  int: (v: number) => Math.round(v).toLocaleString(),
  pct: (v: number) => `${Math.round(v * 100)}%`,
};

export function LineChart({
  points,
  yFormat = "int",
  label,
  yMax,
  area = true,
}: {
  /** x is the (pre-formatted) axis label. Props stay serializable so server pages can render this. */
  points: { x: string; y: number }[];
  yFormat?: keyof typeof FORMATS;
  label: string;
  yMax?: number;
  area?: boolean;
}) {
  const format = FORMATS[yFormat];
  const [hover, setHover] = useState<number | null>(null);
  if (!points.length) return null;
  const max = yMax ?? niceMax(Math.max(...points.map((p) => p.y)));
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => PAD.t + ih - (v / max) * ih;
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(" ");
  const fmtX = (s: string) => s;
  const ticks = [0, max / 2, max];
  const xTicks = [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="img"
        aria-label={label}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          const i = Math.round(((px - PAD.l) / iw) * (points.length - 1));
          setHover(Math.max(0, Math.min(points.length - 1, i)));
        }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#D6CDBC" strokeWidth={1} />
            <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" className="fill-muted font-mono text-[10px]">
              {format(t)}
            </text>
          </g>
        ))}
        {xTicks.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} className="fill-muted font-mono text-[10px]">
            {fmtX(points[i].x)}
          </text>
        ))}
        {area && (
          <polygon
            points={`${x(0)},${y(0)} ${line} ${x(points.length - 1)},${y(0)}`}
            fill="#B8321F"
            fillOpacity={0.08}
          />
        )}
        <polyline points={line} fill="none" stroke="#B8321F" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + ih} stroke="#16140F" strokeWidth={1} strokeDasharray="2 3" />
            <circle cx={x(hover)} cy={y(points[hover].y)} r={4.5} fill="#B8321F" stroke="#FBF8F2" strokeWidth={2} />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 border border-ink bg-paper px-2 py-1 font-mono text-xs whitespace-nowrap shadow-sm"
          style={{
            left: `${(x(hover) / W) * 100}%`,
            transform: `translateX(${hover > points.length / 2 ? "-105%" : "5%"})`,
          }}
        >
          <div className="text-muted">{fmtX(points[hover].x)}</div>
          <div className="font-medium text-ink">{format(points[hover].y)}</div>
        </div>
      )}
    </div>
  );
}

/** Weekly cohort retention heatmap — one hue, light → dark by share retained. */
export function CohortTable({
  cohorts,
}: {
  cohorts: { week: string; size: number; retention: (number | null)[] }[];
}) {
  if (!cohorts.length) return <p className="m-0 font-serif text-muted">Not enough visits yet.</p>;
  const weeks = cohorts[0].retention.length;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="label-cond text-muted">
            <th className="py-2 pr-3 text-left font-semibold">First visit (week of)</th>
            <th className="py-2 pr-3 text-right font-semibold">Visitors</th>
            {Array.from({ length: weeks }, (_, w) => (
              <th key={w} className="px-1 py-2 text-center font-semibold">
                {w === 0 ? "Wk 0" : `+${w}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((c) => (
            <tr key={c.week} className="border-t border-rule">
              <td className="py-1.5 pr-3 whitespace-nowrap">{c.week}</td>
              <td className="py-1.5 pr-3 text-right">{c.size.toLocaleString()}</td>
              {c.retention.map((r, w) => (
                <td key={w} className="p-0.5">
                  {r === null ? (
                    <div className="h-7" />
                  ) : (
                    <div
                      title={`${c.week}, week +${w}: ${(r * 100).toFixed(1)}% returned`}
                      className="flex h-7 min-w-11 items-center justify-center"
                      style={{
                        background: `rgba(184, 50, 31, ${0.06 + r * 0.9})`,
                        color: r > 0.45 ? "#FBF8F2" : "#16140F",
                      }}
                    >
                      {(r * 100).toFixed(0)}%
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Horizontal bars for a short ranked list (referrers, devices). Values are labelled; color is identity-free. */
export function BarList({ rows, total }: { rows: { label: string; n: number }[]; total: number }) {
  if (!rows.length) return <p className="m-0 font-serif text-muted">No data yet.</p>;
  const max = Math.max(...rows.map((r) => r.n));
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[120px_1fr_60px] items-center gap-2.5 font-cond text-sm" title={`${r.label}: ${r.n.toLocaleString()}`}>
          <span className="truncate">{r.label}</span>
          <div className="h-3.5 bg-wash">
            <div className="h-full rounded-r bg-accent" style={{ width: `${(r.n / max) * 100}%` }} />
          </div>
          <span className="text-right font-mono text-xs text-muted">{total ? ((r.n / total) * 100).toFixed(0) : 0}%</span>
        </div>
      ))}
    </div>
  );
}
