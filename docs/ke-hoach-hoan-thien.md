# Kế hoạch hoàn thiện WYCK — trade simulator

**Phiên bản:** 0.1  
**Đích:** biến bản dựng hiện tại thành một công cụ luyện tập và nghiên cứu có số liệu tin được, không phải thành bot thật.

Đây là kế hoạch gốc. Khi mâu thuẫn với [ke-hoach-phat-trien-wyck.md](./ke-hoach-phat-trien-wyck.md), bản này thắng. Đặc tả pha S0 nằm ở [s0-dac-ta.md](./s0-dac-ta.md). Năm câu hỏi cuối file chưa được chốt; đề xuất nằm trong đặc tả S0, mục “Chưa chốt”.

---

## 0. Định nghĩa "hoàn thiện"

Một simulator hoàn thiện phải trả lời được ba câu, mỗi câu bằng số:

1. **Chiến lược này có lãi sau chi phí không?** → expectancy sau phí, trên phân phối nhiều cửa sổ, không phải trên một run đẹp.
2. **Người tập quyết định tốt hơn hay tệ hơn bot?** → so với ghost baseline trên cùng seed.
3. **Mô phỏng có khớp với thực tế không?** → parity với bản Pine + chi phí mô hình hoá đúng.

Dự án dừng khi cả ba câu trả lời được tự động, trên mọi phiên, và không có con số nào trên màn hình là con số chưa trừ phí.

## 1. Nguyên tắc

- **Trung thực trước, vui sau.** Mọi tính năng game phải bám số liệu thật, không thưởng cho hành vi làm đẹp điểm.
- **Engine đóng băng.** Từ S0 trở đi, engine chỉ được sửa qua test, không sửa tay để "ra kết quả đẹp hơn".
- **Không giấu chi phí.** Không có chế độ "bỏ phí" trong chế độ mặc định; nếu có thì phải ghi rõ.
- **Tái lập được.** Mọi phiên chạy bằng seed, chia sẻ được, chạy lại ra đúng kết quả cũ.

## 2. Non-goals (cắt khỏi phạm vi)

- Không kết nối API key, không đặt lệnh thật. Đó là dự án khác.
- Không đăng nhập, không đa người dùng thời gian thực ở v1. Chỉ seed chia sẻ được qua URL.
- Không app native. Chỉ web responsive.
- Không thêm chỉ báo khác. Chỉ Wyckoff.
- Không backtest đa chiến lược. Một chiến lược, làm sâu.

## 3. Hiện trạng → đích

| Hạng mục | Hiện tại | Đích |
|---|---|---|
| Chi phí | Không có | Phí + trượt giá + funding, hiển thị tách dòng |
| Khớp lệnh | Tại close bar tín hiệu | Tại open bar sau, từ chối nếu gap > 0.5 ATR |
| Tick size | Heuristic theo độ lớn giá | `exchangeInfo` thật, cache |
| Báo cáo | Kỷ lục tốt nhất (localStorage) | Phân phối đầy đủ, expectancy, PF, DD p95 |
| Danh mục | 1 symbol, 1 lệnh | Đa symbol, trần 3 lệnh / 2 cùng chiều |
| Tái lập | Cửa sổ ngẫu nhiên không seed | Seed trong URL, chạy lại được |
| Dữ liệu | Server function gọi thẳng | Cache 2 tầng + corpus offline |
| Review | Không có | Replay phiên đã chạy, chấm quyết định |
| Parity | Không có test | Golden-master so với Pine |

Tick hiện tại nằm ở `mintick()` trong engine: giá ≥ 1000 → 0.1, ≥ 1 → 0.01, còn lại 0.0001. Không đọc `exchangeInfo`.

## 4. Kiến trúc bổ sung

Tách ba lớp, hiện đang trộn trong `DeskApp.tsx` và `engine.ts`:

- `engine/` — state machine, đã có, chỉ thêm lớp chi phí và fill model.
- `ledger/` — sổ phiên: mọi run, mọi quyết định, seed, kết quả. Ghi bất biến.
- `report/` — tổng hợp, phân phối, so ghost.

Engine phát ra `fill` event trung tính; chi phí và fill model áp ở tầng ngoài. Như vậy đổi mô hình chi phí không phải chạm vào state machine.

