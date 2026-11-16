//#region node_modules/.nitro/vite/services/ssr/assets/symbols-CjfDfauc.js
var MARKETS = [
	{
		symbol: "BTCUSDT",
		name: "Bitcoin"
	},
	{
		symbol: "ETHUSDT",
		name: "Ether"
	},
	{
		symbol: "SOLUSDT",
		name: "Solana"
	},
	{
		symbol: "BNBUSDT",
		name: "BNB"
	},
	{
		symbol: "XRPUSDT",
		name: "XRP"
	},
	{
		symbol: "DOGEUSDT",
		name: "Dogecoin"
	},
	{
		symbol: "AVAXUSDT",
		name: "Avalanche"
	},
	{
		symbol: "LINKUSDT",
		name: "Chainlink"
	},
	{
		symbol: "ADAUSDT",
		name: "Cardano"
	},
	{
		symbol: "SUIUSDT",
		name: "Sui"
	},
	{
		symbol: "LTCUSDT",
		name: "Litecoin"
	},
	{
		symbol: "BCHUSDT",
		name: "Bitcoin Cash"
	}
];
var INTERVALS = [
	{
		id: "15m",
		label: "15 phút",
		minutes: 15
	},
	{
		id: "1h",
		label: "1 giờ",
		minutes: 60
	},
	{
		id: "4h",
		label: "4 giờ",
		minutes: 240
	},
	{
		id: "1d",
		label: "1 ngày",
		minutes: 1440
	}
];
function intervalMeta(id) {
	return INTERVALS.find((x) => x.id === id) ?? INTERVALS[1];
}
/** Higher-timeframe bias, in minutes. Matches the script default of 4h when the chart is faster. */
function htfMinutes(chartMinutes) {
	if (chartMinutes < 240) return 240;
	if (chartMinutes < 1440) return 1440;
	return 10080;
}
function campaignSpan(interval) {
	if (interval === "15m") return {
		warmup: 80,
		play: 480
	};
	if (interval === "1h") return {
		warmup: 80,
		play: 420
	};
	if (interval === "4h") return {
		warmup: 60,
		play: 320
	};
	return {
		warmup: 40,
		play: 260
	};
}
//#endregion
export { intervalMeta as a, htfMinutes as i, MARKETS as n, campaignSpan as r, INTERVALS as t };
