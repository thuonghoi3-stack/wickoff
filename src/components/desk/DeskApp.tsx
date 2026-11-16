import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward, Square } from "lucide-react";
import { CandleChart } from "@/components/chart/CandleChart";
import { fmtPx, fmtR, fmtUsd, fmtWhen } from "@/lib/market/format";
import { loadMarket } from "@/lib/market/klines";
import { campaignSpan, htfMinutes, INTERVALS, intervalMeta, MARKETS } from "@/lib/market/symbols";
import type { Candle, IntervalId } from "@/lib/market/types";
import {
  WyckoffEngine,
  type EntryMode,
  type Grade,
  type Proposal,
  type Snapshot,
  type StepInfo,
  type TradeSide,
} from "@/lib/wyckoff/engine";

const START = 10_000;
const BUST = 0.7;
const STORE = "wyck-best-v1";
const SPEEDS = [1, 2, 4, 8, 16] as const;
type Speed = (typeof SPEEDS)[number];
const STEP_SEC: Record<Speed, number> = { 1: 0.52, 2: 0.28, 4: 0.14, 8: 0.07, 16: 0.04 };

type LogLine = { id: number; text: string; tone: "acc" | "dist" | "gold" | "flat" };
type ResultKind = "done" | "bust";

type Sim = {
  candles: Candle[];
  head: number;
  engine: WyckoffEngine;
  snap: Snapshot;
  paused: boolean;
  proposal: Proposal | null;
  start: number;
  realized: number;
  riskUsd: number;
  riskPct: number;
  peak: number;
  maxDd: number;
  curve: number[];
  rSum: number;
  wins: number;
  losses: number;
  log: LogLine[];
  logSeq: number;
  result: ResultKind | null;
  ghostR: number;
  mode: "bot" | "you";
  interval: IntervalId;
  symbol: string;
  source: "live" | "vision";
  asOf: number;
  saved: boolean;
};

type Setup = {
  symbol: string;
  interval: IntervalId;
  mode: "bot" | "you";
  side: TradeSide;
  entry: EntryMode;
  grade: Grade;
  risk: number;
  random: boolean;
};

type Best = { r: number; equity: number; symbol: string; interval: string; mode: string; at: number };

let audioCtx: AudioContext | null = null;

function tone(freq: number, dur = 0.07) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx ??= new Ctx();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "triangle";
    o.frequency.value = freq;
    g.gain.value = 0.028;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + dur);
  } catch {
    /* autoplay can fail before a gesture */
  }
}

function readBest(): Best | null {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Best;
    return typeof parsed?.r === "number" ? parsed : null;
  } catch {
    return null;
  }
}

function writeBest(next: Best, prev: Best | null): Best {
  if (!prev || next.r > prev.r) {
    localStorage.setItem(STORE, JSON.stringify(next));
    return next;
  }
  return prev;
}

function equityOf(sim: Sim): number {
  return sim.start + sim.realized + sim.engine.markR() * sim.riskUsd;
}

function pushLog(sim: Sim, text: string, toneName: LogLine["tone"]) {
  sim.log = [{ id: sim.logSeq++, text, tone: toneName }, ...sim.log].slice(0, 28);
}

function toneOf(text: string): LogLine["tone"] {
  if (/LONG|Spring|SOS|LPS|SC|AR|ST|TP/.test(text) && !/SHORT|SOW|LPSY|BC|UTAD|✕|Cắt/.test(text)) return "acc";
  if (/SHORT|UTAD|SOW|LPSY|BC|✕|Cắt|Gãy|Vỡ/.test(text)) return "dist";
  return "flat";
}

