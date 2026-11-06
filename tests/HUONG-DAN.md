# Kiểm thử tự động RoomCraft – hướng dẫn chạy

Bộ kiểm thử dùng Node.js + Playwright, chạy website RoomCraft trên trình duyệt thật, ghi kết quả từng test case kèm ảnh minh chứng.

Không đưa lên GitHub (đã có trong `.gitignore`): `node_modules/`, `anh/`, `ket-qua*/`, `cau-hinh.json`.

## 1. Cài đặt (làm 1 lần)
```
cd tests
npm install
npx playwright install chromium
```
Muốn chạy thêm Firefox / Safari (WebKit): `npx playwright install firefox webkit`.

## 2. Ghi kết quả vào Google Sheet (không bắt buộc)
1. Mở Google Sheet của nhóm → **Tiện ích mở rộng → Apps Script**, dán nội dung `apps-script.gs`, lưu.
2. **Triển khai → Tùy chọn triển khai mới → Ứng dụng web** (Thực thi: Tôi; Quyền truy cập: Bất kỳ ai) → chép URL.
3. Tạo `cau-hinh.json` trong thư mục `tests/`:
   ```json
   { "sheetWebAppUrl": "DÁN_URL_VÀO_ĐÂY" }
   ```
Không có file này thì kết quả vẫn nằm trong `ket-qua/` để dán tay.

## 3. Chạy một phiên
```
node phien/s00-khoi-dong.js      # luôn chạy đầu tiên sau khi pull code mới
node phien/s05-gio-thanh-toan.js
```
Kết quả:
- Màn hình in ĐẠT / KHÔNG ĐẠT từng test case.
- `ket-qua/<phiên>.md`: tóm tắt, lỗi Console, file 404.
- `ket-qua/<phiên>.tsv`: đúng các cột của tab "Test case".
- `anh/<Mã TC>.jpg`: ảnh minh chứng (ảnh lỗi có đuôi `_loi.jpg`), có dải chú thích mã TC, kết quả mong đợi và thực tế.
- `ket-qua/TONG-HOP.xlsx`: gộp mọi phiên đã chạy (Tổng quan, Test case, Lỗi phát hiện, Console & 404).

## 4. Chạy trên nhiều trình duyệt / thiết bị
```
node tools/chay-cau-hinh.js iphone --song-song 2 [--phien s03,s04]
```
Cấu hình: `edge`, `chrome`, `firefox`, `webkit`, `iphone`, `android` (Pixel 7), `ipad`. Kết quả nằm ở `ket-qua/<đợt>/<cấu hình>/` (đặt đợt bằng biến `QA_DOT`, ví dụ `QA_DOT=d3`). Thêm `QA_KHONG_GUI=1` để không gửi Sheet.

## 5. Chốt kết quả
- Mọi test KHÔNG ĐẠT được thành viên xác minh (đọc mã nguồn, tái hiện) và ghi vào `ket-qua/DUYET-LOI.md` (Mã TC | Kết luận | Mức độ | Ghi chú).
- `node tools/chot-ket-qua.js --gui`: áp kết luận đã duyệt, xuất `TONG-HOP.xlsx`, gửi lên Google Sheet.
- Test case thuộc giới hạn đã biết / rủi ro được chấp nhận được khai trong `tools/chap-nhan.js` (dữ liệu gốc giữ "Không đạt", khi tổng hợp không tính vào mẫu số).
- Gửi lại kết quả đã có: `node tools/gui-lai.js`, `node tools/gui-tat-ca.js`.

## 6. Ghi chú
- Khung test tự mở web ở cổng 5599, **không cần Live Server**.
- Mặc định **chặn kết nối Internet** → đồng thời kiểm tra web chạy được khi mất mạng; phiên cần mạng đặt `choMang: true`.
- Mỗi lần chạy dùng dữ liệu sạch từ `data/json`, không ảnh hưởng dữ liệu trên trình duyệt cá nhân.
- Edge bản mới được mở qua CDP (`moEdge()` trong `lib/khung-test.js`); đổi đường dẫn bằng biến `QA_EDGE_EXE` nếu cần.
- Checklist kiểm tra trên điện thoại thật: `tools/checklist-may-that.md`.
- Tài liệu khung test (các hàm `t.mo`, `t.tc`, `kq.dat`…): `tools/api-khung.md`; phạm vi từng phiên: `tools/pham-vi.json`.
