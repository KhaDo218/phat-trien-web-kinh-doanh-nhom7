# Khung kiểm thử RoomCraft – tài liệu cho người viết file phiên

Website: HTML/CSS/JS thuần, dữ liệu nạp từ data/json vào localStorage (khóa `rc_<bảng>`), không có backend.
Khung tự mở web tại http://localhost:5599, trình duyệt Chromium (Playwright 1.48, CommonJS), chặn Internet.

## Cấu trúc 1 file phiên (bắt buộc)
```js
const { phien, TAI_KHOAN } = require('../lib/khung-test');
phien({ ma: 's05', ten: 'Giỏ hàng & Thanh toán' }, async (t) => {
    await t.tc({ ma: 'TC-S05-01', trang: 'cart.html', chucNang: '...', tienDieuKien: '...', cacBuoc: '1. ... 2. ...',
                 duLieu: '...', mongDoi: '...cụ thể...', mucDoNeuLoi: 'Nghiêm trọng'|'Trung bình'|'Nhẹ', manHinh: 'pc'|'mobile' },
        async (kq) => { /* các bước Playwright */ kq.dat(dieuKien, 'mô tả thực tế đọc được'); });
});
```

## API
- `await t.mo(trang, { manHinh, vaiTro: 'khach'|'user'|'admin', moi: true })` → trả về page Playwright. `trang` tương đối từ thư mục scripts/, vd `'checkout.html'`, `'admin/orders.html'`, `'product-detail.html?id=12'`. `moi: true` = dữ liệu sạch (localStorage mới). Đổi `manHinh` cũng tạo ngữ cảnh mới. Không có `moi` thì giữ localStorage (giỏ hàng, đơn...) của bước trước.
- `t.trang` = page đang mở (dùng tiếp ở test case sau mà không mở lại).
- `t.alertCuoi()` = nội dung alert gần nhất (khung tự bấm OK). `t.xoaAlert()` xóa danh sách alert trước khi thao tác.
- Khung TỰ xử lý mọi alert/confirm/prompt (bấm OK). TUYỆT ĐỐI KHÔNG tự viết `p.on('dialog', ...)` hay `p.once('dialog', ...)`. Muốn bấm Hủy ở confirm kế tiếp: gọi `t.huyConfirm()` trước thao tác.
- `await t.chu(selector)` = innerText đã gộp khoảng trắng (null nếu không có phần tử). `await t.chu()` = cả body.
- `await t.bang('orders')` = mảng bản ghi của bảng trong localStorage (products, orders, users, coupons, reviews, carts…). Dùng để tính kết quả mong đợi từ dữ liệu và kiểm tra dữ liệu sau thao tác.
- `await t.traNgang()` = số px bị cuộn ngang (0 = tốt).
- `kq.dat(dieuKien, 'mô tả thực tế')` gọi cho mỗi điều kiện; một cái sai → test KHÔNG ĐẠT. `kq.ghi('...')` ghi thêm thông tin.
- `kq.danhDau('#id')` chọn phần tử khoanh đỏ trong ảnh (mặc định: phần tử thao tác cuối). `kq.danhDau(null)` không khoanh.
- `TAI_KHOAN.user` = { email: 'user@roomcraft.vn', matKhau: 'User@123' }, `TAI_KHOAN.admin` = { email: 'admin@roomcraft.vn', matKhau: 'Admin@123' }.

## Hàm toàn cục của web, gọi qua `await p.evaluate(() => ...)`
getTable(ten), saveTable(ten, mang), findById(ten, id), getObject(ten), saveObject(ten, obj), getSession(), getCurrentUser(), login(email, mk) (trả chuỗi lỗi hoặc rỗng), logout(), addToCart(productId, soLuong), getCart(), clearCart(), getCartTotal(), checkCoupon(ma, tamTinh), createOrder(thongTin), cancelOrder(id), updateOrderStatus(id, trangThai), calcShippingFee(method, zone, tamTinh), getProvinceZone(tenTinh), formatVND(so).
Mã OTP: `JSON.parse(localStorage.getItem('rc_verification_codes'))` (xem cấu trúc trong auth.js).
Chuẩn bị dữ liệu nhanh (vd. sửa tồn kho, tạo đơn ở trạng thái Shipping) bằng getTable/saveTable rồi `p.reload()`.

## Quy tắc viết
1. Selector, id, câu alert/thông báo lấy NGUYÊN VĂN từ mã nguồn được cung cấp. Không bịa id.
2. Kết quả mong đợi theo nghiệp vụ đúng (yêu cầu trong kế hoạch), không chép theo code. Code làm sai → test KHÔNG ĐẠT là đúng (phát hiện lỗi).
3. Số liệu mong đợi (số sản phẩm sau lọc, tiền, tồn kho) tính từ `t.bang(...)` lúc chạy, không ghi cứng con số đoán.
4. Sau thao tác chờ `await p.waitForTimeout(300..1500)` hoặc `p.waitForURL(...)`. Đổi trang bằng click thì chờ URL.
5. Mỗi test case kiểm 1 ý, `mongDoi` cụ thể. Đủ 5 loại: luồng đúng; bỏ trống/sai định dạng; giá trị biên (đúng ngưỡng và vượt 1 đơn vị); phân quyền; kiểm tra dữ liệu sau thao tác bằng t.bang. Ít nhất 2 test `manHinh: 'mobile'`.
6. Không dùng thư viện ngoài, không sửa website, không dùng `test()`/`expect` của @playwright/test.
7. Mỗi test case phải tự chạy được kể cả khi test trước lỗi: nếu cần trạng thái riêng thì tự `t.mo(..., { moi: true })` và chuẩn bị dữ liệu.
