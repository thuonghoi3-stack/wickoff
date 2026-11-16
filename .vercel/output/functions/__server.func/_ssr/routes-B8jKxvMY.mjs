import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as intervalMeta, i as htfMinutes, n as MARKETS, r as campaignSpan, t as INTERVALS$1 } from "./symbols-CjfDfauc.mjs";
import { a as Play, i as RotateCcw, n as Square, o as Pause, r as SkipForward } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B8jKxvMY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var VN = "Asia/Ho_Chi_Minh";
function fmtPx(n) {
	if (!Number.isFinite(n)) return "—";
	const a = Math.abs(n);
	const d = a >= 1e3 ? 2 : a >= 1 ? 4 : a >= .01 ? 5 : 7;
	return n.toLocaleString("en-US", {
		minimumFractionDigits: d,
		maximumFractionDigits: d
	});
}
function fmtR(n) {
	if (!Number.isFinite(n)) return "—";
	return `${n > 0 ? "+" : ""}${n.toFixed(2)}R`;
}
function fmtUsd(n) {
	if (!Number.isFinite(n)) return "—";
	return `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
function fmtWhen(t, withTime) {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: VN,
		day: "2-digit",
		month: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23"
	}).formatToParts(t);
	const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
	return withTime ? `${get("day")}/${get("month")} ${get("hour")}:${get("minute")}` : `${get("day")}/${get("month")}`;
}
var COL = {
	bg: "#0c1016",
	grid: "#1e2836",
	mute: "#8b98a8",
	fg: "#e7edf4",
	acc: "#0e9f7a",
	dist: "#e23b4a",
	gold: "#d6a21e",
	flat: "#8b98a8"
};
function mix(hex, alpha) {
	const n = parseInt(hex.slice(1), 16);
	return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${alpha})`;
}
function CandleChart({ candles, head, boxes, labels, phases, trades, invalidation, interval, chip, tone }) {
	const wrapRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const followRef = (0, import_react.useRef)(true);
	const viewRef = (0, import_react.useRef)({
		end: head,
		count: 80
	});
	const [follow, setFollow] = (0, import_react.useState)(true);
	const [viewTick, setViewTick] = (0, import_react.useState)(0);
	const [read, setRead] = (0, import_react.useState)(null);
	const propsRef = (0, import_react.useRef)({
		candles,
		head,
		boxes,
		labels,
		phases,
		trades,
		invalidation,
		interval
	});
	propsRef.current = {
		candles,
		head,
		boxes,
		labels,
		phases,
		trades,
		invalidation,
		interval
	};
	(0, import_react.useEffect)(() => {
		if (followRef.current) viewRef.current.end = head;
	}, [head]);
	(0, import_react.useEffect)(() => {
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
	}, [
		head,
		boxes,
		labels,
		phases,
		trades,
		candles,
		invalidation,
		follow,
		viewTick
	]);
	(0, import_react.useEffect)(() => {
		const wrap = wrapRef.current;
		if (!wrap) return;
		const onWheel = (e) => {
			e.preventDefault();
			const v = viewRef.current;
			const next = Math.round(v.count * (e.deltaY > 0 ? 1.12 : .88));
			v.count = Math.max(24, Math.min(240, next));
			followRef.current = true;
			setFollow(true);
			v.end = propsRef.current.head;
			setViewTick((n) => n + 1);
		};
		wrap.addEventListener("wheel", onWheel, { passive: false });
		return () => wrap.removeEventListener("wheel", onWheel);
	}, []);
	const pointerIndex = (clientX) => {
		const wrap = wrapRef.current;
		if (!wrap) return null;
		const rect = wrap.getBoundingClientRect();
		const padL = 8;
		const plotW = rect.width - padL - 64;
		const v = viewRef.current;
		const left = Math.max(0, v.end - v.count + 1);
		const slot = plotW / v.count;
		const i = left + Math.floor((clientX - rect.left - padL) / slot);
		if (i < left || i > v.end || i >= propsRef.current.candles.length) return null;
		return i;
	};
	const onMove = (clientX) => {
		const i = pointerIndex(clientX);
		if (i == null) {
			setRead(null);
			return;
		}
		const c = propsRef.current.candles[i];
		if (!c) return;
		setRead({
			i,
			o: c.o,
			h: c.h,
			l: c.l,
			c: c.c
		});
	};
	const drag = (0, import_react.useRef)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: wrapRef,
		className: "chart-wrap",
		onPointerDown: (e) => {
			drag.current = {
				x: e.clientX,
				end: viewRef.current.end
			};
			e.currentTarget.setPointerCapture(e.pointerId);
		},
		onPointerMove: (e) => {
			if (drag.current) {
				const wrap = wrapRef.current;
				if (!wrap) return;
				const slot = (wrap.getBoundingClientRect().width - 72) / viewRef.current.count;
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
		},
		onPointerUp: () => {
			drag.current = null;
		},
		onPointerLeave: () => setRead(null),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", { ref: canvasRef }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "chart-hud",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `chip chip-${tone}`,
					children: chip
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ohlc",
					children: read ? `O ${fmtPx(read.o)}  H ${fmtPx(read.h)}  L ${fmtPx(read.l)}  C ${fmtPx(read.c)}` : candles[head] ? `O ${fmtPx(candles[head].o)}  H ${fmtPx(candles[head].h)}  L ${fmtPx(candles[head].l)}  C ${fmtPx(candles[head].c)}` : ""
				})]
			}),
			!follow && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn btn-ghost chart-follow",
				onClick: () => {
					followRef.current = true;
					viewRef.current.end = head;
					setFollow(true);
					setViewTick((n) => n + 1);
				},
				children: "Bám nến"
			})
		]
	});
}
function draw(ctx, w, h, p, view) {
	const end = Math.min(p.head, view.end);
	const count = view.count;
	const left = Math.max(0, end - count + 1);
	const padL = 8;
	const padR = 64;
	const padT = 16;
	const padB = 22;
	const volH = Math.max(36, Math.round(h * .16));
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
	const span = hi - lo || Math.abs(hi) * .01 || 1;
	const open = p.trades.find((t) => !t.closed);
	if (open) {
		const levels = [
			open.sl,
			open.tp1,
			open.tp2,
			open.entry
		];
		for (const lv of levels) if (lv > lo - span * .35 && lv < hi + span * .35) {
			lo = Math.min(lo, lv);
			hi = Math.max(hi, lv);
		}
	}
	const pad = (hi - lo) * .08 || span * .08;
	lo -= pad;
	hi += pad;
	const yOf = (price) => padT + (hi - price) / (hi - lo) * plotH;
	const slot = plotW / count;
	const xOf = (i) => padL + (i - left + .5) * slot;
	ctx.strokeStyle = COL.grid;
	ctx.lineWidth = 1;
	ctx.font = "11px IBM Plex Mono, ui-monospace, monospace";
	ctx.fillStyle = COL.mute;
	for (let g = 0; g < 4; g++) {
		const price = lo + (hi - lo) * (g + .5) / 4;
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
		const x1 = xOf(box.left) - slot * .5;
		const x2 = xOf(box.right) + slot * .5;
		const y1 = yOf(box.top);
		const y2 = yOf(box.bot);
		const col = box.failed ? COL.flat : box.dir === 1 ? COL.acc : COL.dist;
		ctx.fillStyle = mix(col, box.active ? .14 : .07);
		ctx.strokeStyle = mix(col, box.active ? .9 : .45);
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
		ctx.fillStyle = mix(col, .95);
		ctx.font = "11px IBM Plex Sans, sans-serif";
		ctx.fillText(box.text, x1 + 6, y1 + 14);
	}
	for (const ph of p.phases) {
		if (ph.bar < left || ph.bar > end) continue;
		const x = xOf(ph.bar);
		ctx.strokeStyle = mix(COL.fg, .35);
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
		const fillBox = (a, b, color, alpha) => {
			const y1 = yOf(Math.max(a, b));
			const y2 = yOf(Math.min(a, b));
			ctx.fillStyle = mix(color, alpha);
			ctx.fillRect(x1, y1, Math.max(2, x2 - x1), y2 - y1);
		};
		fillBox(t.entry, t.sl, COL.dist, .18);
		fillBox(t.entry, t.tp3, COL.acc, .1);
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
		ctx.strokeStyle = mix(COL.dist, .8);
		ctx.beginPath();
		ctx.moveTo(padL, yOf(p.invalidation));
		ctx.lineTo(w - padR, yOf(p.invalidation));
		ctx.stroke();
		ctx.setLineDash([]);
	}
	const bodyW = Math.max(1.5, slot * .62);
	for (let i = left; i <= end; i++) {
		const c = p.candles[i];
		if (!c) continue;
		const col = c.c >= c.o ? COL.acc : COL.dist;
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
	const stack = /* @__PURE__ */ new Map();
	ctx.font = "600 11px IBM Plex Sans, sans-serif";
	for (const lb of p.labels) {
		if (lb.bar < left || lb.bar > end) continue;
		const key = `${lb.bar}:${lb.below ? 1 : 0}`;
		const n = stack.get(key) ?? 0;
		stack.set(key, n + 1);
		const col = lb.tone === "acc" ? COL.acc : lb.tone === "dist" ? COL.dist : lb.tone === "fail" ? COL.dist : COL.flat;
		const bw = ctx.measureText(lb.text).width + 10;
		const bh = 16;
		const x = xOf(lb.bar) - bw / 2;
		const base = yOf(lb.price);
		const y = lb.below ? base + 6 + n * 18 : base - bh - 6 - n * 18;
		ctx.fillStyle = mix(col, .92);
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
		const bh = vmax > 0 ? (volBase - volTop) * c.v / vmax : 0;
		ctx.fillStyle = mix(c.c >= c.o ? COL.acc : COL.dist, .45);
		ctx.fillRect(xOf(i) - bodyW / 2, volBase - bh, bodyW, bh);
	}
	const last = p.candles[end];
	if (last) {
		const y = yOf(last.c);
		ctx.strokeStyle = mix(COL.gold, .9);
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
		const i = Math.round(left + (end - left) * t / 3);
		const c = p.candles[i];
		if (!c) continue;
		const label = fmtWhen(c.t, p.interval !== "1d");
		ctx.fillText(label, xOf(i) - 18, h - 6);
	}
}
function round(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var ALLOWED = new Set(MARKETS.map((m) => m.symbol));
var INTERVALS = /* @__PURE__ */ new Set([
	"15m",
	"1h",
	"4h",
	"1d"
]);
var loadMarket = createServerFn({ method: "POST" }).validator((input) => {
	const raw = input;
	const symbol = String(raw?.symbol ?? "").toUpperCase();
	const interval = String(raw?.interval ?? "1h");
	if (!ALLOWED.has(symbol) || !INTERVALS.has(interval)) throw new Error("Cặp hoặc khung thời gian không hỗ trợ.");
	return {
		symbol,
		interval
	};
}).handler(createSsrRpc("aac8f32fbfea733d3f68fefef7280fed8c33b8fc51ed7b0ea5d55c556b48dabe"));
var DEFAULT_PARAMS = {
	climaxLook: 50,
	emaLen: 50,
	climaxZ: 2,
	climaxAtr: 1.3,
	atrLen: 14,
	arPull: 1,
	minHAtr: 2.5,
	maxHAtr: 12,
	arMax: 40,
	maxLife: 300,
	maxRe: 2,
	stZone: .33,
	stEffort: 1,
	minB: 8,
	springPen: 1,
	springBars: 3,
	sosZ: .3,
	sosBody: .5,
	lpsMax: 40,
	lpsTol: 1,
	eMult: .5,
	entryMode: "LPS + Spring Test",
	tradeSide: "Both",
	minGrade: "B",
	slMode: "Range mid",
	slAtr: .3,
	causeRef: 40,
	causeMax: 3,
	scaleOut: true,
	tradeMax: 200,
	htfMinutes: 240,
	keepN: 8,
	commitEntries: true
};
var Ema = class {
	n;
	k;
	buf = [];
	value = null;
	constructor(n, k = 2 / (n + 1)) {
		this.n = n;
		this.k = k;
	}
	push(x) {
		if (this.value == null) {
			this.buf.push(x);
			if (this.buf.length < this.n) return null;
			const s = this.buf.reduce((a, b) => a + b, 0);
			this.value = s / this.n;
			return this.value;
		}
		this.value = x * this.k + this.value * (1 - this.k);
		return this.value;
	}
	get() {
		return this.value;
	}
};
var Atr = class {
	n;
	buf = [];
	value = null;
	prev = null;
	constructor(n) {
		this.n = n;
	}
	push(h, l, c) {
		const tr = this.prev == null ? h - l : Math.max(h - l, Math.abs(h - this.prev), Math.abs(l - this.prev));
		this.prev = c;
		if (this.value == null) {
			this.buf.push(tr);
			if (this.buf.length < this.n) return null;
			this.value = this.buf.reduce((a, b) => a + b, 0) / this.n;
			return this.value;
		}
		this.value = (this.value * (this.n - 1) + tr) / this.n;
		return this.value;
	}
};
var Window = class {
	n;
	q = [];
	sum = 0;
	sumsq = 0;
	constructor(n) {
		this.n = n;
	}
	push(x) {
		this.q.push(x);
		this.sum += x;
		this.sumsq += x * x;
		if (this.q.length > this.n) {
			const y = this.q.shift();
			this.sum -= y;
			this.sumsq -= y * y;
		}
	}
	ready() {
		return this.q.length >= this.n;
	}
	sma() {
		return this.q.length ? this.sum / this.q.length : 0;
	}
	/** Population standard deviation, matching ta.stdev. */
	sd() {
		if (!this.q.length) return 0;
		const m = this.sma();
		return Math.sqrt(Math.max(0, this.sumsq / this.q.length - m * m));
	}
};
var Extreme = class {
	n;
	mode;
	dq = [];
	constructor(n, mode) {
		this.n = n;
		this.mode = mode;
	}
	push(i, v) {
		const worse = (a, b) => this.mode === "min" ? a >= b : a <= b;
		while (this.dq.length && worse(this.dq[this.dq.length - 1].v, v)) this.dq.pop();
		this.dq.push({
			i,
			v
		});
		while (this.dq.length && this.dq[0].i <= i - this.n) this.dq.shift();
	}
	ready(i) {
		return i >= this.n - 1;
	}
	value() {
		return this.dq[0]?.v ?? NaN;
	}
};
function gradeOf(score) {
	return score >= 75 ? "A" : score >= 55 ? "B" : "C";
}
function gradeIdx(g) {
	return g === "A" ? 0 : g === "B" ? 1 : 2;
}
function phaseName(st) {
	if (st === 1 || st === 2) return "A";
	if (st === 3) return "B";
	if (st === 4) return "C";
	if (st === 5) return "D";
	if (st === 6) return "E";
	return "—";
}
var WyckoffEngine = class {
	p;
	armTrades = true;
	bars = [];
	atr;
	ema;
	volW = new Window(50);
	vol10 = new Window(10);
	rngW = new Window(20);
	lo;
	hi;
	cumVol = 0;
	htfEma;
	emaHist = [];
	htfBias = 0;
	form = null;
	st = 0;
	d = 1;
	schId = 0;
	cLvl = null;
	bLvl = null;
	ext = NaN;
	cBar = -1;
	extBar = -1;
	arBar = -1;
	bStart = -1;
	spBar = -1;
	sosBar = -1;
	lpsBar = -1;
	cVol = 0;
	cZv = 0;
	spLvl = null;
	spVol = 0;
	spQ = 0;
	sosVol = 0;
	sosZv = 0;
	hadSpring = false;
	hadTest = false;
	eShown = false;
	reCnt = 0;
	pend = 0;
	pendExt = NaN;
	pendBar = -1;
	pendVol = 0;
	lastEv = "—";
	lastScore = 0;
	trade = null;
	seq = 1;
	pending = null;
	boxes = [];
	labels = [];
	phases = [];
	trades = [];
	nAcc = 0;
	nDist = 0;
	nSp = 0;
	nSpSos = 0;
	nFail = 0;
	nRe = 0;
	born = [];
	notes = [];
	opened = null;
	exited = null;
	barEnd = null;
	atrNow = 0;
	volZNow = 0;
	rngMa = 0;
	constructor(params = {}) {
		this.p = {
			...DEFAULT_PARAMS,
			...params
		};
		this.atr = new Atr(this.p.atrLen);
		this.ema = new Ema(this.p.emaLen);
		this.lo = new Extreme(this.p.climaxLook, "min");
		this.hi = new Extreme(this.p.climaxLook, "max");
		this.htfEma = new Ema(50);
	}
	get length() {
		return this.bars.length;
	}
	push(bar) {
		this.born = [];
		this.notes = [];
		this.opened = null;
		this.exited = null;
		this.pending = null;
		this.bars.push(bar);
		const i = this.bars.length - 1;
		this.cumVol += bar.v;
		const atr = this.atr.push(bar.h, bar.l, bar.c);
		const ema = this.ema.push(bar.c);
		this.volW.push(bar.v);
		this.vol10.push(bar.v);
		const rng = bar.h - bar.l;
		this.rngW.push(rng);
		this.rngMa = this.rngW.ready() ? this.rngW.sma() : rng;
		this.lo.push(i, bar.l);
		this.hi.push(i, bar.h);
		this.foldHtf(bar);
		const hasVol = this.cumVol > 0;
		const vMa = this.volW.ready() ? this.volW.sma() : 0;
		const vSd = this.volW.ready() ? this.volW.sd() : 0;
		const volZ = hasVol && vSd > 0 ? (bar.v - vMa) / vSd : 0;
		hasVol && vMa > 0 && bar.v / vMa;
		this.volZNow = volZ;
		if (atr == null || ema == null) return this.finish(false);
		this.atrNow = atr;
		const big = rng >= this.p.climaxAtr * atr;
		const climaxV = hasVol ? volZ >= this.p.climaxZ : rng >= this.p.climaxAtr * 1.6 * atr;
		const isSC = bar.c < ema && this.lo.ready(i) && bar.l <= this.lo.value() && big && climaxV;
		const isBC = bar.c > ema && this.hi.ready(i) && bar.h >= this.hi.value() && big && climaxV;
		this.machine(i, bar, atr, volZ, hasVol, rng, isSC, isBC);
		return this.finish(this.born.length > 0 || this.opened != null || this.exited != null);
	}
	/** Operator takes the signal just proposed. */
	take(source = "you") {
		const p = this.pending;
		if (!p || this.trade) return null;
		this.pending = null;
		if (source === "fade") return this.openTrade(this.fadeOf(p), false, "fade");
		return this.openTrade(p, true, "you");
	}
	/** Discretionary order at the last close. */
	manual(dir) {
		if (!this.armTrades || this.trade || !this.bars.length || this.atrNow <= 0) return null;
		const bar = this.bars[this.bars.length - 1];
		const i = this.bars.length - 1;
		const px = bar.c;
		const dist = Math.max(this.atrNow * 1.2, px * .002);
		let sl = px - dir * dist;
		let tp1 = px + dir * dist;
		let tp2 = px + dir * 2 * dist;
		let tp3 = px + dir * 3 * dist;
		const H = this.bLvl != null && this.cLvl != null ? Math.abs(this.bLvl - this.cLvl) : 0;
		if (this.st >= 2 && this.cLvl != null && this.bLvl != null && H > 0 && dir === this.d) {
			sl = this.cLvl - dir * this.p.slAtr * this.atrNow;
			if (dir * (px - sl) <= 0) sl = px - dir * dist;
			tp1 = this.bLvl;
			tp2 = this.bLvl + dir * H;
			tp3 = this.bLvl + dir * H * this.cause(i - this.cBar);
		}
		const risk = Math.abs(px - sl);
		const proposal = {
			schId: this.schId,
			type: "Tay",
			dir,
			bar: i,
			time: bar.t,
			entry: px,
			sl,
			tp1,
			tp2,
			tp3,
			grade: "C",
			score: 0,
			risk
		};
		return this.openTrade(proposal, false, "you");
	}
	markR(price) {
		const t = this.trade;
		if (!t || t.closed) return 0;
		const px = price ?? this.bars[this.bars.length - 1]?.c ?? t.entry;
		if (!(t.risk > 0)) return t.real;
		return t.real + t.remain * t.dir * (px - t.entry) / t.risk;
	}
	/** Sum of closed-trade R with entry at or after `fromBar`. */
	closedR(fromBar = 0) {
		let s = 0;
		for (const t of this.trades) if (t.closed && t.bar >= fromBar) s += t.real;
		return s;
	}
	fadeOf(p) {
		const dir = p.dir * -1;
		const dist = Math.max(Math.abs(p.entry - p.sl), this.mintick(p.entry));
		return {
			...p,
			type: `Ngược ${p.type}`,
			dir,
			sl: p.entry - dir * dist,
			tp1: p.entry + dir * dist,
			tp2: p.entry + dir * 2 * dist,
			tp3: p.entry + dir * 3 * dist,
			risk: dist
		};
	}
	finish(interesting) {
		return {
			born: this.born.slice(),
			interesting,
			proposal: this.pending,
			opened: this.opened,
			exit: this.exited,
			notes: this.notes.slice(),
			snap: this.snapshot()
		};
	}
	foldHtf(bar) {
		const ms = this.p.htfMinutes * 6e4;
		const bucket = Math.floor(bar.t / ms) * ms;
		if (!this.form) {
			this.form = {
				bucket,
				c: bar.c
			};
			return;
		}
		if (bucket !== this.form.bucket) {
			this.closeHtf(this.form.c);
			this.form = {
				bucket,
				c: bar.c
			};
			return;
		}
		this.form.c = bar.c;
	}
	closeHtf(close) {
		const e = this.htfEma.push(close);
		if (e == null) {
			this.htfBias = 0;
			return;
		}
		this.emaHist.push(e);
		if (this.emaHist.length < 6) {
			this.htfBias = 0;
			return;
		}
		const e5 = this.emaHist[this.emaHist.length - 6];
		this.htfBias = close > e && e > e5 ? 1 : close < e && e < e5 ? -1 : 0;
	}
	machine(i, bar, atr, volZ, hasVol, rng, isSC, isBC) {
		const vol = bar.v;
		this.barEnd = null;
		if (this.trade && !this.trade.closed && i > this.trade.bar) this.manage(i, bar);
		let endNow = this.barEnd != null;
		let endFail = false;
		let doBreak = false;
		let endTxt = this.barEnd ?? "";
		let goSOS = false;
		let doSpring = false;
		let doLPS = false;
		let doTest = false;
		const d = this.d;
		const xC = d === 1 ? bar.l : bar.h;
		const xB = d === 1 ? bar.h : bar.l;
		const H = this.bLvl != null && this.cLvl != null ? Math.abs(this.bLvl - this.cLvl) : NaN;
		const nmS = d === 1 ? "Spring" : "UTAD";
		const body = Math.abs(bar.c - bar.o);
		if (this.st === 0) {
			if (isSC || isBC) {
				this.d = isSC ? 1 : -1;
				this.st = 1;
				this.cLvl = isSC ? bar.l : bar.h;
				this.cBar = i;
				this.cVol = vol;
				this.cZv = volZ;
				this.ext = bar.c;
				this.extBar = i;
				this.hadSpring = false;
				this.hadTest = false;
				this.eShown = false;
				this.spQ = 0;
				this.reCnt = 0;
				this.pend = 0;
				this.lastEv = isSC ? "SC" : "BC";
			}
		} else if (this.st === 1 && this.cLvl != null) {
			const pen = this.d * (this.cLvl - xC);
			if (pen > 0) {
				if (pen <= atr) {
					this.cLvl = xC;
					this.cBar = i;
					this.cVol = Math.max(this.cVol, vol);
					this.cZv = Math.max(this.cZv, volZ);
					this.ext = bar.c;
					this.extBar = i;
				} else this.st = 0;
			} else {
				if (this.d * (xB - this.ext) > 0) {
					this.ext = xB;
					this.extBar = i;
				}
				const h = Math.abs(this.ext - this.cLvl);
				if (this.extBar > this.cBar && this.d * (this.ext - bar.c) >= this.p.arPull * atr && h >= this.p.minHAtr * atr) {
					if (h <= this.p.maxHAtr * atr) {
						this.bLvl = this.ext;
						this.arBar = this.extBar;
						this.st = 2;
						this.schId += 1;
						if (this.d === 1) this.nAcc += 1;
						else this.nDist += 1;
						this.cleanup();
						const top = Math.max(this.cLvl, this.bLvl);
						const bot = Math.min(this.cLvl, this.bLvl);
						this.boxes.push({
							schId: this.schId,
							dir: this.d,
							left: this.cBar,
							right: i,
							top,
							bot,
							text: `${this.d === 1 ? "Tích lũy" : "Phân phối"} · Pha A`,
							failed: false,
							active: true
						});
						this.mark(this.cBar, this.cLvl, this.d === 1 ? "SC" : "BC", this.d === 1, this.d === 1 ? "Đáy climax — cung được hấp thụ" : "Đỉnh climax — cầu được hấp thụ");
						this.mark(this.arBar, this.bLvl, "AR", this.d === -1, this.d === 1 ? "Automatic Rally" : "Automatic Reaction");
						this.phase(this.cBar, "A", top, bot);
						this.lastEv = "AR";
						endTxt = "";
					} else this.st = 0;
				} else if (i - this.cBar > this.p.arMax) this.st = 0;
			}
		} else if (this.st === 2 && this.cLvl != null && this.bLvl != null) {
			if (d * (this.cLvl - bar.c) > this.p.springPen * atr) doBreak = true;
			else if (d * (bar.c - this.bLvl) > H) {
				endNow = true;
				endTxt = "Thoát biên";
			} else if (i - this.arBar >= 2 && d * (xC - this.cLvl) <= this.p.stZone * H && d * (bar.c - this.cLvl) > 0 && (!hasVol || vol <= this.p.stEffort * this.cVol)) {
				this.st = 3;
				this.bStart = i;
				this.mark(i, xC, "ST", d === 1, "Secondary Test — quay lại vùng climax, khối lượng thấp hơn");
				this.phase(i, "B", Math.max(this.cLvl, this.bLvl), Math.min(this.cLvl, this.bLvl));
				this.lastEv = "ST";
			}
		} else if (this.st === 3 && this.cLvl != null && this.bLvl != null) {
			const sosNow = d * (bar.c - this.bLvl) > .1 * atr && body >= this.p.sosBody * rng && d * (bar.c - bar.o) > 0 && (!hasVol || volZ >= this.p.sosZ);
			if (this.pend > 0) {
				this.pend += 1;
				if (d * (this.pendExt - xC) > 0) {
					this.pendExt = xC;
					this.pendBar = i;
					this.pendVol = Math.max(this.pendVol, vol);
				}
				if (d * (this.cLvl - this.pendExt) > this.p.springPen * atr) doBreak = true;
				else if (d * (bar.c - this.cLvl) > 0) {
					this.spLvl = this.pendExt;
					this.spBar = this.pendBar;
					this.spVol = this.pendVol;
					doSpring = true;
				} else if (this.pend > this.p.springBars) doBreak = true;
			} else if (d * (bar.c - this.bLvl) > H) {
				endNow = true;
				endTxt = "Thoát biên";
			} else if (i - this.bStart >= this.p.minB) {
				const pen = d * (this.cLvl - xC);
				if (sosNow) goSOS = true;
				else if (pen > .1 * atr) {
					if (pen > this.p.springPen * atr) doBreak = true;
					else if (d * (bar.c - this.cLvl) > 0) {
						this.spLvl = xC;
						this.spBar = i;
						this.spVol = vol;
						doSpring = true;
					} else {
						this.pend = 1;
						this.pendExt = xC;
						this.pendBar = i;
						this.pendVol = vol;
					}
				}
			} else if (d * (this.cLvl - bar.c) > this.p.springPen * atr) doBreak = true;
		} else if (this.st === 4 && this.cLvl != null && this.bLvl != null && this.spLvl != null) {
			const sosNow = d * (bar.c - this.bLvl) > .1 * atr && body >= this.p.sosBody * rng && d * (bar.c - bar.o) > 0 && (!hasVol || volZ >= this.p.sosZ);
			if (d * (this.spLvl - bar.c) > 0) {
				endNow = true;
				endFail = true;
				endTxt = `Gãy ${nmS}`;
			} else if (d * (bar.c - this.bLvl) > H) {
				endNow = true;
				endTxt = "Thoát biên";
			} else if (sosNow) goSOS = true;
			else if (!this.hadTest && i > this.spBar + 1 && d * (xC - this.cLvl) <= this.p.stZone * H && d * (xC - this.spLvl) >= 0 && (!hasVol || vol < this.spVol) && d * (bar.c - bar.o) >= 0) doTest = true;
		} else if (this.st === 5 && this.cLvl != null && this.bLvl != null) {
			const mid = (this.cLvl + this.bLvl) / 2;
			const inLps = i > this.sosBar && d * (xC - this.bLvl) <= this.p.lpsTol * atr && d * (xC - mid) > 0;
			const conf = d * (bar.c - this.bLvl) > 0 && (d === 1 ? bar.c - bar.l >= .5 * rng : bar.h - bar.c >= .5 * rng);
			if (inLps && conf) doLPS = true;
			else if (d * (this.bLvl - bar.c) > .5 * H) {
				this.st = 3;
				this.lastEv = "Về lại biên";
			} else if (d * (bar.c - this.bLvl) >= H) {
				endNow = true;
				endTxt = d === 1 ? "Markup, không LPS" : "Markdown, không LPSY";
			} else if (i - this.sosBar > this.p.lpsMax) {
				endNow = true;
				endTxt = d === 1 ? "Không có LPS" : "Không có LPSY";
			}
		} else if (this.st === 6 && this.cLvl != null && this.bLvl != null) {
			if (!this.eShown && d * (bar.c - this.bLvl) >= this.p.eMult * H) {
				this.eShown = true;
				this.phase(i, "E", Math.max(this.cLvl, this.bLvl), Math.min(this.cLvl, this.bLvl));
				this.lastEv = d === 1 ? "Markup" : "Markdown";
			}
			if (!(this.trade != null && !this.trade.closed && this.trade.link && this.trade.schId === this.schId) && !endNow) {
				if (this.eShown || d * (this.bLvl - bar.c) > .5 * H || i - this.lpsBar > this.p.lpsMax * 2) {
					endNow = true;
					endTxt = this.eShown ? d === 1 ? "Markup" : "Markdown" : "Xong pha";
				}
			}
		}
		if (doBreak && this.cLvl != null && this.bLvl != null) {
			if ((d === 1 ? isSC : isBC) && this.reCnt < this.p.maxRe && Math.abs(this.bLvl - xC) <= this.p.maxHAtr * atr) {
				this.reCnt += 1;
				this.nRe += 1;
				this.cLvl = xC;
				this.cVol = Math.max(this.cVol, vol);
				this.cZv = Math.max(this.cZv, volZ);
				this.arBar = i;
				this.st = 2;
				this.pend = 0;
				this.hadSpring = false;
				this.hadTest = false;
				const top = Math.max(this.cLvl, this.bLvl);
				const bot = Math.min(this.cLvl, this.bLvl);
				const box = this.activeBox();
				if (box) {
					box.top = top;
					box.bot = bot;
				}
				this.mark(i, xC, d === 1 ? "SC" : "BC", d === 1, "Kéo biên sang climax mới");
				this.lastEv = "Kéo biên";
			} else {
				endNow = true;
				endFail = true;
				endTxt = "Vỡ biên";
			}
		}
		if (doSpring && this.spLvl != null && this.cLvl != null && this.bLvl != null) {
			const depth = d * (this.cLvl - this.spLvl) / atr;
			const spd = i - this.spBar;
			const cl = rng > 0 ? d === 1 ? (bar.c - bar.l) / rng : (bar.h - bar.c) / rng : .5;
			let q = 0;
			q += depth <= .5 ? 25 : depth <= 1 ? 15 : 5;
			q += !hasVol ? 12 : this.spVol < this.cVol * .7 ? 25 : this.spVol < this.cVol ? 15 : 5;
			q += spd === 0 ? 25 : spd === 1 ? 15 : 5;
			q += cl >= .6 ? 25 : cl >= .4 ? 15 : 5;
			this.spQ = q;
			this.hadSpring = true;
			this.st = 4;
			this.pend = 0;
			this.nSp += 1;
			this.mark(this.spBar, this.spLvl, nmS, d === 1, `${nmS} · chất lượng ${q}/100`);
			this.phase(this.spBar, "C", Math.max(this.cLvl, this.bLvl), Math.min(this.cLvl, this.bLvl));
			this.lastEv = nmS;
		}
		if (doTest && this.cLvl != null && this.bLvl != null) {
			this.hadTest = true;
			this.lastEv = "Test";
			const life = i - this.cBar;
			const score = this.score(this.cZv, this.hadSpring, this.spQ, true, 0, life, true);
			const g = gradeOf(score);
			const offer = this.offer(g, "test");
			this.mark(i, xC, offer ? `Test · ${g}` : "Test", d === 1, `Test ${nmS} · ${score}/100`);
			if (offer) {
				this.lastScore = score;
				const sl = (this.spLvl ?? this.cLvl) - d * this.p.slAtr * atr;
				const cause = this.cause(life);
				this.propose({
					schId: this.schId,
					type: "Spring Test",
					dir: d,
					bar: i,
					time: bar.t,
					entry: bar.c,
					sl,
					tp1: this.bLvl,
					tp2: this.bLvl + d * H,
					tp3: this.bLvl + d * H * cause,
					grade: g,
					score,
					risk: Math.abs(bar.c - sl)
				});
			}
		}
		if (goSOS && this.cLvl != null && this.bLvl != null) {
			if (this.hadSpring && (this.sosBar < 0 || this.sosBar < this.spBar)) this.nSpSos += 1;
			this.st = 5;
			this.sosBar = i;
			this.sosVol = vol;
			this.sosZv = volZ;
			const code = d === 1 ? "SOS" : "SOW";
			this.mark(i, xB, code, d === -1, d === 1 ? "Sign of Strength" : "Sign of Weakness");
			this.phase(i, "D", Math.max(this.cLvl, this.bLvl), Math.min(this.cLvl, this.bLvl));
			this.lastEv = code;
		}
		if (doLPS && this.cLvl != null && this.bLvl != null) {
			const life = i - this.cBar;
			const lowEff = !hasVol || vol < this.sosVol;
			const score = this.score(this.cZv, this.hadSpring, this.spQ, this.hadTest, this.sosZv, life, lowEff);
			const g = gradeOf(score);
			const offer = this.offer(g, "lps");
			const nmL = d === 1 ? "LPS" : "LPSY";
			this.st = 6;
			this.lpsBar = i;
			this.lastEv = nmL;
			this.lastScore = score;
			this.mark(i, xC, `${nmL} · ${g}`, d === 1, `${d === 1 ? "Last Point of Support" : "Last Point of Supply"} · ${score}/100`);
			if (offer) {
				const mid = (this.cLvl + this.bLvl) / 2;
				const sl = (this.p.slMode === "Range mid" ? mid : this.p.slMode === "LPS low / high" ? xC : this.hadSpring && this.spLvl != null ? this.spLvl : mid) - d * this.p.slAtr * atr;
				const cause = this.cause(life);
				this.propose({
					schId: this.schId,
					type: nmL,
					dir: d,
					bar: i,
					time: bar.t,
					entry: bar.c,
					sl,
					tp1: this.bLvl + d * .5 * H,
					tp2: this.bLvl + d * H,
					tp3: this.bLvl + d * H * cause,
					grade: g,
					score,
					risk: Math.abs(bar.c - sl)
				});
			}
		}
		if (!endNow && this.st >= 1 && this.st <= 5 && this.cBar >= 0 && i - this.cBar > this.p.maxLife) {
			endNow = true;
			endTxt = "Hết hạn biên";
		}
		const box = this.activeBox();
		if (this.st >= 2 && box) {
			box.right = i;
			if (!endNow) box.text = `${this.d === 1 ? "Tích lũy" : "Phân phối"} · Pha ${phaseName(this.st)}`;
		}
		if (endNow) {
			if (this.st >= 2 && box) {
				box.text = `${this.d === 1 ? "Tích lũy" : "Phân phối"} · ${endTxt}`;
				box.active = false;
				if (endFail) {
					this.nFail += 1;
					box.failed = true;
					this.mark(i, bar.c, "✕", this.d === 1, endTxt, "fail");
				}
			}
			if (endTxt) this.lastEv = endTxt;
			this.st = 0;
			this.pend = 0;
		}
	}
	offer(g, kind) {
		if (!this.armTrades || this.trade) return false;
		if (kind === "test" && this.p.entryMode === "LPS only") return false;
		if (kind === "lps" && this.p.entryMode === "Spring Test only") return false;
		return (this.p.tradeSide === "Both" || this.p.tradeSide === "Long only" && this.d === 1 || this.p.tradeSide === "Short only" && this.d === -1) && gradeIdx(g) <= gradeIdx(this.p.minGrade);
	}
	propose(p) {
		if (this.p.entryMode === "LPS only" && p.type === "Spring Test") return;
		if (this.p.entryMode === "Spring Test only" && p.type !== "Spring Test") return;
		if (this.p.commitEntries) this.openTrade(p, true, "bot");
		else this.pending = p;
	}
	openTrade(p, link, source) {
		const dir = p.dir;
		let risk = Math.max(p.risk, this.mintick(p.entry));
		let tp1 = p.tp1;
		let tp2 = p.tp2;
		let tp3 = p.tp3;
		if (dir * (tp1 - p.entry) < risk) tp1 = p.entry + dir * risk;
		if (dir * (tp2 - tp1) < .5 * risk) tp2 = tp1 + dir * risk;
		if (dir * (tp3 - tp2) < .5 * risk) tp3 = tp2 + dir * risk;
		const t = {
			id: this.seq++,
			schId: p.schId,
			link,
			type: p.type,
			dir,
			source,
			bar: p.bar,
			exitBar: null,
			entry: p.entry,
			sl: p.sl,
			curSl: p.sl,
			tp1,
			tp2,
			tp3,
			risk,
			hits: 0,
			real: 0,
			remain: 1,
			grade: p.grade,
			score: p.score,
			closed: false,
			exitText: ""
		};
		this.trade = t;
		this.trades.push(t);
		this.opened = {
			type: t.type,
			dir: t.dir,
			grade: t.grade,
			source: t.source
		};
		this.born.push(`${t.dir === 1 ? "LONG" : "SHORT"} ${t.type} · ${t.grade}`);
		return t;
	}
	manage(i, bar) {
		const t = this.trade;
		if (!t || t.closed) return;
		const hitSl = t.dir === 1 ? bar.l <= t.curSl : bar.h >= t.curSl;
		let done = false;
		let reason = "";
		const tps = [
			t.tp1,
			t.tp2,
			t.tp3
		];
		if (hitSl) {
			t.real += t.remain * t.dir * (t.curSl - t.entry) / t.risk;
			t.remain = 0;
			done = true;
			reason = t.curSl === t.sl ? "Cắt lỗ" : t.hits === 1 ? "Hòa vốn" : "Khóa TP1";
		} else if (this.p.scaleOut) {
			while (t.hits < 3 && (t.dir === 1 ? bar.h >= tps[t.hits] : bar.l <= tps[t.hits])) {
				const rk = Math.abs(tps[t.hits] - t.entry) / t.risk;
				t.real += rk / 3;
				t.remain = Math.max(0, t.remain - 1 / 3);
				t.hits += 1;
				if (t.hits === 1) {
					t.curSl = t.entry;
					this.notes.push("TP1");
				} else if (t.hits === 2) {
					t.curSl = t.tp1;
					this.notes.push("TP2");
				} else this.notes.push("TP3");
			}
			if (t.hits >= 3) {
				t.remain = 0;
				done = true;
				reason = "TP3";
			}
		} else {
			if (t.dir === 1 ? bar.h >= t.tp1 : bar.l <= t.tp1) {
				if (t.hits === 0) this.notes.push("TP1");
				t.hits = Math.max(t.hits, 1);
			}
			if (t.dir === 1 ? bar.h >= t.tp2 : bar.l <= t.tp2) {
				t.real += Math.abs(t.tp2 - t.entry) / t.risk;
				t.remain = 0;
				t.hits = 2;
				this.notes.push("TP2");
				done = true;
				reason = "TP2";
			}
		}
		if (!done && i - t.bar >= this.p.tradeMax) {
			t.real += t.remain * t.dir * (bar.c - t.entry) / t.risk;
			t.remain = 0;
			done = true;
			reason = "Hết giờ";
		}
		if (!done) return;
		t.closed = true;
		t.exitBar = i;
		t.exitText = reason;
		this.exited = {
			text: reason,
			r: t.real,
			dir: t.dir
		};
		this.mark(i, t.dir === 1 ? bar.h : bar.l, `${reason} ${t.real >= 0 ? "+" : ""}${t.real.toFixed(1)}R`, t.dir === -1, `Đóng lệnh ${reason}`, t.real > 0 ? "acc" : t.real < 0 ? "dist" : "flat");
		this.born.push(`${reason} ${t.real >= 0 ? "+" : ""}${t.real.toFixed(2)}R`);
		if (this.st === 6 && t.link && t.schId === this.schId) this.barEnd = `Đóng lệnh (${reason})`;
		this.trade = null;
	}
	score(cz, sp, q, ts, sz, life, lowEff) {
		let s = 0;
		s += cz >= this.p.climaxZ + 1 ? 15 : 8;
		s += sp ? Math.round(20 * q / 100) : 0;
		s += ts ? 15 : 0;
		s += sz >= 1 ? 15 : sz >= this.p.sosZ ? 8 : 0;
		s += life >= this.p.causeRef ? 15 : life >= this.p.causeRef / 2 ? 8 : 0;
		s += lowEff ? 10 : 0;
		s += this.htfBias === this.d ? 10 : this.htfBias === 0 ? 5 : 0;
		return s;
	}
	cause(life) {
		return Math.min(Math.max(life / this.p.causeRef, 1), this.p.causeMax);
	}
	mintick(px) {
		const a = Math.abs(px);
		if (a >= 1e3) return .1;
		if (a >= 1) return .01;
		return 1e-4;
	}
	cleanup() {
		const cut = this.schId - this.p.keepN;
		this.labels = this.labels.filter((x) => x.schId > cut);
		this.phases = this.phases.filter((x) => x.schId > cut);
		this.boxes = this.boxes.filter((x) => x.schId > cut);
		this.trades = this.trades.filter((x) => x.schId > cut || !x.closed);
	}
	activeBox() {
		for (let i = this.boxes.length - 1; i >= 0; i--) if (this.boxes[i].active && this.boxes[i].schId === this.schId) return this.boxes[i];
		return null;
	}
	mark(bar, price, text, below, tip, tone) {
		const toneFinal = tone ?? (this.d === 1 ? "acc" : "dist");
		this.labels.push({
			schId: this.schId,
			bar,
			price,
			text,
			below,
			tone: toneFinal,
			tip
		});
		this.born.push(text);
	}
	phase(bar, text, top, bot) {
		this.phases.push({
			schId: this.schId,
			bar,
			top,
			bot,
			text
		});
	}
	snapshot() {
		const i = this.bars.length - 1;
		const atr = this.atrNow || 1;
		const H = this.bLvl != null && this.cLvl != null ? Math.abs(this.bLvl - this.cLvl) : 0;
		const life = this.st >= 1 && this.cBar >= 0 ? i - this.cBar : 0;
		const d = this.st === 0 ? 0 : this.d;
		const names = this.d === 1 ? [
			"Selling Climax",
			"Automatic Rally",
			"Secondary Test",
			"Spring",
			"Test",
			"Sign of Strength",
			"Last Point of Support",
			"Markup"
		] : [
			"Buying Climax",
			"Automatic Reaction",
			"Secondary Test",
			"UTAD",
			"Test",
			"Sign of Weakness",
			"Last Point of Supply",
			"Markdown"
		];
		const codes = this.d === 1 ? [
			"SC",
			"AR",
			"ST",
			"Spring",
			"Test",
			"SOS",
			"LPS",
			"E"
		] : [
			"BC",
			"AR",
			"ST",
			"UTAD",
			"Test",
			"SOW",
			"LPSY",
			"E"
		];
		const done = [
			this.st >= 1,
			this.st >= 2,
			this.st >= 3,
			this.hadSpring && this.st >= 4,
			this.hadTest && this.st >= 4,
			this.st >= 5,
			this.st >= 6,
			this.eShown && this.st === 6
		];
		const cur = this.st === 0 ? -1 : this.st === 1 ? 1 : this.st === 2 ? 2 : this.st === 3 ? 3 : this.st === 4 ? this.hadTest ? 5 : 4 : this.st === 5 ? 6 : 7;
		const steps = codes.map((code, idx) => ({
			code,
			name: names[idx],
			state: this.st !== 0 && idx === cur ? "now" : this.st !== 0 && done[idx] ? "done" : "wait"
		}));
		const conf = this.confidence(i);
		const volZ = this.volZNow;
		const effort = volZ >= 1.5 && this.bars.length && this.bars[i].h - this.bars[i].l <= this.rngMa ? "Nỗ lực lớn, kết quả nhỏ" : volZ >= 1.5 ? "Nỗ lực lớn, kết quả lớn" : volZ <= -.5 && this.bars.length && this.bars[i].h - this.bars[i].l >= 1.3 * this.rngMa ? "Nỗ lực nhỏ, kết quả lớn" : "Bình thường";
		return {
			st: this.st,
			dir: d,
			phase: phaseName(this.st),
			lastEvent: this.lastEv,
			confidence: conf,
			waiting: this.waiting(i),
			story: this.story(),
			htf: this.htfBias,
			invalidation: this.invalidation(),
			range: this.st >= 2 && this.cLvl != null && this.bLvl != null ? {
				low: Math.min(this.cLvl, this.bLvl),
				high: Math.max(this.cLvl, this.bLvl),
				height: H,
				atr: H / atr,
				life,
				cause: this.bLvl + this.d * H * this.cause(life)
			} : null,
			springQ: this.hadSpring && this.st >= 4 ? this.spQ : null,
			effort,
			steps,
			trade: this.trade,
			boxes: this.boxes.map((b) => ({ ...b })),
			labels: this.labels.slice(),
			phases: this.phases.slice(),
			trades: this.trades.map((t) => ({ ...t })),
			stats: {
				ranges: this.nAcc + this.nDist,
				failed: this.nFail,
				extended: this.nRe,
				springs: this.nSp,
				springToSos: this.nSpSos
			}
		};
	}
	confidence(i) {
		const st = this.st;
		const built = st === 3 ? Math.min((i - this.bStart) / Math.max(this.p.minB, 1), 1) : 0;
		const c = st === 1 ? 10 : st === 2 ? 20 : st === 3 ? 30 + 10 * built : st === 4 ? 50 + .15 * this.spQ : st === 5 ? 70 + (this.hadSpring ? 7 : 0) + (this.hadTest ? 5 : 0) : st === 6 ? 80 + .17 * this.lastScore : 0;
		return Math.min(c, 97);
	}
	waiting(i) {
		const nS = this.d === 1 ? "Spring" : "UTAD";
		const nO = this.d === 1 ? "SOS" : "SOW";
		const nL = this.d === 1 ? "LPS" : "LPSY";
		if (this.st === 0) return `Nến climax (volume z ≥ ${this.p.climaxZ.toFixed(1)})`;
		if (this.st === 1) return `Hồi ≥ ${this.p.arPull.toFixed(1)} ATR để xác nhận AR`;
		if (this.st === 2) return "Test lại vùng climax, khối lượng thấp hơn (ST)";
		if (this.st === 3) {
			if (i - this.bStart < this.p.minB) return `Pha B đang xây ${i - this.bStart}/${this.p.minB} nến`;
			return `${nS} hoặc ${nO} đóng cửa vượt biên`;
		}
		if (this.st === 4) return `Test khối lượng thấp hoặc ${nO}`;
		if (this.st === 5) return `${nL} hồi về biên phá (${Math.max(this.p.lpsMax - (i - this.sosBar), 0)} nến)`;
		return this.trade ? "Theo dõi mục tiêu" : this.d === 1 ? "Markup" : "Markdown";
	}
	story() {
		if (this.st === 0) return "Đang quét climax";
		const drying = this.vol10.ready() && this.volW.ready() && this.vol10.sma() < this.volW.sma() * .85;
		if (this.d === 1) {
			if (this.st <= 2) return "Climax bán đã bị hấp thụ";
			if (this.st === 3) return drying ? "Cung đang cạn" : "Cung còn hoạt động";
			if (this.st === 4) return "Tay yếu đã bị rũ";
			if (this.st === 5) return "Cầu đang vào";
			return "Cầu kiểm soát";
		}
		if (this.st <= 2) return "Climax mua đã bị hấp thụ";
		if (this.st === 3) return drying ? "Cầu đang cạn" : "Cầu còn hoạt động";
		if (this.st === 4) return "Người mua muộn bị kẹt";
		if (this.st === 5) return "Cung đang vào";
		return "Cung kiểm soát";
	}
	invalidation() {
		if (this.st === 1 && this.cLvl != null) return this.cLvl - this.d * this.atrNow;
		if ((this.st === 2 || this.st === 3) && this.cLvl != null) return this.cLvl - this.d * this.p.springPen * this.atrNow;
		if (this.st === 4 && this.spLvl != null) return this.spLvl;
		if (this.st === 5 && this.cLvl != null && this.bLvl != null) return (this.cLvl + this.bLvl) / 2;
		if (this.st === 6) return this.trade ? this.trade.curSl : this.cLvl != null && this.bLvl != null ? (this.cLvl + this.bLvl) / 2 : null;
		return null;
	}
};
var START = 1e4;
var BUST = .7;
var STORE = "wyck-best-v1";
var SPEEDS = [
	1,
	2,
	4,
	8,
	16
];
var STEP_SEC = {
	1: .52,
	2: .28,
	4: .14,
	8: .07,
	16: .04
};
var audioCtx = null;
function tone(freq, dur = .07) {
	try {
		const Ctx = window.AudioContext || window.webkitAudioContext;
		audioCtx ??= new Ctx();
		if (audioCtx.state === "suspended") audioCtx.resume();
		const o = audioCtx.createOscillator();
		const g = audioCtx.createGain();
		o.type = "triangle";
		o.frequency.value = freq;
		g.gain.value = .028;
		o.connect(g);
		g.connect(audioCtx.destination);
		o.start();
		o.stop(audioCtx.currentTime + dur);
	} catch {}
}
function readBest() {
	try {
		const raw = localStorage.getItem(STORE);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		return typeof parsed?.r === "number" ? parsed : null;
	} catch {
		return null;
	}
}
function writeBest(next, prev) {
	if (!prev || next.r > prev.r) {
		localStorage.setItem(STORE, JSON.stringify(next));
		return next;
	}
	return prev;
}
function equityOf(sim) {
	return sim.start + sim.realized + sim.engine.markR() * sim.riskUsd;
}
function pushLog(sim, text, toneName) {
	sim.log = [{
		id: sim.logSeq++,
		text,
		tone: toneName
	}, ...sim.log].slice(0, 28);
}
function toneOf(text) {
	if (/LONG|Spring|SOS|LPS|SC|AR|ST|TP/.test(text) && !/SHORT|SOW|LPSY|BC|UTAD|✕|Cắt/.test(text)) return "acc";
	if (/SHORT|UTAD|SOW|LPSY|BC|✕|Cắt|Gãy|Vỡ/.test(text)) return "dist";
	return "flat";
}
function apply(sim, info) {
	if (info.exit) {
		sim.realized += info.exit.r * sim.riskUsd;
		sim.rSum += info.exit.r;
		sim.riskUsd = 0;
		if (info.exit.r > 0) sim.wins += 1;
		else if (info.exit.r < 0) sim.losses += 1;
		pushLog(sim, `${info.exit.text} ${fmtR(info.exit.r)}`, info.exit.r >= 0 ? "acc" : "dist");
		tone(info.exit.r >= 0 ? 880 : 196, .1);
	}
	for (const note of info.notes) pushLog(sim, note, "gold");
	for (const line of info.born) if (/^(SC|BC|AR|ST|Spring|UTAD|Test|SOS|SOW|LPS|LPSY|✕)/.test(line)) pushLog(sim, line, toneOf(line));
	if (info.opened) {
		sim.riskUsd = (sim.start + sim.realized) * sim.riskPct;
		pushLog(sim, `${info.opened.dir === 1 ? "LONG" : "SHORT"} ${info.opened.type} · ${info.opened.grade}`, info.opened.dir === 1 ? "acc" : "dist");
		tone(640, .08);
	}
	if (info.proposal) {
		sim.proposal = info.proposal;
		sim.paused = true;
		tone(520, .06);
	}
	const eq = equityOf(sim);
	if (eq > sim.peak) sim.peak = eq;
	const dd = sim.peak > 0 ? (sim.peak - eq) / sim.peak : 0;
	if (dd > sim.maxDd) sim.maxDd = dd;
	sim.curve.push(eq);
	if (eq <= sim.start * BUST) {
		sim.result = "bust";
		sim.paused = true;
		tone(140, .2);
	}
}
function isSetupEvent(info) {
	return Boolean(info.proposal || info.opened || info.exit || info.born.some((b) => /^(Spring|UTAD|SOS|SOW|LPS|LPSY|Test)/.test(b)));
}
function DeskApp() {
	const simRef = (0, import_react.useRef)(null);
	const speedRef = (0, import_react.useRef)(4);
	const api = (0, import_react.useRef)({
		toggle: () => {},
		skip: () => {},
		fast: () => {}
	});
	const [phase, setPhase] = (0, import_react.useState)("brief");
	const [tick, setTick] = (0, import_react.useState)(0);
	const [speed, setSpeed] = (0, import_react.useState)(4);
	const [error, setError] = (0, import_react.useState)("");
	const [best, setBest] = (0, import_react.useState)(null);
	const [tab, setTab] = (0, import_react.useState)("phase");
	const [setup, setSetup] = (0, import_react.useState)({
		symbol: "BTCUSDT",
		interval: "1h",
		mode: "bot",
		side: "Both",
		entry: "LPS + Spring Test",
		grade: "B",
		risk: .01,
		random: true
	});
	(0, import_react.useEffect)(() => {
		setBest(readBest());
	}, []);
	(0, import_react.useEffect)(() => {
		speedRef.current = speed;
	}, [speed]);
	(0, import_react.useEffect)(() => {
		if (phase !== "play") return;
		let raf = 0;
		let acc = 0;
		let last = performance.now();
		let dead = false;
		const loop = (now) => {
			if (dead) return;
			const dt = Math.min(.05, (now - last) / 1e3);
			last = now;
			const sim = simRef.current;
			if (sim && !sim.paused && !sim.proposal && !sim.result) {
				acc += dt;
				const step = STEP_SEC[speedRef.current];
				let n = 0;
				while (acc >= step && n < 10) {
					acc -= step;
					const stepped = stepOne();
					n += 1;
					if (stepped.kind !== "next") break;
				}
				if (n) setTick((t) => t + 1);
			}
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => {
			dead = true;
			cancelAnimationFrame(raf);
		};
	}, [phase]);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			const tag = e.target?.tagName;
			if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
			if (e.code === "Space") {
				e.preventDefault();
				api.current.toggle();
			} else if (e.key === "n" || e.key === "N") api.current.skip();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	(0, import_react.useEffect)(() => {
		const sim = simRef.current;
		if (!sim?.result || sim.saved) return;
		sim.saved = true;
		const eq = equityOf(sim);
		const next = writeBest({
			r: sim.rSum,
			equity: eq,
			symbol: sim.symbol,
			interval: sim.interval,
			mode: sim.mode,
			at: Date.now()
		}, best);
		setBest(next);
	}, [tick, best]);
	function stepOne() {
		const sim = simRef.current;
		if (!sim || sim.paused || sim.proposal || sim.result) return {
			kind: "end",
			signal: false
		};
		if (sim.head >= sim.candles.length - 1) {
			sim.result = "done";
			sim.paused = true;
			tone(740, .12);
			return {
				kind: "end",
				signal: false
			};
		}
		const info = sim.engine.push(sim.candles[sim.head + 1]);
		sim.head += 1;
		sim.snap = info.snap;
		apply(sim, info);
		const signal = isSetupEvent(info);
		if (sim.result || sim.head >= sim.candles.length - 1) {
			if (!sim.result && sim.head >= sim.candles.length - 1) {
				sim.result = "done";
				sim.paused = true;
				tone(740, .12);
			}
			return {
				kind: "end",
				signal
			};
		}
		if (sim.proposal || sim.paused) return {
			kind: "hold",
			signal: true
		};
		return {
			kind: "next",
			signal
		};
	}
	api.current.toggle = () => {
		const sim = simRef.current;
		if (!sim || sim.result || sim.proposal) return;
		sim.paused = !sim.paused;
		setTick((t) => t + 1);
	};
	api.current.skip = () => {
		const sim = simRef.current;
		if (!sim || sim.result || sim.proposal) return;
		sim.paused = false;
		let guard = 0;
		let stepped = stepOne();
		while (guard++ < 600 && stepped.kind === "next" && !stepped.signal) stepped = stepOne();
		if (!sim.result && !sim.proposal) sim.paused = true;
		setTick((t) => t + 1);
	};
	api.current.fast = () => {
		const sim = simRef.current;
		if (!sim || sim.result) return;
		sim.paused = false;
		let guard = 0;
		while (guard++ < 8e3) {
			if (sim.proposal) {
				sim.proposal = null;
				sim.paused = false;
				pushLog(sim, "Bỏ qua tín hiệu", "flat");
			}
			if (stepOne().kind === "end" || sim.result) break;
		}
		setTick((t) => t + 1);
	};
	async function begin(next) {
		setError("");
		setPhase("load");
		tone(180, .01);
		const res = await loadMarket({ data: {
			symbol: next.symbol,
			interval: next.interval
		} });
		if (!res.ok) {
			setError(res.error);
			setPhase("brief");
			return;
		}
		let { warmup, play } = campaignSpan(next.interval);
		const all = res.candles;
		if (all.length < warmup + 80) warmup = Math.max(30, Math.min(warmup, Math.floor(all.length * .25)));
		play = Math.min(play, all.length - warmup);
		if (play < 60) {
			setError("Chuỗi nến quá ngắn để mở một vòng.");
			setPhase("brief");
			return;
		}
		const span = warmup + play;
		const slack = all.length - span;
		const beginAt = next.random && slack > 0 ? Math.floor(Math.random() * (slack + 1)) : Math.max(0, slack);
		const candles = all.slice(beginAt, beginAt + span);
		const minutes = intervalMeta(next.interval).minutes;
		const params = {
			htfMinutes: htfMinutes(minutes),
			tradeSide: next.side,
			entryMode: next.entry,
			minGrade: next.grade,
			commitEntries: next.mode === "bot"
		};
		const ghost = new WyckoffEngine(params);
		ghost.armTrades = false;
		for (let i = 0; i < warmup; i++) ghost.push(candles[i]);
		ghost.armTrades = true;
		ghost.p.commitEntries = true;
		for (let i = warmup; i < candles.length; i++) ghost.push(candles[i]);
		const gTrade = ghost.snapshot().trade;
		const ghostR = ghost.closedR(warmup) + (gTrade && gTrade.bar >= warmup ? ghost.markR() : 0);
		const engine = new WyckoffEngine({
			...params,
			commitEntries: next.mode === "bot"
		});
		engine.armTrades = false;
		let snap = null;
		for (let i = 0; i < warmup; i++) snap = engine.push(candles[i]).snap;
		engine.armTrades = true;
		const sim = {
			candles,
			head: warmup - 1,
			engine,
			snap: snap ?? engine.snapshot(),
			paused: false,
			proposal: null,
			start: START,
			realized: 0,
			riskUsd: 0,
			riskPct: next.risk,
			peak: START,
			maxDd: 0,
			curve: [START],
			rSum: 0,
			wins: 0,
			losses: 0,
			log: [],
			logSeq: 1,
			result: null,
			ghostR,
			mode: next.mode,
			interval: next.interval,
			symbol: next.symbol,
			source: res.source,
			asOf: candles[candles.length - 1].t,
			saved: false
		};
		pushLog(sim, `Mở băng ${next.symbol} · ${intervalMeta(next.interval).label}`, "gold");
		simRef.current = sim;
		setTab("phase");
		setPhase("play");
		setTick((t) => t + 1);
	}
	function actOnProposal(kind) {
		const sim = simRef.current;
		if (!sim?.proposal) return;
		if (kind === "skip") {
			sim.proposal = null;
			sim.paused = false;
			pushLog(sim, "Bỏ qua tín hiệu", "flat");
		} else {
			const trade = sim.engine.take(kind === "fade" ? "fade" : "you");
			sim.proposal = null;
			sim.snap = sim.engine.snapshot();
			if (trade) {
				sim.riskUsd = (sim.start + sim.realized) * sim.riskPct;
				pushLog(sim, `${trade.dir === 1 ? "LONG" : "SHORT"} ${trade.type} · ${trade.grade}`, trade.dir === 1 ? "acc" : "dist");
				tone(kind === "fade" ? 300 : 640, .08);
			}
			sim.paused = false;
		}
		setTick((t) => t + 1);
	}
	function manual(dir) {
		const sim = simRef.current;
		if (!sim || sim.snap.trade || sim.proposal || sim.result) return;
		if (!sim.engine.manual(dir)) return;
		sim.snap = sim.engine.snapshot();
		sim.riskUsd = (sim.start + sim.realized) * sim.riskPct;
		pushLog(sim, `${dir === 1 ? "LONG" : "SHORT"} tay`, dir === 1 ? "acc" : "dist");
		tone(500, .06);
		setTick((t) => t + 1);
	}
	const sim = simRef.current;
	if (phase !== "play" || !sim) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brief, {
		setup,
		setSetup,
		best,
		error,
		loading: phase === "load",
		onStart: () => void begin(setup)
	});
	const eq = equityOf(sim);
	const pnl = eq - sim.start;
	const snap = sim.snap;
	const chip = snap.st === 0 ? "Đang quét climax" : `${snap.dir === 1 ? "Tích lũy" : "Phân phối"} · Pha ${snap.phase}`;
	const toneName = snap.st === 0 ? "idle" : snap.dir === 1 ? "acc" : "dist";
	const bar = sim.candles[sim.head];
	const trades = sim.wins + sim.losses;
	const openR = sim.engine.markR();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "desk",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "topbar",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "brand",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "brand-mark",
							children: "WYCK"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "brand-sub",
							children: [
								sim.symbol,
								" · ",
								intervalMeta(sim.interval).label
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "top-meta",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: sim.source === "live" ? "pill pill-live" : "pill",
							children: sim.source === "live" ? "Trực tiếp" : "Kho nến"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "muted",
							children: [bar ? fmtWhen(bar.t, sim.interval !== "1d") : "", sim.source === "vision" ? ` · đến ${fmtWhen(sim.asOf, sim.interval !== "1d")}` : ""]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `pnl ${pnl >= 0 ? "text-acc" : "text-dist"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: fmtUsd(eq) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: pnl >= 0 ? `+${fmtUsd(pnl)}` : fmtUsd(pnl) })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "chart-pane",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CandleChart, {
					candles: sim.candles,
					head: sim.head,
					boxes: snap.boxes,
					labels: snap.labels,
					phases: snap.phases,
					trades: snap.trades,
					invalidation: snap.invalidation,
					interval: sim.interval,
					chip,
					tone: toneName
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "side",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "tabs",
						children: [
							["phase", "Pha"],
							["log", "Nhật ký"],
							["setup", "Bàn"]
						].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: tab === id ? "tab on" : "tab",
							onClick: () => setTab(id),
							children: label
						}, id))
					}),
					tab === "phase" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhasePanel, {
						snap,
						eq,
						openR
					}),
					tab === "log" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogPanel, { log: sim.log }),
					tab === "setup" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pad stack",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "muted",
								children: sim.mode === "bot" ? "Bot tự vào mọi lệnh đạt chuẩn." : "Băng dừng ở mỗi tín hiệu. Bạn chọn vào, đánh ngược, hoặc bỏ."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								"Grade tối thiểu ",
								setup.grade,
								" · ",
								setup.side === "Both" ? "hai chiều" : setup.side === "Long only" ? "chỉ long" : "chỉ short",
								" · rủi ro",
								" ",
								(sim.riskPct * 100).toFixed(1),
								"%"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "muted",
								children: "Luật Wyckoff giữ nguyên tham số Eye: climax z 2, ATR 1.3, Spring tối đa 1 ATR, SOS z 0.3."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spark, {
								points: sim.curve,
								up: eq >= sim.start
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "dock",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "dock-stats",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							k: "R",
							v: fmtR(sim.rSum + (sim.riskUsd > 0 ? openR : 0))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							k: "Win",
							v: trades ? `${Math.round(100 * sim.wins / trades)}%` : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							k: "Lệnh",
							v: String(trades)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							k: "DD",
							v: `${(sim.maxDd * 100).toFixed(1)}%`
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "dock-controls",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn btn-gold",
							onClick: () => api.current.toggle(),
							disabled: Boolean(sim.result || sim.proposal),
							children: [sim.paused ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { size: 18 }), sim.paused ? "Chạy" : "Dừng"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn btn-ghost",
							onClick: () => api.current.skip(),
							disabled: Boolean(sim.result || sim.proposal),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipForward, { size: 18 }), "Tín hiệu"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn btn-ghost",
							onClick: () => api.current.fast(),
							disabled: Boolean(sim.result),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { size: 16 }), "Tua hết"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "speeds",
							children: SPEEDS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: speed === s ? "seg on" : "seg",
								onClick: () => setSpeed(s),
								children: [s, "×"]
							}, s))
						}),
						sim.mode === "you" && !sim.proposal && !snap.trade && !sim.result && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "manual",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-acc",
								onClick: () => manual(1),
								children: "Mua"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-dist",
								onClick: () => manual(-1),
								children: "Bán"
							})]
						})
					]
				})]
			}),
			sim.proposal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sheet-back",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sheet",
					role: "dialog",
					"aria-label": "Tín hiệu vào lệnh",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "eyebrow",
							children: sim.proposal.dir === 1 ? "Tích lũy · LONG" : "Phân phối · SHORT"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
							sim.proposal.type,
							" · ",
							sim.proposal.grade,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "muted",
								children: [" ", sim.proposal.score]
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "levels",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Vào" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: fmtPx(sim.proposal.entry) })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Cắt" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "text-dist",
									children: fmtPx(sim.proposal.sl)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "TP1" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: fmtPx(sim.proposal.tp1) })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "TP2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: fmtPx(sim.proposal.tp2) })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "TP3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: fmtPx(sim.proposal.tp3) })] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sheet-actions",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn btn-acc",
									onClick: () => actOnProposal("take"),
									children: "Vào lệnh"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn btn-dist",
									onClick: () => actOnProposal("fade"),
									children: "Đánh ngược"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn btn-ghost",
									onClick: () => actOnProposal("skip"),
									children: "Bỏ qua"
								})
							]
						})
					]
				})
			}),
			sim.result && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sheet-back",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sheet result",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "eyebrow",
							children: sim.result === "bust" ? "Cháy tài khoản" : "Hết băng"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: pnl >= 0 ? "text-acc" : "text-dist",
							children: fmtR(sim.rSum)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"Vốn ",
							fmtUsd(eq),
							" · ",
							trades,
							" lệnh · thắng ",
							trades ? Math.round(100 * sim.wins / trades) : 0,
							"% · DD tối đa ",
							(sim.maxDd * 100).toFixed(1),
							"%"
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "muted",
							children: [
								"Bot đầy đủ trên cùng băng: ",
								fmtR(sim.ghostR),
								". ",
								sim.mode === "you" ? "Bạn duyệt từng tín hiệu." : "Bạn để bot tự đánh."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spark, {
							points: sim.curve,
							up: eq >= sim.start
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sheet-actions",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "btn btn-gold",
								onClick: () => void begin(setup),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { size: 16 }), "Chơi lại"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-ghost",
								onClick: () => {
									simRef.current = null;
									setPhase("brief");
								},
								children: "Đổi cặp"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "fine",
							children: "Mô phỏng giấy trên nến Binance USDT-M. Không phải lời khuyên đầu tư."
						})
					]
				})
			})
		]
	});
}
function PhasePanel({ snap, eq, openR }) {
	const t = snap.trade;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pad stack",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "row-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "muted",
					children: "Độ tin cậy"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: snap.st === 0 ? "—" : `${Math.round(snap.confidence)}%` })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "conf",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					style: { width: `${snap.confidence}%` },
					className: snap.dir === -1 ? "bg-dist" : "bg-acc"
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: snap.story }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "muted",
				children: ["Chờ: ", snap.waiting]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "map",
				children: snap.steps.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: `map-${s.state}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: s.code }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: s.name })
					]
				}, s.code))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "kv",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sự kiện cuối" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: snap.lastEvent }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "HTF" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
						className: snap.htf === 1 ? "text-acc" : snap.htf === -1 ? "text-dist" : "",
						children: snap.htf === 1 ? "Tăng" : snap.htf === -1 ? "Giảm" : "Đứng"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Biên" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: snap.range ? `${fmtPx(snap.range.low)} – ${fmtPx(snap.range.high)}` : "—" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Mục tiêu cause" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: snap.range ? fmtPx(snap.range.cause) : "—" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Vỡ nếu" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
						className: "text-dist",
						children: snap.invalidation != null ? fmtPx(snap.invalidation) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Volume" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: snap.effort })
				]
			}),
			t && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `trade-card ${t.dir === 1 ? "edge-acc" : "edge-dist"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
					t.dir === 1 ? "LONG" : "SHORT",
					" ",
					t.type,
					" · ",
					t.grade
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "kv",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Vào" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: fmtPx(t.entry) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Cắt" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: fmtPx(t.curSl) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "TP1 / TP2 / TP3" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: [
							fmtPx(t.tp1),
							" · ",
							fmtPx(t.tp2),
							" · ",
							fmtPx(t.tp3)
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Đang mở" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
							className: openR >= 0 ? "text-acc" : "text-dist",
							children: fmtR(openR)
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "muted",
				children: [
					"Biên ",
					snap.stats.ranges,
					" · gãy ",
					snap.stats.failed,
					" · kéo ",
					snap.stats.extended,
					" · Spring→SOS",
					" ",
					snap.stats.springs ? `${Math.round(100 * snap.stats.springToSos / snap.stats.springs)}%` : "—",
					" · vốn ",
					fmtUsd(eq)
				]
			})
		]
	});
}
function LogPanel({ log }) {
	if (!log.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "pad muted",
		children: "Chưa có sự kiện."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
		className: "log",
		children: log.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
			className: `log-${line.tone}`,
			children: line.text
		}, line.id))
	});
}
function Stat({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stat",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: k }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: v })]
	});
}
function Spark({ points, up }) {
	if (points.length < 2) return null;
	const min = Math.min(...points);
	const max = Math.max(...points);
	const w = 320;
	const h = 56;
	const d = points.map((p, i) => {
		const x = i / (points.length - 1) * w;
		const y = 52 - (p - min) / (max - min || 1) * 48;
		return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
	}).join(" ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: `0 0 ${w} ${h}`,
		className: up ? "spark up" : "spark down",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d })
	});
}
function Brief({ setup, setSetup, best, error, loading, onStart }) {
	const patch = (partial) => setSetup({
		...setup,
		...partial
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "brief",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "eyebrow",
				children: "Binance USDT-M perpetual"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "WYCK" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "lede",
				children: "Bàn mô phỏng bot Wyckoff. Nến futures thật, chỉ báo vẽ SC, AR, ST, Spring, SOS, LPS và kế hoạch lệnh ngay trên giá."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Cặp" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: setup.symbol,
					onChange: (e) => patch({ symbol: e.target.value }),
					children: MARKETS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
						value: m.symbol,
						children: [
							m.symbol,
							" · ",
							m.name
						]
					}, m.symbol))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Khung" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "segs",
					children: INTERVALS$1.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: setup.interval === it.id ? "seg on" : "seg",
						onClick: () => patch({ interval: it.id }),
						children: it.label
					}, it.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Ai bấm lệnh" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "segs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: setup.mode === "bot" ? "seg on" : "seg",
						onClick: () => patch({ mode: "bot" }),
						children: "Bot tự đánh"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: setup.mode === "you" ? "seg on" : "seg",
						onClick: () => patch({ mode: "you" }),
						children: "Bạn duyệt"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "more",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { children: "Luật vào lệnh" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Chiều" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "segs",
							children: [
								["Both", "Cả hai"],
								["Long only", "Long"],
								["Short only", "Short"]
							].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: setup.side === id ? "seg on" : "seg",
								onClick: () => patch({ side: id }),
								children: label
							}, id))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Kiểu vào" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "segs",
							children: [
								["LPS + Spring Test", "Cả hai"],
								["LPS only", "LPS"],
								["Spring Test only", "Spring"]
							].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: setup.entry === id ? "seg on" : "seg",
								onClick: () => patch({ entry: id }),
								children: label
							}, id))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Grade tối thiểu" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "segs",
							children: [
								"A",
								"B",
								"C"
							].map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: setup.grade === g ? "seg on" : "seg",
								onClick: () => patch({ grade: g }),
								children: g
							}, g))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Rủi ro mỗi lệnh" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "segs",
							children: [
								.005,
								.01,
								.02
							].map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: setup.risk === r ? "seg on" : "seg",
								onClick: () => patch({ risk: r }),
								children: [(r * 100).toFixed(1), "%"]
							}, r))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "check",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: setup.random,
							onChange: (e) => patch({ random: e.target.checked })
						}), "Cửa sổ ngẫu nhiên trong lịch sử"]
					})
				]
			}),
			best && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "best",
				children: [
					"Kỷ lục ",
					fmtR(best.r),
					" · ",
					best.symbol,
					" ",
					best.interval
				]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "error",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn btn-gold btn-xl",
				onClick: onStart,
				disabled: loading,
				children: loading ? "Đang kéo nến…" : "Vào bàn"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "fine",
				children: "Vốn giấy $10,000. Nến Binance USDT-M. Không phải lời khuyên đầu tư."
			})
		]
	});
}
var SplitComponent = DeskApp;
//#endregion
export { SplitComponent as component };
