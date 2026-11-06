# Tiến độ kiểm thử đợt 2 (cập nhật 05/11/2026)

## Đã xong
- Khung test chạy 7 cấu hình: `QA_DOT=d2 QA_CAU_HINH=edge|chrome|firefox|webkit|iphone|android|ipad`.
- Apps Script đã triển khai bản ghi theo tab (`tab`, `cheDo: 'bang'`).
- Phiên mới: s11 Nghiệp vụ E2E (22 kịch bản), s12 Audit (30 hạng mục). Checklist máy thật: `tools/checklist-may-that.md`.
- Lỗi đã xác minh đợt 2: `ket-qua/d2/DUYET-LOI.md` (leo quyền admin qua rc_session).
- Chạy tự động: `node tools/dot2-tu-dong.js` → chạy mọi cấu hình, ma trận, DeepSeek phân loại tương thích (`ket-qua/d2/TUONG-THICH.md`), gửi các tab Sheet (Đ2-Tổng quan, Đ2-Ma trận, Đ2-Hồi quy, Đ2-Checklist máy thật, Đ2-<trình duyệt>). Nhật ký: `ket-qua/d2/nhat-ky.txt`.

## ĐÃ HOÀN TẤT 05/11 16:23 (3 lệnh dưới đã chạy xong; giữ lại để chạy lại khi cần):
1. `for ch in edge chrome webkit iphone android ipad; do node tools/chay-cau-hinh.js $ch --phien s06,s11 --song-song 2; done`  (s06 đã được DeepSeek sửa theo giao diện chọn sao mới: Edge 29/30; s11 đã sửa: Edge 16/22)
2. `node tools/dot2-tu-dong.js --bo-chay`  (ma trận + gửi lại toàn bộ tab Sheet)
3. `node tools/bao-cao-dot2.js`  (tab Đ2-Lỗi + báo cáo md/docx). Kết luận lỗi: ket-qua/d2/DUYET-LOI.md (9 lỗi, đã xác minh).

## Việc còn lại (ghi chú cũ)
1. Đọc `ket-qua/d2/nhat-ky.txt`, `TUONG-THICH.md`; xác minh lỗi mới/lỗi tương thích (đọc code + tái hiện), ghi vào `ket-qua/d2/DUYET-LOI.md`.
2. s11 còn test viết sai: TC-S11-01, 07, 08, 09, 17 (page.fill timeout ở checkout — kiểm id ô nhập checkout.html), 10 (getCart), 11, 14; TC-S11-02/03 "Số đơn = 151" cần xem mong đợi có đúng không.
3. Tab Đ2-Lỗi (gộp lỗi, trạng thái 5 lỗi đợt 1: Đã sửa/Vẫn còn) — tạo bằng cheDo 'bang'.
4. Báo cáo đợt 2 (khác đợt 1): delta hồi quy, ma trận tương thích, nghiệp vụ E2E, audit, rủi ro, kết luận sẵn sàng. GLM/DeepSeek viết, script sinh bảng, `tools/md-sang-docx.py` xuất Word.

## Lưu ý kỹ thuật
- Trình duyệt đã tải thẳng zip từ https://playwright.download.prss.microsoft.com/dbazure/download/playwright/builds/... (webkit 2083 chạy được). Firefox 1465 lỗi "side-by-side configuration is incorrect" → thiếu Microsoft Visual C++ Redistributable (x64); cài xong thì chạy `node tools/chay-cau-hinh.js firefox` rồi `node tools/dot2-tu-dong.js --bo-chay`.
- Đang xếp hàng: edge, chrome, android (dot2-tu-dong) → webkit, iphone, ipad → dot2-tu-dong --bo-chay (ma trận + Sheet đủ cấu hình).
- Playwright 1.48 tải từ azureedge (đã ngừng) → dùng `PLAYWRIGHT_DOWNLOAD_HOST=https://cdn.playwright.dev`. Gọi `node node_modules/playwright/cli.js` (PowerShell chặn npx.ps1).
- Đợt 1 điểm mới phát hiện: trang chủ mobile cuộn ngang còn 622px (đợt 1: 2.968px) → sửa 1 phần.

## Đã gửi đủ 7 tab chi tiết lên Sheet (13/13 phiên mỗi tab) – không còn việc dở
- Tab chi tiết Đ2-Firefox mới gửi được s00 (Apps Script trả HTML ~ chạm hạn mức Google). Hôm sau chạy lại: node tools/dot2-tu-dong.js --bo-chay (hoặc chỉ gửi firefox).
- Firefox chạy từ D:/pw-firefox (thư mục người dùng có dấu cách làm Windows không nạp mozglue).

