import type { Candle } from "@/lib/market/types";

export type EntryMode = "LPS + Spring Test" | "LPS only" | "Spring Test only";
export type TradeSide = "Both" | "Long only" | "Short only";
export type Grade = "A" | "B" | "C";
export type SlMode = "Range mid" | "LPS low / high" | "Spring / UTAD extreme";
export type Dir = 1 | -1;

export type WyckoffParams = {
  climaxLook: number;
  emaLen: number;
  climaxZ: number;
  climaxAtr: number;
  atrLen: number;
  arPull: number;
  minHAtr: number;
  maxHAtr: number;
  arMax: number;
  maxLife: number;
  maxRe: number;
  stZone: number;
  stEffort: number;
  minB: number;
  springPen: number;
  springBars: number;
  sosZ: number;
  sosBody: number;
  lpsMax: number;
  lpsTol: number;
  eMult: number;
  entryMode: EntryMode;
  tradeSide: TradeSide;
  minGrade: Grade;
  slMode: SlMode;
  slAtr: number;
  causeRef: number;
  causeMax: number;
  scaleOut: boolean;
  tradeMax: number;
  htfMinutes: number;
  keepN: number;
  /** Bot mode opens trades. Operator mode only proposes them. */
  commitEntries: boolean;
};

export const DEFAULT_PARAMS: WyckoffParams = {
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
  stZone: 0.33,
  stEffort: 1,
  minB: 8,
  springPen: 1,
  springBars: 3,
  sosZ: 0.3,
  sosBody: 0.5,
  lpsMax: 40,
  lpsTol: 1,
  eMult: 0.5,
  entryMode: "LPS + Spring Test",
  tradeSide: "Both",
  minGrade: "B",
  slMode: "Range mid",
  slAtr: 0.3,
  causeRef: 40,
  causeMax: 3,
  scaleOut: true,
  tradeMax: 200,
  htfMinutes: 240,
  keepN: 8,
  commitEntries: true,
};

export type RangeBox = {
  schId: number;
  dir: Dir;
  left: number;
  right: number;
  top: number;
  bot: number;
  text: string;
  failed: boolean;
  active: boolean;
};

export type Mark = {
  schId: number;
  bar: number;
  price: number;
  text: string;
  below: boolean;
  tone: "acc" | "dist" | "fail" | "flat";
  tip: string;
};

export type PhaseLine = {
  schId: number;
  bar: number;
  top: number;
  bot: number;
  text: string;
};

export type LiveTrade = {
  id: number;
  schId: number;
  link: boolean;
  type: string;
  dir: Dir;
  source: "bot" | "you" | "fade";
  bar: number;
  exitBar: number | null;
  entry: number;
  sl: number;
  curSl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  risk: number;
  hits: number;
  real: number;
  remain: number;
  grade: string;
  score: number;
  closed: boolean;
  exitText: string;
};

export type Proposal = {
  schId: number;
  type: string;
  dir: Dir;
  bar: number;
  time: number;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  grade: Grade;
  score: number;
  risk: number;
};

export type StepDot = { code: string; name: string; state: "done" | "now" | "wait" };

export type Snapshot = {
  st: number;
  dir: Dir | 0;
  phase: string;
  lastEvent: string;
  confidence: number;
  waiting: string;
  story: string;
  htf: -1 | 0 | 1;
  invalidation: number | null;
  range: null | { low: number; high: number; height: number; atr: number; life: number; cause: number };
  springQ: number | null;
  effort: string;
  steps: StepDot[];
  trade: LiveTrade | null;
  boxes: RangeBox[];
  labels: Mark[];
  phases: PhaseLine[];
  trades: LiveTrade[];
  stats: { ranges: number; failed: number; extended: number; springs: number; springToSos: number };
};

export type StepInfo = {
  born: string[];
  interesting: boolean;
  proposal: Proposal | null;
  opened: { type: string; dir: Dir; grade: string; source: LiveTrade["source"] } | null;
  exit: { text: string; r: number; dir: Dir } | null;
  notes: string[];
  snap: Snapshot;
};