Hệ quả cho thứ tự sửa: S0 chỉ được thêm vết sự kiện (trace) để so Pine. S1 đặt phí và fill **ngoài** máy trạng thái. Nếu fill đổi giá vào lệnh bên trong `openTrade`, đó là sửa engine và phải có mốc parity mới, tách khỏi bộ 500 sự kiện.

---

## 5. Pha công việc

### S0 — Đóng băng engine & parity harness (6 ngày)

| Việc | Chi tiết |
|---|---|
| Golden master | 500 bộ nến cố định, chạy engine, chụp toàn bộ sự kiện ra JSON |
| Sinh kỳ vọng | Chạy bản Pine ở bar-replay trên cùng bộ, export cùng định dạng |
| Diff runner | So từng sự kiện: loại, bar, giá, điểm, hướng. Sai lệch > 0 là fail |
| CI chặn | Không merge nếu parity < 100% trên bộ này |
| Tách file | Tách engine khỏi route component |

**DoD:** 500/500 bộ khớp tuyệt đối; engine chạy được headless trong test.

**Ghi chú:** phần lớn thời gian ở đây là dựng export từ Pine, không phải viết code. Nếu bỏ qua bước này thì mọi pha sau đều xây trên cát.

Định dạng, cách export và cách hiểu "sai lệch > 0" với số thực: [s0-dac-ta.md](./s0-dac-ta.md).

### S1 — Lớp chi phí & fill (8 ngày)

| Việc | Chi tiết |
|---|---|
| Phí | `FEE_BPS` cấu hình theo sàn, mặc định 4 (taker 0.04%/chiều) |
| Trượt giá | `SLIP_BPS` theo khung: 15m = 2, 1h = 1.5, 4h/1d = 1. Cộng thêm 0.3 ATR nếu entry là market sau gap |
| Funding | Trừ mỗi mốc 8h nếu giữ lệnh qua, dùng rate tĩnh cấu hình được |
| Fill model | Entry tại `open[i+1]`; từ chối và ghi log nếu `\|open - close_signal\| > 0.5 ATR` |
| Tick size | Fetch `exchangeInfo` một lần/symbol, cache 24h, thay `mintick()` |
| Hiển thị | Dock tách `R gộp` và `R sau phí`, mặc định hiện số sau phí |

Công thức chi phí tính theo R để độc lập vốn:

```
costR = (2*FEE_BPS + 2*SLIP_BPS) / 10000 * entry / |entry - sl|
```

**DoD:** mọi run mới đều có `grossR` và `netR`; chênh lệch trung bình 0.10–0.20R/lệnh ở khung 15m đúng như dự tính; không còn chỗ nào hiển thị R gộp mà không nhãn.

### S2 — Lõi thống kê & seed (7 ngày)

| Việc | Chi tiết |
|---|---|
| Seed | `seed = hash(symbol, tf, window, params)`, đưa vào URL |
| Sổ phiên | Lưu mọi run: seed, mode, quyết định, netR, DD, kết quả |
| Báo cáo | Expectancy, PF, win rate, DD p95, phân rã theo grade và khung |
| Hàng loạt | "Chạy 200 cửa sổ" — chạy nền, xuất bảng tổng hợp |
| Thay bảng kỷ lục | Bỏ "Kỷ lục", thay bằng "Phân phối 200 phiên gần nhất" |

**DoD:** một nút cho ra báo cáo 200 phiên trong < 90s; báo cáo có đủ 6 chỉ số; seed trong URL chạy lại ra đúng netR từng lệnh.

### S3 — Chế độ danh mục (6 ngày)

| Việc | Chi tiết |
|---|---|
| Đa symbol | Chọn nhiều cặp, một đồng hồ thời gian chung |
| Trần | 3 lệnh mở, 2 cùng chiều, 1 lệnh/base asset |
| Vốn chung | Một đường equity, risk % tính trên equity tổng |
| Correlation guard | Chặn mở lệnh thứ 2 nếu tương quan 30 nến > 0.8 |

**DoD:** chạy được 5 symbol đồng thời; trần và guard chặn đúng, có log lý do chặn.

### S4 — Vòng lặp review & học (9 ngày)

| Việc | Chi tiết |
|---|---|
| Replay | Xem lại phiên đã chạy, dừng ở từng quyết định |
| Chấm quyết định | Mỗi lần bỏ qua/take/fade được gắn nhãn đúng-sai theo kết quả sau đó 20 nến |
| So ghost | Hiện song song đường ghost và đường của bạn trên cùng seed |
| Thẻ kết phiên | 3 điểm mạnh, 3 điểm yếu rút từ log, không chung chung |
| Bộ đề | 20 seed cố định làm bài tập, có đáp án tham chiếu |

