# Hiện trạng bàn WYCK

> Bản này không còn là lộ trình. Lộ trình là [ke-hoach-hoan-thien.md](./ke-hoach-hoan-thien.md). Ở đây chỉ ghi những gì đang chạy, để S0 không phải đào lại UI.

Vốn giấy. Không phải lời khuyên đầu tư. Cập nhật: 2026-11-16.

## Vòng đang chạy

| Việc | Hiện tại |
|---|---|
| Vốn | $10,000 |
| Cháy | Vốn ≤ 70% vốn đầu thì dừng |
| Rủi ro | 0.5% / 1% / 2% của (vốn đầu + R đã chốt) lúc vào lệnh |
| Tốc độ | 1× 2× 4× 8× 16× |
| Phím | Space chạy/dừng, `N` tới sự kiện kế |
| Kỷ lục | Một số R trong `localStorage` (`wyck-best-v1`), không seed, không trừ phí |
| Chế độ | Bot tự vào, hoặc dừng sheet: vào / đánh ngược / bỏ. Khi flat được Mua/Bán tay |
| Tua hết | Bỏ mọi sheet. Không được tính là một phiên nghiên cứu |
| Ghost | Cùng `WyckoffEngine`, cùng tham số, chạy kín trước vòng; chỉ hiện lúc kết |
| Âm | Oscillator ngắn, không ảnh hưởng số |

Warmup không phát lệnh (`armTrades = false`). Người chơi bắt đầu sau warmup.

## Luật sự kiện

`WyckoffEngine` trong `src/lib/wyckoff/engine.ts`, tham số `DEFAULT_PARAMS` theo Eye: climax z 2, ATR 1.3, Spring tối đa 1 ATR, SOS z 0.3, scale-out 1/3, grade A ≥ 75, B ≥ 55. Mặc định bàn lấy grade tối thiểu B.

Sự kiện vẽ được: SC, BC, AR, ST, Spring, UTAD, Test, SOS, SOW, LPS, LPSY, biên gãy. Pha A–E. HTF: khung dưới 4h dùng 4h, 4h dùng 1d, 1d dùng 1w.

Tick size là heuristic trong `mintick()`, chưa phải `exchangeInfo`. Vào lệnh tại close nến tín hiệu. Chưa có phí, trượt giá, funding.

Nhãn trên chart bị `cleanup()` cắt theo `keepN`. Tập nhãn đang vẽ không phải nhật ký đầy đủ. Parity phải trace lúc phát sinh — xem [s0-dac-ta.md](./s0-dac-ta.md).

## Dữ liệu

Nến futures UM qua Binance Vision, cache trong RAM tiến trình.

| Khung | Mục tiêu nến | Warmup | Nến chơi |
|---|---:|---:|---:|
| 15 phút | 960 | 80 | 480 |
| 1 giờ | 1000 | 80 | 420 |
| 4 giờ | 900 | 60 | 320 |
| 1 ngày | 540 | 40 | 260 |

Mười hai cặp `*USDT`: BTC, ETH, SOL, BNB, XRP, DOGE, AVAX, LINK, ADA, SUI, LTC, BCH.

Cửa sổ “ngẫu nhiên” dùng `Math.random`, không seed, không đưa vào URL. Tắt ngẫu nhiên thì lấy đuôi chuỗi.

## Đã có trong repo, không thuộc v1

`src/lib/multiplayer/` là phòng WebRTC, client tự tính kết quả. Bản hoàn thiện cắt đa người dùng thời gian thực. Không gắn vào bàn.

Auth và Postgres có trong khung app, tắt. Kỷ lục local không phải lý do bật tài khoản.
