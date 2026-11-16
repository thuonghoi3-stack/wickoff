export type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export type IntervalId = "15m" | "1h" | "4h" | "1d";

export type MarketPack = {
  ok: true;
  symbol: string;
  interval: IntervalId;
  source: "live" | "vision";
  /** Open time of the last closed candle. */
  asOf: number;
  candles: Candle[];
};

export type MarketResponse = MarketPack | { ok: false; error: string };