function apply(sim: Sim, info: StepInfo) {
  if (info.exit) {
    sim.realized += info.exit.r * sim.riskUsd;
    sim.rSum += info.exit.r;
    sim.riskUsd = 0;
    if (info.exit.r > 0) sim.wins += 1;
    else if (info.exit.r < 0) sim.losses += 1;
    pushLog(sim, `${info.exit.text} ${fmtR(info.exit.r)}`, info.exit.r >= 0 ? "acc" : "dist");
    tone(info.exit.r >= 0 ? 880 : 196, 0.1);
  }
  for (const note of info.notes) pushLog(sim, note, "gold");
  for (const line of info.born) {
    if (/^(SC|BC|AR|ST|Spring|UTAD|Test|SOS|SOW|LPS|LPSY|✕)/.test(line)) pushLog(sim, line, toneOf(line));
  }
  if (info.opened) {
    sim.riskUsd = (sim.start + sim.realized) * sim.riskPct;
    const side = info.opened.dir === 1 ? "LONG" : "SHORT";
    pushLog(sim, `${side} ${info.opened.type} · ${info.opened.grade}`, info.opened.dir === 1 ? "acc" : "dist");
    tone(640, 0.08);
  }
  if (info.proposal) {
    sim.proposal = info.proposal;
    sim.paused = true;
    tone(520, 0.06);
  }
  const eq = equityOf(sim);
  if (eq > sim.peak) sim.peak = eq;
  const dd = sim.peak > 0 ? (sim.peak - eq) / sim.peak : 0;
  if (dd > sim.maxDd) sim.maxDd = dd;
  sim.curve.push(eq);
  if (eq <= sim.start * BUST) {
    sim.result = "bust";
    sim.paused = true;
    tone(140, 0.2);
  }
}

function isSetupEvent(info: StepInfo): boolean {
  return Boolean(info.proposal || info.opened || info.exit || info.born.some((b) => /^(Spring|UTAD|SOS|SOW|LPS|LPSY|Test)/.test(b)));
}