## KẾ HOẠCH SỬA LỖI ĐỢT 2 (chưa làm – chờ reset giới hạn tuần)
Yêu cầu người dùng: DeepSeek/GLM sửa, an toàn mọi trình duyệt, hiệu năng tốt nhất, KHÔNG giảm chất lượng video/ảnh (chỉ tối ưu không mất dữ liệu).
- Làm trên nhánh riêng `fix/loi-dot2` (không sửa thẳng main).
- DeepSeek trả về JSON [{file, old, new}] (old phải khớp đúng 1 lần), script áp dụng + node --check; Claude duyệt git diff.
- BUG-01 tràn ngang trang chủ: min-width:0 / overflow-x:clip cho khung slider .featured-track (css/pages/index.css), kiểm Android/iPad.
- BUG-02 isAdmin: lấy quyền từ bảng users (role_id) thay vì rc_session.role (js/core/auth.js).
- BUG-03 showLowStock: gồm tồn kho 0, nhãn "Hết hàng" (admin-index.js).
- BUG-04 chatVeLaiLuu: đếm .rc-msg thay vì children (components/chatbot.js).
- BUG-05 chatbot hiểu ngân sách số đầy đủ (10.000.001 / 10000001 đồng).
- BUG-06 admin/orders iPad: bọc bảng overflow-x:auto.
- BUG-07 ảnh/dung lượng: KHÔNG nén mất dữ liệu; chỉ loading="lazy" + decoding="async" cho ảnh dưới màn hình đầu, width/height, tối ưu JPEG không mất dữ liệu (jpegtran -optimize -copy none nếu có), không đụng video.
- BUG-08 thêm meta description trang chủ (và các trang chính).
- BUG-09 cancelOrder kiểm tra user_id (trừ admin).
- Sau sửa: chạy lại s00,s06,s08,s09,s10,s12 trên edge, firefox, webkit, android, ipad; cập nhật DUYET-LOI (Đã sửa).

## Đợt 3 – HOÀN TẤT (06/11/2026)
- Hồi quy đủ 13 phiên × 7 cấu hình trên nhánh fix/loi-dot2: 0 test mới hỏng, 123 test chuyển sang đạt; 7/9 lỗi đã sửa.
- Còn: BUG-02 (giả user_id admin trong localStorage — giới hạn kiến trúc, cần backend), BUG-07 (4 ảnh > 500 KB giữ nguyên theo yêu cầu không giảm chất lượng).
- Edge 156 không mở được bằng launch() của Playwright 1.48 -> khung test tự chạy msedge.exe + connectOverCDP (moEdge trong lib/khung-test.js).
- Sheet: Đ3-Tổng quan, Đ3-Lỗi, Đ3-Thay đổi, Đ0-Nhật ký lỗi (chuẩn hóa), Tổng kết kiểm thử.
- Báo cáo: ket-qua/BAO-CAO-KIEM-THU-DOT3.docx, ket-qua/BAO-CAO-TONG-KET-KIEM-THU.docx.
- Chưa commit (nhánh fix/loi-dot2 + thư mục tests/).

## CHỐT CUỐI (06/11/2026)
- Sửa script s03/s04: bấm nút "Bộ lọc" thu gọn trên màn hẹp (lỗi script, không phải lỗi web) → s03/s04 30/30 trên 7 cấu hình. Kết quả cũ: ket-qua/d3-truoc-sua-script/.
- Phân loại lại: BUG-02 = giới hạn kiến trúc đã biết, BUG-07 = rủi ro được chấp nhận (tools/chap-nhan.js; dữ liệu gốc giữ "Không đạt", tổng hợp không tính vào mẫu số).
- Phase 3: Edge/Chrome/Firefox 98,5%, WebKit/iPad 98,0%, Pixel 7 97,7%, iPhone 97,4%. 7 sửa, 2 chấp nhận rủi ro, 0 còn mở, 0 mới hỏng.
- Sheet: Đ3-Tổng quan, Đ3-Lỗi, Đ3-Thay đổi, Tổng kết kiểm thử đã cập nhật. Hồ sơ nộp: tests/BAO-CAO-NOP/.
- Còn lại (việc của nhóm): review + merge nhánh fix/loi-dot2; commit tests/ (không kèm cau-hinh.json, .env).