class Ema {
  private buf: number[] = [];
  private value: number | null = null;
  constructor(
    private n: number,
    private k = 2 / (n + 1),
  ) {}
  push(x: number): number | null {
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
  get(): number | null {
    return this.value;
  }
}

class Atr {
  private buf: number[] = [];
  private value: number | null = null;
  private prev: number | null = null;
  constructor(private n: number) {}
  push(h: number, l: number, c: number): number | null {
    const tr =
      this.prev == null ? h - l : Math.max(h - l, Math.abs(h - this.prev), Math.abs(l - this.prev));
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
}

class Window {
  private q: number[] = [];
  private sum = 0;
  private sumsq = 0;
  constructor(private n: number) {}
  push(x: number) {
    this.q.push(x);
    this.sum += x;
    this.sumsq += x * x;
    if (this.q.length > this.n) {
      const y = this.q.shift()!;
      this.sum -= y;
      this.sumsq -= y * y;
    }
  }
  ready(): boolean {
    return this.q.length >= this.n;
  }
  sma(): number {
    return this.q.length ? this.sum / this.q.length : 0;
  }
  /** Population standard deviation, matching ta.stdev. */
  sd(): number {
    if (!this.q.length) return 0;
    const m = this.sma();
    return Math.sqrt(Math.max(0, this.sumsq / this.q.length - m * m));
  }
}

class Extreme {
  private dq: { i: number; v: number }[] = [];
  constructor(
    private n: number,
    private mode: "min" | "max",
  ) {}
  push(i: number, v: number) {
    const worse = (a: number, b: number) => (this.mode === "min" ? a >= b : a <= b);
    while (this.dq.length && worse(this.dq[this.dq.length - 1]!.v, v)) this.dq.pop();
    this.dq.push({ i, v });
    while (this.dq.length && this.dq[0]!.i <= i - this.n) this.dq.shift();
  }
  ready(i: number): boolean {
    return i >= this.n - 1;
  }
  value(): number {
    return this.dq[0]?.v ?? NaN;
  }
}

function gradeOf(score: number): Grade {
  return score >= 75 ? "A" : score >= 55 ? "B" : "C";
}

function gradeIdx(g: string): number {
  return g === "A" ? 0 : g === "B" ? 1 : 2;
}

function phaseName(st: number): string {
  if (st === 1 || st === 2) return "A";
  if (st === 3) return "B";
  if (st === 4) return "C";
  if (st === 5) return "D";
  if (st === 6) return "E";
  return "—";
}

export class WyckoffEngine {
  readonly p: WyckoffParams;
  armTrades = true;

  private bars: Candle[] = [];
  private atr: Atr;
  private ema: Ema;
  private volW = new Window(50);
  private vol10 = new Window(10);
  private rngW = new Window(20);
  private lo: Extreme;
  private hi: Extreme;
  private cumVol = 0;

  private htfEma: Ema;
  private emaHist: number[] = [];
  private htfBias: -1 | 0 | 1 = 0;
  private form: { bucket: number; c: number } | null = null;

  private st = 0;
  private d: Dir = 1;
  private schId = 0;
  private cLvl: number | null = null;
  private bLvl: number | null = null;
  private ext = NaN;
  private cBar = -1;
  private extBar = -1;
  private arBar = -1;
  private bStart = -1;
  private spBar = -1;
  private sosBar = -1;
  private lpsBar = -1;
  private cVol = 0;
  private cZv = 0;
  private spLvl: number | null = null;
  private spVol = 0;
  private spQ = 0;
  private sosVol = 0;
  private sosZv = 0;
  private hadSpring = false;
  private hadTest = false;
  private eShown = false;
  private reCnt = 0;
  private pend = 0;
  private pendExt = NaN;
  private pendBar = -1;
  private pendVol = 0;
  private lastEv = "—";
  private lastScore = 0;

  private trade: LiveTrade | null = null;
  private seq = 1;
  private pending: Proposal | null = null;

  boxes: RangeBox[] = [];
  labels: Mark[] = [];
  phases: PhaseLine[] = [];
  trades: LiveTrade[] = [];

