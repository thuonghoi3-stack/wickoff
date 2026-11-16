# Đặc tả S0 — golden master và diff

**Trạng thái:** bản nháp để chốt, chưa phải cổng CI.  
**Bám:** [ke-hoach-hoan-thien.md](./ke-hoach-hoan-thien.md) pha S0.  
**Không làm trong S0:** phí, slippage, funding, fill tại `open[i+1]`, seed URL, báo cáo 200 phiên. Những thứ đó bắt đầu ở S1/S2 và dùng mốc parity riêng.

S0 trả lời câu 3 của định nghĩa hoàn thiện, phần “có khớp Pine không”, trên sự kiện và lệnh theo hành vi hiện tại (vào tại close của nến tín hiệu).

---

## 1. Đề xuất cho năm câu hỏi mở

Chưa được duyệt. Viết ở đây để khỏi chặn đặc tả; sửa một dòng nếu chọn khác.

| # | Đề xuất | Vì sao |
|---|---|---|
| 1 | Phí mặc định **5 bps/chiều** (taker VIP 0 của Binance USDT-M, 0.050%), không phải 4. Một hằng `FEE_BPS`, không có bảng theo sàn ở S1. Đổi số là đổi phiên bản sổ, không đổi engine | 4 bps thấp hơn biểu phí công khai VIP 0. Một hằng đủ cho “không giấu phí” |
| 2 | **Giữ fade.** Cùng phí, cùng slippage, cùng fill với lệnh thuận. Không có biểu phí riêng | Fade là một quyết định cần đo ở câu 2. Chi phí của nó là chi phí một lệnh market ngược chiều |
| 3 | Báo cáo 200 phiên **chạy trên máy người dùng**, engine headless, nến lấy từ corpus đã tải. Không backend | Không đăng nhập ở v1. Job dài trên server không tái lập được trên từng phiên |
| 4 | Corpus offline: **BTCUSDT, ETHUSDT, SOLUSDT**, mỗi cặp một đoạn **1h** (≥ 1000 nến) và riêng BTC một đoạn **15m**. Ghi thời điểm đầu và nguồn trong file | Đủ chơi mất mạng và đủ mẫu cho diff thật. 500 bộ parity không nằm trong ba file này |
| 5 | **Không có chế độ bỏ phí.** Mọi run vẫn lưu `grossR` và `netR`. Màn hình mặc định chỉ hiện `netR`. `grossR` chỉ xuất hiện kèm nhãn “chưa trừ phí” | Khớp cả nguyên tắc “không giấu” và DoD “mọi run có hai số” |

Nếu câu 1 giữ 4 bps như bản 0.1, chỉ đổi hằng. Các câu còn lại không đổi định dạng golden master.

---

## 2. Hai mốc parity, không trộn

| Mốc | So cái gì | Khi nào khóa |
|---|---|---|
| `pine-v1` | Sự kiện sơ đồ + lệnh theo close của nến tín hiệu, chưa phí | S0. Cổng 500/500 |
| `fill-v2` | Giá khớp, lệnh bị từ chối vì gap, `netR` | S1. Bộ file khác, không sửa `pine-v1` cho khớp fill mới |

S1 được phép làm expectancy lệch Pine. Không được phép sửa `pine-v1` để khỏi đỏ. Lệch fill ghi vào changelog kèm mốc mới.

---

## 3. Vì sao không chụp nhãn đang vẽ

`cleanup()` chỉ giữ `keepN` sơ đồ. Nhãn trên chart không phải tập sự kiện đầy đủ. `born` là chuỗi text đã ghép (`"Test · A"`, `"Cắt +0.50R"`), mất giá và bar của một số sự kiện, và `phase()` không đẩy vào `born`.

Vết parity phải ghi **lúc phát sinh**, trước cleanup, từ một hàm trace thuần. Thêm trace không được đổi `st`, lệnh, hay điểm. Test S0 đầu tiên: bật trace rồi tắt, snapshot và danh sách lệnh đóng phải giống nhau từng bit trên một fixture.

---

## 4. Định dạng một bộ

Đường dẫn: `fixtures/parity/<id>.json`.

`id` là slug ổn định, ví dụ `btc-1h-20240301-a`. Không dùng hash làm tên file.

