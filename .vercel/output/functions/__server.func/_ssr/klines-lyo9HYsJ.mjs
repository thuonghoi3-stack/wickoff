import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { n as MARKETS } from "./symbols-CjfDfauc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/klines-lyo9HYsJ.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var TARGET = {
	"15m": 960,
	"1h": 1e3,
	"4h": 900,
	"1d": 540
};
var ALLOWED = new Set(MARKETS.map((m) => m.symbol));
var INTERVALS = /* @__PURE__ */ new Set([
	"15m",
	"1h",
	"4h",
	"1d"
]);
var VISION = "https://data.binance.vision/data/futures/um";
var cache = /* @__PURE__ */ new Map();
function pad(n) {
	return String(n).padStart(2, "0");
}
function ymd(y, m, d) {
	return `${y}-${pad(m)}-${pad(d)}`;
}
function parts(ms) {
	const dt = new Date(ms);
	return {
		y: dt.getUTCFullYear(),
		m: dt.getUTCMonth() + 1,
		d: dt.getUTCDate()
	};
}
function prevMonth(y, m) {
	return m === 1 ? {
		y: y - 1,
		m: 12
	} : {
		y,
		m: m - 1
	};
}
function monthDays(y, m, untilDay) {
	const out = [];
	for (let d = 1; d <= untilDay; d++) out.push(ymd(y, m, d));
	return out;
}
function lastNDays(latestMs, n) {
	const out = [];
	for (let i = n - 1; i >= 0; i--) {
		const p = parts(latestMs - i * 864e5);
		out.push(ymd(p.y, p.m, p.d));
	}
	return out;
}
async function mapPool(items, size, fn) {
	const ret = new Array(items.length);
	let cursor = 0;
	const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
		while (cursor < items.length) {
			const idx = cursor++;
			ret[idx] = await fn(items[idx]);
		}
	});
	await Promise.all(workers);
	return ret;
}
async function fetchZipCsv(url) {
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(2e4) });
		if (!res.ok) return null;
		const buf = new Uint8Array(await res.arrayBuffer());
		const { unzipSync } = await import("../_libs/fflate.mjs").then((n) => n.t);
		const files = unzipSync(buf);
		const name = Object.keys(files)[0];
		if (!name) return null;
		return new TextDecoder().decode(files[name]);
	} catch {
		return null;
	}
}
function parseCsv(csv) {
	const out = [];
	for (const line of csv.split(/\r?\n/)) {
		if (!line || line.startsWith("open_time")) continue;
		const p = line.split(",");
		if (p.length < 6) continue;
		let t = Number(p[0]);
		if (!Number.isFinite(t)) continue;
		if (t > 0x38d7ea4c68000) t = Math.floor(t / 1e3);
		const o = Number(p[1]);
		const h = Number(p[2]);
		const l = Number(p[3]);
		const c = Number(p[4]);
		const v = Number(p[5]);
		if (![
			o,
			h,
			l,
			c,
			v
		].every(Number.isFinite) || h < l || c <= 0) continue;
		out.push({
			t,
			o,
			h,
			l,
			c,
			v
		});
	}
	return out;
}
function merge(chunks) {
	const map = /* @__PURE__ */ new Map();
	for (const chunk of chunks) for (const c of chunk) map.set(c.t, c);
	return [...map.values()].sort((a, b) => a.t - b.t);
}
async function findLatest(symbol, interval) {
	const now = Date.now();
	const days = [
		0,
		1,
		2,
		3,
		4,
		5,
		6,
		7
	].map((back) => now - back * 864e5);
	return (await Promise.all(days.map(async (ms) => {
		const p = parts(ms);
		const url = `${VISION}/daily/klines/${symbol}/${interval}/${symbol}-${interval}-${ymd(p.y, p.m, p.d)}.zip`;
		try {
			return (await fetch(url, {
				method: "HEAD",
				signal: AbortSignal.timeout(12e3)
			})).ok ? ms : 0;
		} catch {
			return 0;
		}
	}))).find((ms) => ms > 0) || null;
}
async function loadVision(symbol, interval) {
	const latestMs = await findLatest(symbol, interval);
	if (!latestMs) throw new Error("Binance chưa có file nến futures cho cặp này.");
	const latest = parts(latestMs);
	const chunks = (await mapPool(interval === "15m" ? lastNDays(latestMs, 10) : monthDays(latest.y, latest.m, latest.d), 8, (date) => fetchZipCsv(`${VISION}/daily/klines/${symbol}/${interval}/${symbol}-${interval}-${date}.zip`))).filter((x) => !!x).map(parseCsv);
	if (interval !== "15m") {
		let cursor = prevMonth(latest.y, latest.m);
		let guard = 0;
		while (merge(chunks).length < TARGET[interval] && guard++ < 26) {
			const csv = await fetchZipCsv(`${VISION}/monthly/klines/${symbol}/${interval}/${symbol}-${interval}-${`${cursor.y}-${pad(cursor.m)}`}.zip`);
			if (csv) chunks.push(parseCsv(csv));
			cursor = prevMonth(cursor.y, cursor.m);
		}
	}
	const candles = merge(chunks).slice(-TARGET[interval]);
	if (candles.length < 180) throw new Error("Không đủ nến đóng để dựng một vòng Wyckoff.");
	return candles;
}
function parseLive(rows) {
	const now = Date.now();
	const out = [];
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
		if (![
			t,
			o,
			h,
			l,
			c,
			v
		].every(Number.isFinite) || h < l || c <= 0) continue;
		out.push({
			t,
			o,
			h,
			l,
			c,
			v
		});
	}
	return out;
}
async function tryLive(symbol, interval) {
	try {
		const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=1000`;
		const res = await fetch(url, { signal: AbortSignal.timeout(4e3) });
		if (!res.ok) return null;
		const data = await res.json();
		if (!Array.isArray(data)) return null;
		const candles = parseLive(data);
		return candles.length >= 180 ? candles : null;
	} catch {
		return null;
	}
}
var loadMarket_createServerFn_handler = createServerRpc({
	id: "aac8f32fbfea733d3f68fefef7280fed8c33b8fc51ed7b0ea5d55c556b48dabe",
	name: "loadMarket",
	filename: "src/lib/market/klines.ts"
}, (opts) => loadMarket.__executeServer(opts));
var loadMarket = createServerFn({ method: "POST" }).validator((input) => {
	const raw = input;
	const symbol = String(raw?.symbol ?? "").toUpperCase();
	const interval = String(raw?.interval ?? "1h");
	if (!ALLOWED.has(symbol) || !INTERVALS.has(interval)) throw new Error("Cặp hoặc khung thời gian không hỗ trợ.");
	return {
		symbol,
		interval
	};
}).handler(loadMarket_createServerFn_handler, async ({ data }) => {
	const key = `${data.symbol}:${data.interval}`;
	const hit = cache.get(key);
	const ttl = hit?.pack.source === "live" ? 2e4 : 6e5;
	if (hit && Date.now() - hit.at < ttl) return hit.pack;
	try {
		const live = await tryLive(data.symbol, data.interval);
		const candles = live ?? await loadVision(data.symbol, data.interval);
		const pack = {
			ok: true,
			symbol: data.symbol,
			interval: data.interval,
			source: live ? "live" : "vision",
			asOf: candles[candles.length - 1].t,
			candles
		};
		cache.set(key, {
			at: Date.now(),
			pack
		});
		return pack;
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Không tải được nến Binance Futures."
		};
	}
});
//#endregion
export { loadMarket_createServerFn_handler };