**DoD:** replay được một phiên bất kỳ trong sổ; thẻ kết phiên sinh từ dữ liệu thật, không phải câu mẫu.

**Cảnh báo thiết kế:** nhãn đúng-sai theo kết quả 20 nến sẽ thưởng cho may mắn. Ghi rõ là "kết quả ngắn hạn", đừng gọi là "quyết định đúng".

### S5 — Bền hoá dữ liệu & lỗi (6 ngày)

| Việc | Chi tiết |
|---|---|
| Cache | IndexedDB, TTL 15 phút, khoá theo symbol+tf |
| Prefetch | Nạp trước cặp kế tiếp khi vào bàn |
| Rate limit | Backoff luỹ thừa, xử lý 429/451, hàng đợi 1 request/lần |
| Corpus offline | 3 bộ nến đóng gói sẵn, dùng khi mất mạng |
| Trạng thái lỗi | Mọi nhánh lỗi có màn hình + nút thử lại, không màn hình trắng |
| Mobile | Dock và sheet chạy được ở 375px, không cuộn ngang |

**DoD:** tắt mạng giữa phiên vẫn chơi tiếp được bằng corpus; 375px không vỡ layout.

### S6 — Ra mắt (4 ngày)

| Việc | Chi tiết |
|---|---|
| Analytics | Đếm phiên, tỷ lệ bỏ ngang ở bar thứ N, thời lượng |
| Trang giới thiệu | Nêu rõ: giấy, không phải lời khuyên, số liệu đã trừ phí |
| Hướng dẫn | 1 trang giải thích từng phase, từng grade, cách đọc báo cáo |
| Ghi chú phiên bản | Ghi mọi thay đổi engine, kèm mốc parity |

**DoD:** người mới đọc trang hướng dẫn tự chạy được một phiên mà không cần hỏi.

---

## 6. Cổng chất lượng

| Cổng | Ngưỡng | Chặn pha nào |
|---|---|---|
| Parity | 500/500 | Mọi pha sau S0 |
| Chi phí hiển thị | 100% run có netR | Mọi pha sau S1 |
| Tái lập seed | 100% khớp netR | S2 trở đi |
| Báo cáo 200 phiên | < 90s, đủ 6 chỉ số | S3 trở đi |
| Mobile 375px | Không vỡ layout | S6 |
| Corpus offline | Chơi được không mạng | S6 |

## 7. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Engine lệch bản Pine mà không biết | Cao | S0 làm trước, CI chặn |
| Số liệu đẹp giả do thiếu chi phí | Cao | Cổng 100% netR, không hiện R gộp mặc định |
| Người chơi overfit vào sim | Trung bình | Bộ đề 20 seed cố định, báo cáo phân phối chứ không phải điểm cao |
| Binance chặn IP / 451 | Trung bình | Cache + corpus offline + backoff |
| Sửa engine để "cảm giác đúng hơn" | Trung bình | Mọi thay đổi engine phải kèm test và mốc parity mới |
| Scope phình sang bot thật | Cao | Non-goals ở mục 2, đọc lại trước mỗi pha |

## 8. Thứ tự và tổng lực

S0 → S1 → S2 là xương sống, khoảng **21 ngày**, và sau đó app đã dùng được cho nghiên cứu thật. S3–S6 là **25 ngày** tiếp, làm sau khi có số liệu từ S2.

Không đảo thứ tự. Làm S3 trước S1 sẽ cho ra báo cáo danh mục đẹp nhưng sai.

## 9. Câu hỏi mở

1. Chấp nhận mức phí mặc định 4 bps, hay cần bảng phí theo sàn?
2. Có giữ chế độ fade không, và có tính chi phí riêng cho nó không?
3. Báo cáo 200 phiên chạy trên máy người dùng hay cần backend?
4. Corpus offline đóng gói cặp nào, khung nào?
5. Có cần chế độ "bỏ phí" để so sánh, hay chỉ một chế độ duy nhất?

Chưa chốt. Đề xuất và hệ quả nằm ở [s0-dac-ta.md](./s0-dac-ta.md). Chốt năm mục này trước khi viết code S0.
