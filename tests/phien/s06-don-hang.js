const { phien, TAI_KHOAN } = require('../lib/khung-test');

// orders.html không nạp cart.js/shipping.js/products.js -> nạp thêm để tạo đơn bằng createOrder
async function napDichVu(p) {
    for (const f of ['js/services/products.js', 'js/services/cart.js', 'js/services/shipping.js'])
        await p.addScriptTag({ url: f });
}

phien({ ma: 's06', ten: 'Đơn hàng & Đánh giá' }, async (t) => {

    // Tiện ích: lấy user hiện tại (đăng nhập) và id
    async function userId(p) {
        return await p.evaluate(() => { const u = getCurrentUser(); return u ? u.id : null; });
    }

    // =================================================================
    // NHÓM 1: DANH SÁCH ĐƠN CỦA TÔI
    // =================================================================

    await t.tc({
        ma: 'TC-S06-01', trang: 'orders.html', chucNang: 'Danh sách đơn - hiển thị đúng đơn của người đăng nhập',
        tienDieuKien: 'Đăng nhập user@roomcraft.vn có đơn hàng', cacBuoc: '1. Mở orders.html 2. Đọc bảng đơn hàng',
        duLieu: 'Tài khoản user', mongDoi: 'Bảng chỉ chứa đơn của user đang đăng nhập, số dòng = số đơn của user', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        const orders = await t.bang('orders');
        const cuaToi = orders.filter(o => o.user_id == uid);
        const soDong = await p.locator('#tbOrders tr').count();
        kq.dat(soDong == cuaToi.length, 'Số dòng bảng = ' + soDong + ', số đơn của user = ' + cuaToi.length);
        // Kiểm tra không lẫn đơn người khác
        const maDonHienThi = await p.locator('#tbOrders tr td:first-child').allInnerTexts();
        const maDonCuaToi = cuaToi.map(o => '#' + o.id);
        const lanDon = maDonHienThi.filter(m => !maDonCuaToi.includes(m.trim()));
        kq.dat(lanDon.length == 0, 'Số mã đơn lạ (không thuộc user): ' + lanDon.length);
    });

    await t.tc({
        ma: 'TC-S06-02', trang: 'orders.html', chucNang: 'Danh sách đơn - đúng số sản phẩm và tổng tiền',
        tienDieuKien: 'Đăng nhập user có đơn', cacBuoc: '1. Mở orders.html 2. So sánh cột Số sản phẩm và Tổng tiền với dữ liệu',
        duLieu: 'Dữ liệu orders', mongDoi: 'Cột Số sản phẩm = tổng quantity các item; Tổng tiền = formatVND(total_amount)', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        const orders = (await t.bang('orders')).filter(o => o.user_id == uid);
        if (orders.length == 0) { kq.ghi('User không có đơn để kiểm'); kq.dat(false, 'Không có đơn'); return; }
        // getOrdersByUser sắp xếp mới nhất (id lớn nhất) lên đầu → sort trước khi lấy
        orders.sort((a, b) => Number(b.id) - Number(a.id));
        const o0 = orders[0];
        const soSpMong = o0.items.reduce((s, it) => s + Number(it.quantity), 0);
        const dong0 = p.locator('#tbOrders tr').first();
        const soSpThuc = (await dong0.locator('td').nth(2).innerText()).trim();
        kq.dat(Number(soSpThuc) == soSpMong, 'Số sản phẩm hiển thị = ' + soSpThuc + ', mong đợi = ' + soSpMong);
        const tienThuc = (await dong0.locator('td').nth(3).innerText()).trim();
        const tienMong = await p.evaluate((v) => formatVND(v), o0.total_amount);
        kq.dat(tienThuc == tienMong, 'Tổng tiền hiển thị = "' + tienThuc + '", mong đợi = "' + tienMong + '"');
    });

    await t.tc({
        ma: 'TC-S06-03', trang: 'orders.html', chucNang: 'Danh sách đơn - đơn mới nhất xếp đầu',
        tienDieuKien: 'Đăng nhập user có nhiều đơn', cacBuoc: '1. Mở orders.html 2. Đọc thứ tự mã đơn',
        duLieu: 'Dữ liệu orders', mongDoi: 'Đơn có id lớn nhất (mới nhất) hiển thị ở dòng đầu tiên', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        const orders = (await t.bang('orders')).filter(o => o.user_id == uid);
        if (orders.length < 2) { kq.ghi('User ít đơn, bỏ qua so sánh thứ tự'); kq.dat(true, 'Không đủ đơn'); return; }
        const maxId = Math.max(...orders.map(o => Number(o.id)));
        const dongDau = (await p.locator('#tbOrders tr td:first-child').first().innerText()).trim();
        kq.dat(dongDau == '#' + maxId, 'Dòng đầu = "' + dongDau + '", đơn mới nhất = #' + maxId);
    });

    await t.tc({
        ma: 'TC-S06-04', trang: 'orders.html', chucNang: 'Danh sách đơn - trạng thái hiển thị đúng tiếng Việt',
        tienDieuKien: 'Đăng nhập user có đơn', cacBuoc: '1. Mở orders.html 2. Đọc cột Trạng thái',
        duLieu: 'Dữ liệu orders', mongDoi: 'Trạng thái hiển thị đúng nhãn: Đã xác nhận/Đang đóng gói/Đang giao hàng/Đã giao/Đã hủy', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        const orders = (await t.bang('orders')).filter(o => o.user_id == uid);
        if (orders.length == 0) { kq.dat(true, 'Không có đơn'); return; }
        // Nhãn chuẩn cố định theo nghiệp vụ (không dùng getStatusText làm oracle)
        const NHAN = { Confirmed: 'Đã xác nhận', Packing: 'Đang đóng gói', Shipping: 'Đang giao hàng', Delivered: 'Đã giao', Cancelled: 'Đã hủy' };
        // getOrdersByUser sắp xếp mới nhất lên đầu → sort trước khi lấy dòng đầu
        orders.sort((a, b) => Number(b.id) - Number(a.id));
        const o0 = orders[0];
        const nhanMong = NHAN[o0.status];
        // Đọc textContent để không bị CSS text-transform: uppercase làm sai lệch
        const nhanThuc = (await p.locator('#tbOrders tr').first().locator('td').nth(4).textContent()).trim();
        kq.dat(nhanThuc.toLowerCase() == String(nhanMong).toLowerCase(),
            'Nhãn trạng thái = "' + nhanThuc + '", mong đợi = "' + nhanMong + '"');
    });

    await t.tc({
        ma: 'TC-S06-05', trang: 'orders.html', chucNang: 'Danh sách đơn - chưa đăng nhập bị chặn',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Gõ thẳng orders.html',
        duLieu: 'Không đăng nhập', mongDoi: 'Bị chuyển về trang đăng nhập, không thấy bảng đơn', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1000);
        kq.dat(/login\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
        const coBang = await p.locator('#tbOrders').count();
        kq.dat(coBang == 0, 'Số bảng đơn hiển thị = ' + coBang);
    });

    await t.tc({
        ma: 'TC-S06-06', trang: 'orders.html', chucNang: 'Danh sách đơn - mobile không cuộn ngang',
        tienDieuKien: 'Đăng nhập user, màn hình mobile', cacBuoc: '1. Mở orders.html trên mobile 2. Đo cuộn ngang',
        duLieu: 'Màn hình 375px', mongDoi: 'Không bị cuộn ngang (0px)', mucDoNeuLoi: 'Nhẹ', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(800);
        const cuon = await t.traNgang();
        kq.dat(cuon == 0, 'Số px cuộn ngang = ' + cuon);
    });

    // =================================================================
    // NHÓM 2: CHI TIẾT ĐƠN ĐÚNG SỐ LIỆU
    // =================================================================

    await t.tc({
        ma: 'TC-S06-07', trang: 'order-detail.html', chucNang: 'Chi tiết đơn - đúng số liệu tiền',
        tienDieuKien: 'Đăng nhập user có đơn', cacBuoc: '1. Mở chi tiết đơn của user 2. Đọc tạm tính, phí ship, giảm giá, tổng',
        duLieu: 'Đơn mới nhất của user', mongDoi: 'Tạm tính/phí ship/giảm giá/tổng khớp dữ liệu đơn', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        const orders = (await t.bang('orders')).filter(o => o.user_id == uid);
        if (orders.length == 0) { kq.dat(false, 'User không có đơn'); return; }
        orders.sort((a, b) => Number(b.id) - Number(a.id));
        const o0 = orders[0];
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + o0.id));
        await p.waitForTimeout(800);
        const body = await t.chu();
        const f = (v) => p.evaluate((x) => formatVND(x), v);
        kq.dat(body.includes(await f(o0.subtotal)), 'Có tạm tính ' + await f(o0.subtotal));
        kq.dat(body.includes(await f(o0.shipping_fee)), 'Có phí ship ' + await f(o0.shipping_fee));
        kq.dat(body.includes(await f(o0.discount_amount)), 'Có giảm giá ' + await f(o0.discount_amount));
        kq.dat(body.includes(await f(o0.total_amount)), 'Có tổng cộng ' + await f(o0.total_amount));
    });

    await t.tc({
        ma: 'TC-S06-08', trang: 'order-detail.html', chucNang: 'Chi tiết đơn - đúng số lượng và đơn giá từng sản phẩm',
        tienDieuKien: 'Đăng nhập user có đơn', cacBuoc: '1. Mở chi tiết đơn 2. Đọc dòng sản phẩm',
        duLieu: 'Đơn mới nhất', mongDoi: 'Mỗi dòng hiển thị "đơn giá x số lượng" và thành tiền = đơn giá * số lượng', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        const orders = (await t.bang('orders')).filter(o => o.user_id == uid);
        if (orders.length == 0) { kq.dat(false, 'User không có đơn'); return; }
        orders.sort((a, b) => Number(b.id) - Number(a.id));
        const o0 = orders[0];
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + o0.id));
        await p.waitForTimeout(800);
        const it = o0.items[0];
        const donGia = await p.evaluate((v) => formatVND(v), it.unit_price);
        const thanhTien = await p.evaluate((v) => formatVND(v), it.unit_price * it.quantity);
        const body = await t.chu();
        kq.dat(body.includes(donGia + ' x ' + it.quantity), 'Có "' + donGia + ' x ' + it.quantity + '"');
        kq.dat(body.includes(thanhTien), 'Có thành tiền ' + thanhTien);
    });

    await t.tc({
        ma: 'TC-S06-09', trang: 'order-detail.html', chucNang: 'Chi tiết đơn - xem đơn của người khác bị chặn',
        tienDieuKien: 'Đăng nhập user', cacBuoc: '1. Mở order-detail.html?id=<đơn của user khác>',
        duLieu: 'id đơn thuộc user khác', mongDoi: 'Hiện "Không tìm thấy đơn hàng.", không lộ thông tin đơn', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        const orders = await t.bang('orders');
        const donKhac = orders.find(o => o.user_id != uid);
        if (!donKhac) { kq.dat(true, 'Không có đơn người khác'); return; }
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + donKhac.id));
        await p.waitForTimeout(800);
        const body = await t.chu();
        kq.dat(body.includes('Không tìm thấy đơn hàng.'), 'Có thông báo không tìm thấy');
        kq.dat(!body.includes(donKhac.shipping_phone), 'Không lộ SĐT người nhận');
    });

    await t.tc({
        ma: 'TC-S06-10', trang: 'order-detail.html', chucNang: 'Chi tiết đơn - id không tồn tại',
        tienDieuKien: 'Đăng nhập user', cacBuoc: '1. Mở order-detail.html?id=999999',
        duLieu: 'id = 999999', mongDoi: 'Hiện "Không tìm thấy đơn hàng."', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('order-detail.html?id=999999', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const body = await t.chu();
        kq.dat(body.includes('Không tìm thấy đơn hàng.'), 'Có thông báo không tìm thấy');
    });

    await t.tc({
        ma: 'TC-S06-11', trang: 'order-detail.html', chucNang: 'Chi tiết đơn - mobile hiển thị đúng tổng tiền',
        tienDieuKien: 'Đăng nhập user, mobile', cacBuoc: '1. Mở chi tiết đơn trên mobile 2. Đọc tổng cộng',
        duLieu: 'Đơn mới nhất', mongDoi: 'Tổng cộng hiển thị đúng, không cuộn ngang', mucDoNeuLoi: 'Nhẹ', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        const orders = (await t.bang('orders')).filter(o => o.user_id == uid);
        if (orders.length == 0) { kq.dat(false, 'User không có đơn'); return; }
        orders.sort((a, b) => Number(b.id) - Number(a.id));
        const o0 = orders[0];
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + o0.id));
        await p.waitForTimeout(800);
        const tong = await p.evaluate((v) => formatVND(v), o0.total_amount);
        const body = await t.chu();
        kq.dat(body.includes(tong), 'Có tổng cộng ' + tong);
        const cuon = await t.traNgang();
        kq.dat(cuon == 0, 'Số px cuộn ngang = ' + cuon);
    });

    // =================================================================
    // NHÓM 3: HỦY ĐƠN
    // =================================================================

    await t.tc({
        ma: 'TC-S06-12', trang: 'order-detail.html', chucNang: 'Hủy đơn Confirmed - hoàn tồn kho',
        tienDieuKien: 'Đơn ở trạng thái Confirmed', cacBuoc: '1. Mở chi tiết đơn Confirmed 2. Bấm Hủy đơn 3. Xác nhận',
        duLieu: 'Đơn Confirmed của user', mongDoi: 'Đơn chuyển Cancelled, tồn kho từng sản phẩm tăng đúng số lượng đã đặt', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        // Chuẩn bị: chọn đơn Confirmed của user, nếu không có thì tạo
        let orders = await t.bang('orders');
        let don = orders.find(o => o.user_id == uid && o.status == 'Confirmed');
        if (!don) {
            // tạo đơn Confirmed bằng createOrder
            await napDichVu(p);
            await p.evaluate(() => {
                const prod = getTable('products').find(x => x.is_active !== false && x.stock_quantity > 5);
                clearCart(); addToCart(prod.id, 2);
                createOrder({ shipping_name: 'Test', shipping_phone: '0900000000', shipping_email: 'a@b.c',
                    shipping_province: 'Đồng Nai', shipping_ward: 'Phường Trấn Biên', shipping_street: 'Số 1',
                    house_type: 'Nhà phố / nhà riêng', shipping_note: '', payment_method: 'COD',
                    payment_plan: 'COD', shipping_method_id: 1, coupon_code: '', card_last4: '' });
            });
            await p.waitForTimeout(300);
            orders = await t.bang('orders');
            don = orders.filter(o => o.user_id == uid && o.status == 'Confirmed').sort((a, b) => b.id - a.id)[0];
        }
        const tonTruoc = {};
        const prods = await t.bang('products');
        for (const it of don.items) {
            const pr = prods.find(x => x.id == it.product_id);
            tonTruoc[it.product_id] = pr ? pr.stock_quantity : null;
        }
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + don.id));
        await p.waitForTimeout(800);
        t.xoaAlert();
        await p.click("input[value='Hủy đơn hàng']");
        await p.waitForTimeout(800);
        kq.dat(t.alertCuoi() == 'Đã hủy đơn hàng!', 'Alert: "' + t.alertCuoi() + '"');
        const sau = await t.bang('orders');
        const donSau = sau.find(o => o.id == don.id);
        kq.dat(donSau.status == 'Cancelled', 'Trạng thái sau = ' + donSau.status);
        const prodsSau = await t.bang('products');
        let hoanDung = true;
        for (const it of don.items) {
            const pr = prodsSau.find(x => x.id == it.product_id);
            if (pr.stock_quantity != tonTruoc[it.product_id] + it.quantity) hoanDung = false;
        }
        kq.dat(hoanDung, 'Tồn kho hoàn lại đúng số lượng');
    });

    await t.tc({
        ma: 'TC-S06-13', trang: 'order-detail.html', chucNang: 'Hủy đơn cọc - ghi hoàn tiền đã trả',
        tienDieuKien: 'Đơn Confirmed thanh toán cọc (DEPOSIT)', cacBuoc: '1. Mở chi tiết đơn cọc 2. Hủy đơn',
        duLieu: 'Đơn Confirmed payment_plan=DEPOSIT', mongDoi: 'refund_amount = paid_amount, amount_due = 0, hiện "hoàn lại ..."', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        // Tạo đơn cọc
        await napDichVu(p);
        await p.evaluate(() => {
            const prod = getTable('products').find(x => x.is_active !== false && x.stock_quantity > 5);
            clearCart(); addToCart(prod.id, 1);
            createOrder({ shipping_name: 'Test', shipping_phone: '0900000000', shipping_email: 'a@b.c',
                shipping_province: 'Đồng Nai', shipping_ward: 'Phường Trấn Biên', shipping_street: 'Số 1',
                house_type: 'Nhà phố / nhà riêng', shipping_note: '', payment_method: 'Bank Transfer',
                payment_plan: 'DEPOSIT', shipping_method_id: 1, coupon_code: '', card_last4: '' });
        });
        await p.waitForTimeout(300);
        const orders = await t.bang('orders');
        const don = orders.filter(o => o.user_id == uid && o.status == 'Confirmed' && o.payment_plan == 'DEPOSIT').sort((a, b) => b.id - a.id)[0];
        if (!don) { kq.dat(false, 'Không tạo được đơn cọc'); return; }
        const paid = Number(don.paid_amount);
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + don.id));
        await p.waitForTimeout(800);
        t.xoaAlert();
        await p.click("input[value='Hủy đơn hàng']");
        await p.waitForTimeout(800);
        const sau = (await t.bang('orders')).find(o => o.id == don.id);
        kq.dat(Number(sau.refund_amount) == paid, 'refund_amount = ' + sau.refund_amount + ', paid = ' + paid);
        kq.dat(Number(sau.amount_due) == 0, 'amount_due = ' + sau.amount_due);
        const body = await t.chu();
        const hoan = await p.evaluate((v) => formatVND(v), paid);
        kq.dat(body.includes('hoàn lại ' + hoan), 'Có câu hoàn lại ' + hoan);
    });

    await t.tc({
        ma: 'TC-S06-14', trang: 'order-detail.html', chucNang: 'Không hủy được đơn Shipping',
        tienDieuKien: 'Đơn ở trạng thái Shipping', cacBuoc: '1. Mở chi tiết đơn Shipping 2. Kiểm tra nút hủy',
        duLieu: 'Đơn Shipping của user', mongDoi: 'Không hiện nút "Hủy đơn hàng"', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        // Chuẩn bị đơn Shipping
        await p.evaluate((u) => {
            const orders = getTable('orders');
            const don = orders.find(o => o.user_id == u && o.status == 'Confirmed');
            if (don) { don.status = 'Shipping'; saveTable('orders', orders); }
        }, uid);
        await p.reload(); await p.waitForTimeout(600);
        const orders = await t.bang('orders');
        const don = orders.find(o => o.user_id == uid && o.status == 'Shipping');
        if (!don) { kq.dat(true, 'Không có đơn Shipping để kiểm'); return; }
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + don.id));
        await p.waitForTimeout(800);
        const coNut = await p.locator("input[value='Hủy đơn hàng']").count();
        kq.dat(coNut == 0, 'Số nút hủy = ' + coNut);
    });

    await t.tc({
        ma: 'TC-S06-15', trang: 'order-detail.html', chucNang: 'cancelOrder - gọi trực tiếp đơn Shipping bị từ chối',
        tienDieuKien: 'Đơn Shipping', cacBuoc: '1. Gọi cancelOrder(id) qua evaluate',
        duLieu: 'Đơn Shipping', mongDoi: 'Trả câu lỗi "không thể hủy", trạng thái vẫn Shipping, tồn kho không đổi', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        await p.evaluate((u) => {
            const orders = getTable('orders');
            const don = orders.find(o => o.user_id == u && o.status == 'Confirmed');
            if (don) { don.status = 'Shipping'; saveTable('orders', orders); }
        }, uid);
        await p.reload(); await p.waitForTimeout(600);
        const orders = await t.bang('orders');
        const don = orders.find(o => o.user_id == uid && o.status == 'Shipping');
        if (!don) { kq.dat(true, 'Không có đơn Shipping'); return; }
        const prodsTruoc = await t.bang('products');
        const loi = await p.evaluate((id) => cancelOrder(id), don.id);
        kq.dat(loi != '', 'Câu lỗi: "' + loi + '"');
        const sau = (await t.bang('orders')).find(o => o.id == don.id);
        kq.dat(sau.status == 'Shipping', 'Trạng thái vẫn = ' + sau.status);
        const prodsSau = await t.bang('products');
        let khongDoi = true;
        for (const it of don.items) {
            const a = prodsTruoc.find(x => x.id == it.product_id);
            const b = prodsSau.find(x => x.id == it.product_id);
            if (a.stock_quantity != b.stock_quantity) khongDoi = false;
        }
        kq.dat(khongDoi, 'Tồn kho không đổi');
    });

    await t.tc({
        ma: 'TC-S06-16', trang: 'order-detail.html', chucNang: 'Hủy đơn Packing - được phép',
        tienDieuKien: 'Đơn ở trạng thái Packing', cacBuoc: '1. Mở chi tiết đơn Packing 2. Bấm Hủy đơn',
        duLieu: 'Đơn Packing', mongDoi: 'Hủy thành công, trạng thái Cancelled', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        await p.evaluate((u) => {
            const orders = getTable('orders');
            const don = orders.find(o => o.user_id == u && o.status == 'Confirmed');
            if (don) { don.status = 'Packing'; saveTable('orders', orders); }
        }, uid);
        await p.reload(); await p.waitForTimeout(600);
        const orders = await t.bang('orders');
        const don = orders.find(o => o.user_id == uid && o.status == 'Packing');
        if (!don) { kq.dat(true, 'Không có đơn Packing'); return; }
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + don.id));
        await p.waitForTimeout(800);
        t.xoaAlert();
        await p.click("input[value='Hủy đơn hàng']");
        await p.waitForTimeout(800);
        const sau = (await t.bang('orders')).find(o => o.id == don.id);
        kq.dat(sau.status == 'Cancelled', 'Trạng thái sau = ' + sau.status);
    });

    await t.tc({
        ma: 'TC-S06-17', trang: 'order-detail.html', chucNang: 'Hủy đơn - bấm Cancel ở hộp xác nhận thì không hủy',
        tienDieuKien: 'Đơn Confirmed', cacBuoc: '1. Mở chi tiết đơn 2. Bấm Hủy đơn 3. Bấm Cancel ở confirm',
        duLieu: 'Đơn Confirmed', mongDoi: 'Đơn vẫn Confirmed, không hoàn tồn kho', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        const orders = await t.bang('orders');
        const don = orders.find(o => o.user_id == uid && o.status == 'Confirmed');
        if (!don) { kq.dat(true, 'Không có đơn Confirmed'); return; }
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + don.id));
        await p.waitForTimeout(800);
        t.huyConfirm();
        await p.click("input[value='Hủy đơn hàng']");
        await p.waitForTimeout(600);
        const sau = (await t.bang('orders')).find(o => o.id == don.id);
        kq.dat(sau.status == 'Confirmed', 'Trạng thái sau = ' + sau.status);
    });

    // =================================================================
    // NHÓM 4: ĐÁNH GIÁ
    // =================================================================

    await t.tc({
        ma: 'TC-S06-18', trang: 'order-detail.html', chucNang: 'Đánh giá - chỉ hiện form khi Delivered',
        tienDieuKien: 'Đơn Confirmed', cacBuoc: '1. Mở chi tiết đơn Confirmed 2. Kiểm tra khu đánh giá',
        duLieu: 'Đơn Confirmed', mongDoi: 'Không có khu "Đánh giá sản phẩm"', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        const orders = await t.bang('orders');
        const don = orders.find(o => o.user_id == uid && o.status == 'Confirmed');
        if (!don) { kq.dat(true, 'Không có đơn Confirmed'); return; }
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + don.id));
        await p.waitForTimeout(800);
        const co = await p.locator('.review-section').count();
        kq.dat(co == 0, 'Số khu đánh giá = ' + co);
    });

    await t.tc({
        ma: 'TC-S06-19', trang: 'order-detail.html', chucNang: 'Đánh giá - hiện form khi Delivered',
        tienDieuKien: 'Đơn Delivered chưa đánh giá', cacBuoc: '1. Mở chi tiết đơn Delivered 2. Kiểm tra form',
        duLieu: 'Đơn Delivered', mongDoi: 'Có khu đánh giá với select sao và textarea cho từng sản phẩm', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        // Chuẩn bị đơn Delivered chưa đánh giá
        await p.evaluate((u) => {
            const orders = getTable('orders');
            const don = orders.find(o => o.user_id == u && o.status == 'Confirmed');
            if (don) { don.status = 'Delivered'; saveTable('orders', orders); }
        }, uid);
        await p.reload(); await p.waitForTimeout(600);
        const orders = await t.bang('orders');
        const don = orders.find(o => o.user_id == uid && o.status == 'Delivered');
        if (!don) { kq.dat(true, 'Không có đơn Delivered'); return; }
        // Xóa review cũ của user cho sản phẩm trong đơn
        await p.evaluate((d) => {
            let reviews = getTable('reviews');
            reviews = reviews.filter(r => !(r.user_id == d.user_id && d.items.some(it => it.product_id == r.product_id)));
            saveTable('reviews', reviews);
        }, don);
        await p.reload(); await p.waitForTimeout(600);
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + don.id));
        await p.waitForTimeout(800);
        const co = await p.locator('.review-section').count();
        kq.dat(co == 1, 'Số khu đánh giá = ' + co);
        const coSelect = await p.locator('#cboRating0').count();
        kq.dat(coSelect == 1, 'Có select sao #cboRating0 = ' + coSelect);
    });

    await t.tc({
        ma: 'TC-S06-20', trang: 'order-detail.html', chucNang: 'Đánh giá - bỏ trống nhận xét',
        tienDieuKien: 'Đơn Delivered chưa đánh giá', cacBuoc: '1. Mở chi tiết đơn 2. Chọn 4 sao 3. Để trống nhận xét 4. Bấm Gửi đánh giá',
        duLieu: 'Đã chọn sao, nhận xét trống', mongDoi: 'Báo "Vui lòng nhập nhận xét của bạn!", không thêm review', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        await p.evaluate((u) => {
            const orders = getTable('orders');
            const don = orders.find(o => o.user_id == u && o.status == 'Confirmed');
            if (don) { don.status = 'Delivered'; saveTable('orders', orders); }
        }, uid);
        await p.reload(); await p.waitForTimeout(600);
        const orders = await t.bang('orders');
        const don = orders.find(o => o.user_id == uid && o.status == 'Delivered');
        if (!don) { kq.dat(true, 'Không có đơn Delivered'); return; }
        await p.evaluate((d) => {
            let reviews = getTable('reviews');
            reviews = reviews.filter(r => !(r.user_id == d.user_id && d.items.some(it => it.product_id == r.product_id)));
            saveTable('reviews', reviews);
        }, don);
        await p.reload(); await p.waitForTimeout(600);
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + don.id));
        await p.waitForTimeout(800);
        const soReviewTruoc = (await t.bang('reviews')).length;
        t.xoaAlert();
        // Phải chọn sao trước, nếu không website báo "Vui lòng chọn số sao cho sản phẩm!"
        await p.click(".review-box .star-picker[data-i='0'] button[data-v='4']");
        await p.waitForTimeout(200);
        await p.click(".review-box input[value='Gửi đánh giá']");
        await p.waitForTimeout(400);
        kq.dat(t.alertCuoi() == 'Vui lòng nhập nhận xét của bạn!', 'Alert: "' + t.alertCuoi() + '"');
        const soReviewSau = (await t.bang('reviews')).length;
        kq.dat(soReviewSau == soReviewTruoc, 'Số review không đổi: ' + soReviewSau);
    });

    await t.tc({
        ma: 'TC-S06-21', trang: 'order-detail.html', chucNang: 'Đánh giá - gửi thành công lưu vào bảng reviews',
        tienDieuKien: 'Đơn Delivered chưa đánh giá', cacBuoc: '1. Chọn 4 sao 2. Nhập nhận xét 3. Bấm Gửi',
        duLieu: '4 sao, "Sản phẩm tốt"', mongDoi: 'Alert "Cảm ơn bạn đã đánh giá!", bảng reviews có bản ghi mới đúng rating/comment', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        await p.evaluate((u) => {
            const orders = getTable('orders');
            const don = orders.find(o => o.user_id == u && o.status == 'Confirmed');
            if (don) { don.status = 'Delivered'; saveTable('orders', orders); }
        }, uid);
        await p.reload(); await p.waitForTimeout(600);
        const orders = await t.bang('orders');
        const don = orders.find(o => o.user_id == uid && o.status == 'Delivered');
        if (!don) { kq.dat(true, 'Không có đơn Delivered'); return; }
        await p.evaluate((d) => {
            let reviews = getTable('reviews');
            reviews = reviews.filter(r => !(r.user_id == d.user_id && d.items.some(it => it.product_id == r.product_id)));
            saveTable('reviews', reviews);
        }, don);
        await p.reload(); await p.waitForTimeout(600);
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + don.id));
        await p.waitForTimeout(800);
        const soTruoc = (await t.bang('reviews')).length;
        t.xoaAlert();
        // #cboRating0 là input hidden, không phải <select> → chọn sao bằng nút trong .star-picker
        await p.click(".review-box .star-picker[data-i='0'] button[data-v='4']");
        await p.fill('#txtComment0', 'Sản phẩm tốt');
        await p.click(".review-box input[value='Gửi đánh giá']");
        await p.waitForTimeout(600);
        kq.dat(t.alertCuoi() == 'Cảm ơn bạn đã đánh giá!', 'Alert: "' + t.alertCuoi() + '"');
        const reviews = await t.bang('reviews');
        kq.dat(reviews.length == soTruoc + 1, 'Số review tăng 1: ' + soTruoc + ' -> ' + reviews.length);
        const moi = reviews[reviews.length - 1];
        kq.dat(moi.user_id == uid && moi.product_id == don.items[0].product_id, 'Review đúng user & sản phẩm');
        kq.dat(Number(moi.rating) == 4 && moi.comment == 'Sản phẩm tốt', 'rating=' + moi.rating + ', comment="' + moi.comment + '"');
    });

    await t.tc({
        ma: 'TC-S06-22', trang: 'order-detail.html', chucNang: 'Đánh giá - không đánh giá 2 lần',
        tienDieuKien: 'User đã đánh giá sản phẩm trong đơn Delivered', cacBuoc: '1. Mở chi tiết đơn 2. Kiểm tra khu đánh giá',
        duLieu: 'Đã có review', mongDoi: 'Hiện "Cảm ơn bạn đã đánh giá sản phẩm này!", không có form gửi', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        await p.evaluate((u) => {
            const orders = getTable('orders');
            const don = orders.find(o => o.user_id == u && o.status == 'Confirmed');
            if (don) { don.status = 'Delivered'; saveTable('orders', orders); }
        }, uid);
        await p.reload(); await p.waitForTimeout(600);
        const orders = await t.bang('orders');
        const don = orders.find(o => o.user_id == uid && o.status == 'Delivered');
        if (!don) { kq.dat(true, 'Không có đơn Delivered'); return; }
        // Đảm bảo đã có review
        await p.evaluate((d) => {
            let reviews = getTable('reviews');
            reviews = reviews.filter(r => !(r.user_id == d.user_id && d.items.some(it => it.product_id == r.product_id)));
            reviews.push({ id: getNextId('reviews'), user_id: d.user_id, product_id: d.items[0].product_id,
                rating: 5, comment: 'Đã đánh giá', review_image_url: null, is_hidden: false, created_at: new Date().toISOString() });
            saveTable('reviews', reviews);
        }, don);
        await p.reload(); await p.waitForTimeout(600);
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + don.id));
        await p.waitForTimeout(800);
        const body = await t.chu();
        kq.dat(body.includes('Cảm ơn bạn đã đánh giá sản phẩm này!'), 'Có thông báo đã đánh giá');
        const coForm = await p.locator('#cboRating0').count();
        kq.dat(coForm == 0, 'Số form đánh giá = ' + coForm);
    });

    await t.tc({
        ma: 'TC-S06-23', trang: 'order-detail.html', chucNang: 'addReview - gọi trực tiếp lần 2 bị từ chối',
        tienDieuKien: 'Đã có review của user cho sản phẩm', cacBuoc: '1. Gọi addReview lần 2 qua evaluate',
        duLieu: 'Cùng user + sản phẩm', mongDoi: 'Trả "Bạn đã đánh giá sản phẩm này rồi!", số review không tăng', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        const orders = (await t.bang('orders')).filter(o => o.user_id == uid);
        if (orders.length == 0) { kq.dat(true, 'Không có đơn'); return; }
        const pid = orders[0].items[0].product_id;
        // Đảm bảo có review
        await p.evaluate(({ u, pid }) => {
            let reviews = getTable('reviews');
            reviews = reviews.filter(r => !(r.user_id == u && r.product_id == pid));
            reviews.push({ id: getNextId('reviews'), user_id: u, product_id: pid, rating: 5, comment: 'x',
                review_image_url: null, is_hidden: false, created_at: new Date().toISOString() });
            saveTable('reviews', reviews);
        }, { u: uid, pid });
        await p.reload(); await p.waitForTimeout(400);
        const soTruoc = (await t.bang('reviews')).length;
        const loi = await p.evaluate(({ u, pid }) => addReview(u, pid, 3, 'lần 2'), { u: uid, pid });
        kq.dat(loi == 'Bạn đã đánh giá sản phẩm này rồi!', 'Câu lỗi: "' + loi + '"');
        const soSau = (await t.bang('reviews')).length;
        kq.dat(soSau == soTruoc, 'Số review không đổi: ' + soSau);
    });

    await t.tc({
        ma: 'TC-S06-24', trang: 'order-detail.html', chucNang: 'Đánh giá - mobile gửi thành công',
        tienDieuKien: 'Đơn Delivered chưa đánh giá, mobile', cacBuoc: '1. Mở chi tiết đơn trên mobile 2. Nhập 5 sao + nhận xét 3. Gửi',
        duLieu: '5 sao, "Rất hài lòng"', mongDoi: 'Gửi thành công, review được lưu, không cuộn ngang', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        await p.evaluate((u) => {
            const orders = getTable('orders');
            const don = orders.find(o => o.user_id == u && o.status == 'Confirmed');
            if (don) { don.status = 'Delivered'; saveTable('orders', orders); }
        }, uid);
        await p.reload(); await p.waitForTimeout(600);
        const orders = await t.bang('orders');
        const don = orders.find(o => o.user_id == uid && o.status == 'Delivered');
        if (!don) { kq.dat(true, 'Không có đơn Delivered'); return; }
        await p.evaluate((d) => {
            let reviews = getTable('reviews');
            reviews = reviews.filter(r => !(r.user_id == d.user_id && d.items.some(it => it.product_id == r.product_id)));
            saveTable('reviews', reviews);
        }, don);
        await p.reload(); await p.waitForTimeout(600);
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + don.id));
        await p.waitForTimeout(800);
        const soTruoc = (await t.bang('reviews')).length;
        t.xoaAlert();
        // #cboRating0 là input hidden, không phải <select> → chọn sao bằng nút trong .star-picker
        await p.click(".review-box .star-picker[data-i='0'] button[data-v='5']");
        await p.fill('#txtComment0', 'Rất hài lòng');
        await p.click(".review-box input[value='Gửi đánh giá']");
        await p.waitForTimeout(600);
        kq.dat(t.alertCuoi() == 'Cảm ơn bạn đã đánh giá!', 'Alert: "' + t.alertCuoi() + '"');
        const soSau = (await t.bang('reviews')).length;
        kq.dat(soSau == soTruoc + 1, 'Số review tăng 1: ' + soTruoc + ' -> ' + soSau);
        const cuon = await t.traNgang();
        kq.dat(cuon == 0, 'Số px cuộn ngang = ' + cuon);
    });

    // =================================================================
    // NHÓM 5: PHÂN QUYỀN & BIÊN
    // =================================================================

    await t.tc({
        ma: 'TC-S06-25', trang: 'order-detail.html', chucNang: 'Phân quyền - chưa đăng nhập mở chi tiết đơn',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Gõ thẳng order-detail.html?id=1',
        duLieu: 'id=1', mongDoi: 'Bị chuyển về trang đăng nhập', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('order-detail.html?id=1', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1000);
        kq.dat(/login\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });

    await t.tc({
        ma: 'TC-S06-26', trang: 'order-detail.html', chucNang: 'Phân quyền - user không hủy được đơn người khác',
        tienDieuKien: 'Đăng nhập user, đơn Confirmed của user khác', cacBuoc: '1. Gọi cancelOrder(id đơn người khác) qua evaluate',
        duLieu: 'id đơn user khác', mongDoi: 'Đơn người khác không bị đổi trạng thái', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        const orders = await t.bang('orders');
        const donKhac = orders.find(o => o.user_id != uid && o.status == 'Confirmed');
        if (!donKhac) { kq.dat(true, 'Không có đơn Confirmed của người khác'); return; }
        const trangThaiTruoc = donKhac.status;
        await p.evaluate((id) => cancelOrder(id), donKhac.id);
        const sau = (await t.bang('orders')).find(o => o.id == donKhac.id);
        kq.dat(sau.status == trangThaiTruoc, 'Trạng thái đơn người khác = ' + sau.status);
    });

    await t.tc({
        ma: 'TC-S06-27', trang: 'order-detail.html', chucNang: 'Biên - đơn Delivered không có nút hủy',
        tienDieuKien: 'Đơn Delivered', cacBuoc: '1. Mở chi tiết đơn Delivered 2. Kiểm tra nút hủy',
        duLieu: 'Đơn Delivered', mongDoi: 'Không có nút "Hủy đơn hàng"', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        const orders = await t.bang('orders');
        const don = orders.find(o => o.user_id == uid && o.status == 'Delivered');
        if (!don) { kq.dat(true, 'Không có đơn Delivered'); return; }
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + don.id));
        await p.waitForTimeout(800);
        const coNut = await p.locator("input[value='Hủy đơn hàng']").count();
        kq.dat(coNut == 0, 'Số nút hủy = ' + coNut);
    });

    await t.tc({
        ma: 'TC-S06-28', trang: 'order-detail.html', chucNang: 'Biên - đơn Cancelled hiện ghi chú hủy',
        tienDieuKien: 'Đơn Cancelled', cacBuoc: '1. Mở chi tiết đơn Cancelled 2. Đọc ghi chú',
        duLieu: 'Đơn Cancelled', mongDoi: 'Hiện "Đơn hàng này đã bị hủy." và không có nút hủy', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        const orders = await t.bang('orders');
        const don = orders.find(o => o.user_id == uid && o.status == 'Cancelled');
        if (!don) { kq.dat(true, 'Không có đơn Cancelled'); return; }
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + don.id));
        await p.waitForTimeout(800);
        const body = await t.chu();
        kq.dat(body.includes('Đơn hàng này đã bị hủy.'), 'Có ghi chú hủy');
        const coNut = await p.locator("input[value='Hủy đơn hàng']").count();
        kq.dat(coNut == 0, 'Số nút hủy = ' + coNut);
    });

    await t.tc({
        ma: 'TC-S06-29', trang: 'orders.html', chucNang: 'Danh sách đơn - user không có đơn hiện thông báo trống',
        tienDieuKien: 'User không có đơn', cacBuoc: '1. Xóa hết đơn của user 2. Mở orders.html',
        duLieu: 'Không có đơn', mongDoi: 'Hiện "Chưa có đơn hàng nào"', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        await p.evaluate((u) => {
            const orders = getTable('orders').filter(o => o.user_id != u);
            saveTable('orders', orders);
        }, uid);
        await p.reload(); await p.waitForTimeout(600);
        const body = await t.chu();
        kq.dat(body.includes('Chưa có đơn hàng nào'), 'Có thông báo trống');
    });

    await t.tc({
        ma: 'TC-S06-30', trang: 'order-detail.html', chucNang: 'Đánh giá - mobile không hiện form khi chưa Delivered',
        tienDieuKien: 'Đơn Shipping, mobile', cacBuoc: '1. Mở chi tiết đơn Shipping trên mobile 2. Kiểm tra khu đánh giá',
        duLieu: 'Đơn Shipping', mongDoi: 'Không có khu đánh giá, không cuộn ngang', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(800);
        const uid = await userId(p);
        await p.evaluate((u) => {
            const orders = getTable('orders');
            const don = orders.find(o => o.user_id == u && o.status == 'Confirmed');
            if (don) { don.status = 'Shipping'; saveTable('orders', orders); }
        }, uid);
        await p.reload(); await p.waitForTimeout(600);
        const orders = await t.bang('orders');
        const don = orders.find(o => o.user_id == uid && o.status == 'Shipping');
        if (!don) { kq.dat(true, 'Không có đơn Shipping'); return; }
        await p.goto(p.url().replace('orders.html', 'order-detail.html?id=' + don.id));
        await p.waitForTimeout(800);
        const co = await p.locator('.review-section').count();
        kq.dat(co == 0, 'Số khu đánh giá = ' + co);
        const cuon = await t.traNgang();
        kq.dat(cuon == 0, 'Số px cuộn ngang = ' + cuon);
    });
});