  private nAcc = 0;
  private nDist = 0;
  private nSp = 0;
  private nSpSos = 0;
  private nFail = 0;
  private nRe = 0;

  private born: string[] = [];
  private notes: string[] = [];
  private opened: StepInfo["opened"] = null;
  private exited: StepInfo["exit"] = null;
  private barEnd: string | null = null;
  private atrNow = 0;
  private volZNow = 0;
  private rngMa = 0;

  constructor(params: Partial<WyckoffParams> = {}) {
    this.p = { ...DEFAULT_PARAMS, ...params };
    this.atr = new Atr(this.p.atrLen);
    this.ema = new Ema(this.p.emaLen);
    this.lo = new Extreme(this.p.climaxLook, "min");
    this.hi = new Extreme(this.p.climaxLook, "max");
    this.htfEma = new Ema(50);
  }

  get length(): number {
    return this.bars.length;
  }

  push(bar: Candle): StepInfo {
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
    const volRel = hasVol && vMa > 0 ? bar.v / vMa : 1;
    this.volZNow = volZ;

    if (atr == null || ema == null) return this.finish(false);

    this.atrNow = atr;
    const big = rng >= this.p.climaxAtr * atr;
    const climaxV = hasVol ? volZ >= this.p.climaxZ : rng >= this.p.climaxAtr * 1.6 * atr;
    const isSC =
      bar.c < ema && this.lo.ready(i) && bar.l <= this.lo.value() && big && climaxV;
    const isBC =
      bar.c > ema && this.hi.ready(i) && bar.h >= this.hi.value() && big && climaxV;

    this.machine(i, bar, atr, volZ, hasVol, rng, isSC, isBC);
    return this.finish(this.born.length > 0 || this.opened != null || this.exited != null);
  }

  /** Operator takes the signal just proposed. */
  take(source: "you" | "fade" = "you"): LiveTrade | null {
    const p = this.pending;
    if (!p || this.trade) return null;
    this.pending = null;
    if (source === "fade") return this.openTrade(this.fadeOf(p), false, "fade");
    return this.openTrade(p, true, "you");
  }

  /** Discretionary order at the last close. */
  manual(dir: Dir): LiveTrade | null {
    if (!this.armTrades || this.trade || !this.bars.length || this.atrNow <= 0) return null;
    const bar = this.bars[this.bars.length - 1]!;
    const i = this.bars.length - 1;
    const px = bar.c;
    const dist = Math.max(this.atrNow * 1.2, px * 0.002);
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
    const proposal: Proposal = {
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
      risk,
    };
    return this.openTrade(proposal, false, "you");
  }

  markR(price?: number): number {
    const t = this.trade;
    if (!t || t.closed) return 0;
    const px = price ?? this.bars[this.bars.length - 1]?.c ?? t.entry;
    if (!(t.risk > 0)) return t.real;
    return t.real + (t.remain * t.dir * (px - t.entry)) / t.risk;
  }

  /** Sum of closed-trade R with entry at or after `fromBar`. */
  closedR(fromBar = 0): number {
    let s = 0;
    for (const t of this.trades) if (t.closed && t.bar >= fromBar) s += t.real;
    return s;
  }

  private fadeOf(p: Proposal): Proposal {
    const dir = (p.dir * -1) as Dir;
    const dist = Math.max(Math.abs(p.entry - p.sl), this.mintick(p.entry));
    return {
      ...p,
      type: `Ngược ${p.type}`,
      dir,
      sl: p.entry - dir * dist,
      tp1: p.entry + dir * dist,
      tp2: p.entry + dir * 2 * dist,
      tp3: p.entry + dir * 3 * dist,
      risk: dist,
    };
  }

  private finish(interesting: boolean): StepInfo {
    return {
      born: this.born.slice(),
      interesting,
      proposal: this.pending,
      opened: this.opened,
      exit: this.exited,
      notes: this.notes.slice(),
      snap: this.snapshot(),
    };
  }

