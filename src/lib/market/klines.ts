import { createServerFn } from "@tanstack/react-start";
import type { Candle, IntervalId, MarketResponse } from "@/lib/market/types";
import { MARKETS } from "@/lib/market/symbols";

const TARGET: Record<IntervalId, number> = {
  "15m": 960,
  "1h": 1000,
  "4h": 900,
  "1d": 540,
};

const ALLOWED = new Set<string>(MARKETS.map((m) => m.symbol));
const INTERVALS = new Set<IntervalId>(["15m", "1h", "4h", "1d"]);
const VISION = "https://data.binance.vision/data/futures/um";

type CacheRow = { at: number; pack: Extract<MarketResponse, { ok: true }> };
const cache = new Map<string, CacheRow>();

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function ymd(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}

function parts(ms: number): { y: number; m: number; d: number } {
  const dt = new Date(ms);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

function prevMonth(y: number, m: number): { y: number; m: number } {
  return m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
}

function monthDays(y: number, m: number, untilDay: number): string[] {
  const out: string[] = [];
  for (let d = 1; d <= untilDay; d++) out.push(ymd(y, m, d));
  return out;
}

function lastNDays(latestMs: number, n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const p = parts(latestMs - i * 86_400_000);
    out.push(ymd(p.y, p.m, p.d));
  }
  return out;
}

async function mapPool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const ret: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      ret[idx] = await fn(items[idx]!);
    }
  });
  await Promise.all(workers);
  return ret;
}

async function fetchZipCsv(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    const { unzipSync } = await import("fflate");
    const files = unzipSync(buf);
    const name = Object.keys(files)[0];
    if (!name) return null;
    return new TextDecoder().decode(files[name]);
  } catch {
    return null;
  }
}

function parseCsv(csv: string): Candle[] {
  const out: Candle[] = [];
  for (const line of csv.split(/\r?\n/)) {
    if (!line || line.startsWith("open_time")) continue;
    const p = line.split(",");
    if (p.length < 6) continue;
    let t = Number(p[0]);
    if (!Number.isFinite(t)) continue;
    if (t > 1e15) t = Math.floor(t / 1000);
    const o = Number(p[1]);
    const h = Number(p[2]);
    const l = Number(p[3]);
    const c = Number(p[4]);
    const v = Number(p[5]);
    if (![o, h, l, c, v].every(Number.isFinite) || h < l || c <= 0) continue;
    out.push({ t, o, h, l, c, v });
  }
  return out;
}

function merge(chunks: Candle[][]): Candle[] {
  const map = new Map<number, Candle>();
  for (const chunk of chunks) {
    for (const c of chunk) map.set(c.t, c);
  }
  return [...map.values()].sort((a, b) => a.t - b.t);
}

async function findLatest(symbol: string, interval: IntervalId): Promise<number | null> {
  const now = Date.now();
  const days = [0, 1, 2, 3, 4, 5, 6, 7].map((back) => now - back * 86_400_000);
  const hits = await Promise.all(
    days.map(async (ms) => {
      const p = parts(ms);
      const date = ymd(p.y, p.m, p.d);
      const url = `${VISION}/daily/klines/${symbol}/${interval}/${symbol}-${interval}-${date}.zip`;
      try {
        const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(12_000) });
        return res.ok ? ms : 0;
      } catch {
        return 0;
      }
    }),
  );
  const found = hits.find((ms) => ms > 0);
  return found || null;
}

async function loadVision(symbol: string, interval: IntervalId): Promise<Candle[]> {
  const latestMs = await findLatest(symbol, interval);
  if (!latestMs) {
    throw new Error("Binance chưa có file nến futures cho cặp này.");
  }
  const latest = parts(latestMs);
  const dates = interval === "15m" ? lastNDays(latestMs, 10) : monthDays(latest.y, latest.m, latest.d);
  const dailyCsv = await mapPool(dates, 8, (date) =>
    fetchZipCsv(`${VISION}/daily/klines/${symbol}/${interval}/${symbol}-${interval}-${date}.zip`),
  );
  const chunks: Candle[][] = dailyCsv.filter((x): x is string => !!x).map(parseCsv);

  if (interval !== "15m") {
    let cursor = prevMonth(latest.y, latest.m);
    let guard = 0;
    while (merge(chunks).length < TARGET[interval] && guard++ < 26) {
      const tag = `${cursor.y}-${pad(cursor.m)}`;
      const csv = await fetchZipCsv(
        `${VISION}/monthly/klines/${symbol}/${interval}/${symbol}-${interval}-${tag}.zip`,
      );
      if (csv) chunks.push(parseCsv(csv));
      cursor = prevMonth(cursor.y, cursor.m);
    }
  }

  const candles = merge(chunks).slice(-TARGET[interval]);
  if (candles.length < 180) {
    throw new Error("Không đủ nến đóng để dựng một vòng Wyckoff.");
  }
  return candles;
}

function parseLive(rows: unknown[]): Candle[] {
  const now = Date.now();
  const out: Candle[] = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 6) continue;
    const closeTime = Number(row[6]);
    if (Number.isFinite(closeTime) && closeTime > now) continue;
    const t = Number(row[0]);
    const o = Number(row[1]);
    const h = Number(row[2]);
    const l = Number(row[3]);
    const c = Number(row[4]);
    const v = Number(row[5]);
    if (![t, o, h, l, c, v].every(Number.isFinite) || h < l || c <= 0) continue;
    out.push({ t, o, h, l, c, v });
  }
  return out;
}

async function tryLive(symbol: string, interval: IntervalId): Promise<Candle[] | null> {
  try {
    const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=1000`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return null;
    const candles = parseLive(data);
    return candles.length >= 180 ? candles : null;
  } catch {
    return null;
  }
}

export const loadMarket = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const raw = input as { symbol?: string; interval?: string };
    const symbol = String(raw?.symbol ?? "").toUpperCase();
    const interval = String(raw?.interval ?? "1h") as IntervalId;
    if (!ALLOWED.has(symbol) || !INTERVALS.has(interval)) {
      throw new Error("Cặp hoặc khung thời gian không hỗ trợ.");
    }
    return { symbol, interval };
  })
  .handler(async ({ data }): Promise<MarketResponse> => {
    const key = `${data.symbol}:${data.interval}`;
    const hit = cache.get(key);
    const ttl = hit?.pack.source === "live" ? 20_000 : 10 * 60_000;
    if (hit && Date.now() - hit.at < ttl) return hit.pack;
    try {
      const live = await tryLive(data.symbol, data.interval);
      const candles = live ?? (await loadVision(data.symbol, data.interval));
      const pack: Extract<MarketResponse, { ok: true }> = {
        ok: true,
        symbol: data.symbol,
        interval: data.interval,
        source: live ? "live" : "vision",
        asOf: candles[candles.length - 1]!.t,
        candles,
      };
      cache.set(key, { at: Date.now(), pack });
      return pack;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không tải được nến Binance Futures.";
      return { ok: false, error: message };
    }
  });
