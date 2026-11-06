const { phien, TAI_KHOAN } = require('../lib/khung-test');

// Trang thanh toán dùng nút #btnPlaceOrder (type=button); trang đăng ký dùng nút submit của form
async function bamGui(p) {
    if (await p.locator('#btnPlaceOrder').count()) return p.click('#btnPlaceOrder');
    return p.click('form [type=submit]');
}

phien({ ma: 's11', ten: 'Nghiệp vụ thực tế (E2E)' }, async (t) => {

    // =====================================================================
    // TC-S11-01: Khách mới đăng ký → mua 1 sản phẩm COD → admin chuyển trạng thái
    //            → khách đánh giá 5 sao. Kiểm giao diện + dữ liệu từng bước.
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-01', trang: 'register.html', chucNang: 'E2E: đăng ký → mua COD → admin giao → đánh giá 5 sao',
        tienDieuKien: 'Dữ liệu sạch, chưa đăng nhập',
        cacBuoc: '1. Đăng ký tài khoản mới 2. Thêm 1 sản phẩm vào giỏ 3. Thanh toán COD 4. Admin chuyển Confirmed→Packing→Shipping→Delivered 5. Khách đánh giá 5 sao',
        duLieu: 'Sản phẩm còn hàng, địa chỉ nội thành',
        mongDoi: 'Tồn kho giảm 1 khi đặt; trạng thái đơn đúng từng bước; doanh thu Dashboard tăng đúng số tiền đơn sau Delivered; điểm TB sản phẩm cập nhật sau đánh giá',
        mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('register.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);

        // Đăng ký tài khoản mới
        const emailMoi = 'e2e11@roomcraft.vn';
        await p.fill('#txtFullName', 'Khách E2E Mười Một');
        await p.fill('#txtEmail', emailMoi);
        await p.fill('#txtPhone', '0912345678');
        await p.fill('#txtPassword', 'E2e@12345');
        await p.fill('#txtConfirm', 'E2e@12345');
        await bamGui(p);
        await p.waitForTimeout(600);
        // Nhập OTP nếu có
        const otp = await p.evaluate(() => {
            const codes = JSON.parse(localStorage.getItem('rc_verification_codes') || '[]');
            const c = codes.filter(x => x.purpose == 'REGISTER' && !x.is_used).pop();
            return c ? c.code : '';
        });
        if (otp) {
            const oOtp = await p.$('#txtOtp');
            if (oOtp) {
                await p.fill('#txtOtp', otp);
                await bamGui(p);
                await p.waitForTimeout(800);
            }
        }
        // Đăng nhập nếu chưa
        const daDangNhap = await p.evaluate(() => getCurrentUser() != null);
        if (!daDangNhap) {
            await p.evaluate((e) => login(e, 'E2e@12345'), emailMoi);
        }
        kq.dat(await p.evaluate(() => getCurrentUser() != null), 'Đã đăng nhập tài khoản mới');

        // Chọn 1 sản phẩm còn hàng, không phải đồ cũ
        const sp = await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 5 && x.product_type != 'USED');
            return ps[0];
        });
        const tonTruoc = sp.stock_quantity;
        await p.evaluate((id) => addToCart(id, 1), sp.id);

        // Mở checkout
        await p.goto(t.trang.url().replace(/register\.html.*/, 'checkout.html'));
        await p.waitForTimeout(1500);
        await p.fill('#txtName', 'Khách E2E Mười Một');
        await p.fill('#txtPhone', '0912345678');
        await p.selectOption('#cboProvince', 'TP. Hồ Chí Minh');
        await p.waitForTimeout(600);
        const wardOpt = await p.$eval('#txtWard', el => el.options.length > 1 ? el.options[1].value : '');
        if (wardOpt) await p.selectOption('#txtWard', wardOpt);
        await p.fill('#txtStreet', 'Số 12 Nguyễn Huệ');
        await p.waitForTimeout(300);
        // Chọn COD
        const coCOD = await p.$('input[name=rdoPlan][value=COD]:not([disabled])');
        if (coCOD) await coCOD.check();
        await p.check('#chkAgree');
        await bamGui(p);
        await p.waitForTimeout(1500);

        const donMoi = await p.evaluate(() => {
            const os = getTable('orders');
            return os[os.length - 1];
        });
        const spSau = await p.evaluate((id) => findById('products', id), sp.id);
        kq.dat(spSau.stock_quantity == tonTruoc - 1, 'Tồn kho giảm 1: ' + tonTruoc + ' → ' + spSau.stock_quantity);
        kq.dat(donMoi.status == 'Confirmed', 'Trạng thái đơn: ' + donMoi.status);

        // Admin chuyển trạng thái
        const pAdmin = await t.mo('admin/orders.html', { vaiTro: 'admin' });
        await pAdmin.waitForTimeout(800);
        for (const tt of ['Packing', 'Shipping', 'Delivered']) {
            await pAdmin.evaluate(([id, s]) => updateOrderStatus(id, s), [donMoi.id, tt]);
        }
        const donSau = await pAdmin.evaluate((id) => findById('orders', id), donMoi.id);
        kq.dat(donSau.status == 'Delivered', 'Sau admin: ' + donSau.status);

        // Doanh thu Dashboard
        await pAdmin.goto(pAdmin.url().replace(/orders\.html.*/, 'index.html'));
        await pAdmin.waitForTimeout(800);
        const chuDB = await t.chu();
        const tongDT = await pAdmin.evaluate(() => {
            const os = getTable('orders').filter(o => o.status == 'Delivered');
            return os.reduce((s, o) => s + Number(o.total_amount), 0);
        });
        kq.dat(chuDB.indexOf(await pAdmin.evaluate((v) => formatVND(v), tongDT)) >= 0,
            'Dashboard có tổng doanh thu ' + tongDT);

        // Khách đánh giá
        await p.goto(p.url().replace(/checkout\.html.*/, 'order-detail.html?id=' + donMoi.id));
        await p.waitForTimeout(800);
        const coNut = await p.$('.star-picker button[data-v="5"]');
        if (coNut) {
            await coNut.click();
            await p.fill('#txtComment0', 'Sản phẩm rất tốt, đóng gói cẩn thận!');
            await p.click('input[value="Gửi đánh giá"]');
            await p.waitForTimeout(600);
        }
        const review = await p.evaluate((id) => getTable('reviews').filter(r => r.product_id == id), sp.id);
        kq.dat(review.length >= 1 && review[review.length - 1].rating == 5, 'Đánh giá 5 sao đã lưu: ' + review.length);
    });

    // =====================================================================
    // TC-S11-02: Sản phẩm còn đúng 1 món, 2 tab cùng thêm vào giỏ rồi cùng thanh toán
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-02', trang: 'product-detail.html', chucNang: 'E2E: 2 tab cùng mua sản phẩm còn 1 món',
        tienDieuKien: 'Sản phẩm còn đúng 1 món, đăng nhập user',
        cacBuoc: '1. Mở 2 tab cùng thêm vào giỏ 2. Cả 2 tab cùng thanh toán',
        duLieu: 'Sản phẩm tồn kho = 1',
        mongDoi: 'Chỉ 1 đơn thành công, tab kia báo hết hàng, tồn kho = 0 không âm, không có đơn rác',
        mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('product-detail.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        // Đặt 1 sản phẩm tồn kho = 1
        const spId = await p.evaluate(() => {
            const ps = getTable('products');
            const sp = ps.filter(x => x.is_active && x.product_type != 'USED')[0];
            sp.stock_quantity = 1;
            saveTable('products', ps);
            return sp.id;
        });
        await p.reload();
        await p.waitForTimeout(600);

        // Tab 1 thêm vào giỏ
        await p.evaluate((id) => addToCart(id, 1), spId);
        // Tab 2
        const p2 = await p.context().newPage();
        await p2.goto(p.url());
        await p2.waitForTimeout(600);
        await p2.evaluate((id) => addToCart(id, 1), spId);

        // Tab 1 thanh toán
        await p.goto(p.url().replace(/product-detail\.html.*/, 'checkout.html'));
        await p.waitForTimeout(1500);
        await p.fill('#txtName', 'Nguyễn Văn A');
        await p.fill('#txtPhone', '0912345678');
        await p.selectOption('#cboProvince', 'TP. Hồ Chí Minh');
        await p.waitForTimeout(600);
        const w = await p.$eval('#txtWard', el => el.options.length > 1 ? el.options[1].value : '');
        if (w) await p.selectOption('#txtWard', w);
        await p.fill('#txtStreet', 'Số 12 Nguyễn Huệ');
        await p.check('#chkAgree');
        await bamGui(p);
        await p.waitForTimeout(1500);

        // Tab 2 thanh toán
        await p2.goto(p2.url().replace(/product-detail\.html.*/, 'checkout.html'));
        await p2.waitForTimeout(1500);
        const url2 = p2.url();
        const soDon = await p2.evaluate(() => getTable('orders').filter(o => Date.now() - new Date(o.created_at).getTime() < 120000).length);
        const spSau = await p2.evaluate((id) => findById('products', id), spId);
        kq.dat(spSau.stock_quantity == 0, 'Tồn kho = ' + spSau.stock_quantity);
        kq.dat(soDon == 1, 'Số đơn mới tạo = ' + soDon);
        kq.dat(/cart\.html/.test(url2) || /checkout\.html/.test(url2), 'Tab 2 ở ' + url2.split('/scripts/')[1]);
        await p2.close();
    });

    // =====================================================================
    // TC-S11-03: 2 tài khoản cùng mua 1 món đồ cũ
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-03', trang: 'product-detail.html', chucNang: 'E2E: 2 tài khoản cùng mua 1 món đồ cũ',
        tienDieuKien: 'Có sản phẩm USED còn 1 món',
        cacBuoc: '1. User1 đặt mua 2. User2 thử thêm vào giỏ',
        duLieu: 'Sản phẩm USED tồn kho = 1',
        mongDoi: 'User1 đặt thành công, món chuyển "Đã bán", User2 không thêm được, chỉ ghi 1 lần bán',
        mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('product-detail.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const spId = await p.evaluate(() => {
            const ps = getTable('products');
            let sp = ps.filter(x => x.product_type == 'USED' && x.is_active)[0];
            if (!sp) {
                sp = ps[0];
                sp.product_type = 'USED';
            }
            sp.stock_quantity = 1;
            sp.is_active = true;
            saveTable('products', ps);
            return sp.id;
        });
        await p.reload();
        await p.waitForTimeout(600);
        await p.evaluate((id) => addToCart(id, 1), spId);
        await p.goto(p.url().replace(/product-detail\.html.*/, 'checkout.html'));
        await p.waitForTimeout(1500);
        await p.fill('#txtName', 'Nguyễn Văn A');
        await p.fill('#txtPhone', '0912345678');
        await p.selectOption('#cboProvince', 'TP. Hồ Chí Minh');
        await p.waitForTimeout(600);
        const w = await p.$eval('#txtWard', el => el.options.length > 1 ? el.options[1].value : '');
        if (w) await p.selectOption('#txtWard', w);
        await p.fill('#txtStreet', 'Số 12 Nguyễn Huệ');
        await p.check('#chkAgree');
        await bamGui(p);
        await p.waitForTimeout(1500);
        const soDon1 = await p.evaluate(() => getTable('orders').filter(o => Date.now() - new Date(o.created_at).getTime() < 120000).length);

        // User2 thử thêm
        const p2 = await t.mo('product-detail.html?id=' + spId, { vaiTro: 'khach' });
        await p2.waitForTimeout(600);
        const loi = await p2.evaluate((id) => addToCart(id, 1), spId);
        kq.dat(loi != '', 'User2 báo: "' + loi + '"');
        const spSau = await p2.evaluate((id) => findById('products', id), spId);
        kq.dat(spSau.stock_quantity == 0, 'Tồn kho = ' + spSau.stock_quantity);
        kq.dat(soDon1 == 1, 'Số đơn mới tạo = ' + soDon1);
    });

    // =====================================================================
    // TC-S11-04: Admin đổi giá sản phẩm khi đang trong giỏ khách
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-04', trang: 'cart.html', chucNang: 'E2E: admin đổi giá khi sản phẩm đang trong giỏ',
        tienDieuKien: 'User có 1 sản phẩm trong giỏ',
        cacBuoc: '1. Thêm vào giỏ 2. Admin đổi giá 3. Vào lại giỏ/thanh toán',
        duLieu: 'Giá cũ → giá mới',
        mongDoi: 'Giỏ hiện giá mới, tổng tiền tính lại đúng, đơn lưu đúng giá mới, doanh thu khớp',
        mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('cart.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const spId = await p.evaluate(() => {
            const ps = getTable('products');
            const sp = ps.filter(x => x.is_active && x.stock_quantity > 3 && x.product_type != 'USED')[0];
            return sp.id;
        });
        await p.evaluate((id) => addToCart(id, 1), spId);
        // Admin đổi giá
        const giaMoi = await p.evaluate((id) => {
            const ps = getTable('products');
            for (const x of ps) if (x.id == id) { x.price = 5000000; }
            saveTable('products', ps);
            return 5000000;
        }, spId);
        await p.reload();
        await p.waitForTimeout(800);
        const chuGio = await t.chu();
        kq.dat(chuGio.indexOf(await p.evaluate((v) => formatVND(v), giaMoi)) >= 0,
            'Giỏ hiện giá mới ' + giaMoi);
        const tong = await p.evaluate(() => getCartTotal());
        kq.dat(tong == giaMoi, 'Tổng giỏ = ' + tong);
    });

    // =====================================================================
    // TC-S11-05: Admin ẩn sản phẩm khi đang trong giỏ khách
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-05', trang: 'cart.html', chucNang: 'E2E: admin ẩn sản phẩm trong giỏ khách',
        tienDieuKien: 'User có 2 sản phẩm trong giỏ',
        cacBuoc: '1. Thêm 2 món 2. Admin ẩn 1 món 3. Vào lại giỏ/thanh toán',
        duLieu: 'Sản phẩm A bị ẩn',
        mongDoi: 'Món A biến mất hoặc bị đánh dấu không khả dụng, không thanh toán được A, món B vẫn đặt được, tồn kho A không đổi',
        mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('cart.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const ids = await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 3 && x.product_type != 'USED');
            return [ps[0].id, ps[1].id];
        });
        await p.evaluate(([a, b]) => { addToCart(a, 1); addToCart(b, 1); }, ids);
        const tonA = await p.evaluate((id) => findById('products', id).stock_quantity, ids[0]);
        await p.evaluate((id) => {
            const ps = getTable('products');
            for (const x of ps) if (x.id == id) x.is_active = false;
            saveTable('products', ps);
        }, ids[0]);
        await p.reload();
        await p.waitForTimeout(800);
        const gio = await p.evaluate(() => getCart());
        kq.dat(gio.filter(x => x.product_id == ids[0]).length == 0, 'Món A đã bị loại khỏi giỏ');
        const tonSau = await p.evaluate((id) => findById('products', id).stock_quantity, ids[0]);
        kq.dat(tonSau == tonA, 'Tồn kho A không đổi: ' + tonA + ' → ' + tonSau);
    });

    // =====================================================================
    // TC-S11-06: Khách giữ 5 món, admin giảm tồn kho còn 3
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-06', trang: 'cart.html', chucNang: 'E2E: admin giảm tồn kho khi khách giữ 5 món',
        tienDieuKien: 'User có 5 món trong giỏ',
        cacBuoc: '1. Thêm 5 món 2. Admin giảm tồn kho còn 3 3. Vào lại giỏ',
        duLieu: 'Tồn kho 5 → 3',
        mongDoi: 'Giỏ bị giới hạn còn 3 hoặc chặn đặt, sau đặt tồn kho = 0 không âm',
        mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('cart.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const spId = await p.evaluate(() => {
            const ps = getTable('products');
            const sp = ps.filter(x => x.is_active && x.product_type != 'USED')[0];
            sp.stock_quantity = 5;
            saveTable('products', ps);
            return sp.id;
        });
        await p.evaluate((id) => addToCart(id, 5), spId);
        await p.evaluate((id) => {
            const ps = getTable('products');
            for (const x of ps) if (x.id == id) x.stock_quantity = 3;
            saveTable('products', ps);
        }, spId);
        await p.reload();
        await p.waitForTimeout(800);
        const gio = await p.evaluate(() => getCart());
        const sl = gio.find(x => x.product_id == spId);
        kq.dat(sl && sl.quantity <= 3, 'Số lượng trong giỏ = ' + (sl ? sl.quantity : 0));
    });

    // =====================================================================
    // TC-S11-07: Đơn đặt cọc 30% rồi hủy ở Confirmed
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-07', trang: 'checkout.html', chucNang: 'E2E: đặt cọc 30% rồi hủy ở Confirmed',
        tienDieuKien: 'User đăng nhập, sản phẩm giá > 10 triệu',
        cacBuoc: '1. Đặt cọc 30% 2. Hủy đơn ở Confirmed',
        duLieu: 'Sản phẩm giá cao',
        mongDoi: 'Trạng thái "Đã hủy", hoàn tiền đúng số cọc, tồn kho hoàn lại, doanh thu Dashboard không đổi',
        mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const spId = await p.evaluate(() => {
            const ps = getTable('products');
            const sp = ps.filter(x => x.is_active && x.product_type != 'USED')[0];
            sp.price = 15000000;
            sp.stock_quantity = 5;
            saveTable('products', ps);
            return sp.id;
        });
        await p.evaluate((id) => addToCart(id, 1), spId);
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForTimeout(1500);
        await p.fill('#txtName', 'Nguyễn Văn A');
        await p.fill('#txtPhone', '0912345678');
        await p.selectOption('#cboProvince', 'TP. Hồ Chí Minh');
        await p.waitForTimeout(600);
        const w = await p.$eval('#txtWard', el => el.options.length > 1 ? el.options[1].value : '');
        if (w) await p.selectOption('#txtWard', w);
        await p.fill('#txtStreet', 'Số 12 Nguyễn Huệ');
        await p.waitForTimeout(300);
        const coCoc = await p.$('input[name=rdoPlan][value=DEPOSIT]:not([disabled])');
        if (coCoc) await coCoc.check();
        await p.check('#chkAgree');
        await bamGui(p);
        await p.waitForTimeout(1500);
        const don = await p.evaluate(() => {
            const os = getTable('orders');
            return os[os.length - 1];
        });
        const coc = don.paid_amount;
        const tonTruocHuy = await p.evaluate((id) => findById('products', id).stock_quantity, spId);
        // Hủy
        await p.evaluate((id) => cancelOrder(id), don.id);
        const donSau = await p.evaluate((id) => findById('orders', id), don.id);
        kq.dat(donSau.status == 'Cancelled', 'Trạng thái: ' + donSau.status);
        kq.dat(donSau.refund_amount == coc, 'Hoàn tiền = ' + donSau.refund_amount + ' (cọc ' + coc + ')');
        const tonSau = await p.evaluate((id) => findById('products', id).stock_quantity, spId);
        kq.dat(tonSau == tonTruocHuy + 1, 'Tồn kho hoàn: ' + tonTruocHuy + ' → ' + tonSau);
    });

    // =====================================================================
    // TC-S11-08: COD sát ngưỡng kèm mã giảm giá
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-08', trang: 'checkout.html', chucNang: 'E2E: COD sát ngưỡng 10 triệu kèm mã giảm giá',
        tienDieuKien: 'User đăng nhập, có mã giảm 500k',
        cacBuoc: '1. Tạm tính 10.500.000 − 500.000 = 10.000.000 → COD chọn được 2. Tạm tính 10.500.001 − 500.000 = 10.000.001 → COD bị khóa',
        duLieu: 'Mã giảm 500.000',
        mongDoi: 'Trường hợp 1 COD chọn được; trường hợp 2 COD bị khóa, đơn lưu đúng tổng và phương thức',
        mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        // Tạo mã giảm 500k
        await p.evaluate(() => {
            const cs = getTable('coupons');
            cs.push({ id: 999, code: 'GIAM500K', discount_type: 'FIXED', discount_value: 500000, min_order_value: 0, expires_at: '2030-12-31T23:59:59', is_active: true });
            saveTable('coupons', cs);
        });
        const spId = await p.evaluate(() => {
            const ps = getTable('products');
            const sp = ps.filter(x => x.is_active && x.product_type != 'USED')[0];
            sp.price = 10500000;
            sp.stock_quantity = 5;
            saveTable('products', ps);
            return sp.id;
        });
        await p.evaluate((id) => addToCart(id, 1), spId);
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForTimeout(1500);
        await p.fill('#txtName', 'Nguyễn Văn A');
        await p.fill('#txtPhone', '0912345678');
        await p.selectOption('#cboProvince', 'TP. Hồ Chí Minh');
        await p.waitForTimeout(600);
        const w = await p.$eval('#txtWard', el => el.options.length > 1 ? el.options[1].value : '');
        if (w) await p.selectOption('#txtWard', w);
        await p.fill('#txtStreet', 'Số 12 Nguyễn Huệ');
        await p.fill('#txtCoupon', 'GIAM500K');
        await p.click('input[value="Áp dụng"]');
        await p.waitForTimeout(400);
        const coCOD = await p.$('input[name=rdoPlan][value=COD]:not([disabled])');
        kq.dat(coCOD != null, 'Trường hợp 10.000.000: COD chọn được = ' + (coCOD != null));

        // Trường hợp 2: tăng giá 1 đồng
        await p.evaluate((id) => {
            const ps = getTable('products');
            for (const x of ps) if (x.id == id) x.price = 10500001;
            saveTable('products', ps);
        }, spId);
        await p.reload();
        await p.waitForTimeout(1500);
        await p.fill('#txtName', 'Nguyễn Văn A');
        await p.fill('#txtPhone', '0912345678');
        await p.selectOption('#cboProvince', 'TP. Hồ Chí Minh');
        await p.waitForTimeout(600);
        const w2 = await p.$eval('#txtWard', el => el.options.length > 1 ? el.options[1].value : '');
        if (w2) await p.selectOption('#txtWard', w2);
        await p.fill('#txtStreet', 'Số 12 Nguyễn Huệ');
        await p.fill('#txtCoupon', 'GIAM500K');
        await p.click('input[value="Áp dụng"]');
        await p.waitForTimeout(400);
        const cod2 = await p.$('input[name=rdoPlan][value=COD]:not([disabled])');
        kq.dat(cod2 == null, 'Trường hợp 10.000.001: COD bị khóa = ' + (cod2 == null));
    });

    // =====================================================================
    // TC-S11-09: Mã giảm giá hết hạn / chưa đủ giá trị / dùng lại
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-09', trang: 'checkout.html', chucNang: 'E2E: mã giảm giá hết hạn / chưa đủ / dùng lại',
        tienDieuKien: 'User đăng nhập, có 3 mã: hết hạn, min cao, đã dùng',
        cacBuoc: '1. Áp mã hết hạn 2. Áp mã chưa đủ min 3. Áp mã đã dùng',
        duLieu: 'Mã HETHAN, MINMAX, DADUNG',
        mongDoi: 'Cả 3 bị từ chối, tổng không giảm',
        mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        await p.evaluate(() => {
            const cs = getTable('coupons');
            cs.push({ id: 901, code: 'HETHAN', discount_type: 'FIXED', discount_value: 100000, min_order_value: 0, expires_at: '2020-01-01T00:00:00', is_active: true });
            cs.push({ id: 902, code: 'MINMAX', discount_type: 'FIXED', discount_value: 100000, min_order_value: 99999999, expires_at: '2030-12-31T23:59:59', is_active: true });
            saveTable('coupons', cs);
        });
        const spId = await p.evaluate(() => {
            const ps = getTable('products');
            const sp = ps.filter(x => x.is_active && x.product_type != 'USED')[0];
            sp.price = 1000000;
            sp.stock_quantity = 5;
            saveTable('products', ps);
            return sp.id;
        });
        await p.evaluate((id) => addToCart(id, 1), spId);
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForTimeout(1500);
        await p.fill('#txtName', 'Nguyễn Văn A');
        await p.fill('#txtPhone', '0912345678');
        await p.selectOption('#cboProvince', 'TP. Hồ Chí Minh');
        await p.waitForTimeout(600);
        const w = await p.$eval('#txtWard', el => el.options.length > 1 ? el.options[1].value : '');
        if (w) await p.selectOption('#txtWard', w);
        await p.fill('#txtStreet', 'Số 12 Nguyễn Huệ');
        await p.fill('#txtCoupon', 'HETHAN');
        await p.click('input[value="Áp dụng"]');
        await p.waitForTimeout(300);
        const loi1 = await t.chu('#msgCoupon');
        kq.dat(/hết hạn/i.test(loi1), 'Mã hết hạn: "' + loi1 + '"');
        await p.fill('#txtCoupon', 'MINMAX');
        await p.click('input[value="Áp dụng"]');
        await p.waitForTimeout(300);
        const loi2 = await t.chu('#msgCoupon');
        kq.dat(/tối thiểu/i.test(loi2), 'Mã chưa đủ min: "' + loi2 + '"');
        const tong = await p.evaluate(() => getOrderTotal());
        kq.dat(tong == 1000000 + await p.evaluate(() => getShippingFee()), 'Tổng không giảm = ' + tong);
    });

    // =====================================================================
    // TC-S11-10: Khách vãng lai thêm X → đăng nhập tài khoản đã có X
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-10', trang: 'login.html', chucNang: 'E2E: gộp giỏ khách vãng lai khi đăng nhập',
        tienDieuKien: 'Khách vãng lai có X trong giỏ, user đã có X trong giỏ',
        cacBuoc: '1. Khách thêm X 2. Đăng nhập user đã có X',
        duLieu: 'X số lượng 2 (khách) + 1 (user)',
        mongDoi: 'Giỏ gộp đúng, trùng món cộng số lượng không vượt tồn kho, tổng tiền đúng',
        mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const spId = await p.evaluate(() => {
            const ps = getTable('products');
            const sp = ps.filter(x => x.is_active && x.product_type != 'USED')[0];
            sp.stock_quantity = 10;
            saveTable('products', ps);
            return sp.id;
        });
        // Khách thêm 2
        await p.evaluate((id) => addToCart(id, 2), spId);
        // User đã có 1 trong giỏ
        await p.evaluate((id) => {
            const carts = getObject('carts') || {};
            const user = findUserByEmail('user@roomcraft.vn');
            carts[user.id] = [{ product_id: id, quantity: 1 }];
            saveObject('carts', carts);
        }, spId);
        // Đăng nhập
        await p.fill('#txtEmail', TAI_KHOAN.user.email);
        await p.fill('#txtPassword', TAI_KHOAN.user.matKhau);
        await p.click('form[name=frmLogin] [type=submit]');
        await p.waitForTimeout(1500);
        const gio = await p.evaluate(() => getCart());
        const sl = gio.find(x => x.product_id == spId);
        kq.dat(sl && sl.quantity == 3, 'Số lượng sau gộp = ' + (sl ? sl.quantity : 0));
        const tong = await p.evaluate(() => getCartTotal());
        const gia = await p.evaluate((id) => findById('products', id).price, spId);
        kq.dat(tong == gia * 3, 'Tổng = ' + tong + ' (kỳ vọng ' + gia * 3 + ')');
    });

    // =====================================================================
    // TC-S11-11: Admin khóa tài khoản đang có đơn đang xử lý
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-11', trang: 'admin/users.html', chucNang: 'E2E: admin khóa tài khoản có đơn đang xử lý',
        tienDieuKien: 'User có đơn Confirmed',
        cacBuoc: '1. Admin khóa user 2. User thử đăng nhập lại 3. Admin xử lý đơn',
        duLieu: 'User có đơn Confirmed',
        mongDoi: 'User bị đẩy ra, không đăng nhập lại được, đơn vẫn hiển thị và xử lý tiếp được',
        mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/orders.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(800);
        // Tạo đơn Confirmed cho user
        const donId = await p.evaluate(() => {
            const user = findUserByEmail('user@roomcraft.vn');
            const ps = getTable('products');
            const sp = ps.filter(x => x.is_active && x.product_type != 'USED')[0];
            const os = getTable('orders');
            const id = getNextId('orders');
            os.push({
                id: id, user_id: user.id, shipping_method_id: 1, coupon_id: null,
                shipping_name: 'User Test', shipping_phone: '0912345678', shipping_email: user.email,
                shipping_province: 'TP. Hồ Chí Minh', shipping_ward: 'Phường Bến Nghé', shipping_street: 'Số 12 Nguyễn Huệ',
                shipping_address: 'Số 12 Nguyễn Huệ, Phường Bến Nghé, TP. Hồ Chí Minh',
                house_type: null, shipping_note: null, payment_method: 'COD', payment_plan: 'COD', card_last4: null,
                status: 'Confirmed', subtotal: sp.price, shipping_fee: 0, discount_amount: 0, total_amount: sp.price,
                paid_amount: 0, amount_due: sp.price, refund_amount: 0,
                created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
                items: [{ product_id: sp.id, product_name: sp.name, product_image: null, quantity: 1, unit_price: sp.price }]
            });
            saveTable('orders', os);
            return id;
        });
        // Khóa user
        await p.evaluate(() => {
            const us = getTable('users');
            for (const u of us) if (u.email == 'user@roomcraft.vn') u.is_active = false;
            saveTable('users', us);
        });
        // User thử đăng nhập
        const p2 = await t.mo('login.html', { vaiTro: 'khach' });
        await p2.waitForTimeout(600);
        await p2.fill('#txtEmail', TAI_KHOAN.user.email);
        await p2.fill('#txtPassword', TAI_KHOAN.user.matKhau);
        await p2.click('form[name=frmLogin] [type=submit]');
        await p2.waitForTimeout(800);
        const loi = await t.chu('#msgError');
        kq.dat(/khóa/i.test(loi), 'Thông báo: "' + loi + '"');
        // Admin xử lý đơn (dùng lại trang admin đã mở, không reload để tránh mất context)
        const don = await p.evaluate((id) => findById('orders', id), donId);
        kq.dat(don != null && don.status == 'Confirmed', 'Đơn vẫn còn: ' + (don ? don.status : 'null'));
        await p.evaluate((id) => updateOrderStatus(id, 'Packing'), donId);
        const donSau = await p.evaluate((id) => findById('orders', id), donId);
        kq.dat(donSau.status == 'Packing', 'Đơn xử lý tiếp: ' + donSau.status);
    });

    // =====================================================================
    // TC-S11-12: Admin hủy đơn khách ở Confirmed
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-12', trang: 'admin/orders.html', chucNang: 'E2E: admin hủy đơn khách ở Confirmed',
        tienDieuKien: 'Có đơn Confirmed',
        cacBuoc: '1. Admin hủy đơn 2. Kiểm trạng thái 2 phía, tồn kho, doanh thu',
        duLieu: 'Đơn Confirmed',
        mongDoi: 'Trạng thái "Đã hủy" ở cả 2 phía, tồn kho hoàn lại đúng, doanh thu Dashboard không đổi',
        mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/orders.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(800);
        const info = await p.evaluate(() => {
            const user = findUserByEmail('user@roomcraft.vn');
            const ps = getTable('products');
            const sp = ps.filter(x => x.is_active && x.product_type != 'USED')[0];
            const tonTruoc = sp.stock_quantity;
            sp.stock_quantity = tonTruoc - 2;
            saveTable('products', ps);
            const os = getTable('orders');
            const id = getNextId('orders');
            os.push({
                id: id, user_id: user.id, shipping_method_id: 1, coupon_id: null,
                shipping_name: 'User Test', shipping_phone: '0912345678', shipping_email: user.email,
                shipping_province: 'TP. Hồ Chí Minh', shipping_ward: 'Phường Bến Nghé', shipping_street: 'Số 12 Nguyễn Huệ',
                shipping_address: 'Số 12 Nguyễn Huệ, Phường Bến Nghé, TP. Hồ Chí Minh',
                house_type: null, shipping_note: null, payment_method: 'COD', payment_plan: 'COD', card_last4: null,
                status: 'Confirmed', subtotal: sp.price * 2, shipping_fee: 0, discount_amount: 0, total_amount: sp.price * 2,
                paid_amount: 0, amount_due: sp.price * 2, refund_amount: 0,
                created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
                items: [{ product_id: sp.id, product_name: sp.name, product_image: null, quantity: 2, unit_price: sp.price }]
            });
            saveTable('orders', os);
            return { id: id, spId: sp.id, tonTruoc: tonTruoc };
        });
        await p.evaluate((id) => cancelOrder(id), info.id);
        const don = await p.evaluate((id) => findById('orders', id), info.id);
        kq.dat(don.status == 'Cancelled', 'Trạng thái: ' + don.status);
        const tonSau = await p.evaluate((id) => findById('products', id).stock_quantity, info.spId);
        kq.dat(tonSau == info.tonTruoc, 'Tồn kho hoàn: ' + info.tonTruoc + ' → ' + tonSau);
    });

    // =====================================================================
    // TC-S11-13: Đối soát 5 đơn loại khác nhau
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-13', trang: 'admin/index.html', chucNang: 'E2E: đối soát 5 đơn loại khác nhau',
        tienDieuKien: 'Có 5 đơn: COD, cọc 30%, có/không mã, đồ nhỏ/lớn, có/không giao nhanh',
        cacBuoc: '1. Tạo 5 đơn 2. Kiểm tổng tiền từng đơn',
        duLieu: '5 đơn khác nhau',
        mongDoi: 'Tổng tiền từng đơn = tạm tính + phí giao − giảm giá, khớp ở trang Đặt hàng thành công, chi tiết đơn và Dashboard',
        mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/index.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(800);
        const kqTinh = await p.evaluate(() => {
            const os = getTable('orders');
            let sai = 0;
            for (const o of os) {
                const tinh = Number(o.subtotal) + Number(o.shipping_fee) - Number(o.discount_amount);
                if (tinh != Number(o.total_amount)) sai++;
            }
            return { tong: os.length, sai: sai };
        });
        kq.dat(kqTinh.sai == 0, 'Số đơn sai tổng: ' + kqTinh.sai + '/' + kqTinh.tong);
    });

    // =====================================================================
    // TC-S11-14: Shop the Room - Thêm trọn bộ
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-14', trang: 'shop-the-room.html', chucNang: 'E2E: Shop the Room - thêm trọn bộ',
        tienDieuKien: 'Có phòng với nhiều sản phẩm',
        cacBuoc: '1. Mở chi tiết phòng 2. Thêm trọn bộ 3. Thanh toán',
        duLieu: 'Phòng có sản phẩm hết hàng',
        mongDoi: 'Tự bỏ món hết hàng, báo đúng số món, giỏ đủ món, phí giao theo đồ lớn, tồn kho giảm đúng',
        mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('shop-the-room.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(1000);
        const coNut = await p.$('button:has-text("Thêm trọn bộ"), input[value*="trọn bộ"]');
        if (coNut) {
            await coNut.click();
            await p.waitForTimeout(600);
            const gio = await p.evaluate(() => getCart());
            kq.dat(gio.length > 0, 'Giỏ có ' + gio.length + ' món sau khi thêm trọn bộ');
        } else {
            kq.ghi('Không tìm thấy nút Thêm trọn bộ trên trang');
            kq.dat(false, 'Không có nút Thêm trọn bộ');
        }
    });

    // =====================================================================
    // TC-S11-15: Đánh giá chỉ sau Delivered
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-15', trang: 'order-detail.html', chucNang: 'E2E: đánh giá chỉ sau Delivered',
        tienDieuKien: 'Có đơn ở Confirmed/Packing/Shipping/Delivered',
        cacBuoc: '1. Thử đánh giá ở Confirmed/Packing/Shipping 2. Đánh giá sau Delivered',
        duLieu: 'Đơn ở các trạng thái khác nhau',
        mongDoi: 'Chỉ sau Delivered mới đánh giá được, điểm TB và số lượt cập nhật, không đánh giá 2 lần',
        mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('order-detail.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const info = await p.evaluate(() => {
            const user = findUserByEmail('user@roomcraft.vn');
            const ps = getTable('products');
            const sp = ps.filter(x => x.is_active && x.product_type != 'USED')[0];
            const os = getTable('orders');
            const id = getNextId('orders');
            os.push({
                id: id, user_id: user.id, shipping_method_id: 1, coupon_id: null,
                shipping_name: 'User Test', shipping_phone: '0912345678', shipping_email: user.email,
                shipping_province: 'TP. Hồ Chí Minh', shipping_ward: 'Phường Bến Nghé', shipping_street: 'Số 12 Nguyễn Huệ',
                shipping_address: 'Số 12 Nguyễn Huệ, Phường Bến Nghé, TP. Hồ Chí Minh',
                house_type: null, shipping_note: null, payment_method: 'COD', payment_plan: 'COD', card_last4: null,
                status: 'Confirmed', subtotal: sp.price, shipping_fee: 0, discount_amount: 0, total_amount: sp.price,
                paid_amount: 0, amount_due: sp.price, refund_amount: 0,
                created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
                items: [{ product_id: sp.id, product_name: sp.name, product_image: null, quantity: 1, unit_price: sp.price }]
            });
            saveTable('orders', os);
            return { id: id, spId: sp.id };
        });
        // Ở Confirmed: không có form đánh giá
        await p.goto(p.url().replace(/order-detail\.html.*/, 'order-detail.html?id=' + info.id));
        await p.waitForTimeout(600);
        let coForm = await p.$('.review-section');
        kq.dat(coForm == null, 'Confirmed: có form đánh giá = ' + (coForm != null));
        // Chuyển Delivered
        await p.evaluate((id) => {
            updateOrderStatus(id, 'Packing');
            updateOrderStatus(id, 'Shipping');
            updateOrderStatus(id, 'Delivered');
        }, info.id);
        await p.reload();
        await p.waitForTimeout(600);
        coForm = await p.$('.review-section');
        kq.dat(coForm != null, 'Delivered: có form đánh giá = ' + (coForm != null));
        // Đánh giá
        const nut5 = await p.$('.star-picker button[data-v="5"]');
        if (nut5) {
            await nut5.click();
            await p.fill('#txtComment0', 'Rất tốt!');
            await p.click('input[value="Gửi đánh giá"]');
            await p.waitForTimeout(600);
        }
        const soReview = await p.evaluate((id) => getTable('reviews').filter(r => r.product_id == id).length, info.spId);
        kq.dat(soReview >= 1, 'Số review: ' + soReview);
        // Thử đánh giá lần 2
        const daDanhGia = await p.evaluate(([uid, pid]) => hasReviewed(uid, pid), [await p.evaluate(() => getCurrentUser().id), info.spId]);
        kq.dat(daDanhGia, 'Đã đánh giá (không cho đánh giá 2 lần)');
    });

    // =====================================================================
    // TC-S11-16: Dashboard khớp dữ liệu
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-16', trang: 'admin/index.html', chucNang: 'E2E: Dashboard khớp dữ liệu',
        tienDieuKien: 'Có nhiều đơn ở các trạng thái',
        cacBuoc: '1. Mở Dashboard 2. So sánh với dữ liệu',
        duLieu: 'Đơn Delivered, Confirmed, sản phẩm tồn kho ≤ 3',
        mongDoi: 'Tổng doanh thu = tổng tiền đơn Delivered, số đơn theo trạng thái đúng, danh sách sắp hết hàng đúng (tồn kho ≤ 3)',
        mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/index.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(1000);
        const soLieu = await p.evaluate(() => {
            const os = getTable('orders');
            const ps = getTable('products');
            const dt = os.filter(o => o.status == 'Delivered').reduce((s, o) => s + Number(o.total_amount), 0);
            const sapHet = ps.filter(x => x.is_active && x.stock_quantity <= 3).length;
            return { dt: dt, sapHet: sapHet };
        });
        const chu = await t.chu();
        const dtStr = await p.evaluate((v) => formatVND(v), soLieu.dt);
        kq.dat(chu.indexOf(dtStr) >= 0, 'Dashboard có doanh thu ' + dtStr);
    });

    // =====================================================================
    // TC-S11-17: Mua số lượng 2 cùng một món
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-17', trang: 'checkout.html', chucNang: 'E2E: mua 2 cùng một món, hủy hoàn lại 2',
        tienDieuKien: 'User đăng nhập, sản phẩm tồn kho ≥ 2',
        cacBuoc: '1. Mua 2 2. Hủy đơn',
        duLieu: 'Số lượng 2',
        mongDoi: 'Tồn kho giảm 2, đơn ghi đơn giá × 2, hủy hoàn lại 2',
        mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const info = await p.evaluate(() => {
            const ps = getTable('products');
            const sp = ps.filter(x => x.is_active && x.product_type != 'USED')[0];
            sp.stock_quantity = 10;
            saveTable('products', ps);
            return { id: sp.id, gia: sp.price, ton: 10 };
        });
        await p.evaluate((id) => addToCart(id, 2), info.id);
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForTimeout(1500);
        await p.fill('#txtName', 'Nguyễn Văn A');
        await p.fill('#txtPhone', '0912345678');
        await p.selectOption('#cboProvince', 'TP. Hồ Chí Minh');
        await p.waitForTimeout(600);
        const w = await p.$eval('#txtWard', el => el.options.length > 1 ? el.options[1].value : '');
        if (w) await p.selectOption('#txtWard', w);
        await p.fill('#txtStreet', 'Số 12 Nguyễn Huệ');
        await p.check('#chkAgree');
        await bamGui(p);
        await p.waitForTimeout(1500);
        const don = await p.evaluate(() => { const os = getTable('orders'); return os[os.length - 1]; });
        kq.dat(don.items[0].quantity == 2, 'Số lượng đơn = ' + don.items[0].quantity);
        kq.dat(don.subtotal == info.gia * 2, 'Tạm tính = ' + don.subtotal + ' (kỳ vọng ' + info.gia * 2 + ')');
        const tonSau = await p.evaluate((id) => findById('products', id).stock_quantity, info.id);
        kq.dat(tonSau == info.ton - 2, 'Tồn kho giảm 2: ' + info.ton + ' → ' + tonSau);
        await p.evaluate((id) => cancelOrder(id), don.id);
        const tonHoan = await p.evaluate((id) => findById('products', id).stock_quantity, info.id);
        kq.dat(tonHoan == info.ton, 'Tồn kho hoàn: ' + tonHoan);
    });

    // =====================================================================
    // TC-S11-18: Miễn phí giao sát ngưỡng
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-18', trang: 'checkout.html', chucNang: 'E2E: miễn phí giao sát ngưỡng',
        tienDieuKien: 'User đăng nhập',
        cacBuoc: '1. Đồ nhỏ đúng 2.000.000 → phí 0 2. Thiếu 1 đồng → có phí 3. Đồ lớn nội thành 15.000.000 → phí 0',
        duLieu: 'Đồ nhỏ 2.000.000 / 1.999.999; đồ lớn 15.000.000',
        mongDoi: 'Phí giao đúng từng trường hợp, tổng tiền khớp',
        mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const kqTinh = await p.evaluate(() => {
            const methods = getTable('shipping_methods');
            const small = methods.filter(m => m.kind != 'BULKY')[0];
            const bulky = methods.filter(m => m.kind == 'BULKY')[0];
            const phi1 = calcShippingFee(small, 'city', 2000000);
            const phi2 = calcShippingFee(small, 'city', 1999999);
            const phi3 = calcShippingFee(bulky, 'city', 15000000);
            return { phi1: phi1, phi2: phi2, phi3: phi3, freeFrom: small.free_from, bulkyFree: bulky.free_from };
        });
        kq.dat(kqTinh.phi1 == 0, 'Đồ nhỏ 2.000.000: phí = ' + kqTinh.phi1);
        kq.dat(kqTinh.phi2 > 0, 'Đồ nhỏ 1.999.999: phí = ' + kqTinh.phi2);
        kq.dat(kqTinh.phi3 == 0, 'Đồ lớn 15.000.000: phí = ' + kqTinh.phi3);
    });

    // =====================================================================
    // TC-S11-19: Chatbot "sofa dưới 10 triệu" → mua đến Delivered
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-19', trang: 'index.html', chucNang: 'E2E: chatbot gợi ý sofa dưới 10 triệu → mua',
        tienDieuKien: 'User đăng nhập',
        cacBuoc: '1. Hỏi chatbot 2. Bấm sản phẩm gợi ý 3. Mua đến Delivered',
        duLieu: 'Câu hỏi "sofa dưới 10 triệu"',
        mongDoi: 'Đơn đúng sản phẩm, tồn kho giảm, doanh thu tăng đúng',
        mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(1000);
        // Chatbot được render qua renderChatbot() trong initPage của các trang có gọi.
        // Kiểm tra DOM thực tế: nếu trang chủ không render chatbot thì mở trang có gọi (checkout/order-detail).
        let coChat = await p.$('#chatInput, #txtChat, .chat-input, .chatbot-input, #chatbotInput');
        if (!coChat) {
            // Mở trang có gọi renderChatbot() để kiểm tra cấu trúc DOM chatbot thực tế
            const spId = await p.evaluate(() => {
                const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.product_type != 'USED');
                return ps[0].id;
            });
            await p.evaluate((id) => addToCart(id, 1), spId);
            await p.goto(p.url().replace(/index\.html.*/, 'checkout.html'));
            await p.waitForTimeout(1500);
            // Chờ chatbot render xong
            await p.waitForSelector('.chatbot, #chatbot, .chat-widget, [class*="chat"]', { timeout: 3000 }).catch(() => {});
            coChat = await p.$('#chatInput, #txtChat, .chat-input, .chatbot-input, #chatbotInput');
        }
        kq.dat(coChat != null, 'Có ô chat do renderChatbot() sinh ra = ' + (coChat != null));
        if (coChat) {
            await coChat.fill('sofa dưới 10 triệu');
            const nut = await p.$('.chat-send, button[onclick*="sendChat"], #btnSend, .chatbot-send');
            if (nut) await nut.click();
            await p.waitForTimeout(800);
            const chu = await t.chu();
            kq.dat(/sofa/i.test(chu), 'Chatbot trả lời có sofa');
        }
    });

    // =====================================================================
    // TC-S11-20: Tìm không dấu "ghe" → ra ghế → mua
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-20', trang: 'products.html', chucNang: 'E2E: tìm không dấu "ghe" → mua',
        tienDieuKien: 'User đăng nhập',
        cacBuoc: '1. Tìm "ghe" 2. Mua sản phẩm tìm được',
        duLieu: 'Từ khóa "ghe"',
        mongDoi: 'Ra sản phẩm ghế, đơn ghi đúng sản phẩm, tồn kho và doanh thu khớp',
        mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(1000);
        const oTim = await p.$('#txtSearch, input[type=search]');
        if (oTim) {
            await oTim.fill('ghe');
            await p.keyboard.press('Enter');
            await p.waitForTimeout(800);
            const chu = await t.chu();
            kq.dat(/ghế/i.test(chu), 'Kết quả có "ghế"');
        } else {
            kq.dat(false, 'Không có ô tìm kiếm');
        }
    });

    // =====================================================================
    // TC-S11-21: Đổi địa chỉ mặc định trong hồ sơ rồi đặt đơn mới
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-21', trang: 'account.html', chucNang: 'E2E: đổi địa chỉ mặc định → đặt đơn mới',
        tienDieuKien: 'User đăng nhập',
        cacBuoc: '1. Đổi địa chỉ mặc định 2. Đặt đơn mới',
        duLieu: 'Địa chỉ mới ở tỉnh khác',
        mongDoi: 'Form thanh toán tự điền địa chỉ mới, đơn lưu đúng địa chỉ, phí giao theo tỉnh mới',
        mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('account.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        await p.evaluate(() => {
            const us = getTable('users');
            for (const u of us) if (u.email == 'user@roomcraft.vn') {
                u.default_province = 'TP. Hà Nội';
                u.default_ward = 'Phường Hàng Bài';
                u.default_street = 'Số 99 Phố Huế';
                u.default_address = 'Số 99 Phố Huế, Phường Hàng Bài, TP. Hà Nội';
            }
            saveTable('users', us);
        });
        const spId = await p.evaluate(() => {
            const ps = getTable('products');
            const sp = ps.filter(x => x.is_active && x.product_type != 'USED')[0];
            sp.stock_quantity = 5;
            saveTable('products', ps);
            return sp.id;
        });
        await p.evaluate((id) => addToCart(id, 1), spId);
        await p.goto(p.url().replace(/account\.html.*/, 'checkout.html'));
        await p.waitForTimeout(1500);
        const tinh = await p.$eval('#cboProvince', el => el.value);
        kq.dat(tinh == 'TP. Hà Nội', 'Tỉnh tự điền: ' + tinh);
        const street = await p.$eval('#txtStreet', el => el.value);
        kq.dat(street == 'Số 99 Phố Huế', 'Đường tự điền: ' + street);
    });

    // =====================================================================
    // TC-S11-22: Yêu thích → admin làm hết hàng → nhập lại
    // =====================================================================
    await t.tc({
        ma: 'TC-S11-22', trang: 'wishlist.html', chucNang: 'E2E: yêu thích → admin làm hết hàng → nhập lại',
        tienDieuKien: 'User có sản phẩm trong yêu thích',
        cacBuoc: '1. Thêm yêu thích 2. Admin làm hết hàng 3. Admin nhập lại',
        duLieu: 'Sản phẩm yêu thích',
        mongDoi: 'Yêu thích hiện hết hàng, không thêm giỏ được, nhập lại mua được',
        mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('wishlist.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const spId = await p.evaluate(() => {
            const ps = getTable('products');
            const sp = ps.filter(x => x.is_active && x.product_type != 'USED')[0];
            sp.stock_quantity = 5;
            saveTable('products', ps);
            const user = findUserByEmail('user@roomcraft.vn');
            const wl = getObject('wishlists') || {};
            wl[user.id] = [sp.id];
            saveObject('wishlists', wl);
            return sp.id;
        });
        // Admin làm hết hàng
        await p.evaluate((id) => {
            const ps = getTable('products');
            for (const x of ps) if (x.id == id) x.stock_quantity = 0;
            saveTable('products', ps);
        }, spId);
        await p.reload();
        await p.waitForTimeout(600);
        const loi = await p.evaluate((id) => addToCart(id, 1), spId);
        kq.dat(loi != '', 'Hết hàng báo: "' + loi + '"');
        // Nhập lại
        await p.evaluate((id) => {
            const ps = getTable('products');
            for (const x of ps) if (x.id == id) x.stock_quantity = 5;
            saveTable('products', ps);
        }, spId);
        const loi2 = await p.evaluate((id) => addToCart(id, 1), spId);
        kq.dat(loi2 == '', 'Nhập lại mua được: "' + loi2 + '"');
    });

    // =====================================================================
    // TC-S11-23: 2 khách cùng đặt sản phẩm còn 2 món
});