  private foldHtf(bar: Candle) {
    const ms = this.p.htfMinutes * 60_000;
    const bucket = Math.floor(bar.t / ms) * ms;
    if (!this.form) {
      this.form = { bucket, c: bar.c };
      return;
    }
    if (bucket !== this.form.bucket) {
      this.closeHtf(this.form.c);
      this.form = { bucket, c: bar.c };
      return;
    }
    this.form.c = bar.c;
  }

  private closeHtf(close: number) {
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
    const e5 = this.emaHist[this.emaHist.length - 6]!;
    this.htfBias = close > e && e > e5 ? 1 : close < e && e < e5 ? -1 : 0;
  }

  private machine(
    i: number,
    bar: Candle,
    atr: number,
    volZ: number,
    hasVol: boolean,
    rng: number,
    isSC: boolean,
    isBC: boolean,
  ) {
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
        } else {
          this.st = 0;
        }
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
              active: true,
            });
            this.mark(this.cBar, this.cLvl, this.d === 1 ? "SC" : "BC", this.d === 1, this.d === 1 ? "Đáy climax — cung được hấp thụ" : "Đỉnh climax — cầu được hấp thụ");
            this.mark(this.arBar, this.bLvl, "AR", this.d === -1, this.d === 1 ? "Automatic Rally" : "Automatic Reaction");
            this.phase(this.cBar, "A", top, bot);
            this.lastEv = "AR";
            endTxt = "";
          } else {
            this.st = 0;
          }
        } else if (i - this.cBar > this.p.arMax) {
          this.st = 0;
        }
      }
    } else if (this.st === 2 && this.cLvl != null && this.bLvl != null) {
      if (d * (this.cLvl - bar.c) > this.p.springPen * atr) doBreak = true;
      else if (d * (bar.c - this.bLvl) > H) {
        endNow = true;
        endTxt = "Thoát biên";
      } else if (
        i - this.arBar >= 2 &&
        d * (xC - this.cLvl) <= this.p.stZone * H &&
        d * (bar.c - this.cLvl) > 0 &&
        (!hasVol || vol <= this.p.stEffort * this.cVol)
      ) {
        this.st = 3;
        this.bStart = i;
        this.mark(i, xC, "ST", d === 1, "Secondary Test — quay lại vùng climax, khối lượng thấp hơn");
        this.phase(i, "B", Math.max(this.cLvl, this.bLvl), Math.min(this.cLvl, this.bLvl));
        this.lastEv = "ST";
      }
    } else if (this.st === 3 && this.cLvl != null && this.bLvl != null) {
      const sosNow =
        d * (bar.c - this.bLvl) > 0.1 * atr &&
        body >= this.p.sosBody * rng &&
        d * (bar.c - bar.o) > 0 &&
        (!hasVol || volZ >= this.p.sosZ);
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
        else if (pen > 0.1 * atr) {
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
      const sosNow =
        d * (bar.c - this.bLvl) > 0.1 * atr &&
        body >= this.p.sosBody * rng &&
        d * (bar.c - bar.o) > 0 &&
        (!hasVol || volZ >= this.p.sosZ);
      if (d * (this.spLvl - bar.c) > 0) {
        endNow = true;
        endFail = true;
        endTxt = `Gãy ${nmS}`;
      } else if (d * (bar.c - this.bLvl) > H) {
        endNow = true;
        endTxt = "Thoát biên";
      } else if (sosNow) goSOS = true;
      else if (
        !this.hadTest &&
        i > this.spBar + 1 &&
        d * (xC - this.cLvl) <= this.p.stZone * H &&
        d * (xC - this.spLvl) >= 0 &&
        (!hasVol || vol < this.spVol) &&
        d * (bar.c - bar.o) >= 0
      ) {
        doTest = true;
      }
    } else if (this.st === 5 && this.cLvl != null && this.bLvl != null) {
      const mid = (this.cLvl + this.bLvl) / 2;
      const inLps = i > this.sosBar && d * (xC - this.bLvl) <= this.p.lpsTol * atr && d * (xC - mid) > 0;
      const conf = d * (bar.c - this.bLvl) > 0 && (d === 1 ? bar.c - bar.l >= 0.5 * rng : bar.h - bar.c >= 0.5 * rng);
      if (inLps && conf) doLPS = true;
      else if (d * (this.bLvl - bar.c) > 0.5 * H) {
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
      const linked = this.trade != null && !this.trade.closed && this.trade.link && this.trade.schId === this.schId;
      if (!linked && !endNow) {
        if (this.eShown || d * (this.bLvl - bar.c) > 0.5 * H || i - this.lpsBar > this.p.lpsMax * 2) {
          endNow = true;
          endTxt = this.eShown ? (d === 1 ? "Markup" : "Markdown") : "Xong pha";
        }
      }
    }

    if (doBreak && this.cLvl != null && this.bLvl != null) {
      const newClimax = d === 1 ? isSC : isBC;
      if (newClimax && this.reCnt < this.p.maxRe && Math.abs(this.bLvl - xC) <= this.p.maxHAtr * atr) {
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
      const depth = (d * (this.cLvl - this.spLvl)) / atr;
      const spd = i - this.spBar;
      const cl = rng > 0 ? (d === 1 ? (bar.c - bar.l) / rng : (bar.h - bar.c) / rng) : 0.5;
      let q = 0;
      q += depth <= 0.5 ? 25 : depth <= 1 ? 15 : 5;
      q += !hasVol ? 12 : this.spVol < this.cVol * 0.7 ? 25 : this.spVol < this.cVol ? 15 : 5;
      q += spd === 0 ? 25 : spd === 1 ? 15 : 5;
      q += cl >= 0.6 ? 25 : cl >= 0.4 ? 15 : 5;
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
          risk: Math.abs(bar.c - sl),
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
        const slB =
          this.p.slMode === "Range mid" ? mid : this.p.slMode === "LPS low / high" ? xC : this.hadSpring && this.spLvl != null ? this.spLvl : mid;
        const sl = slB - d * this.p.slAtr * atr;
        const cause = this.cause(life);
        this.propose({
          schId: this.schId,
          type: nmL,
          dir: d,
          bar: i,
          time: bar.t,
          entry: bar.c,
          sl,
          tp1: this.bLvl + d * 0.5 * H,
          tp2: this.bLvl + d * H,
          tp3: this.bLvl + d * H * cause,
          grade: g,
          score,
          risk: Math.abs(bar.c - sl),
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

  private offer(g: Grade, kind: "test" | "lps"): boolean {
    if (!this.armTrades || this.trade) return false;
    if (kind === "test" && this.p.entryMode === "LPS only") return false;
    if (kind === "lps" && this.p.entryMode === "Spring Test only") return false;
    const sideOk =
      this.p.tradeSide === "Both" ||
      (this.p.tradeSide === "Long only" && this.d === 1) ||
      (this.p.tradeSide === "Short only" && this.d === -1);
    return sideOk && gradeIdx(g) <= gradeIdx(this.p.minGrade);
  }

  private propose(p: Proposal) {
    if (this.p.entryMode === "LPS only" && p.type === "Spring Test") return;
    if (this.p.entryMode === "Spring Test only" && p.type !== "Spring Test") return;
    if (this.p.commitEntries) this.openTrade(p, true, "bot");
    else this.pending = p;
  }

  private openTrade(p: Proposal, link: boolean, source: LiveTrade["source"]): LiveTrade {
    const dir = p.dir;
    let risk = Math.max(p.risk, this.mintick(p.entry));
    let tp1 = p.tp1;
    let tp2 = p.tp2;
    let tp3 = p.tp3;
    if (dir * (tp1 - p.entry) < risk) tp1 = p.entry + dir * risk;
    if (dir * (tp2 - tp1) < 0.5 * risk) tp2 = tp1 + dir * risk;
    if (dir * (tp3 - tp2) < 0.5 * risk) tp3 = tp2 + dir * risk;
    const t: LiveTrade = {
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
      exitText: "",
    };
    this.trade = t;
    this.trades.push(t);
    this.opened = { type: t.type, dir: t.dir, grade: t.grade, source: t.source };
    this.born.push(`${t.dir === 1 ? "LONG" : "SHORT"} ${t.type} · ${t.grade}`);
    return t;
  }

  private manage(i: number, bar: Candle) {
    const t = this.trade;
    if (!t || t.closed) return;
    const hitSl = t.dir === 1 ? bar.l <= t.curSl : bar.h >= t.curSl;
    let done = false;
    let reason = "";
    const tps = [t.tp1, t.tp2, t.tp3];
    if (hitSl) {
      t.real += (t.remain * t.dir * (t.curSl - t.entry)) / t.risk;
      t.remain = 0;
      done = true;
      reason = t.curSl === t.sl ? "Cắt lỗ" : t.hits === 1 ? "Hòa vốn" : "Khóa TP1";
    } else if (this.p.scaleOut) {
      while (t.hits < 3 && (t.dir === 1 ? bar.h >= tps[t.hits]! : bar.l <= tps[t.hits]!)) {
        const rk = Math.abs(tps[t.hits]! - t.entry) / t.risk;
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
      t.real += (t.remain * t.dir * (bar.c - t.entry)) / t.risk;
      t.remain = 0;
      done = true;
      reason = "Hết giờ";
    }
    if (!done) return;
    t.closed = true;
    t.exitBar = i;
    t.exitText = reason;
    this.exited = { text: reason, r: t.real, dir: t.dir };
    this.mark(
      i,
      t.dir === 1 ? bar.h : bar.l,
      `${reason} ${t.real >= 0 ? "+" : ""}${t.real.toFixed(1)}R`,
      t.dir === -1,
      `Đóng lệnh ${reason}`,
      t.real > 0 ? "acc" : t.real < 0 ? "dist" : "flat",
    );
    this.born.push(`${reason} ${t.real >= 0 ? "+" : ""}${t.real.toFixed(2)}R`);
    if (this.st === 6 && t.link && t.schId === this.schId) {
      this.barEnd = `Đóng lệnh (${reason})`;
    }
    this.trade = null;
  }

  private score(cz: number, sp: boolean, q: number, ts: boolean, sz: number, life: number, lowEff: boolean): number {
    let s = 0;
    s += cz >= this.p.climaxZ + 1 ? 15 : 8;
    s += sp ? Math.round((20 * q) / 100) : 0;
    s += ts ? 15 : 0;
    s += sz >= 1 ? 15 : sz >= this.p.sosZ ? 8 : 0;
    s += life >= this.p.causeRef ? 15 : life >= this.p.causeRef / 2 ? 8 : 0;
    s += lowEff ? 10 : 0;
    s += this.htfBias === this.d ? 10 : this.htfBias === 0 ? 5 : 0;
    return s;
  }

  private cause(life: number): number {
    return Math.min(Math.max(life / this.p.causeRef, 1), this.p.causeMax);
  }

  private mintick(px: number): number {
    const a = Math.abs(px);
    if (a >= 1000) return 0.1;
    if (a >= 1) return 0.01;
    return 0.0001;
  }

  private cleanup() {
    const cut = this.schId - this.p.keepN;
    this.labels = this.labels.filter((x) => x.schId > cut);
    this.phases = this.phases.filter((x) => x.schId > cut);
    this.boxes = this.boxes.filter((x) => x.schId > cut);
    this.trades = this.trades.filter((x) => x.schId > cut || !x.closed);
  }

  private activeBox(): RangeBox | null {
    for (let i = this.boxes.length - 1; i >= 0; i--) {
      if (this.boxes[i]!.active && this.boxes[i]!.schId === this.schId) return this.boxes[i]!;
    }
    return null;
  }

  private mark(bar: number, price: number, text: string, below: boolean, tip: string, tone?: Mark["tone"]) {
    const toneFinal = tone ?? (this.d === 1 ? "acc" : "dist");
    this.labels.push({ schId: this.schId, bar, price, text, below, tone: toneFinal, tip });
    this.born.push(text);
  }

  private phase(bar: number, text: string, top: number, bot: number) {
    this.phases.push({ schId: this.schId, bar, top, bot, text });
  }

  snapshot(): Snapshot {
    const i = this.bars.length - 1;
    const atr = this.atrNow || 1;
    const H = this.bLvl != null && this.cLvl != null ? Math.abs(this.bLvl - this.cLvl) : 0;
    const life = this.st >= 1 && this.cBar >= 0 ? i - this.cBar : 0;
    const d = this.st === 0 ? 0 : this.d;
    const names =
      this.d === 1
        ? ["Selling Climax", "Automatic Rally", "Secondary Test", "Spring", "Test", "Sign of Strength", "Last Point of Support", "Markup"]
        : ["Buying Climax", "Automatic Reaction", "Secondary Test", "UTAD", "Test", "Sign of Weakness", "Last Point of Supply", "Markdown"];
    const codes = this.d === 1 ? ["SC", "AR", "ST", "Spring", "Test", "SOS", "LPS", "E"] : ["BC", "AR", "ST", "UTAD", "Test", "SOW", "LPSY", "E"];
    const done = [
      this.st >= 1,
      this.st >= 2,
      this.st >= 3,
      this.hadSpring && this.st >= 4,
      this.hadTest && this.st >= 4,
      this.st >= 5,
      this.st >= 6,
      this.eShown && this.st === 6,
    ];
    const cur =
      this.st === 0 ? -1 : this.st === 1 ? 1 : this.st === 2 ? 2 : this.st === 3 ? 3 : this.st === 4 ? (this.hadTest ? 5 : 4) : this.st === 5 ? 6 : 7;
    const steps: StepDot[] = codes.map((code, idx) => ({
      code,
      name: names[idx]!,
      state: this.st !== 0 && idx === cur ? "now" : this.st !== 0 && done[idx] ? "done" : "wait",
    }));
    const conf = this.confidence(i);
    const volZ = this.volZNow;
    const effort =
      volZ >= 1.5 && this.bars.length && this.bars[i]!.h - this.bars[i]!.l <= this.rngMa
        ? "Nỗ lực lớn, kết quả nhỏ"
        : volZ >= 1.5
          ? "Nỗ lực lớn, kết quả lớn"
          : volZ <= -0.5 && this.bars.length && this.bars[i]!.h - this.bars[i]!.l >= 1.3 * this.rngMa
            ? "Nỗ lực nhỏ, kết quả lớn"
            : "Bình thường";
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
      range:
        this.st >= 2 && this.cLvl != null && this.bLvl != null
          ? {
              low: Math.min(this.cLvl, this.bLvl),
              high: Math.max(this.cLvl, this.bLvl),
              height: H,
              atr: H / atr,
              life,
              cause: this.bLvl + this.d * H * this.cause(life),
            }
          : null,
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
        springToSos: this.nSpSos,
      },
    };
  }

  private confidence(i: number): number {
    const st = this.st;
    const built =
      st === 3 ? Math.min((i - this.bStart) / Math.max(this.p.minB, 1), 1) : 0;
    const c =
      st === 1 ? 10 : st === 2 ? 20 : st === 3 ? 30 + 10 * built : st === 4 ? 50 + 0.15 * this.spQ : st === 5 ? 70 + (this.hadSpring ? 7 : 0) + (this.hadTest ? 5 : 0) : st === 6 ? 80 + 0.17 * this.lastScore : 0;
    return Math.min(c, 97);
  }

  private waiting(i: number): string {
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

  private story(): string {
    if (this.st === 0) return "Đang quét climax";
    const drying = this.vol10.ready() && this.volW.ready() && this.vol10.sma() < this.volW.sma() * 0.85;
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

  private invalidation(): number | null {
    if (this.st === 1 && this.cLvl != null) return this.cLvl - this.d * this.atrNow;
    if ((this.st === 2 || this.st === 3) && this.cLvl != null) return this.cLvl - this.d * this.p.springPen * this.atrNow;
    if (this.st === 4 && this.spLvl != null) return this.spLvl;
    if (this.st === 5 && this.cLvl != null && this.bLvl != null) return (this.cLvl + this.bLvl) / 2;
    if (this.st === 6) return this.trade ? this.trade.curSl : this.cLvl != null && this.bLvl != null ? (this.cLvl + this.bLvl) / 2 : null;
    return null;
  }
}