export function DeskApp() {
  const simRef = useRef<Sim | null>(null);
  const speedRef = useRef<Speed>(4);
  const api = useRef({ toggle: () => {}, skip: () => {}, fast: () => {} });
  const [phase, setPhase] = useState<"brief" | "load" | "play">("brief");
  const [tick, setTick] = useState(0);
  const [speed, setSpeed] = useState<Speed>(4);
  const [error, setError] = useState("");
  const [best, setBest] = useState<Best | null>(null);
  const [tab, setTab] = useState<"phase" | "log" | "setup">("phase");
  const [setup, setSetup] = useState<Setup>({
    symbol: "BTCUSDT",
    interval: "1h",
    mode: "bot",
    side: "Both",
    entry: "LPS + Spring Test",
    grade: "B",
    risk: 0.01,
    random: true,
  });

  useEffect(() => {
    setBest(readBest());
  }, []);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    if (phase !== "play") return;
    let raf = 0;
    let acc = 0;
    let last = performance.now();
    let dead = false;
    const loop = (now: number) => {
      if (dead) return;
      const dt = Math.min(0.05, (now - last) / 1000);
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        api.current.toggle();
      } else if (e.key === "n" || e.key === "N") api.current.skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const sim = simRef.current;
    if (!sim?.result || sim.saved) return;
    sim.saved = true;
    const eq = equityOf(sim);
    const next = writeBest(
      {
        r: sim.rSum,
        equity: eq,
        symbol: sim.symbol,
        interval: sim.interval,
        mode: sim.mode,
        at: Date.now(),
      },
      best,
    );
    setBest(next);
  }, [tick, best]);

  function stepOne(): { kind: "next" | "hold" | "end"; signal: boolean } {
    const sim = simRef.current;
    if (!sim || sim.paused || sim.proposal || sim.result) return { kind: "end", signal: false };
    if (sim.head >= sim.candles.length - 1) {
      sim.result = "done";
      sim.paused = true;
      tone(740, 0.12);
      return { kind: "end", signal: false };
    }
    const info = sim.engine.push(sim.candles[sim.head + 1]!);
    sim.head += 1;
    sim.snap = info.snap;
    apply(sim, info);
    const signal = isSetupEvent(info);
    if (sim.result || sim.head >= sim.candles.length - 1) {
      if (!sim.result && sim.head >= sim.candles.length - 1) {
        sim.result = "done";
        sim.paused = true;
        tone(740, 0.12);
      }
      return { kind: "end", signal };
    }
    if (sim.proposal || sim.paused) return { kind: "hold", signal: true };
    return { kind: "next", signal };
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
    while (guard++ < 8000) {
      if (sim.proposal) {
        sim.proposal = null;
        sim.paused = false;
        pushLog(sim, "Bỏ qua tín hiệu", "flat");
      }
      const stepped = stepOne();
      if (stepped.kind === "end" || sim.result) break;
    }
    setTick((t) => t + 1);
  };

  async function begin(next: Setup) {
    setError("");
    setPhase("load");
    tone(180, 0.01);
    const res = await loadMarket({ data: { symbol: next.symbol, interval: next.interval } });
    if (!res.ok) {
      setError(res.error);
      setPhase("brief");
      return;
    }
    let { warmup, play } = campaignSpan(next.interval);
    const all = res.candles;
    if (all.length < warmup + 80) {
      warmup = Math.max(30, Math.min(warmup, Math.floor(all.length * 0.25)));
    }
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
      commitEntries: next.mode === "bot",
    };
    const ghost = new WyckoffEngine(params);
    ghost.armTrades = false;
    for (let i = 0; i < warmup; i++) ghost.push(candles[i]!);
    ghost.armTrades = true;
    ghost.p.commitEntries = true;
    for (let i = warmup; i < candles.length; i++) ghost.push(candles[i]!);
    const gTrade = ghost.snapshot().trade;
    const ghostR = ghost.closedR(warmup) + (gTrade && gTrade.bar >= warmup ? ghost.markR() : 0);

    const engine = new WyckoffEngine({ ...params, commitEntries: next.mode === "bot" });
    engine.armTrades = false;
    let snap: Snapshot | null = null;
    for (let i = 0; i < warmup; i++) snap = engine.push(candles[i]!).snap;
    engine.armTrades = true;
    const sim: Sim = {
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
      asOf: candles[candles.length - 1]!.t,
      saved: false,
    };
    pushLog(sim, `Mở băng ${next.symbol} · ${intervalMeta(next.interval).label}`, "gold");
    simRef.current = sim;
    setTab("phase");
    setPhase("play");
    setTick((t) => t + 1);
  }

  function actOnProposal(kind: "take" | "fade" | "skip") {
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
        const side = trade.dir === 1 ? "LONG" : "SHORT";
        pushLog(sim, `${side} ${trade.type} · ${trade.grade}`, trade.dir === 1 ? "acc" : "dist");
        tone(kind === "fade" ? 300 : 640, 0.08);
      }
      sim.paused = false;
    }
    setTick((t) => t + 1);
  }

  function manual(dir: 1 | -1) {
    const sim = simRef.current;
    if (!sim || sim.snap.trade || sim.proposal || sim.result) return;
    const trade = sim.engine.manual(dir);
    if (!trade) return;
    sim.snap = sim.engine.snapshot();
    sim.riskUsd = (sim.start + sim.realized) * sim.riskPct;
    pushLog(sim, `${dir === 1 ? "LONG" : "SHORT"} tay`, dir === 1 ? "acc" : "dist");
    tone(500, 0.06);
    setTick((t) => t + 1);
  }

  const sim = simRef.current;
  if (phase !== "play" || !sim) {
    return (
      <Brief
        setup={setup}
        setSetup={setSetup}
        best={best}
        error={error}
        loading={phase === "load"}
        onStart={() => void begin(setup)}
      />
    );
  }

  const eq = equityOf(sim);
  const pnl = eq - sim.start;
  const snap = sim.snap;
  const chip =
    snap.st === 0 ? "Đang quét climax" : `${snap.dir === 1 ? "Tích lũy" : "Phân phối"} · Pha ${snap.phase}`;
  const toneName = snap.st === 0 ? "idle" : snap.dir === 1 ? "acc" : "dist";
  const bar = sim.candles[sim.head];
  const trades = sim.wins + sim.losses;
  const openR = sim.engine.markR();

  return (
    <div className="desk">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">WYCK</span>
          <span className="brand-sub">
            {sim.symbol} · {intervalMeta(sim.interval).label}
          </span>
        </div>
        <div className="top-meta">
          <span className={sim.source === "live" ? "pill pill-live" : "pill"}>{sim.source === "live" ? "Trực tiếp" : "Kho nến"}</span>
          <span className="muted">
            {bar ? fmtWhen(bar.t, sim.interval !== "1d") : ""}
            {sim.source === "vision" ? ` · đến ${fmtWhen(sim.asOf, sim.interval !== "1d")}` : ""}
          </span>
        </div>
        <div className={`pnl ${pnl >= 0 ? "text-acc" : "text-dist"}`}>
          <strong>{fmtUsd(eq)}</strong>
          <span>{pnl >= 0 ? `+${fmtUsd(pnl)}` : fmtUsd(pnl)}</span>
        </div>
      </header>

      <section className="chart-pane">
        <CandleChart
          candles={sim.candles}
          head={sim.head}
          boxes={snap.boxes}
          labels={snap.labels}
          phases={snap.phases}
          trades={snap.trades}
          invalidation={snap.invalidation}
          interval={sim.interval}
          chip={chip}
          tone={toneName}
        />
      </section>

      <aside className="side">
        <div className="tabs">
          {(
            [
              ["phase", "Pha"],
              ["log", "Nhật ký"],
              ["setup", "Bàn"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" className={tab === id ? "tab on" : "tab"} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
        {tab === "phase" && <PhasePanel snap={snap} eq={eq} openR={openR} />}
        {tab === "log" && <LogPanel log={sim.log} />}
        {tab === "setup" && (
          <div className="pad stack">
            <p className="muted">
              {sim.mode === "bot" ? "Bot tự vào mọi lệnh đạt chuẩn." : "Băng dừng ở mỗi tín hiệu. Bạn chọn vào, đánh ngược, hoặc bỏ."}
            </p>
            <p>
              Grade tối thiểu {setup.grade} · {setup.side === "Both" ? "hai chiều" : setup.side === "Long only" ? "chỉ long" : "chỉ short"} · rủi ro{" "}
              {(sim.riskPct * 100).toFixed(1)}%
            </p>
            <p className="muted">Luật Wyckoff giữ nguyên tham số Eye: climax z 2, ATR 1.3, Spring tối đa 1 ATR, SOS z 0.3.</p>
            <Spark points={sim.curve} up={eq >= sim.start} />
          </div>
        )}
      </aside>

      <footer className="dock">
        <div className="dock-stats">
          <Stat k="R" v={fmtR(sim.rSum + (sim.riskUsd > 0 ? openR : 0))} />
          <Stat k="Win" v={trades ? `${Math.round((100 * sim.wins) / trades)}%` : "—"} />
          <Stat k="Lệnh" v={String(trades)} />
          <Stat k="DD" v={`${(sim.maxDd * 100).toFixed(1)}%`} />
        </div>
        <div className="dock-controls">
          <button type="button" className="btn btn-gold" onClick={() => api.current.toggle()} disabled={Boolean(sim.result || sim.proposal)}>
            {sim.paused ? <Play size={18} /> : <Pause size={18} />}
            {sim.paused ? "Chạy" : "Dừng"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => api.current.skip()} disabled={Boolean(sim.result || sim.proposal)}>
            <SkipForward size={18} />
            Tín hiệu
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => api.current.fast()} disabled={Boolean(sim.result)}>
            <Square size={16} />
            Tua hết
          </button>
          <div className="speeds">
            {SPEEDS.map((s) => (
              <button key={s} type="button" className={speed === s ? "seg on" : "seg"} onClick={() => setSpeed(s)}>
                {s}×
              </button>
            ))}
          </div>
          {sim.mode === "you" && !sim.proposal && !snap.trade && !sim.result && (
            <div className="manual">
              <button type="button" className="btn btn-acc" onClick={() => manual(1)}>
                Mua
              </button>
              <button type="button" className="btn btn-dist" onClick={() => manual(-1)}>
                Bán
              </button>
            </div>
          )}
        </div>
      </footer>

      {sim.proposal && (
        <div className="sheet-back">
          <div className="sheet" role="dialog" aria-label="Tín hiệu vào lệnh">
            <p className="eyebrow">{sim.proposal.dir === 1 ? "Tích lũy · LONG" : "Phân phối · SHORT"}</p>
            <h2>
              {sim.proposal.type} · {sim.proposal.grade}
              <span className="muted"> {sim.proposal.score}</span>
            </h2>
            <dl className="levels">
              <div>
                <dt>Vào</dt>
                <dd>{fmtPx(sim.proposal.entry)}</dd>
              </div>
              <div>
                <dt>Cắt</dt>
                <dd className="text-dist">{fmtPx(sim.proposal.sl)}</dd>
              </div>
              <div>
                <dt>TP1</dt>
                <dd>{fmtPx(sim.proposal.tp1)}</dd>
              </div>
              <div>
                <dt>TP2</dt>
                <dd>{fmtPx(sim.proposal.tp2)}</dd>
              </div>
              <div>
                <dt>TP3</dt>
                <dd>{fmtPx(sim.proposal.tp3)}</dd>
              </div>
            </dl>
            <div className="sheet-actions">
              <button type="button" className="btn btn-acc" onClick={() => actOnProposal("take")}>
                Vào lệnh
              </button>
              <button type="button" className="btn btn-dist" onClick={() => actOnProposal("fade")}>
                Đánh ngược
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => actOnProposal("skip")}>
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      )}

      {sim.result && (
        <div className="sheet-back">
          <div className="sheet result">
            <p className="eyebrow">{sim.result === "bust" ? "Cháy tài khoản" : "Hết băng"}</p>
            <h2 className={pnl >= 0 ? "text-acc" : "text-dist"}>{fmtR(sim.rSum)}</h2>
            <p>
              Vốn {fmtUsd(eq)} · {trades} lệnh · thắng {trades ? Math.round((100 * sim.wins) / trades) : 0}% · DD tối đa {(sim.maxDd * 100).toFixed(1)}%
            </p>
            <p className="muted">
              Bot đầy đủ trên cùng băng: {fmtR(sim.ghostR)}. {sim.mode === "you" ? "Bạn duyệt từng tín hiệu." : "Bạn để bot tự đánh."}
            </p>
            <Spark points={sim.curve} up={eq >= sim.start} />
            <div className="sheet-actions">
              <button type="button" className="btn btn-gold" onClick={() => void begin(setup)}>
                <RotateCcw size={16} />
                Chơi lại
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  simRef.current = null;
                  setPhase("brief");
                }}
              >
                Đổi cặp
              </button>
            </div>
            <p className="fine">Mô phỏng giấy trên nến Binance USDT-M. Không phải lời khuyên đầu tư.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PhasePanel({ snap, eq, openR }: { snap: Snapshot; eq: number; openR: number }) {
  const t = snap.trade;
  return (
    <div className="pad stack">
      <div>
        <div className="row-between">
          <span className="muted">Độ tin cậy</span>
          <span>{snap.st === 0 ? "—" : `${Math.round(snap.confidence)}%`}</span>
        </div>
        <div className="conf">
          <span style={{ width: `${snap.confidence}%` }} className={snap.dir === -1 ? "bg-dist" : "bg-acc"} />
        </div>
      </div>
      <p>{snap.story}</p>
      <p className="muted">Chờ: {snap.waiting}</p>
      <ul className="map">
        {snap.steps.map((s) => (
          <li key={s.code} className={`map-${s.state}`}>
            <i />
            <b>{s.code}</b>
            <span>{s.name}</span>
          </li>
        ))}
      </ul>
      <div className="kv">
        <span>Sự kiện cuối</span>
        <b>{snap.lastEvent}</b>
        <span>HTF</span>
        <b className={snap.htf === 1 ? "text-acc" : snap.htf === -1 ? "text-dist" : ""}>{snap.htf === 1 ? "Tăng" : snap.htf === -1 ? "Giảm" : "Đứng"}</b>
        <span>Biên</span>
        <b>{snap.range ? `${fmtPx(snap.range.low)} – ${fmtPx(snap.range.high)}` : "—"}</b>
        <span>Mục tiêu cause</span>
        <b>{snap.range ? fmtPx(snap.range.cause) : "—"}</b>
        <span>Vỡ nếu</span>
        <b className="text-dist">{snap.invalidation != null ? fmtPx(snap.invalidation) : "—"}</b>
        <span>Volume</span>
        <b>{snap.effort}</b>
      </div>
      {t && (
        <div className={`trade-card ${t.dir === 1 ? "edge-acc" : "edge-dist"}`}>
          <strong>
            {t.dir === 1 ? "LONG" : "SHORT"} {t.type} · {t.grade}
          </strong>
          <div className="kv">
            <span>Vào</span>
            <b>{fmtPx(t.entry)}</b>
            <span>Cắt</span>
            <b>{fmtPx(t.curSl)}</b>
            <span>TP1 / TP2 / TP3</span>
            <b>
              {fmtPx(t.tp1)} · {fmtPx(t.tp2)} · {fmtPx(t.tp3)}
            </b>
            <span>Đang mở</span>
            <b className={openR >= 0 ? "text-acc" : "text-dist"}>{fmtR(openR)}</b>
          </div>
        </div>
      )}
      <p className="muted">
        Biên {snap.stats.ranges} · gãy {snap.stats.failed} · kéo {snap.stats.extended} · Spring→SOS{" "}
        {snap.stats.springs ? `${Math.round((100 * snap.stats.springToSos) / snap.stats.springs)}%` : "—"} · vốn {fmtUsd(eq)}
      </p>
    </div>
  );
}

function LogPanel({ log }: { log: LogLine[] }) {
  if (!log.length) return <p className="pad muted">Chưa có sự kiện.</p>;
  return (
    <ol className="log">
      {log.map((line) => (
        <li key={line.id} className={`log-${line.tone}`}>
          {line.text}
        </li>
      ))}
    </ol>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="stat">
      <span>{k}</span>
      <b>{v}</b>
    </div>
  );
}

function Spark({ points, up }: { points: number[]; up: boolean }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const w = 320;
  const h = 56;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - 4 - ((p - min) / (max - min || 1)) * (h - 8);
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={up ? "spark up" : "spark down"} aria-hidden>
      <path d={d} />
    </svg>
  );
}

function Brief({
  setup,
  setSetup,
  best,
  error,
  loading,
  onStart,
}: {
  setup: Setup;
  setSetup: (s: Setup) => void;
  best: Best | null;
  error: string;
  loading: boolean;
  onStart: () => void;
}) {
  const patch = (partial: Partial<Setup>) => setSetup({ ...setup, ...partial });
  return (
    <main className="brief">
      <p className="eyebrow">Binance USDT-M perpetual</p>
      <h1>WYCK</h1>
      <p className="lede">
        Bàn mô phỏng bot Wyckoff. Nến futures thật, chỉ báo vẽ SC, AR, ST, Spring, SOS, LPS và kế hoạch lệnh ngay trên giá.
      </p>
      <label className="field">
        <span>Cặp</span>
        <select value={setup.symbol} onChange={(e) => patch({ symbol: e.target.value })}>
          {MARKETS.map((m) => (
            <option key={m.symbol} value={m.symbol}>
              {m.symbol} · {m.name}
            </option>
          ))}
        </select>
      </label>
      <div className="field">
        <span>Khung</span>
        <div className="segs">
          {INTERVALS.map((it) => (
            <button key={it.id} type="button" className={setup.interval === it.id ? "seg on" : "seg"} onClick={() => patch({ interval: it.id })}>
              {it.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>Ai bấm lệnh</span>
        <div className="segs">
          <button type="button" className={setup.mode === "bot" ? "seg on" : "seg"} onClick={() => patch({ mode: "bot" })}>
            Bot tự đánh
          </button>
          <button type="button" className={setup.mode === "you" ? "seg on" : "seg"} onClick={() => patch({ mode: "you" })}>
            Bạn duyệt
          </button>
        </div>
      </div>
      <details className="more">
        <summary>Luật vào lệnh</summary>
        <div className="field">
          <span>Chiều</span>
          <div className="segs">
            {(
              [
                ["Both", "Cả hai"],
                ["Long only", "Long"],
                ["Short only", "Short"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" className={setup.side === id ? "seg on" : "seg"} onClick={() => patch({ side: id })}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Kiểu vào</span>
          <div className="segs">
            {(
              [
                ["LPS + Spring Test", "Cả hai"],
                ["LPS only", "LPS"],
                ["Spring Test only", "Spring"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" className={setup.entry === id ? "seg on" : "seg"} onClick={() => patch({ entry: id })}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Grade tối thiểu</span>
          <div className="segs">
            {(["A", "B", "C"] as const).map((g) => (
              <button key={g} type="button" className={setup.grade === g ? "seg on" : "seg"} onClick={() => patch({ grade: g })}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Rủi ro mỗi lệnh</span>
          <div className="segs">
            {[0.005, 0.01, 0.02].map((r) => (
              <button key={r} type="button" className={setup.risk === r ? "seg on" : "seg"} onClick={() => patch({ risk: r })}>
                {(r * 100).toFixed(1)}%
              </button>
            ))}
          </div>
        </div>
        <label className="check">
          <input type="checkbox" checked={setup.random} onChange={(e) => patch({ random: e.target.checked })} />
          Cửa sổ ngẫu nhiên trong lịch sử
        </label>
      </details>
      {best && (
        <p className="best">
          Kỷ lục {fmtR(best.r)} · {best.symbol} {best.interval}
        </p>
      )}
      {error && <p className="error">{error}</p>}
      <button type="button" className="btn btn-gold btn-xl" onClick={onStart} disabled={loading}>
        {loading ? "Đang kéo nến…" : "Vào bàn"}
      </button>
      <p className="fine">Vốn giấy $10,000. Nến Binance USDT-M. Không phải lời khuyên đầu tư.</p>
    </main>
  );
}