```json
{
  "epoch": "pine-v1",
  "id": "btc-1h-20240301-a",
  "symbol": "BTCUSDT",
  "interval": "1h",
  "params": {},
  "candles": [
    { "t": 1709251200000, "o": 62310.1, "h": 62880, "l": 62102.4, "c": 62755, "v": 1234.5 }
  ],
  "events": [
    {
      "bar": 87,
      "t": 1709564400000,
      "kind": "mark",
      "code": "SC",
      "dir": 1,
      "price": 62102.4,
      "score": null,
      "grade": null
    }
  ]
}
```

Quy ước:

- `params` chỉ ghi khóa khác `DEFAULT_PARAMS`. Rỗng nghĩa là đúng bộ Eye mặc định, `commitEntries: true`.
- `t` là thời điểm **mở** nến, mili-giây UTC. Đây là khóa nối với Pine, không dùng `bar_index` của TradingView.
- `bar` là chỉ số trong `candles` của file này, bắt đầu từ 0. Diff bỏ qua `bar` nếu `t` khớp; `bar` chỉ để đọc lỗi.
- Nến sắp tăng dần theo `t`, không trùng `t`, không thiếu trường.
- `events` sắp theo `(t, kind, code, price)`.

`kind` và `code` được phép:

| kind | code | price | dir | score | grade |
|---|---|---|---|---|---|
| `mark` | `SC` `BC` `AR` `ST` `Spring` `UTAD` `Test` `SOS` `SOW` `LPS` `LPSY` `FAIL` | mức giá nhãn | +1 tích lũy, −1 phân phối | null, trừ Test / LPS / LPSY | null, trừ khi nhãn có grade |
| `phase` | `A` `B` `C` `D` `E` | null | chiều sơ đồ | null | null |
| `proposal` | loại lệnh engine (`Spring Test`, `LPS`, …) | giá vào theo close | chiều lệnh | số nguyên 0–100 | `A` `B` `C` |
| `open` | cùng loại | giá vào đã mở | chiều lệnh | điểm lúc mở | grade lúc mở |
| `exit` | `TP1` `TP2` `TP3` `SL` `TIME` `FAIL` | giá thoát | chiều lệnh | null | null |

`FAIL` thay cho ký tự ✕. Lý do thoát map từ `exitText` hiện có; nếu một chuỗi chưa có mã, thêm mã trong trace chứ không so bằng câu tiếng Việt.

Không ghi vào golden: text tip, màu, tọa độ hộp, log UI, vốn đô, ghost. Những cái đó không có bên Pine.

Lệnh scale-out là nhiều event `exit` (`TP1` rồi `TP2`…). Mỗi event một lần chạm, không gộp thành một R cuối trong `pine-v1`. R thuộc `fill-v2`.

---

## 5. Export từ Pine

Pine không đọc JSON của repo và không ghi file. Chiều đúng là: **nến của TradingView là nguồn**, rồi engine chạy trên đúng các nến đó.

Trên mỗi cửa sổ:

1. Mở đúng symbol, đúng khung, đúng đoạn. Gắn bản chỉ báo Eye gốc, không sửa điều kiện.
2. Thêm một bản sao cùng file, chỉ để `log.info`, không thêm tín hiệu. Mỗi sự kiện một dòng, một prefix cố định:

```text
WYCK1 {"t":1709564400000,"kind":"mark","code":"SC","dir":1,"price":62102.4,"score":null,"grade":null}
```

3. `t` lấy `time` của nến sự kiện (thời điểm mở). Giá lấy đúng giá nhãn / giá vào mà chỉ báo đang dùng.
4. Xuất OHLC của cùng đoạn từ TradingView (CSV) hoặc chép từ data window. Không lấy nến Binance Vision cho bộ này rồi hy vọng trùng TV: lệch một nến làm hỏng cả diff mà không phải lỗi luật.
5. Đổi CSV thành `candles`, ghép dòng `WYCK1` thành `events`, ghi `fixtures/parity/<id>.json`.
6. Commit kèm file. Cấm chạy engine TypeScript rồi dùng chính output đó làm `events` kỳ vọng. Kỳ vọng chỉ đến từ log Pine.

500 bộ là việc lặp 500 lần. Bộ nào chưa có log Pine thì chưa tính vào 500. Không “tạm” lấy output engine để đủ số.

Gợi ý thứ tự lấy mẫu, cho lệch loại thị trường chứ không chỉ BTC tăng:

- 12 cặp đang có trên bàn, khung 1h là xương sống
- mỗi cặp ít nhất một đoạn có Spring và một đoạn không có climax
- thêm 15m và 4h cho BTC và ETH
- cắt đoạn sau khi đã có ≥ `climaxLook + emaLen` nến (50), nếu không engine và Pine đều im ở đầu và diff ra “khớp” giả

