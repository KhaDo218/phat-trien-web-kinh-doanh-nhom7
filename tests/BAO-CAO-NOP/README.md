# Hồ sơ kiểm thử RoomCraft – bản cuối (06/11/2026)

| File | Nội dung |
|---|---|
| 1-BAO-CAO-TONG-KET-KIEM-THU.docx | Báo cáo tổng kết 4 phase (văn phong học thuật): phương pháp, đối chiếu phase, truy vết, rủi ro, đề xuất |
| 2-BAO-CAO-KIEM-THU-DOT3.docx | Đợt 3 – kiểm thử xác nhận và hồi quy sau sửa lỗi, 7 cấu hình |
| 3-BAO-CAO-KIEM-THU-DOT2.docx | Đợt 2 – hồi quy, tương thích đa trình duyệt, E2E, audit |
| 4-KE-HOACH-TEST.md | Kế hoạch kiểm thử |
| 5-NHAT-KY-SUA-LOI-VA-THAY-DOI-TEST.md | Bản sửa từng lỗi, thay đổi công cụ/script, phân loại lại cuối đợt 3 |

**Kết quả cuối (Phase 3, tính trên số test áp dụng):** Edge 98,5% · Chrome 98,5% · Firefox 98,5% · Safari/WebKit 98,0% · iPad 98,0% · Pixel 7 97,7% · iPhone 14 97,4%.
9 lỗi Phase 2: 7 đã sửa và kiểm chứng; BUG-02 là giới hạn kiến trúc đã biết (web không có máy chủ); BUG-07 là rủi ro được chấp nhận (giữ chất lượng ảnh/video). 0 lỗi còn mở, 0 test mới hỏng.

Dữ liệu chi tiết và ảnh minh chứng: Google Sheet của nhóm (tab Đ1-*, Đ2-*, Đ3-*, Đ0-Nhật ký lỗi (chuẩn hóa), Tổng kết kiểm thử). Tab gốc của nhóm (Test (27/10), Việc cần làm (28-31/10)) giữ nguyên.
Bản sửa website: nhánh `fix/loi-dot2`, cần nhóm review trước khi merge vào `main`.
