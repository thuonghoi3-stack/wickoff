import { useEffect, useRef, useState } from "react";
import type { Candle, IntervalId } from "@/lib/market/types";
import { fmtPx, fmtWhen } from "@/lib/market/format";
import type { LiveTrade, Mark, PhaseLine, RangeBox } from "@/lib/wyckoff/engine";

const COL = {
  bg: "#0c1016",
  grid: "#1e2836",
  mute: "#8b98a8",
  fg: "#e7edf4",
  acc: "#0e9f7a",
  dist: "#e23b4a",
  gold: "#d6a21e",
  flat: "#8b98a8",
};

type Props = {
  candles: Candle[];
  head: number;
  boxes: RangeBox[];
  labels: Mark[];
  phases: PhaseLine[];
  trades: LiveTrade[];
  invalidation: number | null;
  interval: IntervalId;
  chip: string;
  tone: "acc" | "dist" | "idle";
};

function mix(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function CandleChart({
  candles,
  head,
  boxes,
  labels,
  phases,
  trades,
  invalidation,
  interval,
  chip,
  tone,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const followRef = useRef(true);
  const viewRef = useRef({ end: head, count: 80 });
  const [follow, setFollow] = useState(true);
  const [viewTick, setViewTick] = useState(0);
  const [read, setRead] = useState<{ i: number; o: number; h: number; l: number; c: number } | null>(null);
  const propsRef = useRef({ candles, head, boxes, labels, phases, trades, invalidation, interval });
  propsRef.current = { candles, head, boxes, labels, phases, trades, invalidation, interval };

  useEffect(() => {
    if (followRef.current) viewRef.current.end = head;
  }, [head]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const paint = () => {
      const p = propsRef.current;
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, w, h, p, viewRef.current);
    };

    const ro = new ResizeObserver(paint);
    ro.observe(wrap);
    paint();
    return () => ro.disconnect();
  }, [head, boxes, labels, phases, trades, candles, invalidation, follow, viewTick]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const v = viewRef.current;
      const next = Math.round(v.count * (e.deltaY > 0 ? 1.12 : 0.88));
      v.count = Math.max(24, Math.min(240, next));
      followRef.current = true;
      setFollow(true);
      v.end = propsRef.current.head;
      setViewTick((n) => n + 1);
    };
    wrap.addEventListener("wheel", onWheel, { passive: false });
    return () => wrap.removeEventListener("wheel", onWheel);
  }, []);

  const pointerIndex = (clientX: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const rect = wrap.getBoundingClientRect();
    const padL = 8;
    const padR = 64;
    const plotW = rect.width - padL - padR;
    const v = viewRef.current;
    const left = Math.max(0, v.end - v.count + 1);
    const slot = plotW / v.count;
    const i = left + Math.floor((clientX - rect.left - padL) / slot);
    if (i < left || i > v.end || i >= propsRef.current.candles.length) return null;
    return i;
  };

  const onMove = (clientX: number) => {
    const i = pointerIndex(clientX);
    if (i == null) {
      setRead(null);
      return;
    }
    const c = propsRef.current.candles[i];
    if (!c) return;
    setRead({ i, o: c.o, h: c.h, l: c.l, c: c.c });
  };

  const drag = useRef<{ x: number; end: number } | null>(null);

  return (
    <div
      ref={wrapRef}
      className="chart-wrap"
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, end: viewRef.current.end };
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (drag.current) {
          const wrap = wrapRef.current;
          if (!wrap) return;
          const plotW = wrap.getBoundingClientRect().width - 72;
          const slot = plotW / viewRef.current.count;
          const dx = e.clientX - drag.current.x;
          const shift = Math.round(-dx / Math.max(slot, 1));
          const end = Math.max(viewRef.current.count - 1, Math.min(propsRef.current.head, drag.current.end + shift));
          viewRef.current.end = end;
          const stuck = end >= propsRef.current.head;
          followRef.current = stuck;
          setFollow(stuck);
          setViewTick((n) => n + 1);
        }
        onMove(e.clientX);
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerLeave={() => setRead(null)}
    >
      <canvas ref={canvasRef} />
      <div className="chart-hud">
        <span className={`chip chip-${tone}`}>{chip}</span>
        <span className="ohlc">
          {read
            ? `O ${fmtPx(read.o)}  H ${fmtPx(read.h)}  L ${fmtPx(read.l)}  C ${fmtPx(read.c)}`
            : candles[head]
              ? `O ${fmtPx(candles[head].o)}  H ${fmtPx(candles[head].h)}  L ${fmtPx(candles[head].l)}  C ${fmtPx(candles[head].c)}`
              : ""}
        </span>
      </div>
      {!follow && (
        <button
          type="button"
          className="btn btn-ghost chart-follow"
          onClick={() => {
            followRef.current = true;
            viewRef.current.end = head;
            setFollow(true);
            setViewTick((n) => n + 1);
          }}
        >
          Bám nến
        </button>
      )}
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: {
    candles: Candle[];
    head: number;
    boxes: RangeBox[];
    labels: Mark[];
    phases: PhaseLine[];
    trades: LiveTrade[];
    invalidation: number | null;
    interval: IntervalId;
  },
  view: { end: number; count: number },
) {
  const end = Math.min(p.head, view.end);
  const count = view.count;
  const left = Math.max(0, end - count + 1);
  const padL = 8;
  const padR = 64;
  const padT = 16;
  const padB = 22;
  const volH = Math.max(36, Math.round(h * 0.16));
  const plotB = h - padB - volH;
  const plotW = w - padL - padR;
  const plotH = plotB - padT;

  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, w, h);

  if (end < 0 || !p.candles.length || plotW <= 0 || plotH <= 0) return;

  let lo = Infinity;
  let hi = -Infinity;
  let vmax = 0;
  for (let i = left; i <= end; i++) {
    const c = p.candles[i];
    if (!c) continue;
    lo = Math.min(lo, c.l);
    hi = Math.max(hi, c.h);
    vmax = Math.max(vmax, c.v);
  }
  if (!Number.isFinite(lo) || hi <= lo) {
    lo = p.candles[end]?.l ?? 0;
    hi = (p.candles[end]?.h ?? 1) * 1.01;
  }
  const span = hi - lo || Math.abs(hi) * 0.01 || 1;
  const open = p.trades.find((t) => !t.closed);
  if (open) {
    const levels = [open.sl, open.tp1, open.tp2, open.entry];
    for (const lv of levels) {
      if (lv > lo - span * 0.35 && lv < hi + span * 0.35) {
        lo = Math.min(lo, lv);
        hi = Math.max(hi, lv);
      }
    }
  }
  const pad = (hi - lo) * 0.08 || span * 0.08;
  lo -= pad;
  hi += pad;

  const yOf = (price: number) => padT + ((hi - price) / (hi - lo)) * plotH;
  const slot = plotW / count;
  const xOf = (i: number) => padL + (i - left + 0.5) * slot;

  ctx.strokeStyle = COL.grid;
  ctx.lineWidth = 1;
  ctx.font = "11px IBM Plex Mono, ui-monospace, monospace";
  ctx.fillStyle = COL.mute;
  for (let g = 0; g < 4; g++) {
    const price = lo + ((hi - lo) * (g + 0.5)) / 4;
    const y = yOf(price);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();
    ctx.fillText(fmtPx(price), w - padR + 6, y + 3);
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(padL, padT, plotW, plotH);
  ctx.clip();

  for (const box of p.boxes) {
    if (box.right < left || box.left > end) continue;
    const x1 = xOf(box.left) - slot * 0.5;
    const x2 = xOf(box.right) + slot * 0.5;
    const y1 = yOf(box.top);
    const y2 = yOf(box.bot);
    const col = box.failed ? COL.flat : box.dir === 1 ? COL.acc : COL.dist;
    ctx.fillStyle = mix(col, box.active ? 0.14 : 0.07);
    ctx.strokeStyle = mix(col, box.active ? 0.9 : 0.45);
    ctx.lineWidth = box.active ? 1.5 : 1;
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    const mid = (box.top + box.bot) / 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, yOf(mid));
    ctx.lineTo(x2, yOf(mid));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = mix(col, 0.95);
    ctx.font = "11px IBM Plex Sans, sans-serif";
    ctx.fillText(box.text, x1 + 6, y1 + 14);
  }

  for (const ph of p.phases) {
    if (ph.bar < left || ph.bar > end) continue;
    const x = xOf(ph.bar);
    ctx.strokeStyle = mix(COL.fg, 0.35);
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(x, yOf(ph.top));
    ctx.lineTo(x, yOf(ph.bot));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COL.fg;
    ctx.font = "600 12px IBM Plex Mono, ui-monospace, monospace";
    ctx.fillText(ph.text, x + 4, yOf(ph.top) + 14);
  }

  for (const t of p.trades) {
    const right = t.exitBar ?? end;
    if (right < left || t.bar > end) continue;
    const x1 = xOf(t.bar);
    const x2 = xOf(right);
    const fillBox = (a: number, b: number, color: string, alpha: number) => {
      const y1 = yOf(Math.max(a, b));
      const y2 = yOf(Math.min(a, b));
      ctx.fillStyle = mix(color, alpha);
      ctx.fillRect(x1, y1, Math.max(2, x2 - x1), y2 - y1);
    };
    fillBox(t.entry, t.sl, COL.dist, 0.18);
    fillBox(t.entry, t.tp3, COL.acc, 0.1);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = COL.acc;
    for (const lv of [t.tp1, t.tp2]) {
      ctx.beginPath();
      ctx.moveTo(x1, yOf(lv));
      ctx.lineTo(x2, yOf(lv));
      ctx.stroke();
    }
    ctx.strokeStyle = COL.dist;
    ctx.beginPath();
    ctx.moveTo(x1, yOf(t.curSl));
    ctx.lineTo(x2, yOf(t.curSl));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (p.invalidation != null && p.invalidation > lo && p.invalidation < hi) {
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = mix(COL.dist, 0.8);
    ctx.beginPath();
    ctx.moveTo(padL, yOf(p.invalidation));
    ctx.lineTo(w - padR, yOf(p.invalidation));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const bodyW = Math.max(1.5, slot * 0.62);
  for (let i = left; i <= end; i++) {
    const c = p.candles[i];
    if (!c) continue;
    const up = c.c >= c.o;
    const col = up ? COL.acc : COL.dist;
    const x = xOf(i);
    ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, yOf(c.h));
    ctx.lineTo(x, yOf(c.l));
    ctx.stroke();
    const y1 = yOf(Math.max(c.o, c.c));
    const y2 = yOf(Math.min(c.o, c.c));
    ctx.fillStyle = col;
    ctx.fillRect(x - bodyW / 2, y1, bodyW, Math.max(1, y2 - y1));
  }

  const stack = new Map<string, number>();
  ctx.font = "600 11px IBM Plex Sans, sans-serif";
  for (const lb of p.labels) {
    if (lb.bar < left || lb.bar > end) continue;
    const key = `${lb.bar}:${lb.below ? 1 : 0}`;
    const n = stack.get(key) ?? 0;
    stack.set(key, n + 1);
    const col = lb.tone === "acc" ? COL.acc : lb.tone === "dist" ? COL.dist : lb.tone === "fail" ? COL.dist : COL.flat;
    const textW = ctx.measureText(lb.text).width;
    const bw = textW + 10;
    const bh = 16;
    const x = xOf(lb.bar) - bw / 2;
    const base = yOf(lb.price);
    const y = lb.below ? base + 6 + n * 18 : base - bh - 6 - n * 18;
    ctx.fillStyle = mix(col, 0.92);
    round(ctx, x, y, bw, bh, 3);
    ctx.fill();
    ctx.fillStyle = "#04140f";
    if (lb.tone === "fail" || lb.tone === "flat") ctx.fillStyle = COL.bg;
    ctx.fillText(lb.text, x + 5, y + 12);
  }

  ctx.restore();

  const volTop = plotB + 8;
  const volBase = h - padB;
  for (let i = left; i <= end; i++) {
    const c = p.candles[i];
    if (!c) continue;
    const bh = vmax > 0 ? ((volBase - volTop) * c.v) / vmax : 0;
    ctx.fillStyle = mix(c.c >= c.o ? COL.acc : COL.dist, 0.45);
    ctx.fillRect(xOf(i) - bodyW / 2, volBase - bh, bodyW, bh);
  }

  const last = p.candles[end];
  if (last) {
    const y = yOf(last.c);
    ctx.strokeStyle = mix(COL.gold, 0.9);
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();
    ctx.setLineDash([]);
    const tag = fmtPx(last.c);
    ctx.font = "600 11px IBM Plex Mono, ui-monospace, monospace";
    const tw = ctx.measureText(tag).width + 8;
    ctx.fillStyle = COL.gold;
    ctx.fillRect(w - padR, y - 8, tw, 16);
    ctx.fillStyle = "#1a1404";
    ctx.fillText(tag, w - padR + 4, y + 4);
  }

  ctx.fillStyle = COL.mute;
  ctx.font = "11px IBM Plex Mono, ui-monospace, monospace";
  const ticks = 4;
  for (let t = 0; t < ticks; t++) {
    const i = Math.round(left + ((end - left) * t) / (ticks - 1));
    const c = p.candles[i];
    if (!c) continue;
    const label = fmtWhen(c.t, p.interval !== "1d");
    ctx.fillText(label, xOf(i) - 18, h - 6);
  }
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