---

## 6. Diff

Runner headless, không mở trình duyệt, không gọi mạng.

Với mỗi file:

1. Dựng `WyckoffEngine` từ `params` + mặc định.
2. `push` lần lượt `candles`.
3. Gom trace thành cùng schema, cùng thứ tự sắp.
4. So với `events`.

Khóa một sự kiện: `(t, kind, code, dir)`. Trùng khóa trong một bên là lỗi fixture, không phải lệch.

"Sai lệch > 0" của bản kế hoạch không áp được kiểu bit-equal lên ATR và EMA. Pine và JavaScript không cùng phép làm tròn. Quy ước dưới đây **là** định nghĩa của lệch 0 trong `pine-v1`. Giá và điểm trong dung sai thì coi như khớp; ngoài dung sai là fail.

| Trường | Khớp khi |
|---|---|
| `kind`, `code`, `dir`, `grade`, `t` | bằng nhau |
| `score` | cùng null, hoặc cùng số nguyên. Engine làm tròn điểm về int trước khi ghi trace |
| `price` | cùng null, hoặc \|Δ\| ≤ max(10⁻⁸ × \|price\|, 10⁻⁶) |

Không nới dung sai để một bộ chuyển từ đỏ sang xanh. Nếu một cửa sổ lệch có hệ thống vì `ta.stdev` population và `ta.atr` Wilder, sửa engine cho khớp Pine rồi ghi một dòng changelog. Không nâng epsilon.

Fail in ra tối đa 20 dòng đầu: `id`, khóa sự kiện, trường, giá trị Pine, giá trị engine. Thiếu hoặc thừa sự kiện tính là fail của bộ đó.

Cổng: 500 file, 500 pass. 499 là chưa xong S0.

Ngoài 500 file Pine, được thêm test nội bộ không tính vào cổng:

- Trace bật/tắt không đổi lệnh.
- `push` tới nến `i` rồi dừng, bằng engine mới push `0..i` (nhân quả). Bộ này tự viết, không cần TV.

---

## 7. Cái CI chạy được và cái không

CI của repo chỉ chạy được vế engine so với JSON đã commit. CI không mở được TradingView.

Vì vậy “không merge khi parity < 100%” nghĩa là:

- mọi file trong `fixtures/parity/` phải pass
- thư mục đó đủ 500 file `epoch: pine-v1` thì cổng S0 mới đóng
- trước khi đủ 500, cổng chưa tồn tại; không lấy 20 file rồi tuyên bố S0 xong

Cấm script “làm mới golden từ engine”. Muốn sửa một file kỳ vọng thì phải kèm log Pine mới trong commit.

---

## 8. Tách file trong S0

Chỉ tách những gì cần để test headless chạy không kéo UI:

- Giữ `WyckoffEngine` ở `src/lib/wyckoff/engine.ts` (đường import hiện tại). Không đổi thuật toán khi chuyển chỗ.
- Trace và kiểu `ParityEvent` nằm cạnh engine.
- Runner diff là một test, không nằm trong `DeskApp.tsx`.
- Chưa tạo `ledger/` và `report/`. Đó là S2.

`DeskApp.tsx` tiếp tục gọi engine như cũ. S0 không đổi bàn chơi, không thêm nút, không hiện phí.

---

## 9. Việc không được làm dù tiện

- Chạy 500 cửa sổ Binance Vision, lưu output engine, gọi đó là golden master.
- So bằng câu nhật ký tiếng Việt.
- Coi nhãn còn trên chart (sau `keepN`) là đủ sự kiện.
- Đổi `climaxZ`, `springPen`, hay bất kỳ tham số Eye nào cho “khớp hơn vài cửa sổ”.
- Nhét fill `open[i+1]` vào cùng bộ `pine-v1`.
- Bắt đầu S1 khi thư mục parity chưa đủ 500 pass.

---

## 10. Xong S0 khi

1. 500 file `fixtures/parity/*.json`, mỗi file có `events` lấy từ log Pine và `candles` lấy từ cùng chart.
2. Runner headless pass 500/500 theo mục 6.
3. Test nhân quả và test “trace không đổi lệnh” pass.
4. Changelog có một dòng: engine khóa ở `pine-v1`, ngày, số file.
5. Bàn chơi vẫn chạy một vòng như trước S0. Không có số phí trên màn hình — phí chưa tồn tại, chưa được bịa.
