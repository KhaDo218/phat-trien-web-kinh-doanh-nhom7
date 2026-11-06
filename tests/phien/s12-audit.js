const { phien, TAI_KHOAN } = require('../lib/khung-test');

phien({ ma: 's12', ten: 'Audit chất lượng' }, async (t) => {

    // ================= BẢO MẬT: GIẢ MẠO SESSION / PHÂN QUYỀN =================

    await t.tc({
        ma: 'TC-S12-01', trang: 'admin/index.html', chucNang: 'Bảo mật - giả mạo rc_session thành Admin khi chưa đăng nhập',
        tienDieuKien: 'Chưa đăng nhập, sửa localStorage rc_session = {user_id:1, role:"Admin"}',
        cacBuoc: '1. Mở trang chủ 2. Ghi đè rc_session thành admin 3. Mở admin/index.html',
        duLieu: 'rc_session = {"user_id":1,"role":"Admin"}', mongDoi: 'Bị chặn, chuyển về trang đăng nhập (không vào được Dashboard)', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.evaluate(() => localStorage.setItem('rc_session', JSON.stringify({ user_id: 1, role: 'Admin' })));
        await p.goto(p.url().replace('index.html', 'admin/index.html')).catch(() => {});
        await p.waitForTimeout(1500);
        kq.dat(!/admin\/index\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
        kq.dat(/login\.html/.test(p.url()), 'Chuyển về trang đăng nhập: ' + /login\.html/.test(p.url()));
    });

    await t.tc({
        ma: 'TC-S12-02', trang: 'admin/index.html', chucNang: 'Bảo mật - user thường sửa role trong rc_session thành Admin',
        tienDieuKien: 'Đăng nhập user@roomcraft.vn rồi sửa role = "Admin"',
        cacBuoc: '1. Đăng nhập user 2. Sửa rc_session.role = "Admin" 3. Mở admin/index.html',
        duLieu: 'role: "Admin"', mongDoi: 'Bị chặn vì role thực của user là User, chuyển về trang chủ', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        await p.evaluate((tk) => login(tk.email, tk.matKhau), TAI_KHOAN.user);
        await p.evaluate(() => {
            const s = JSON.parse(localStorage.getItem('rc_session'));
            s.role = 'Admin';
            localStorage.setItem('rc_session', JSON.stringify(s));
        });
        await p.goto(p.url().replace('login.html', 'admin/index.html')).catch(() => {});
        await p.waitForTimeout(1500);
        kq.dat(!/admin\/index\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });

    await t.tc({
        ma: 'TC-S12-03', trang: 'admin/index.html', chucNang: 'Bảo mật - user thường mở trang admin',
        tienDieuKien: 'Đăng nhập user@roomcraft.vn', cacBuoc: 'Gõ thẳng admin/index.html',
        duLieu: 'user@roomcraft.vn', mongDoi: 'Bị chặn, chuyển về trang chủ, không thấy Dashboard', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const loi = await p.evaluate((tk) => login(tk.email, tk.matKhau), TAI_KHOAN.user);
        if (loi) { kq.dat(false, 'Không đăng nhập được: ' + loi); return; }
        await p.goto(p.url().replace('login.html', 'admin/index.html')).catch(() => {});
        await p.waitForTimeout(1500);
        kq.dat(!/admin\//.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
        const chu = await t.chu();
        kq.dat(!/Dashboard|Tổng quan quản trị/i.test(chu || ''), 'Không thấy nội dung Dashboard');
    });

    await t.tc({
        ma: 'TC-S12-04', trang: 'admin/orders.html', chucNang: 'Bảo mật - user thường mở trang quản lý đơn',
        tienDieuKien: 'Đăng nhập user@roomcraft.vn', cacBuoc: 'Gõ thẳng admin/orders.html',
        duLieu: 'user@roomcraft.vn', mongDoi: 'Bị chặn, không hiển thị danh sách đơn của toàn hệ thống', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const loi = await p.evaluate((tk) => login(tk.email, tk.matKhau), TAI_KHOAN.user);
        if (loi) { kq.dat(false, 'Không đăng nhập được: ' + loi); return; }
        await p.goto(p.url().replace('login.html', 'admin/orders.html')).catch(() => {});
        await p.waitForTimeout(1500);
        kq.dat(!/admin\/orders\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });

    await t.tc({
        ma: 'TC-S12-05', trang: 'admin/index.html', chucNang: 'Bảo mật - khách chưa đăng nhập mở trang admin',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: 'Gõ thẳng admin/index.html',
        duLieu: '(không đăng nhập)', mongDoi: 'Chuyển về trang đăng nhập', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(500);
        await p.goto(p.url().replace('index.html', 'admin/index.html')).catch(() => {});
        await p.waitForTimeout(1500);
        kq.dat(/login\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });

    await t.tc({
        ma: 'TC-S12-06', trang: 'admin/index.html', chucNang: 'Bảo mật - session trỏ tới user_id không tồn tại',
        tienDieuKien: 'Chưa đăng nhập, rc_session = {user_id:99999, role:"Admin"}',
        cacBuoc: '1. Ghi đè rc_session với user_id không tồn tại 2. Mở admin/index.html',
        duLieu: 'user_id: 99999', mongDoi: 'Bị chặn (getCurrentUser trả null)', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.evaluate(() => localStorage.setItem('rc_session', JSON.stringify({ user_id: 99999, role: 'Admin' })));
        await p.goto(p.url().replace('index.html', 'admin/index.html')).catch(() => {});
        await p.waitForTimeout(1000);
        kq.dat(!/admin\/index\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });

    await t.tc({
        ma: 'TC-S12-07', trang: 'admin/index.html', chucNang: 'Bảo mật - tài khoản bị khóa không vào được admin',
        tienDieuKien: 'Đăng nhập admin rồi khóa chính tài khoản admin trong bảng users',
        cacBuoc: '1. Đăng nhập admin 2. Đặt is_active=false cho user admin 3. Mở admin/index.html',
        duLieu: 'is_active: false', mongDoi: 'Bị chặn, không vào được trang quản trị', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        await p.evaluate((tk) => login(tk.email, tk.matKhau), TAI_KHOAN.admin);
        await p.evaluate(() => {
            const users = getTable('users');
            for (const u of users) if (u.email === 'admin@roomcraft.vn') u.is_active = false;
            saveTable('users', users);
        });
        await p.goto(p.url().replace('login.html', 'admin/index.html')).catch(() => {});
        await p.waitForTimeout(1000);
        kq.dat(!/admin\/index\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });

    // ================= XSS LƯU TRỮ =================

    await t.tc({
        ma: 'TC-S12-08', trang: 'profile.html', chucNang: 'XSS lưu trữ - họ tên chứa thẻ script',
        tienDieuKien: 'Đăng nhập user', cacBuoc: '1. Lưu full_name chứa payload XSS 2. Mở trang hồ sơ 3. Kiểm window.__xss',
        duLieu: 'full_name = <img src=x onerror=window.__xss=1>', mongDoi: 'Payload không thực thi, window.__xss không được đặt', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        await p.evaluate((tk) => login(tk.email, tk.matKhau), TAI_KHOAN.user);
        await p.evaluate(() => {
            const users = getTable('users');
            for (const u of users) if (u.email === 'user@roomcraft.vn') u.full_name = '<img src=x onerror=window.__xss=1>';
            saveTable('users', users);
        });
        await p.goto(p.url().replace('login.html', 'profile.html')).catch(() => {});
        await p.waitForTimeout(1200);
        const xss = await p.evaluate(() => window.__xss);
        kq.dat(xss === undefined, 'window.__xss = ' + xss);
    });

    await t.tc({
        ma: 'TC-S12-09', trang: 'profile.html', chucNang: 'XSS lưu trữ - địa chỉ mặc định chứa payload',
        tienDieuKien: 'Đăng nhập user', cacBuoc: '1. Lưu default_address chứa payload 2. Mở trang hồ sơ 3. Kiểm window.__xss',
        duLieu: 'default_address = <img src=x onerror=window.__xss=1>', mongDoi: 'Payload không thực thi', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        await p.evaluate((tk) => login(tk.email, tk.matKhau), TAI_KHOAN.user);
        await p.evaluate(() => {
            const users = getTable('users');
            for (const u of users) if (u.email === 'user@roomcraft.vn') u.default_address = '<img src=x onerror=window.__xss=1>';
            saveTable('users', users);
        });
        await p.goto(p.url().replace('login.html', 'profile.html')).catch(() => {});
        await p.waitForTimeout(1200);
        const xss = await p.evaluate(() => window.__xss);
        kq.dat(xss === undefined, 'window.__xss = ' + xss);
    });

    await t.tc({
        ma: 'TC-S12-10', trang: 'admin/orders.html', chucNang: 'XSS lưu trữ - tên người nhận trong đơn hiển thị ở admin',
        tienDieuKien: 'Đăng nhập admin, có đơn với receiver_name chứa payload',
        cacBuoc: '1. Tạo đơn có receiver_name chứa payload 2. Mở admin/orders.html 3. Kiểm window.__xss',
        duLieu: 'receiver_name = <img src=x onerror=window.__xss=1>', mongDoi: 'Payload không thực thi khi admin xem đơn', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        await p.evaluate((tk) => login(tk.email, tk.matKhau), TAI_KHOAN.admin);
        await p.evaluate(() => {
            const orders = getTable('orders');
            if (orders.length > 0) {
                orders[0].receiver_name = '<img src=x onerror=window.__xss=1>';
                saveTable('orders', orders);
            }
        });
        await p.goto(p.url().replace('login.html', 'admin/orders.html')).catch(() => {});
        await p.waitForTimeout(1500);
        const xss = await p.evaluate(() => window.__xss);
        kq.dat(xss === undefined, 'window.__xss = ' + xss);
    });

    await t.tc({
        ma: 'TC-S12-11', trang: 'product-detail.html', chucNang: 'XSS lưu trữ - tên sản phẩm chứa payload',
        tienDieuKien: 'Có sản phẩm với product_name chứa payload',
        cacBuoc: '1. Sửa product_name chứa payload 2. Mở trang chi tiết 3. Kiểm window.__xss',
        duLieu: 'product_name = <img src=x onerror=window.__xss=1>', mongDoi: 'Payload không thực thi', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        const id = await p.evaluate(() => {
            const products = getTable('products');
            if (products.length === 0) return null;
            products[0].name = '<img src=x onerror=window.__xss=1>';
            saveTable('products', products);
            return products[0].id;
        });
        if (id == null) { kq.dat(false, 'Không có sản phẩm'); return; }
        await p.goto(p.url().replace('index.html', 'product-detail.html?id=' + id)).catch(() => {});
        await p.waitForTimeout(1200);
        const xss = await p.evaluate(() => window.__xss);
        kq.dat(xss === undefined, 'window.__xss = ' + xss);
    });

    // ================= KHẢ NĂNG TIẾP CẬN (axe-core) =================

    await t.tc({
        ma: 'TC-S12-12', trang: 'index.html', chucNang: 'Tiếp cận - trang chủ không có vi phạm critical',
        tienDieuKien: 'Mở trang chủ', cacBuoc: '1. Mở index.html 2. Chạy axe.run() 3. Đếm vi phạm critical',
        duLieu: 'axe-core', mongDoi: '0 vi phạm mức critical', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1000);
        await p.addScriptTag({ path: require.resolve('axe-core') });
        const r = await p.evaluate(() => axe.run());
        const critical = r.violations.filter(v => v.impact === 'critical');
        kq.dat(critical.length === 0, 'Số vi phạm critical: ' + critical.length + (critical.length ? ' (' + critical.map(v => v.id).join(', ') + ')' : ''));
    });

    await t.tc({
        ma: 'TC-S12-13', trang: 'login.html', chucNang: 'Tiếp cận - trang đăng nhập không có vi phạm serious',
        tienDieuKien: 'Mở trang đăng nhập', cacBuoc: '1. Mở login.html 2. Chạy axe.run() 3. Đếm vi phạm serious',
        duLieu: 'axe-core', mongDoi: '0 vi phạm mức serious', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1000);
        await p.addScriptTag({ path: require.resolve('axe-core') });
        const r = await p.evaluate(() => axe.run());
        const serious = r.violations.filter(v => v.impact === 'serious');
        kq.dat(serious.length === 0, 'Số vi phạm serious: ' + serious.length + (serious.length ? ' (' + serious.map(v => v.id).join(', ') + ')' : ''));
    });

    await t.tc({
        ma: 'TC-S12-14', trang: 'cart.html', chucNang: 'Tiếp cận - trang giỏ hàng không có vi phạm critical',
        tienDieuKien: 'Mở trang giỏ hàng', cacBuoc: '1. Mở cart.html 2. Chạy axe.run() 3. Đếm vi phạm critical',
        duLieu: 'axe-core', mongDoi: '0 vi phạm mức critical', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('cart.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(1000);
        await p.addScriptTag({ path: require.resolve('axe-core') });
        const r = await p.evaluate(() => axe.run());
        const critical = r.violations.filter(v => v.impact === 'critical');
        kq.dat(critical.length === 0, 'Số vi phạm critical: ' + critical.length + (critical.length ? ' (' + critical.map(v => v.id).join(', ') + ')' : ''));
    });

    // ================= HIỆU NĂNG =================

    await t.tc({
        ma: 'TC-S12-15', trang: 'index.html', chucNang: 'Hiệu năng - thời gian tải trang chủ < 3s',
        tienDieuKien: 'Mở trang chủ', cacBuoc: '1. Mở index.html 2. Đọc navigation timing loadEventEnd',
        duLieu: 'performance API', mongDoi: 'loadEventEnd < 3000 ms', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1500);
        const load = await p.evaluate(() => {
            const n = performance.getEntriesByType('navigation')[0];
            return n ? n.loadEventEnd : -1;
        });
        kq.dat(load > 0 && load < 3000, 'loadEventEnd = ' + Math.round(load) + ' ms');
    });

    await t.tc({
        ma: 'TC-S12-16', trang: 'index.html', chucNang: 'Hiệu năng - tổng dung lượng tài nguyên trang chủ < 5MB',
        tienDieuKien: 'Mở trang chủ', cacBuoc: '1. Mở index.html 2. Cộng transferSize các resource',
        duLieu: 'performance API', mongDoi: 'Tổng transferSize < 5.000.000 bytes', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1500);
        const tong = await p.evaluate(() => {
            let s = 0;
            for (const r of performance.getEntriesByType('resource')) s += (r.transferSize || 0);
            return s;
        });
        kq.dat(tong < 5000000, 'Tổng transferSize = ' + tong + ' bytes');
    });

    await t.tc({
        ma: 'TC-S12-17', trang: 'index.html', chucNang: 'Hiệu năng - không có ảnh > 500KB trên trang chủ',
        tienDieuKien: 'Mở trang chủ', cacBuoc: '1. Mở index.html 2. Lọc resource ảnh có encodedBodySize > 500KB',
        duLieu: 'performance API', mongDoi: '0 ảnh vượt 500KB', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1500);
        const to = await p.evaluate(() => {
            const ds = [];
            for (const r of performance.getEntriesByType('resource')) {
                if (/\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(r.name) && (r.encodedBodySize || 0) > 500 * 1024)
                    ds.push(r.name.split('/').pop() + ' (' + r.encodedBodySize + ')');
            }
            return ds;
        });
        kq.dat(to.length === 0, 'Số ảnh > 500KB: ' + to.length + (to.length ? ' - ' + to.join(', ') : ''));
    });

    // ================= SEO =================

    await t.tc({
        ma: 'TC-S12-18', trang: 'index.html', chucNang: 'SEO - trang chủ có title, description, lang, 1 h1',
        tienDieuKien: 'Mở trang chủ', cacBuoc: '1. Mở index.html 2. Đọc title, meta description, lang, số h1',
        duLieu: 'DOM', mongDoi: 'title không rỗng, có meta description, lang="vi", đúng 1 h1', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const info = await p.evaluate(() => ({
            title: document.title,
            desc: (document.querySelector('meta[name=description]') || {}).content || '',
            lang: document.documentElement.lang,
            h1: document.querySelectorAll('h1').length
        }));
        kq.dat(info.title && info.title.trim().length > 0, 'title = "' + info.title + '"');
        kq.dat(info.desc && info.desc.trim().length > 0, 'description = "' + info.desc + '"');
        kq.dat(info.lang === 'vi', 'lang = "' + info.lang + '"');
        kq.dat(info.h1 === 1, 'Số h1 = ' + info.h1);
    });

    await t.tc({
        ma: 'TC-S12-19', trang: 'login.html', chucNang: 'SEO - trang đăng nhập có title riêng',
        tienDieuKien: 'Mở trang đăng nhập', cacBuoc: '1. Mở login.html 2. So title với trang chủ',
        duLieu: 'DOM', mongDoi: 'title khác trang chủ và không rỗng', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(500);
        const titleHome = await p.evaluate(() => document.title);
        await p.goto(p.url().replace('index.html', 'login.html')).catch(() => {});
        await p.waitForTimeout(800);
        const titleLogin = await p.evaluate(() => document.title);
        kq.dat(titleLogin && titleLogin.trim().length > 0, 'title login = "' + titleLogin + '"');
        kq.dat(titleLogin !== titleHome, 'title login khác title trang chủ');
    });

    await t.tc({
        ma: 'TC-S12-20', trang: 'product-detail.html', chucNang: 'SEO - trang chi tiết sản phẩm có title và 1 h1',
        tienDieuKien: 'Có sản phẩm', cacBuoc: '1. Mở product-detail.html?id=<id> 2. Đọc title, số h1',
        duLieu: 'id sản phẩm đầu tiên', mongDoi: 'title không rỗng, đúng 1 h1', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        const id = await p.evaluate(() => { const ps = getTable('products'); return ps.length ? ps[0].id : null; });
        if (id == null) { kq.dat(false, 'Không có sản phẩm'); return; }
        await p.goto(p.url().replace('index.html', 'product-detail.html?id=' + id)).catch(() => {});
        await p.waitForTimeout(1000);
        const info = await p.evaluate(() => ({ title: document.title, h1: document.querySelectorAll('h1').length }));
        kq.dat(info.title && info.title.trim().length > 0, 'title = "' + info.title + '"');
        kq.dat(info.h1 === 1, 'Số h1 = ' + info.h1);
    });

    // ================= TOÀN VẸN DỮ LIỆU =================

    await t.tc({
        ma: 'TC-S12-21', trang: 'index.html', chucNang: 'Toàn vẹn dữ liệu - products không trùng id, có trường bắt buộc',
        tienDieuKien: 'Dữ liệu đã nạp', cacBuoc: '1. Đọc bảng products 2. Kiểm id duy nhất, có product_name, price, stock_quantity',
        duLieu: 'rc_products', mongDoi: 'Không trùng id, mọi sản phẩm có tên và giá >= 0', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const products = await t.bang('products');
        // Đọc đúng schema thực tế: sản phẩm thường dùng price, sản phẩm USED có thể dùng sale_price
        const giaCua = (pr) => {
            if (pr.price != null) return Number(pr.price);
            if (pr.sale_price != null) return Number(pr.sale_price);
            if (pr.base_price != null) return Number(pr.base_price);
            return NaN;
        };
        const ids = new Set();
        let trung = 0, thieuTen = 0, thieuGia = 0;
        for (const pr of products) {
            if (ids.has(pr.id)) trung++; else ids.add(pr.id);
            if (!pr.name || String(pr.name).trim() === '') thieuTen++;
            const g = giaCua(pr);
            if (!isFinite(g) || g < 0) thieuGia++;
        }
        kq.dat(trung === 0, 'Số id trùng: ' + trung);
        kq.dat(thieuTen === 0, 'Số sản phẩm thiếu tên: ' + thieuTen);
        kq.dat(thieuGia === 0, 'Số sản phẩm thiếu giá hợp lệ (price/sale_price/base_price): ' + thieuGia);
    });

    await t.tc({
        ma: 'TC-S12-22', trang: 'index.html', chucNang: 'Toàn vẹn dữ liệu - orders tham chiếu user_id hợp lệ',
        tienDieuKien: 'Dữ liệu đã nạp', cacBuoc: '1. Đọc orders và users 2. Kiểm mọi user_id có tồn tại',
        duLieu: 'rc_orders, rc_users', mongDoi: 'Mọi đơn có user_id tồn tại trong users', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const orders = await t.bang('orders');
        const users = await t.bang('users');
        const userIds = new Set(users.map(u => u.id));
        const moCoi = orders.filter(o => o.user_id != null && !userIds.has(o.user_id));
        kq.dat(moCoi.length === 0, 'Số đơn có user_id mồ côi: ' + moCoi.length);
    });

    await t.tc({
        ma: 'TC-S12-23', trang: 'index.html', chucNang: 'Toàn vẹn dữ liệu - tổng tiền đơn khớp tổng món',
        tienDieuKien: 'Có đơn hàng', cacBuoc: '1. Đọc orders 2. Với mỗi đơn, cộng subtotal các món và so total',
        duLieu: 'rc_orders', mongDoi: 'total >= tổng subtotal các món (không âm)', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const orders = await t.bang('orders');
        let sai = 0;
        for (const o of orders) {
            if (!Array.isArray(o.items)) continue;
            let tong = 0;
            for (const it of o.items) tong += Number(it.subtotal || (it.price * it.quantity) || 0);
            if (Number(o.total) < tong - 1) sai++;
        }
        kq.dat(sai === 0, 'Số đơn có total nhỏ hơn tổng món: ' + sai);
    });

    // ================= LINK HỎNG =================

    await t.tc({
        ma: 'TC-S12-24', trang: 'index.html', chucNang: 'Link hỏng - các link nội bộ trên trang chủ trả 200',
        tienDieuKien: 'Mở trang chủ', cacBuoc: '1. Thu thập a[href] nội bộ 2. fetch từng link 3. Đếm link lỗi',
        duLieu: 'a[href] nội bộ', mongDoi: '0 link nội bộ trả mã lỗi', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const ketQua = await p.evaluate(async () => {
            const goc = location.origin;
            const ds = new Set();
            for (const a of document.querySelectorAll('a[href]')) {
                const href = a.getAttribute('href');
                if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) continue;
                try {
                    const u = new URL(href, location.href);
                    if (u.origin === goc) ds.add(u.href);
                } catch (e) {}
            }
            const loi = [];
            for (const url of ds) {
                try {
                    const r = await fetch(url, { method: 'GET' });
                    if (r.status >= 400) loi.push(url + ' -> ' + r.status);
                } catch (e) { loi.push(url + ' -> ERR'); }
            }
            return { tong: ds.size, loi };
        });
        kq.dat(ketQua.loi.length === 0, 'Tổng ' + ketQua.tong + ' link, lỗi: ' + ketQua.loi.length + (ketQua.loi.length ? ' - ' + ketQua.loi.slice(0, 5).join('; ') : ''));
    });

    await t.tc({
        ma: 'TC-S12-25', trang: 'product-list.html', chucNang: 'Link hỏng - link nội bộ trên trang danh sách sản phẩm',
        tienDieuKien: 'Mở trang danh sách sản phẩm', cacBuoc: '1. Mở product-list.html 2. fetch các link nội bộ',
        duLieu: 'a[href] nội bộ', mongDoi: '0 link nội bộ trả mã lỗi', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('product-list.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1000);
        const ketQua = await p.evaluate(async () => {
            const goc = location.origin;
            const ds = new Set();
            for (const a of document.querySelectorAll('a[href]')) {
                const href = a.getAttribute('href');
                if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) continue;
                try {
                    const u = new URL(href, location.href);
                    if (u.origin === goc) ds.add(u.href);
                } catch (e) {}
            }
            const loi = [];
            for (const url of ds) {
                try {
                    const r = await fetch(url, { method: 'GET' });
                    if (r.status >= 400) loi.push(url + ' -> ' + r.status);
                } catch (e) { loi.push(url + ' -> ERR'); }
            }
            return { tong: ds.size, loi };
        });
        kq.dat(ketQua.loi.length === 0, 'Tổng ' + ketQua.tong + ' link, lỗi: ' + ketQua.loi.length + (ketQua.loi.length ? ' - ' + ketQua.loi.slice(0, 5).join('; ') : ''));
    });

    // ================= MOBILE =================

    await t.tc({
        ma: 'TC-S12-26', trang: 'index.html', chucNang: 'Mobile - trang chủ không cuộn ngang',
        tienDieuKien: 'Xem trên mobile', cacBuoc: '1. Mở index.html ở khung mobile 2. Đo scrollWidth - clientWidth',
        duLieu: 'viewport mobile', mongDoi: 'Không cuộn ngang (0px)', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(1000);
        const ngang = await t.traNgang();
        kq.dat(ngang === 0, 'Số px cuộn ngang: ' + ngang);
    });

    await t.tc({
        ma: 'TC-S12-27', trang: 'login.html', chucNang: 'Mobile - trang đăng nhập không cuộn ngang và có title',
        tienDieuKien: 'Xem trên mobile', cacBuoc: '1. Mở login.html ở khung mobile 2. Đo cuộn ngang, đọc title',
        duLieu: 'viewport mobile', mongDoi: 'Không cuộn ngang, title không rỗng', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(1000);
        const ngang = await t.traNgang();
        kq.dat(ngang === 0, 'Số px cuộn ngang: ' + ngang);
        const title = await p.evaluate(() => document.title);
        kq.dat(title && title.trim().length > 0, 'title = "' + title + '"');
    });

    await t.tc({
        ma: 'TC-S12-28', trang: 'index.html', chucNang: 'Mobile - trang chủ không có vi phạm critical (axe)',
        tienDieuKien: 'Xem trên mobile', cacBuoc: '1. Mở index.html mobile 2. Chạy axe.run() 3. Đếm critical',
        duLieu: 'axe-core', mongDoi: '0 vi phạm critical', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(1000);
        await p.addScriptTag({ path: require.resolve('axe-core') });
        const r = await p.evaluate(() => axe.run());
        const critical = r.violations.filter(v => v.impact === 'critical');
        kq.dat(critical.length === 0, 'Số vi phạm critical: ' + critical.length + (critical.length ? ' (' + critical.map(v => v.id).join(', ') + ')' : ''));
    });

    // ================= GIÁ TRỊ BIÊN / ĐỊNH DẠNG =================

    await t.tc({
        ma: 'TC-S12-29', trang: 'index.html', chucNang: 'Toàn vẹn dữ liệu - giá sản phẩm là số nguyên không âm',
        tienDieuKien: 'Dữ liệu đã nạp', cacBuoc: '1. Đọc products 2. Kiểm price là số, >= 0, không NaN',
        duLieu: 'rc_products', mongDoi: 'Mọi price là số hữu hạn >= 0', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const products = await t.bang('products');
        // Sản phẩm USED có thể dùng sale_price thay cho price
        const giaCua = (pr) => {
            if (pr.price != null) return Number(pr.price);
            if (pr.sale_price != null) return Number(pr.sale_price);
            if (pr.base_price != null) return Number(pr.base_price);
            return NaN;
        };
        let sai = 0;
        for (const pr of products) {
            const v = giaCua(pr);
            if (!isFinite(v) || v < 0) sai++;
        }
        kq.dat(sai === 0, 'Số sản phẩm có giá không hợp lệ: ' + sai);
    });

    await t.tc({
        ma: 'TC-S12-30', trang: 'index.html', chucNang: 'Toàn vẹn dữ liệu - tồn kho không âm',
        tienDieuKien: 'Dữ liệu đã nạp', cacBuoc: '1. Đọc products 2. Kiểm stock_quantity >= 0',
        duLieu: 'rc_products', mongDoi: 'Mọi stock_quantity >= 0', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const products = await t.bang('products');
        const am = products.filter(pr => Number(pr.stock_quantity) < 0);
        kq.dat(am.length === 0, 'Số sản phẩm có tồn kho âm: ' + am.length);
    });
});