const { phien, TAI_KHOAN } = require('../lib/khung-test');

phien({ ma: 's05', ten: 'Giỏ hàng & Thanh toán' }, async (t) => {

    // ===================== GIỎ HÀNG =====================

    await t.tc({
        ma: 'TC-S05-01', trang: 'cart.html', chucNang: 'Giỏ hàng - thêm vượt tồn kho',
        tienDieuKien: 'Đã đăng nhập user, giỏ trống', cacBuoc: '1. Mở trang Giỏ hàng 2. Gọi addToCart với số lượng vượt tồn kho',
        duLieu: 'Sản phẩm có tồn kho nhỏ, số lượng = tồn kho + 1', mongDoi: 'Báo "Trong kho chỉ còn N sản phẩm!", giỏ không thêm', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('cart.html', { vaiTro: 'user', moi: true });
        const sp = await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0);
            return ps[0];
        });
        const loi = await p.evaluate(([id, sl]) => addToCart(id, sl), [sp.id, sp.stock_quantity + 1]);
        kq.dat(loi == 'Trong kho chỉ còn ' + sp.stock_quantity + ' sản phẩm!', 'Thông báo: "' + loi + '"');
        const gio = await p.evaluate(() => getCart());
        kq.dat(gio.length == 0, 'Giỏ có ' + gio.length + ' món');
    });

    await t.tc({
        ma: 'TC-S05-02', trang: 'cart.html', chucNang: 'Giỏ hàng - đổi số lượng vượt tồn kho',
        tienDieuKien: 'Giỏ có 1 sản phẩm', cacBuoc: '1. Thêm 1 sản phẩm 2. Gõ số lượng vượt tồn kho vào ô 3. Rời ô',
        duLieu: 'Số lượng = tồn kho + 1', mongDoi: 'Báo "Trong kho chỉ còn N sản phẩm!", số lượng giữ nguyên', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('cart.html', { vaiTro: 'user', moi: true });
        const sp = await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 1);
            addToCart(ps[0].id, 1);
            return ps[0];
        });
        await p.reload();
        await p.waitForTimeout(800);
        t.xoaAlert();
        await p.fill('#txtQty0', String(sp.stock_quantity + 1));
        await p.press('#txtQty0', 'Tab');
        await p.waitForTimeout(500);
        kq.dat(t.alertCuoi() == 'Trong kho chỉ còn ' + sp.stock_quantity + ' sản phẩm!', 'Thông báo: "' + t.alertCuoi() + '"');
        const gio = await p.evaluate(() => getCart());
        kq.dat(gio[0].quantity == 1, 'Số lượng trong giỏ: ' + gio[0].quantity);
    });

    await t.tc({
        ma: 'TC-S05-03', trang: 'cart.html', chucNang: 'Giỏ hàng - đổi số lượng hợp lệ',
        tienDieuKien: 'Giỏ có 1 sản phẩm, tồn kho >= 3', cacBuoc: '1. Gõ số lượng 3 vào ô 2. Rời ô',
        duLieu: 'Số lượng: 3', mongDoi: 'Giỏ cập nhật số lượng 3, thành tiền = giá × 3', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('cart.html', { vaiTro: 'user', moi: true });
        const sp = await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity >= 3);
            addToCart(ps[0].id, 1);
            return ps[0];
        });
        await p.reload();
        await p.waitForTimeout(800);
        await p.fill('#txtQty0', '3');
        await p.press('#txtQty0', 'Tab');
        await p.waitForTimeout(500);
        const gio = await p.evaluate(() => getCart());
        kq.dat(gio[0].quantity == 3, 'Số lượng trong giỏ: ' + gio[0].quantity);
        const tong = await p.evaluate(() => getCartTotal());
        kq.dat(tong == sp.price * 3, 'Tạm tính: ' + tong + ' (mong đợi ' + (sp.price * 3) + ')');
    });

    await t.tc({
        ma: 'TC-S05-04', trang: 'cart.html', chucNang: 'Giỏ hàng - xóa sản phẩm',
        tienDieuKien: 'Giỏ có 1 sản phẩm', cacBuoc: '1. Bấm nút Xóa 2. Xác nhận',
        duLieu: 'Xóa sản phẩm duy nhất', mongDoi: 'Giỏ trống, hiện thông báo giỏ trống', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('cart.html', { vaiTro: 'user', moi: true });
        await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0);
            addToCart(ps[0].id, 1);
        });
        await p.reload();
        await p.waitForTimeout(800);
        await p.click("button[title='Xóa']");
        await p.waitForTimeout(500);
        const gio = await p.evaluate(() => getCart());
        kq.dat(gio.length == 0, 'Giỏ còn ' + gio.length + ' món');
        const chu = await t.chu('#cartContent');
        kq.dat(/Giỏ hàng của bạn đang trống/.test(chu), 'Nội dung: ' + (chu || '').substring(0, 80));
    });

    await t.tc({
        ma: 'TC-S05-05', trang: 'cart.html', chucNang: 'Giỏ khách gộp vào tài khoản khi đăng nhập',
        tienDieuKien: 'Khách chưa đăng nhập có giỏ', cacBuoc: '1. Khách thêm sản phẩm 2. Đăng nhập 3. Mở giỏ',
        duLieu: 'Giỏ khách 1 món', mongDoi: 'Sau đăng nhập giỏ của tài khoản hiển thị (nếu web gộp) hoặc giỏ khách tách biệt rõ ràng', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('cart.html', { vaiTro: 'khach', moi: true });
        const sp = await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0);
            addToCart(ps[0].id, 1);
            return ps[0];
        });
        const gioKhach = await p.evaluate(() => getCart());
        kq.dat(gioKhach.length == 1, 'Giỏ khách: ' + gioKhach.length + ' món');
        await p.evaluate(([e, m]) => login(e, m), [TAI_KHOAN.user.email, TAI_KHOAN.user.matKhau]);
        await p.reload();
        await p.waitForTimeout(800);
        const gioUser = await p.evaluate(() => getCart());
        kq.ghi('Giỏ sau đăng nhập: ' + JSON.stringify(gioUser));
        kq.dat(gioUser.length == 1 && gioUser[0].product_id == sp.id, 'Giỏ user sau đăng nhập: ' + JSON.stringify(gioUser));
    });

    await t.tc({
        ma: 'TC-S05-06', trang: 'cart.html', chucNang: 'Giỏ hàng - số lượng không phải số nguyên (mobile)',
        tienDieuKien: 'Giỏ có 1 sản phẩm', cacBuoc: '1. Gõ "1.5" vào ô số lượng 2. Rời ô',
        duLieu: 'Số lượng: 1.5', mongDoi: 'Báo "Số lượng phải là số nguyên!"', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('cart.html', { vaiTro: 'user', moi: true, manHinh: 'mobile' });
        await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0);
            addToCart(ps[0].id, 1);
        });
        await p.reload();
        await p.waitForTimeout(800);
        t.xoaAlert();
        await p.fill('#txtQty0', '1.5');
        await p.press('#txtQty0', 'Tab');
        await p.waitForTimeout(500);
        kq.dat(t.alertCuoi() == 'Số lượng phải là số nguyên!', 'Thông báo: "' + t.alertCuoi() + '"');
        const ngang = await t.traNgang();
        kq.dat(ngang == 0, 'Cuộn ngang: ' + ngang + 'px');
    });

    // ===================== THANH TOÁN - KIỂM TRA FORM =====================

    await t.tc({
        ma: 'TC-S05-07', trang: 'checkout.html', chucNang: 'Thanh toán - bỏ trống họ tên',
        tienDieuKien: 'Đã đăng nhập, giỏ có 1 món', cacBuoc: '1. Mở thanh toán 2. Xóa họ tên 3. Bấm Đặt hàng',
        duLieu: 'Họ tên: (trống)', mongDoi: 'Báo "Họ tên người nhận không được bỏ trống!", focus ô họ tên', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.parent_category_id != 1);
            addToCart(ps[0].id, 1);
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#btnPlaceOrder', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        t.xoaAlert();
        await p.fill('#txtName', '');
        await p.click('#btnPlaceOrder');
        await p.waitForTimeout(400);
        kq.dat(t.alertCuoi() == 'Họ tên người nhận không được bỏ trống!', 'Thông báo: "' + t.alertCuoi() + '"');
        const o = await p.evaluate(() => document.activeElement && document.activeElement.id);
        kq.dat(o == 'txtName', 'Con trỏ ở ô ' + o);
    });

    await t.tc({
        ma: 'TC-S05-08', trang: 'checkout.html', chucNang: 'Thanh toán - họ tên 1 chữ',
        tienDieuKien: 'Đã đăng nhập, giỏ có 1 món', cacBuoc: '1. Nhập họ tên "An" 2. Bấm Đặt hàng',
        duLieu: 'Họ tên: An', mongDoi: 'Báo "Họ tên chỉ gồm chữ cái và có ít nhất 2 chữ...", focus ô họ tên', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.parent_category_id != 1);
            addToCart(ps[0].id, 1);
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#btnPlaceOrder', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        t.xoaAlert();
        await p.fill('#txtName', 'An');
        await p.click('#btnPlaceOrder');
        await p.waitForTimeout(400);
        kq.dat(t.alertCuoi() == 'Họ tên chỉ gồm chữ cái và có ít nhất 2 chữ (vd. Nguyễn An)!', 'Thông báo: "' + t.alertCuoi() + '"');
        const o = await p.evaluate(() => document.activeElement && document.activeElement.id);
        kq.dat(o == 'txtName', 'Con trỏ ở ô ' + o);
    });

    await t.tc({
        ma: 'TC-S05-09', trang: 'checkout.html', chucNang: 'Thanh toán - SĐT sai đầu số',
        tienDieuKien: 'Đã đăng nhập, giỏ có 1 món', cacBuoc: '1. Nhập SĐT "0123456789" 2. Bấm Đặt hàng',
        duLieu: 'SĐT: 0123456789', mongDoi: 'Báo "Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09!", focus ô SĐT', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.parent_category_id != 1);
            addToCart(ps[0].id, 1);
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#btnPlaceOrder', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        t.xoaAlert();
        await p.fill('#txtName', 'Nguyễn Văn An');
        await p.fill('#txtPhone', '0123456789');
        await p.click('#btnPlaceOrder');
        await p.waitForTimeout(400);
        kq.dat(t.alertCuoi() == 'Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09!', 'Thông báo: "' + t.alertCuoi() + '"');
        const o = await p.evaluate(() => document.activeElement && document.activeElement.id);
        kq.dat(o == 'txtPhone', 'Con trỏ ở ô ' + o);
    });

    await t.tc({
        ma: 'TC-S05-10', trang: 'checkout.html', chucNang: 'Thanh toán - Phường/Xã theo Tỉnh/Thành',
        tienDieuKien: 'Đã đăng nhập, giỏ có 1 món', cacBuoc: '1. Chọn Tỉnh/Thành 2. Kiểm tra ô Phường/Xã',
        duLieu: 'Tỉnh: TP. Hồ Chí Minh', mongDoi: 'Ô Phường/Xã được bật và có danh sách phường của tỉnh đó', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.parent_category_id != 1);
            addToCart(ps[0].id, 1);
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#cboProvince', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        await p.selectOption('#cboProvince', 'TP. Hồ Chí Minh');
        await p.waitForTimeout(600);
        const soPhuong = await p.evaluate(() => document.querySelectorAll('#txtWard option').length);
        const disabled = await p.evaluate(() => document.getElementById('txtWard').disabled);
        kq.dat(disabled == false, 'Ô Phường/Xã disabled: ' + disabled);
        kq.dat(soPhuong > 1, 'Số phường/xã: ' + soPhuong);
    });

    await t.tc({
        ma: 'TC-S05-11', trang: 'checkout.html', chucNang: 'Thanh toán - loại nhà bắt buộc khi có đồ lớn',
        tienDieuKien: 'Giỏ có 1 món đồ lớn (Nội thất)', cacBuoc: '1. Điền đủ thông tin, không chọn loại nhà 2. Bấm Đặt hàng',
        duLieu: 'Không chọn loại nhà', mongDoi: 'Báo "Đơn có nội thất cỡ lớn, vui lòng chọn Loại nhà...", không tạo đơn', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.parent_category_id == 1);
            addToCart(ps[0].id, 1);
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#btnPlaceOrder', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        await p.fill('#txtName', 'Nguyễn Văn An');
        await p.fill('#txtPhone', '0901234567');
        await p.selectOption('#cboProvince', 'TP. Hồ Chí Minh');
        await p.waitForTimeout(500);
        const phuong = await p.evaluate(() => {
            const o = document.querySelectorAll('#txtWard option');
            return o.length > 1 ? o[1].value : '';
        });
        await p.selectOption('#txtWard', phuong);
        await p.fill('#txtStreet', '12 Đường số 5 Phường 1');
        await p.evaluate(() => {
            document.querySelectorAll("input[name='rdoHouse']").forEach(r => r.checked = false);
        });
        t.xoaAlert();
        await p.click('#btnPlaceOrder');
        await p.waitForTimeout(500);
        kq.dat(t.alertCuoi() == 'Đơn có nội thất cỡ lớn, vui lòng chọn Loại nhà để RoomCraft sắp xếp xe và người lắp đặt!', 'Thông báo: "' + t.alertCuoi() + '"');
        const soDon = await p.evaluate(() => getTable('orders').filter(o => Date.now() - new Date(o.created_at).getTime() < 120000).length);
        kq.dat(soDon == 0, 'Số đơn mới tạo trong 2 phút: ' + soDon);
    });

    await t.tc({
        ma: 'TC-S05-12', trang: 'checkout.html', chucNang: 'Thanh toán - chưa tick đồng ý điều khoản',
        tienDieuKien: 'Đã đăng nhập, giỏ có 1 món, form hợp lệ', cacBuoc: '1. Điền đủ thông tin 2. Không tick đồng ý 3. Bấm Đặt hàng',
        duLieu: 'chkAgree: unchecked', mongDoi: 'Báo "Vui lòng đọc và đồng ý với chính sách...", không tạo đơn', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.parent_category_id != 1);
            addToCart(ps[0].id, 1);
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#btnPlaceOrder', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        await p.fill('#txtName', 'Nguyễn Văn An');
        await p.fill('#txtPhone', '0901234567');
        await p.selectOption('#cboProvince', 'TP. Hồ Chí Minh');
        await p.waitForTimeout(500);
        const phuong = await p.evaluate(() => {
            const o = document.querySelectorAll('#txtWard option');
            return o.length > 1 ? o[1].value : '';
        });
        await p.selectOption('#txtWard', phuong);
        await p.fill('#txtStreet', '12 Đường số 5 Phường 1');
        await p.evaluate(() => { document.getElementById('chkAgree').checked = false; });
        t.xoaAlert();
        await p.click('#btnPlaceOrder');
        await p.waitForTimeout(500);
        kq.dat(t.alertCuoi() == 'Vui lòng đọc và đồng ý với chính sách thanh toán, giao hàng và đổi trả!', 'Thông báo: "' + t.alertCuoi() + '"');
        const soDon = await p.evaluate(() => getTable('orders').filter(o => Date.now() - new Date(o.created_at).getTime() < 120000).length);
        kq.dat(soDon == 0, 'Số đơn mới tạo trong 2 phút: ' + soDon);
    });

    // ===================== PHÍ GIAO HÀNG =====================

    await t.tc({
        ma: 'TC-S05-13', trang: 'checkout.html', chucNang: 'Phí giao đồ nhỏ nội thành dưới ngưỡng miễn phí',
        tienDieuKien: 'Giỏ đồ nhỏ, tạm tính < 2tr, tỉnh nội thành', cacBuoc: '1. Chọn TP. Hồ Chí Minh 2. Chọn giao tiêu chuẩn',
        duLieu: 'Tạm tính < 2.000.000', mongDoi: 'Phí giao = fee_city của phương thức tiêu chuẩn (35.000)', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        const info = await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.parent_category_id != 1 && x.price < 2000000);
            addToCart(ps[0].id, 1);
            const m = findById('shipping_methods', 1);
            return { tamTinh: getCartTotal(), fee: m.fee_city };
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#cboProvince', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        await p.selectOption('#cboProvince', 'TP. Hồ Chí Minh');
        await p.waitForTimeout(600);
        const phi = await p.evaluate(() => getShippingFee());
        kq.dat(phi == info.fee, 'Phí giao: ' + phi + ' (mong đợi ' + info.fee + ')');
    });

    await t.tc({
        ma: 'TC-S05-14', trang: 'checkout.html', chucNang: 'Phí giao đồ nhỏ tỉnh xa',
        tienDieuKien: 'Giỏ đồ nhỏ, tạm tính < 2tr, tỉnh xa', cacBuoc: '1. Chọn tỉnh xa (An Giang) 2. Chọn giao tiêu chuẩn',
        duLieu: 'Tỉnh: An Giang', mongDoi: 'Phí giao = fee_province (50.000)', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        const info = await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.parent_category_id != 1 && x.price < 2000000);
            addToCart(ps[0].id, 1);
            const m = findById('shipping_methods', 1);
            return { fee: m.fee_province };
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#cboProvince', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        await p.selectOption('#cboProvince', 'An Giang');
        await p.waitForTimeout(600);
        const phi = await p.evaluate(() => getShippingFee());
        kq.dat(phi == info.fee, 'Phí giao: ' + phi + ' (mong đợi ' + info.fee + ')');
    });

    await t.tc({
        ma: 'TC-S05-15', trang: 'checkout.html', chucNang: 'Miễn phí giao đồ nhỏ từ 2tr',
        tienDieuKien: 'Giỏ đồ nhỏ, tạm tính >= 2tr', cacBuoc: '1. Thêm đồ nhỏ đủ 2tr 2. Chọn tỉnh bất kỳ',
        duLieu: 'Tạm tính >= 2.000.000', mongDoi: 'Phí giao tiêu chuẩn = 0 (Miễn phí)', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.parent_category_id != 1 && x.price >= 2000000);
            addToCart(ps[0].id, 1);
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#cboProvince', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        await p.selectOption('#cboProvince', 'An Giang');
        await p.waitForTimeout(600);
        const phi = await p.evaluate(() => getShippingFee());
        kq.dat(phi == 0, 'Phí giao: ' + phi);
    });

    await t.tc({
        ma: 'TC-S05-16', trang: 'checkout.html', chucNang: 'Phí giao đồ lớn nội thành dưới ngưỡng 15tr',
        tienDieuKien: 'Giỏ đồ lớn, tạm tính < 15tr, nội thành', cacBuoc: '1. Thêm đồ lớn 2. Chọn TP. Hà Nội',
        duLieu: 'Tạm tính < 15.000.000', mongDoi: 'Phí giao = fee_city của phương thức BULKY', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        const info = await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.parent_category_id == 1 && x.price < 15000000);
            addToCart(ps[0].id, 1);
            const m = getTable('shipping_methods').find(x => x.kind == 'BULKY');
            return { fee: m.fee_city, tamTinh: getCartTotal() };
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#cboProvince', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        await p.selectOption('#cboProvince', 'TP. Hà Nội');
        await p.waitForTimeout(600);
        const phi = await p.evaluate(() => getShippingFee());
        kq.dat(phi == info.fee, 'Phí giao: ' + phi + ' (mong đợi ' + info.fee + ')');
    });

    await t.tc({
        ma: 'TC-S05-17', trang: 'checkout.html', chucNang: 'Miễn phí giao đồ lớn nội thành từ 15tr',
        tienDieuKien: 'Giỏ đồ lớn, tạm tính >= 15tr, nội thành', cacBuoc: '1. Thêm đồ lớn đủ 15tr 2. Chọn TP. Đà Nẵng',
        duLieu: 'Tạm tính >= 15.000.000', mongDoi: 'Phí giao = 0', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.parent_category_id == 1 && x.price >= 15000000);
            addToCart(ps[0].id, 1);
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#cboProvince', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        await p.selectOption('#cboProvince', 'TP. Đà Nẵng');
        await p.waitForTimeout(600);
        const phi = await p.evaluate(() => getShippingFee());
        kq.dat(phi == 0, 'Phí giao: ' + phi);
    });

    await t.tc({
        ma: 'TC-S05-18', trang: 'checkout.html', chucNang: 'Giao nhanh chỉ nội thành',
        tienDieuKien: 'Giỏ đồ nhỏ, tỉnh xa', cacBuoc: '1. Chọn An Giang 2. Kiểm tra phương thức giao nhanh',
        duLieu: 'Tỉnh: An Giang', mongDoi: 'Phương thức giao nhanh bị vô hiệu hóa (disabled)', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.parent_category_id != 1);
            addToCart(ps[0].id, 1);
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#cboProvince', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        await p.selectOption('#cboProvince', 'An Giang');
        await p.waitForTimeout(600);
        const dis = await p.evaluate(() => {
            const r = document.querySelector("input[name='rdoShipping'][value='2']");
            return r ? r.disabled : null;
        });
        kq.dat(dis === true, 'Giao nhanh disabled: ' + dis);
    });

    // ===================== COD / ĐẶT CỌC =====================

    await t.tc({
        ma: 'TC-S05-19', trang: 'checkout.html', chucNang: 'COD đúng 10.000.000 được phép',
        tienDieuKien: 'Tổng đơn = 10.000.000', cacBuoc: '1. Kiểm tra canUseCOD(10000000)',
        duLieu: 'Tổng: 10.000.000', mongDoi: 'COD được phép (true)', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        const ok = await p.evaluate(() => canUseCOD(10000000));
        kq.dat(ok === true, 'canUseCOD(10000000) = ' + ok);
    });

    await t.tc({
        ma: 'TC-S05-20', trang: 'checkout.html', chucNang: 'COD 10.000.001 bị khóa',
        tienDieuKien: 'Tổng đơn = 10.000.001', cacBuoc: '1. Kiểm tra canUseCOD(10000001)',
        duLieu: 'Tổng: 10.000.001', mongDoi: 'COD bị khóa (false)', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        const ok = await p.evaluate(() => canUseCOD(10000001));
        kq.dat(ok === false, 'canUseCOD(10000001) = ' + ok);
    });

    await t.tc({
        ma: 'TC-S05-21', trang: 'checkout.html', chucNang: 'Đặt cọc 30% làm tròn lên nghìn',
        tienDieuKien: 'Tổng đơn bất kỳ', cacBuoc: '1. Kiểm tra calcDeposit',
        duLieu: 'Tổng: 10.000.001', mongDoi: 'Cọc = ceil(10000001*0.3/1000)*1000 = 3.001.000', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        const coc = await p.evaluate(() => calcDeposit(10000001));
        const mongDoi = Math.ceil(10000001 * 0.3 / 1000) * 1000;
        kq.dat(coc == mongDoi, 'Cọc: ' + coc + ' (mong đợi ' + mongDoi + ')');
    });

    await t.tc({
        ma: 'TC-S05-22', trang: 'checkout.html', chucNang: 'Đơn > 10tr không có COD, có đặt cọc',
        tienDieuKien: 'Giỏ đồ lớn tổng > 10tr', cacBuoc: '1. Mở thanh toán 2. Kiểm tra danh sách hình thức thanh toán',
        duLieu: 'Tổng > 10.000.000', mongDoi: 'COD bị disabled, có lựa chọn Đặt cọc 30%', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.parent_category_id == 1 && x.price > 10000000);
            addToCart(ps[0].id, 1);
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#cboProvince', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        await p.selectOption('#cboProvince', 'TP. Hồ Chí Minh');
        await p.waitForTimeout(600);
        const kqCOD = await p.evaluate(() => {
            const r = document.querySelector("input[name='rdoPlan'][value='COD']");
            return r ? r.disabled : null;
        });
        const coCoc = await p.evaluate(() => !!document.querySelector("input[name='rdoPlan'][value='DEPOSIT']"));
        kq.dat(kqCOD === true, 'COD disabled: ' + kqCOD);
        kq.dat(coCoc === true, 'Có lựa chọn đặt cọc: ' + coCoc);
    });

    // ===================== MÃ GIẢM GIÁ =====================

    await t.tc({
        ma: 'TC-S05-23', trang: 'checkout.html', chucNang: 'Mã giảm giá đủ điều kiện',
        tienDieuKien: 'Giỏ có tạm tính >= min_order_value của ROOMCRAFT10', cacBuoc: '1. Nhập ROOMCRAFT10 2. Bấm Áp dụng',
        duLieu: 'Mã: ROOMCRAFT10', mongDoi: 'Hiện "Đã áp dụng mã ROOMCRAFT10!", giảm 10% tạm tính', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        const info = await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.parent_category_id != 1 && x.price >= 2000000);
            addToCart(ps[0].id, 1);
            return { tamTinh: getCartTotal() };
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#txtCoupon', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        await p.fill('#txtCoupon', 'ROOMCRAFT10');
        await p.click("input[value='Áp dụng']");
        await p.waitForTimeout(500);
        const msg = await t.chu('#msgCoupon');
        kq.dat(msg == 'Đã áp dụng mã ROOMCRAFT10!', 'Thông báo: "' + msg + '"');
        const giam = await p.evaluate(() => calcDiscount(appliedCoupon, getCartTotal()));
        kq.dat(giam == Math.round(info.tamTinh * 10 / 100), 'Giảm: ' + giam);
    });

    await t.tc({
        ma: 'TC-S05-24', trang: 'checkout.html', chucNang: 'Mã giảm giá không đủ điều kiện',
        tienDieuKien: 'Giỏ có tạm tính < min_order_value của GIAM200K', cacBuoc: '1. Nhập GIAM200K 2. Bấm Áp dụng',
        duLieu: 'Mã: GIAM200K, tạm tính < 5tr', mongDoi: 'Hiện "Đơn hàng cần tối thiểu 5.000.000 ₫ để dùng mã này!"', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.parent_category_id != 1 && x.price < 5000000);
            addToCart(ps[0].id, 1);
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#txtCoupon', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        await p.fill('#txtCoupon', 'GIAM200K');
        await p.click("input[value='Áp dụng']");
        await p.waitForTimeout(500);
        const msg = await t.chu('#msgCoupon');
        kq.dat(msg == 'Đơn hàng cần tối thiểu 5.000.000 ₫ để dùng mã này!', 'Thông báo: "' + msg + '"');
    });

    // ===================== THẺ =====================

    await t.tc({
        ma: 'TC-S05-25', trang: 'checkout.html', chucNang: 'Thẻ sai Luhn',
        tienDieuKien: 'Đã đăng nhập, giỏ có 1 món', cacBuoc: '1. Chọn trả trước, thẻ 2. Nhập số thẻ sai Luhn 3. Đặt hàng',
        duLieu: 'Số thẻ: 1234 5678 9012 3456', mongDoi: 'Báo "Số thẻ không hợp lệ...", focus ô số thẻ', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.parent_category_id != 1);
            addToCart(ps[0].id, 1);
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#btnPlaceOrder', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        await p.fill('#txtName', 'Nguyễn Văn An');
        await p.fill('#txtPhone', '0901234567');
        await p.selectOption('#cboProvince', 'TP. Hồ Chí Minh');
        await p.waitForTimeout(500);
        const phuong = await p.evaluate(() => {
            const o = document.querySelectorAll('#txtWard option');
            return o.length > 1 ? o[1].value : '';
        });
        await p.selectOption('#txtWard', phuong);
        await p.fill('#txtStreet', '12 Đường số 5 Phường 1');
        await p.evaluate(() => {
            const r = document.querySelector("input[name='rdoPlan'][value='FULL']");
            if (r) { r.checked = true; r.click(); }
        });
        await p.waitForTimeout(400);
        await p.evaluate(() => {
            const r = document.querySelector("input[name='rdoPayment'][value='Card']");
            if (r) { r.checked = true; r.click(); }
        });
        await p.waitForSelector('#txtCardNumber', { state: 'attached', timeout: 10000 });
        await p.waitForTimeout(400);
        await p.fill('#txtCardNumber', '1234 5678 9012 3456');
        await p.fill('#txtCardName', 'NGUYEN VAN AN');
        await p.fill('#txtCardExpiry', '12/30');
        await p.fill('#txtCardCvv', '123');
        await p.evaluate(() => { document.getElementById('chkAgree').checked = true; });
        t.xoaAlert();
        await p.click('#btnPlaceOrder');
        await p.waitForTimeout(500);
        kq.dat(t.alertCuoi() == 'Số thẻ không hợp lệ (cần 16 chữ số đúng định dạng thẻ)!', 'Thông báo: "' + t.alertCuoi() + '"');
    });

    await t.tc({
        ma: 'TC-S05-26', trang: 'checkout.html', chucNang: 'Thẻ hết hạn',
        tienDieuKien: 'Đã đăng nhập, giỏ có 1 món', cacBuoc: '1. Chọn thẻ 2. Nhập thẻ Luhn đúng nhưng hết hạn 3. Đặt hàng',
        duLieu: 'Số thẻ: 4111 1111 1111 1111, hết hạn 01/20', mongDoi: 'Báo "Ngày hết hạn phải theo dạng MM/YY và thẻ chưa hết hạn!"', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity > 0 && x.parent_category_id != 1);
            addToCart(ps[0].id, 1);
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#btnPlaceOrder', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        await p.fill('#txtName', 'Nguyễn Văn An');
        await p.fill('#txtPhone', '0901234567');
        await p.selectOption('#cboProvince', 'TP. Hồ Chí Minh');
        await p.waitForTimeout(500);
        const phuong = await p.evaluate(() => {
            const o = document.querySelectorAll('#txtWard option');
            return o.length > 1 ? o[1].value : '';
        });
        await p.selectOption('#txtWard', phuong);
        await p.fill('#txtStreet', '12 Đường số 5 Phường 1');
        await p.evaluate(() => {
            const r = document.querySelector("input[name='rdoPlan'][value='FULL']");
            if (r) { r.checked = true; r.click(); }
        });
        await p.waitForTimeout(400);
        await p.evaluate(() => {
            const r = document.querySelector("input[name='rdoPayment'][value='Card']");
            if (r) { r.checked = true; r.click(); }
        });
        await p.waitForSelector('#txtCardNumber', { state: 'attached', timeout: 10000 });
        await p.waitForTimeout(400);
        await p.fill('#txtCardNumber', '4111 1111 1111 1111');
        await p.fill('#txtCardName', 'NGUYEN VAN AN');
        await p.fill('#txtCardExpiry', '01/20');
        await p.fill('#txtCardCvv', '123');
        await p.evaluate(() => { document.getElementById('chkAgree').checked = true; });
        t.xoaAlert();
        await p.click('#btnPlaceOrder');
        await p.waitForTimeout(500);
        kq.dat(t.alertCuoi() == 'Ngày hết hạn phải theo dạng MM/YY và thẻ chưa hết hạn!', 'Thông báo: "' + t.alertCuoi() + '"');
    });

    // ===================== ĐẶT HÀNG THÀNH CÔNG =====================

    await t.tc({
        ma: 'TC-S05-27', trang: 'checkout.html', chucNang: 'Đặt hàng thành công - tồn kho giảm, giỏ trống',
        tienDieuKien: 'Đã đăng nhập, giỏ có 1 món, form hợp lệ', cacBuoc: '1. Điền đủ thông tin 2. Tick đồng ý 3. Bấm Đặt hàng',
        duLieu: 'Đơn COD hợp lệ', mongDoi: 'Chuyển trang order-success, tồn kho giảm đúng số lượng, giỏ trống', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        const info = await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity >= 2 && x.parent_category_id != 1 && x.price < 3000000);
            addToCart(ps[0].id, 1);
            return { id: ps[0].id, stock: ps[0].stock_quantity };
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#btnPlaceOrder', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        await p.fill('#txtName', 'Nguyễn Văn An');
        await p.fill('#txtPhone', '0901234567');
        await p.selectOption('#cboProvince', 'TP. Hồ Chí Minh');
        await p.waitForTimeout(500);
        const phuong = await p.evaluate(() => {
            const o = document.querySelectorAll('#txtWard option');
            return o.length > 1 ? o[1].value : '';
        });
        await p.selectOption('#txtWard', phuong);
        await p.fill('#txtStreet', '12 Đường số 5 Phường 1');
        await p.evaluate(() => { document.getElementById('chkAgree').checked = true; });
        await p.click('#btnPlaceOrder');
        await p.waitForTimeout(1500);
        kq.dat(/order-success\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
        const sp = await p.evaluate((id) => findById('products', id), info.id);
        kq.dat(sp.stock_quantity == info.stock - 1, 'Tồn kho: ' + sp.stock_quantity + ' (trước: ' + info.stock + ')');
        const gio = await p.evaluate(() => { const c = JSON.parse(localStorage.getItem('rc_carts') || '{}'); const s = JSON.parse(localStorage.getItem('rc_session') || 'null'); return c[s ? s.user_id : 'guest'] || []; });
        kq.dat(gio.length == 0, 'Giỏ còn ' + gio.length + ' món');
    });

    await t.tc({
        ma: 'TC-S05-28', trang: 'order-success.html', chucNang: 'Trang Đặt hàng thành công - đúng số tiền',
        tienDieuKien: 'Vừa đặt đơn thành công', cacBuoc: '1. Xem trang order-success 2. So sánh tổng tiền',
        duLieu: 'Đơn vừa tạo', mongDoi: 'Trang hiển thị đúng tổng tiền của đơn trong localStorage', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true });
        await p.evaluate(() => {
            const ps = getTable('products').filter(x => x.is_active && x.stock_quantity >= 2 && x.parent_category_id != 1 && x.price < 3000000);
            addToCart(ps[0].id, 1);
        });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForSelector('#btnPlaceOrder', { state: 'attached', timeout: 15000 });
        await p.waitForTimeout(1500);
        await p.fill('#txtName', 'Nguyễn Văn An');
        await p.fill('#txtPhone', '0901234567');
        await p.selectOption('#cboProvince', 'TP. Hồ Chí Minh');
        await p.waitForTimeout(500);
        const phuong = await p.evaluate(() => {
            const o = document.querySelectorAll('#txtWard option');
            return o.length > 1 ? o[1].value : '';
        });
        await p.selectOption('#txtWard', phuong);
        await p.fill('#txtStreet', '12 Đường số 5 Phường 1');
        await p.evaluate(() => { document.getElementById('chkAgree').checked = true; });
        await p.click('#btnPlaceOrder');
        await p.waitForTimeout(1500);
        const don = await p.evaluate(() => {
            const ds = getTable('orders');
            return ds[ds.length - 1];
        });
        const chu = await t.chu('#successBox');
        const tong = await p.evaluate((t) => formatVND(t), don.total_amount);
        kq.dat(chu.indexOf(tong) >= 0, 'Trang hiển thị: ' + (chu || '').substring(0, 200) + ' | Mong đợi chứa: ' + tong);
    });

    await t.tc({
        ma: 'TC-S05-29', trang: 'checkout.html', chucNang: 'Thanh toán - giỏ trống chuyển về cart (mobile)',
        tienDieuKien: 'Đã đăng nhập, giỏ trống', cacBuoc: '1. Mở thẳng checkout.html',
        duLieu: 'Giỏ trống', mongDoi: 'Báo "Giỏ hàng đang trống!" và chuyển về cart.html', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'user', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(1500);
        kq.dat(t.alertCuoi() == 'Giỏ hàng đang trống!', 'Thông báo: "' + t.alertCuoi() + '"');
        kq.dat(/cart\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
        const ngang = await t.traNgang();
        kq.dat(ngang == 0, 'Cuộn ngang: ' + ngang + 'px');
    });

    await t.tc({
        ma: 'TC-S05-30', trang: 'checkout.html', chucNang: 'Phân quyền - khách chưa đăng nhập vào checkout',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Mở thẳng checkout.html',
        duLieu: 'Vai trò: khách', mongDoi: 'Bị chặn, chuyển về trang đăng nhập', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('checkout.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1500);
        kq.dat(/login\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });
});