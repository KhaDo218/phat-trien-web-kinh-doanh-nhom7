const { phien, TAI_KHOAN } = require('../lib/khung-test');

phien({ ma: 's10', ten: 'Phi chức năng' }, async (t) => {

    // ============ NHÓM 1: KHÔNG CUỘN NGANG Ở 3 KÍCH THƯỚC ============

    await t.tc({
        ma: 'TC-S10-01', trang: 'index.html', chucNang: 'Bố cục - không cuộn ngang ở 390px',
        tienDieuKien: 'Mở trang chủ', cacBuoc: '1. Mở trang chủ ở khung 390px 2. Đo scrollWidth so với clientWidth',
        duLieu: 'Khung 390px', mongDoi: 'Không có cuộn ngang (số px cuộn ngang = 0)', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(800);
        const ngang = await t.traNgang();
        kq.dat(ngang === 0, 'Số px cuộn ngang: ' + ngang);
    });

    await t.tc({
        ma: 'TC-S10-02', trang: 'index.html', chucNang: 'Bố cục - không cuộn ngang ở 768px',
        tienDieuKien: 'Mở trang chủ', cacBuoc: '1. Mở trang chủ ở khung 768px 2. Đo scrollWidth so với clientWidth',
        duLieu: 'Khung 768px', mongDoi: 'Không có cuộn ngang (số px cuộn ngang = 0)', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.setViewportSize({ width: 768, height: 1024 });
        await p.waitForTimeout(600);
        const ngang = await t.traNgang();
        kq.dat(ngang === 0, 'Số px cuộn ngang: ' + ngang);
    });

    await t.tc({
        ma: 'TC-S10-03', trang: 'index.html', chucNang: 'Bố cục - không cuộn ngang ở 1440px',
        tienDieuKien: 'Mở trang chủ', cacBuoc: '1. Mở trang chủ ở khung 1440px 2. Đo scrollWidth so với clientWidth',
        duLieu: 'Khung 1440px', mongDoi: 'Không có cuộn ngang (số px cuộn ngang = 0)', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.setViewportSize({ width: 1440, height: 900 });
        await p.waitForTimeout(600);
        const ngang = await t.traNgang();
        kq.dat(ngang === 0, 'Số px cuộn ngang: ' + ngang);
    });

    await t.tc({
        ma: 'TC-S10-04', trang: 'cart.html', chucNang: 'Bố cục - giỏ hàng không cuộn ngang ở 390px',
        tienDieuKien: 'Đăng nhập user, có sản phẩm trong giỏ', cacBuoc: '1. Thêm 2 sản phẩm vào giỏ 2. Mở giỏ hàng ở 390px 3. Đo cuộn ngang',
        duLieu: 'Khung 390px', mongDoi: 'Không có cuộn ngang', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'user', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(800);
        await p.evaluate(() => {
            const ps = getTable('products');
            const u = getCurrentUser();
            const uid = u ? u.id : 'guest';
            const carts = getObject('carts') || {};
            let gio = carts[uid] || [];
            if (ps.length > 0) gio.push({ product_id: ps[0].id, quantity: 1 });
            if (ps.length > 1) gio.push({ product_id: ps[1].id, quantity: 1 });
            carts[uid] = gio;
            saveObject('carts', carts);
        });
        await p.goto(p.url().replace('index.html', 'cart.html'));
        await p.waitForTimeout(800);
        const ngang = await t.traNgang();
        kq.dat(ngang === 0, 'Số px cuộn ngang: ' + ngang);
    });

    await t.tc({
        ma: 'TC-S10-05', trang: 'checkout.html', chucNang: 'Bố cục - thanh toán không cuộn ngang ở 390px',
        tienDieuKien: 'Đăng nhập user, có sản phẩm trong giỏ', cacBuoc: '1. Thêm sản phẩm 2. Mở trang thanh toán ở 390px 3. Đo cuộn ngang',
        duLieu: 'Khung 390px', mongDoi: 'Không có cuộn ngang', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'user', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(800);
        await p.evaluate(() => {
            const ps = getTable('products');
            const u = getCurrentUser();
            const uid = u ? u.id : 'guest';
            const carts = getObject('carts') || {};
            let gio = carts[uid] || [];
            if (ps.length > 0) gio.push({ product_id: ps[0].id, quantity: 1 });
            carts[uid] = gio;
            saveObject('carts', carts);
        });
        await p.goto(p.url().replace('index.html', 'checkout.html'));
        await p.waitForTimeout(800);
        const ngang = await t.traNgang();
        kq.dat(ngang === 0, 'Số px cuộn ngang: ' + ngang);
    });

    await t.tc({
        ma: 'TC-S10-06', trang: 'admin/index.html', chucNang: 'Bố cục - trang quản trị không cuộn ngang ở 1440px',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Mở admin/index.html ở 1440px 2. Đo cuộn ngang',
        duLieu: 'Khung 1440px', mongDoi: 'Không có cuộn ngang', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/index.html', { vaiTro: 'admin', moi: true });
        await p.setViewportSize({ width: 1440, height: 900 });
        await p.waitForTimeout(800);
        const ngang = await t.traNgang();
        kq.dat(ngang === 0, 'Số px cuộn ngang: ' + ngang);
    });

    // ============ NHÓM 2: PHÂN QUYỀN ============

    await t.tc({
        ma: 'TC-S10-07', trang: 'cart.html', chucNang: 'Phân quyền - khách mở giỏ hàng (giỏ khách)',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Mở cart.html khi chưa đăng nhập 2. Mở checkout.html',
        duLieu: 'Khách', mongDoi: 'Khách xem được giỏ hàng (giỏ guest, không bị chuyển trang); sang Thanh toán thì bị chuyển tới login.html', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('cart.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        kq.dat(/cart\.html/.test(p.url()), 'Mở giỏ: đang ở ' + p.url().split('/scripts/')[1]);
        await p.evaluate(() => { const sp = getTable('products').find(x => x.is_active !== false && x.stock_quantity > 0); addToCart(sp.id, 1); });
        await p.goto(p.url().replace(/[^/]+$/, 'checkout.html'));
        await p.waitForTimeout(1200);
        kq.dat(/login\.html/.test(p.url()), 'Mở thanh toán: đang ở ' + p.url().split('/scripts/')[1]);
    });

    await t.tc({
        ma: 'TC-S10-08', trang: 'orders.html', chucNang: 'Phân quyền - khách mở đơn hàng',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Mở orders.html khi chưa đăng nhập',
        duLieu: 'Khách', mongDoi: 'Bị chặn, chuyển sang login.html', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1000);
        kq.dat(/login\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });

    await t.tc({
        ma: 'TC-S10-09', trang: 'admin/products.html', chucNang: 'Phân quyền - user thường mở trang admin sản phẩm',
        tienDieuKien: 'Đăng nhập user', cacBuoc: '1. Mở admin/products.html khi đăng nhập user',
        duLieu: TAI_KHOAN.user.email, mongDoi: 'Bị chặn, chuyển về index.html (không phải admin)', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/products.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(1000);
        kq.dat(!/admin\//.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
        kq.dat(/index\.html/.test(p.url()), 'Về trang chủ: ' + /index\.html/.test(p.url()));
    });

    await t.tc({
        ma: 'TC-S10-10', trang: 'admin/orders.html', chucNang: 'Phân quyền - khách mở trang admin đơn hàng',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Mở admin/orders.html khi chưa đăng nhập',
        duLieu: 'Khách', mongDoi: 'Bị chặn, chuyển sang login.html', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/orders.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1000);
        kq.dat(/login\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });

    await t.tc({
        ma: 'TC-S10-11', trang: 'admin/index.html', chucNang: 'Phân quyền - admin vào được trang quản trị',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Mở admin/index.html khi đăng nhập admin',
        duLieu: TAI_KHOAN.admin.email, mongDoi: 'Vẫn ở admin/index.html, không bị chặn', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/index.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(1000);
        kq.dat(/admin\/index\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });

    // ============ NHÓM 3: MẤT MẠNG - FONT/ICON/3D/BIỂU ĐỒ VẪN HIỆN ============

    await t.tc({
        ma: 'TC-S10-12', trang: 'index.html', chucNang: 'Mất mạng - trang chủ vẫn hiển thị nội dung',
        tienDieuKien: 'Chặn mạng sau khi trang đã tải', cacBuoc: '1. Mở trang chủ 2. Chặn mạng 3. Kiểm tra tiêu đề và sản phẩm vẫn hiện',
        duLieu: 'offline', mongDoi: 'Trang chủ vẫn hiện tiêu đề và danh sách sản phẩm', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1000);
        await p.context().setOffline(true);
        await p.waitForTimeout(500);
        const chu = await t.chu();
        kq.dat(chu != null && chu.length > 100, 'Độ dài nội dung: ' + (chu ? chu.length : 0));
        const soThe = await p.locator('.product-card, .card, [class*=product]').count();
        kq.dat(soThe > 0, 'Số thẻ sản phẩm hiển thị: ' + soThe);
        await p.context().setOffline(false);
    });

    await t.tc({
        ma: 'TC-S10-13', trang: 'index.html', chucNang: 'Mất mạng - icon/font không vỡ bố cục',
        tienDieuKien: 'Chặn mạng', cacBuoc: '1. Mở trang chủ 2. Chặn mạng 3. Đo cuộn ngang và kiểm tra header vẫn hiện',
        duLieu: 'offline', mongDoi: 'Header vẫn hiện, không cuộn ngang', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1000);
        await p.context().setOffline(true);
        await p.waitForTimeout(500);
        const header = await p.locator('header, .header, nav').first().count();
        kq.dat(header > 0, 'Header hiện: ' + (header > 0));
        const ngang = await t.traNgang();
        kq.dat(ngang === 0, 'Số px cuộn ngang: ' + ngang);
        await p.context().setOffline(false);
    });

    await t.tc({
        ma: 'TC-S10-14', trang: 'product-detail.html', chucNang: 'Mất mạng - trang chi tiết sản phẩm vẫn hiện',
        tienDieuKien: 'Đã mở trang chi tiết', cacBuoc: '1. Mở chi tiết sản phẩm 2. Chặn mạng 3. Kiểm tra tên sản phẩm vẫn hiện',
        duLieu: 'offline', mongDoi: 'Tên sản phẩm và giá vẫn hiển thị', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const id = await p.evaluate(() => { const ps = getTable('products'); return ps.length ? ps[0].id : null; });
        if (id == null) { kq.dat(false, 'Không có sản phẩm'); return; }
        await p.goto(p.url().replace('index.html', 'product-detail.html?id=' + id));
        await p.waitForTimeout(800);
        await p.context().setOffline(true);
        await p.waitForTimeout(500);
        const chu = await t.chu();
        kq.dat(chu != null && chu.length > 50, 'Độ dài nội dung: ' + (chu ? chu.length : 0));
        await p.context().setOffline(false);
    });

    // ============ NHÓM 4: ẢNH/MODEL 404 ============

    await t.tc({
        ma: 'TC-S10-15', trang: 'index.html', chucNang: 'Ảnh 404 - trang chủ vẫn tải được khi ảnh lỗi',
        tienDieuKien: 'Chặn ảnh trả 404', cacBuoc: '1. Chặn mọi request ảnh trả 404 2. Mở trang chủ 3. Kiểm tra trang vẫn hiện',
        duLieu: 'Ảnh 404', mongDoi: 'Trang chủ vẫn hiện nội dung, không lỗi trắng', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.route('**/*.{png,jpg,jpeg,webp,gif,svg}', route => route.fulfill({ status: 404, body: '' }));
        await p.reload();
        await p.waitForTimeout(1000);
        const chu = await t.chu();
        kq.dat(chu != null && chu.length > 100, 'Độ dài nội dung: ' + (chu ? chu.length : 0));
        await p.unroute('**/*.{png,jpg,jpeg,webp,gif,svg}');
    });

    await t.tc({
        ma: 'TC-S10-16', trang: 'product-detail.html', chucNang: 'Model 3D 404 - trang chi tiết vẫn hiện',
        tienDieuKien: 'Chặn model 3D trả 404', cacBuoc: '1. Chặn file .glb/.gltf trả 404 2. Mở chi tiết sản phẩm 3. Kiểm tra trang vẫn hiện',
        duLieu: 'Model 404', mongDoi: 'Trang chi tiết vẫn hiện tên và giá', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const id = await p.evaluate(() => { const ps = getTable('products'); return ps.length ? ps[0].id : null; });
        if (id == null) { kq.dat(false, 'Không có sản phẩm'); return; }
        await p.route('**/*.{glb,gltf}', route => route.fulfill({ status: 404, body: '' }));
        await p.goto(p.url().replace('index.html', 'product-detail.html?id=' + id));
        await p.waitForTimeout(1000);
        const chu = await t.chu();
        kq.dat(chu != null && chu.length > 50, 'Độ dài nội dung: ' + (chu ? chu.length : 0));
        await p.unroute('**/*.{glb,gltf}');
    });

    // ============ NHÓM 5: LỖI CONSOLE ============

    await t.tc({
        ma: 'TC-S10-17', trang: 'index.html', chucNang: 'Console - trang chủ không có lỗi JS',
        tienDieuKien: 'Mở trang chủ', cacBuoc: '1. Bắt lỗi console 2. Mở trang chủ 3. Kiểm tra không có lỗi',
        duLieu: 'Không', mongDoi: 'Không có lỗi console.error', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        const loi = [];
        p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::|Failed to load resource/.test(m.text())) loi.push(m.text()); });
        p.on('pageerror', e => loi.push(e.message));
        await p.reload();
        await p.waitForTimeout(1500);
        kq.dat(loi.length === 0, 'Số lỗi console: ' + loi.length + (loi.length ? ' | ' + loi[0] : ''));
    });

    await t.tc({
        ma: 'TC-S10-18', trang: 'cart.html', chucNang: 'Console - giỏ hàng không có lỗi JS',
        tienDieuKien: 'Đăng nhập user', cacBuoc: '1. Bắt lỗi console 2. Mở giỏ hàng 3. Kiểm tra không có lỗi',
        duLieu: 'Không', mongDoi: 'Không có lỗi console.error', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'user', moi: true });
        const loi = [];
        p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::|Failed to load resource/.test(m.text())) loi.push(m.text()); });
        p.on('pageerror', e => loi.push(e.message));
        await p.goto(p.url().replace('index.html', 'cart.html'));
        await p.waitForTimeout(1500);
        kq.dat(loi.length === 0, 'Số lỗi console: ' + loi.length + (loi.length ? ' | ' + loi[0] : ''));
    });

    await t.tc({
        ma: 'TC-S10-19', trang: 'admin/index.html', chucNang: 'Console - trang quản trị không có lỗi JS',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Bắt lỗi console 2. Mở admin/index.html 3. Kiểm tra không có lỗi',
        duLieu: 'Không', mongDoi: 'Không có lỗi console.error', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'admin', moi: true });
        const loi = [];
        p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::|Failed to load resource/.test(m.text())) loi.push(m.text()); });
        p.on('pageerror', e => loi.push(e.message));
        await p.goto(p.url().replace('index.html', 'admin/index.html'));
        await p.waitForTimeout(1500);
        kq.dat(loi.length === 0, 'Số lỗi console: ' + loi.length + (loi.length ? ' | ' + loi[0] : ''));
    });

    // ============ NHÓM 6: DATA_VERSION - GIỮ TÀI KHOẢN TỰ ĐĂNG KÝ ============

    await t.tc({
        ma: 'TC-S10-20', trang: 'index.html', chucNang: 'DATA_VERSION - tài khoản tự đăng ký vẫn giữ sau khi tăng version',
        tienDieuKien: 'Đã có tài khoản tự đăng ký trong localStorage', cacBuoc: '1. Tạo tài khoản tự đăng ký 2. Đổi rc_version thành số cũ 3. Reload 4. Kiểm tra tài khoản vẫn còn',
        duLieu: 'email tự đăng ký', mongDoi: 'Tài khoản tự đăng ký vẫn tồn tại sau khi nạp lại dữ liệu', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const email = 'tudangky_s10@test.vn';
        await p.evaluate((em) => {
            const users = getTable('users');
            users.push({
                id: getNextId('users'), role_id: 1, full_name: 'Tự Đăng Ký S10',
                email: em, phone: null, password_hash: 'x', google_id: null,
                avatar_url: null, default_address: null, is_verified: true, is_active: true,
                created_at: new Date().toISOString()
            });
            saveTable('users', users);
            localStorage.setItem('rc_version', '0');
        }, email);
        await p.reload();
        await p.waitForTimeout(1500);
        const con = await p.evaluate((em) => {
            const users = getTable('users');
            return users.some(u => u.email === em);
        }, email);
        kq.dat(con === true, 'Tài khoản tự đăng ký còn trong bảng users: ' + con);
    });

    await t.tc({
        ma: 'TC-S10-21', trang: 'index.html', chucNang: 'DATA_VERSION - tài khoản mẫu không bị nhân đôi sau khi tăng version',
        tienDieuKien: 'Có tài khoản mẫu trong JSON', cacBuoc: '1. Đổi rc_version thành số cũ 2. Reload 3. Đếm số tài khoản cùng email mẫu',
        duLieu: TAI_KHOAN.user.email, mongDoi: 'Chỉ có 1 tài khoản với email user@roomcraft.vn', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        await p.evaluate(() => localStorage.setItem('rc_version', '0'));
        await p.reload();
        await p.waitForTimeout(1500);
        const soLuong = await p.evaluate((em) => {
            const users = getTable('users');
            return users.filter(u => u.email.toLowerCase() === em.toLowerCase()).length;
        }, TAI_KHOAN.user.email);
        kq.dat(soLuong === 1, 'Số tài khoản cùng email mẫu: ' + soLuong);
    });

    await t.tc({
        ma: 'TC-S10-22', trang: 'index.html', chucNang: 'DATA_VERSION - đơn hàng tạo trên máy vẫn giữ sau khi tăng version',
        tienDieuKien: 'Có đơn hàng tạo trên máy', cacBuoc: '1. Tạo đơn hàng 2. Đổi rc_version thành số cũ 3. Reload 4. Kiểm tra đơn vẫn còn',
        duLieu: 'Đơn tạo trên máy', mongDoi: 'Đơn hàng tạo trên máy vẫn tồn tại', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const maDon = await p.evaluate(() => {
            const orders = getTable('orders');
            const u = getCurrentUser();
            const don = {
                id: getNextId('orders'), user_id: u ? u.id : 1, status: 'Pending',
                total_amount: 100000, created_at: new Date().toISOString()
            };
            orders.push(don);
            saveTable('orders', orders);
            localStorage.setItem('rc_version', '0');
            return don.id;
        });
        await p.reload();
        await p.waitForTimeout(1500);
        const con = await p.evaluate((id) => {
            const orders = getTable('orders');
            return orders.some(o => o.id === id);
        }, maDon);
        kq.dat(con === true, 'Đơn hàng tạo trên máy còn: ' + con);
    });

    // ============ NHÓM 7: THỜI GIAN MỞ TRANG ============

    await t.tc({
        ma: 'TC-S10-23', trang: 'index.html', chucNang: 'Hiệu năng - trang chủ mở dưới 5 giây',
        tienDieuKien: 'Dữ liệu sạch', cacBuoc: '1. Đo thời gian từ lúc bắt đầu mở đến khi DOM sẵn sàng 2. Kiểm tra < 5000ms',
        duLieu: 'Dữ liệu sạch', mongDoi: 'Thời gian mở trang chủ < 5000ms', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const batDau = Date.now();
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForLoadState('domcontentloaded');
        const thoiGian = Date.now() - batDau;
        kq.dat(thoiGian < 5000, 'Thời gian mở: ' + thoiGian + 'ms');
    });

    await t.tc({
        ma: 'TC-S10-24', trang: 'index.html', chucNang: 'Hiệu năng - trang chủ mở lại (đã có dữ liệu) dưới 3 giây',
        tienDieuKien: 'Đã nạp dữ liệu lần đầu', cacBuoc: '1. Mở trang chủ lần 1 2. Reload và đo thời gian 3. Kiểm tra < 3000ms',
        duLieu: 'Dữ liệu đã nạp', mongDoi: 'Thời gian reload < 3000ms', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1000);
        const batDau = Date.now();
        await p.reload();
        await p.waitForLoadState('domcontentloaded');
        const thoiGian = Date.now() - batDau;
        kq.dat(thoiGian < 3000, 'Thời gian reload: ' + thoiGian + 'ms');
    });

    // ============ NHÓM 8: GIÁ TRỊ BIÊN / ĐỊNH DẠNG ============

    await t.tc({
        ma: 'TC-S10-25', trang: 'index.html', chucNang: 'Định dạng - formatVND đúng định dạng tiếng Việt',
        tienDieuKien: 'Mở trang chủ', cacBuoc: '1. Gọi formatVND(1000000) 2. Kiểm tra kết quả chứa dấu chấm phân cách',
        duLieu: '1000000', mongDoi: 'Kết quả có dạng "1.000.000" (kèm đ hoặc ₫)', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(500);
        const kqChuoi = await p.evaluate(() => formatVND(1000000));
        kq.dat(/1\.000\.000/.test(kqChuoi), 'formatVND(1000000) = "' + kqChuoi + '"');
    });

    await t.tc({
        ma: 'TC-S10-26', trang: 'index.html', chucNang: 'Định dạng - formatVND giá trị biên 0',
        tienDieuKien: 'Mở trang chủ', cacBuoc: '1. Gọi formatVND(0) 2. Kiểm tra kết quả chứa "0"',
        duLieu: '0', mongDoi: 'Kết quả chứa "0"', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(500);
        const kqChuoi = await p.evaluate(() => formatVND(0));
        kq.dat(/0/.test(kqChuoi), 'formatVND(0) = "' + kqChuoi + '"');
    });

    await t.tc({
        ma: 'TC-S10-27', trang: 'index.html', chucNang: 'Định dạng - formatVND giá trị biên 999 và 1000',
        tienDieuKien: 'Mở trang chủ', cacBuoc: '1. Gọi formatVND(999) 2. Gọi formatVND(1000) 3. Kiểm tra phân cách',
        duLieu: '999, 1000', mongDoi: '999 không có dấu chấm, 1000 có dấu chấm phân cách', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(500);
        const k999 = await p.evaluate(() => formatVND(999));
        const k1000 = await p.evaluate(() => formatVND(1000));
        kq.dat(!/\.\d{3}/.test(k999.replace(/[^\d.]/g, '')) || /999/.test(k999), 'formatVND(999) = "' + k999 + '"');
        kq.dat(/1\.000/.test(k1000), 'formatVND(1000) = "' + k1000 + '"');
    });

    // ============ NHÓM 9: MOBILE BỔ SUNG ============

    await t.tc({
        ma: 'TC-S10-28', trang: 'login.html', chucNang: 'Mobile - trang đăng nhập không cuộn ngang ở 390px',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Mở login.html ở 390px 2. Đo cuộn ngang',
        duLieu: 'Khung 390px', mongDoi: 'Không có cuộn ngang', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(600);
        const ngang = await t.traNgang();
        kq.dat(ngang === 0, 'Số px cuộn ngang: ' + ngang);
    });

    await t.tc({
        ma: 'TC-S10-29', trang: 'orders.html', chucNang: 'Mobile - trang đơn hàng không cuộn ngang ở 390px',
        tienDieuKien: 'Đăng nhập user', cacBuoc: '1. Mở orders.html ở 390px 2. Đo cuộn ngang',
        duLieu: 'Khung 390px', mongDoi: 'Không có cuộn ngang', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('orders.html', { vaiTro: 'user', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(800);
        const ngang = await t.traNgang();
        kq.dat(ngang === 0, 'Số px cuộn ngang: ' + ngang);
    });

    // ============ NHÓM 10: DỮ LIỆU SAU THAO TÁC ============

    await t.tc({
        ma: 'TC-S10-30', trang: 'index.html', chucNang: 'Dữ liệu - resetData xóa hết rc_* và nạp lại',
        tienDieuKien: 'Có dữ liệu trong localStorage', cacBuoc: '1. Thêm dữ liệu tạm 2. Gọi resetData 3. Kiểm tra dữ liệu mẫu được nạp lại',
        duLieu: 'resetData', mongDoi: 'rc_version = DATA_VERSION hiện tại, bảng products có dữ liệu', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        await p.evaluate(() => {
            localStorage.setItem('rc_test_tam', 'abc');
            resetData();
        });
        await p.waitForTimeout(1500);
        const tam = await p.evaluate(() => localStorage.getItem('rc_test_tam'));
        kq.dat(tam === null, 'Khóa tạm đã bị xóa: ' + (tam === null));
        // Trang tải lại và nạp JSON bất đồng bộ: chờ tới khi có dữ liệu (tối đa 15s) thay vì chờ cố định
        await p.waitForFunction(() => typeof getTable === 'function' && getTable('products').length > 0, null, { timeout: 15000 }).catch(() => {});
        const soSP = await p.evaluate(() => getTable('products').length);
        kq.dat(soSP > 0, 'Số sản phẩm sau reset: ' + soSP);
    });
});