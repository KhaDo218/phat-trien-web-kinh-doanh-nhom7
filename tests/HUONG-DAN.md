# Kiểm thử tự động RoomCraft – hướng dẫn cài 1 lần

Thư mục `tests/`. Không đưa lên GitHub: `cau-hinh.json` (URL ghi được vào Sheet), `.env` (API key), `node_modules/`, `anh/`, `ket-qua*/` (đã có trong .gitignore). Báo cáo cuối để nộp nằm ở `BAO-CAO-NOP/`.

## 1. Cài (gõ trong terminal VS Code, làm 1 lần)
```
cd tests
npm install   (cài playwright + exceljs)
npx playwright install chromium
```
(tải khoảng 150 MB trình duyệt Chromium dùng riêng cho test)

## 2. Cho kết quả tự ghi vào Google Sheet (làm 1 lần, 5 phút)
1. Mở Google Sheet của nhóm → **Tiện ích mở rộng → Apps Script**.
2. Xóa code mẫu, dán toàn bộ nội dung file `apps-script.gs` → bấm Lưu.
3. **Triển khai → Tùy chọn triển khai mới → Loại: Ứng dụng web**
   - Thực thi dưới dạng: **Tôi**
   - Ai có quyền truy cập: **Bất kỳ ai**
   - Bấm Triển khai, cấp quyền, **chép URL** (dạng `https://script.google.com/macros/s/.../exec`).
4. Tạo file `cau-hinh.json` trong thư mục này:
   ```json
   { "sheetWebAppUrl": "DÁN_URL_VÀO_ĐÂY" }
   ```
   Không có file này thì kết quả vẫn nằm trong `ket-qua/<phiên>.tsv` để dán tay (bấm ô A trống đầu tiên trong tab Test case → Ctrl+V).

## 3. Chạy
```
node phien/s00-khoi-dong.js      # luôn chạy đầu tiên sau khi pull code mới
node phien/s01-tai-khoan.js
```
Kết quả:
- Màn hình in ĐẠT / KHÔNG ĐẠT từng test case
- `ket-qua/s01.md` tóm tắt + lỗi Console + file 404
- `ket-qua/s01.tsv` đúng 15 cột tab "Test case"
- `anh/TC-S01-03.jpg` ảnh minh chứng (ảnh lỗi có đuôi `_loi.jpg`): có dải chú thích Mã TC / Đạt-Không đạt / mong đợi / thực tế, hiện lại nội dung alert, khoanh đỏ phần tử vừa thao tác (đổi bằng `kq.danhDau('#id')`, tắt bằng `kq.danhDau(null)`)
- `ket-qua/TONG-HOP.xlsx` gộp mọi phiên đã chạy: tab Tổng quan, Test case (ảnh nằm trong ô), Lỗi phát hiện, Console & 404
- Có `cau-hinh.json` → tự gửi lên Google Sheet: ảnh nhỏ chèn trong ô cột L, ảnh gốc lưu ở Drive (thư mục *RoomCraft - Minh chung kiem thu*), cột P là link
- Lỗi Excel "EBUSY" = đang mở file TONG-HOP.xlsx → đóng Excel rồi chạy `node lib/xuat-excel.js`

## 4. Ghi chú
- Khung test tự mở web (cổng 5599), **không cần bật Live Server**.
- Mặc định **chặn mọi kết nối Internet** (CDN, Google, AI) → đồng thời kiểm tra web chạy được khi mất mạng.
- Mỗi lần chạy dùng dữ liệu sạch từ `data/json` (không ảnh hưởng dữ liệu trên Chrome của bạn).

## 5. Giao phiên cho AI và chốt kết quả (bổ sung 03/11/2026)
- `node tools/giao-phien.mjs s05` : DeepSeek viết file phiên theo `tools/pham-vi.json` + `tools/api-khung.md` → chạy → tự sửa lỗi script → phân loại test KHÔNG ĐẠT (`ket-qua/s05-phan-loai.md`). Thêm `--chi-chay` để không viết lại.
- Mọi test KHÔNG ĐẠT phải được người xác minh, ghi vào `ket-qua/DUYET-LOI.md` (Mã TC | Kết luận | Mức độ | Ghi chú).
- `node tools/chot-ket-qua.js --gui` : áp mức độ đã duyệt → xuất `TONG-HOP.xlsx` → gửi cả 11 phiên kèm ảnh lên Google Sheet.
- Báo cáo: `ket-qua/BAO-CAO-KIEM-THU.md` → `python tools/md-sang-docx.py ket-qua/BAO-CAO-KIEM-THU.md ket-qua/BAO-CAO-KIEM-THU.docx`.
- Kiểm thử hồi quy sau khi sửa lỗi: chạy lại s00, s08, s09, s10 rồi `node tools/chot-ket-qua.js --gui`.

## 6. Đợt 2–3: đa trình duyệt, xác nhận sửa lỗi (bổ sung 06/11/2026)
- Cấu hình: edge, chrome, firefox, webkit, iphone, android (Pixel 7), ipad. Edge từ bản 156 được mở qua CDP (`moEdge()` trong `lib/khung-test.js`); đổi đường dẫn bằng biến `QA_EDGE_EXE` nếu cần.
- Chạy 1 cấu hình: `QA_DOT=d3 node tools/chay-cau-hinh.js iphone --song-song 2 [--phien s03,s04]` → `ket-qua/d3/<cấu hình>/`. Thêm `QA_KHONG_GUI=1` để không gửi Sheet.
- Tổng hợp đợt 3 (so với đợt 2), gửi tab Đ3-*, viết báo cáo đợt 3: `node tools/dot3.js` (`--bo-gui` để không gửi).
- Báo cáo tổng kết 4 phase + tab "Tổng kết kiểm thử": `node tools/bao-cao-tong.js`.
- Test case thuộc giới hạn đã biết / rủi ro được chấp nhận: `tools/chap-nhan.js` (dữ liệu gốc giữ nguyên, khi tổng hợp không tính vào mẫu số).
- Chỉ chạy một tiến trình gửi Google Sheet tại một thời điểm.
