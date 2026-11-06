const { phien, TAI_KHOAN } = require('../lib/khung-test');

phien({ ma: 's08', ten: 'Admin đơn hàng, Dashboard, người dùng, đánh giá' }, async (t) => {

    // ===================== ADMIN ĐƠN HÀNG =====================

    await t.tc({
        ma: 'TC-S08-01', trang: 'admin/orders.html', chucNang: 'Đổi trạng thái đơn Confirmed → Packing',
        tienDieuKien: 'Đăng nhập admin, có đơn ở trạng thái Confirmed',
        cacBuoc: '1. Mở trang quản lý đơn hàng 2. Bấm nút chuyển sang "Đang đóng gói" của đơn Confirmed 3. Xác nhận',
        duLieu: 'Đơn Confirmed đầu tiên', mongDoi: 'Đơn chuyển sang Packing, lưu vào localStorage', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/orders.html', { vaiTro: 'admin', moi: true });
        // Chuẩn bị: đặt đơn đầu tiên về Confirmed
        const orders = await t.bang('orders');
        const don = orders.find(o => o.status === 'Confirmed');
        kq.dat(don != null, 'Có đơn Confirmed: ' + (don ? '#' + don.id : 'không'));
        if (!don) return;
        await p.reload();
        await p.waitForTimeout(800);
        await p.fill('#txtSearch', '');
        await p.type('#txtSearch', String(don.id));   // ô tìm kiếm lọc theo sự kiện onkeyup -> phải gõ phím
        await p.waitForTimeout(500);
        p.once('dialog', d => d.accept());
        await p.click(`input[value='→ Đang đóng gói']`);
        await p.waitForTimeout(800);
        const sau = await t.bang('orders');
        const d2 = sau.find(o => o.id === don.id);
        kq.dat(d2 && d2.status === 'Packing', 'Trạng thái sau: ' + (d2 ? d2.status : 'không thấy'));
    });

    await t.tc({
        ma: 'TC-S08-02', trang: 'admin/orders.html', chucNang: 'Luồng đầy đủ Confirmed → Packing → Shipping → Delivered',
        tienDieuKien: 'Đăng nhập admin, có đơn Confirmed',
        cacBuoc: '1. Chuyển lần lượt qua từng trạng thái kế tiếp 2. Kiểm tra trạng thái cuối',
        duLieu: 'Đơn Confirmed', mongDoi: 'Đơn đi đủ 4 bước và kết thúc ở Delivered, paid_amount = total_amount, amount_due = 0', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/orders.html', { vaiTro: 'admin', moi: true });
        const orders = await t.bang('orders');
        const don = orders.find(o => o.status === 'Confirmed');
        if (!don) { kq.dat(false, 'Không có đơn Confirmed'); return; }
        await p.reload();
        await p.waitForTimeout(800);
        // Lọc theo mã đơn để chắc chắn thao tác đúng đơn
        await p.fill('#txtSearch', '');
        await p.type('#txtSearch', String(don.id));   // ô tìm kiếm lọc theo sự kiện onkeyup -> phải gõ phím
        await p.waitForTimeout(500);
        for (const nhan of ['→ Đang đóng gói', '→ Đang giao hàng', '→ Đã giao']) {
            const nut = p.locator(`input[value='${nhan}']`).first();
            await nut.waitFor({ state: 'visible', timeout: 10000 });
            p.once('dialog', d => d.accept());
            await nut.click();
            await p.waitForTimeout(700);
        }
        const sau = await t.bang('orders');
        const d2 = sau.find(o => o.id === don.id);
        kq.dat(d2 && d2.status === 'Delivered', 'Trạng thái cuối: ' + (d2 ? d2.status : 'không thấy'));
        kq.dat(d2 && Number(d2.paid_amount) === Number(d2.total_amount), 'paid_amount=' + (d2 ? d2.paid_amount : '?') + ' total=' + (d2 ? d2.total_amount : '?'));
        kq.dat(d2 && Number(d2.amount_due) === 0, 'amount_due=' + (d2 ? d2.amount_due : '?'));
    });

    await t.tc({
        ma: 'TC-S08-03', trang: 'admin/orders.html', chucNang: 'Hủy đơn Confirmed hoàn tồn kho',
        tienDieuKien: 'Đăng nhập admin, có đơn Confirmed',
        cacBuoc: '1. Ghi lại tồn kho sản phẩm trong đơn 2. Bấm Hủy đơn 3. Xác nhận 4. Kiểm tra tồn kho',
        duLieu: 'Đơn Confirmed', mongDoi: 'Đơn thành Cancelled, tồn kho từng sản phẩm tăng đúng bằng số lượng trong đơn', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/orders.html', { vaiTro: 'admin', moi: true });
        const orders = await t.bang('orders');
        const don = orders.find(o => o.status === 'Confirmed');
        if (!don) { kq.dat(false, 'Không có đơn Confirmed'); return; }
        const truoc = await t.bang('products');
        const mapTruoc = {};
        truoc.forEach(x => mapTruoc[x.id] = x.stock_quantity);
        await p.reload();
        await p.waitForTimeout(800);
        await p.fill('#txtSearch', '');
        await p.type('#txtSearch', String(don.id));   // ô tìm kiếm lọc theo sự kiện onkeyup -> phải gõ phím
        await p.waitForTimeout(500);
        p.once('dialog', d => d.accept());
        await p.click(`input[value='Hủy đơn']`);
        await p.waitForTimeout(800);
        const sau = await t.bang('orders');
        const d2 = sau.find(o => o.id === don.id);
        kq.dat(d2 && d2.status === 'Cancelled', 'Trạng thái: ' + (d2 ? d2.status : 'không thấy'));
        const spSau = await t.bang('products');
        let ok = true, chiTiet = '';
        for (const it of don.items) {
            const sp = spSau.find(x => x.id === it.product_id);
            const mong = (mapTruoc[it.product_id] || 0) + it.quantity;
            if (!sp || sp.stock_quantity !== mong) { ok = false; chiTiet += it.product_id + ' mong ' + mong + ' thực ' + (sp ? sp.stock_quantity : '?') + '; '; }
        }
        kq.dat(ok, chiTiet || 'Tồn kho hoàn đúng');
    });

    await t.tc({
        ma: 'TC-S08-04', trang: 'admin/orders.html', chucNang: 'Không hủy được đơn đã Shipping',
        tienDieuKien: 'Đăng nhập admin, có đơn Shipping',
        cacBuoc: '1. Lọc đơn Shipping 2. Kiểm tra không có nút Hủy đơn',
        duLieu: 'Đơn Shipping', mongDoi: 'Đơn Shipping không hiện nút Hủy đơn', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/orders.html', { vaiTro: 'admin', moi: true });
        const orders = await t.bang('orders');
        const don = orders.find(o => o.status === 'Shipping');
        if (!don) { kq.dat(false, 'Không có đơn Shipping'); return; }
        await p.selectOption('#cboStatus', 'Shipping');
        await p.waitForTimeout(600);
        await p.fill('#txtSearch', '');
        await p.type('#txtSearch', String(don.id));   // ô tìm kiếm lọc theo sự kiện onkeyup -> phải gõ phím
        await p.waitForTimeout(600);
        const soNutHuy = await p.locator(`input[value='Hủy đơn']`).count();
        kq.dat(soNutHuy === 0, 'Số nút Hủy đơn: ' + soNutHuy);
    });

    await t.tc({
        ma: 'TC-S08-05', trang: 'admin/orders.html', chucNang: 'Xem chi tiết đơn hàng',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Bấm vào mã đơn 2. Kiểm tra modal chi tiết',
        duLieu: 'Đơn đầu tiên trên bảng', mongDoi: 'Modal hiện đúng mã đơn, tên người nhận, địa chỉ, tổng cộng', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/orders.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(800);
        // Bấm nút mã đơn của dòng đầu tiên trên bảng
        const nutMaDon = p.locator('#tbOrders button.order-id-link').first();
        await nutMaDon.waitFor({ state: 'visible', timeout: 10000 });
        const nhanNut = (await nutMaDon.textContent()) || '';
        const idDong = Number(nhanNut.replace(/[^\d]/g, ''));
        kq.dat(!isNaN(idDong) && idDong > 0, 'Đọc được id đơn từ dòng đầu: ' + nhanNut);
        // Lấy đơn theo đúng id của dòng đầu bảng
        const orders = await t.bang('orders');
        const don = orders.find(o => Number(o.id) === idDong);
        kq.dat(don != null, 'Tìm được đơn #' + idDong + ' trong dữ liệu');
        if (!don) return;
        await nutMaDon.click();
        // Chờ modal render xong
        await p.waitForSelector('#orderModal .modal-box', { timeout: 10000 });
        await p.waitForTimeout(500);
        // Dùng textContent thô để không làm hỏng chuỗi địa chỉ nhiều dòng
        const modalTho = await p.evaluate(() => {
            const el = document.querySelector('#orderModal');
            return el ? el.textContent : '';
        });
        kq.dat(modalTho.includes('#' + don.id), 'Modal có mã đơn #' + don.id + ': ' + modalTho.includes('#' + don.id));
        kq.dat(modalTho.includes(don.shipping_name), 'Modal có tên người nhận "' + don.shipping_name + '": ' + modalTho.includes(don.shipping_name));
        kq.dat(modalTho.includes(don.shipping_address), 'Modal có địa chỉ "' + don.shipping_address + '": ' + modalTho.includes(don.shipping_address));
    });

    await t.tc({
        ma: 'TC-S08-06', trang: 'admin/orders.html', chucNang: 'Tìm kiếm đơn theo mã',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Nhập mã đơn (có tiền tố #) vào ô tìm kiếm 2. Kiểm tra kết quả',
        duLieu: 'Mã đơn có tiền tố #', mongDoi: 'Chỉ hiện đúng đơn tìm được', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/orders.html', { vaiTro: 'admin', moi: true });
        const orders = await t.bang('orders');
        // Tìm kiếm so khớp chuỗi con trên "id tenKhach shipping_name".
        // Chọn đơn có id mà chuỗi "#<id>" không phải chuỗi con của bất kỳ đơn khác
        // (id không phải tiền tố/hậu tố của id khác, và không xuất hiện trong tên khách).
        const users = await t.bang('users');
        const tenKhachCua = (o) => {
            const u = users.find(x => x.id === o.user_id);
            return ((u ? u.full_name : '') + ' ' + (o.shipping_name || '')).toLowerCase();
        };
        const ungVien = orders.filter(o => {
            const khoa = String(o.id);
            // không được là chuỗi con của id đơn khác
            const trungIdKhac = orders.some(x => String(x.id) !== khoa && String(x.id).includes(khoa));
            // không được xuất hiện trong tên khách của đơn khác
            const trungTenKhac = orders.some(x => String(x.id) !== khoa && tenKhachCua(x).includes(khoa));
            return !trungIdKhac && !trungTenKhac;
        });
        kq.dat(ungVien.length > 0, 'Có đơn mà mã không trùng chuỗi con với đơn khác: ' + ungVien.length);
        if (ungVien.length === 0) return;
        const don = ungVien[0];
        await p.waitForTimeout(800);
        await p.fill('#txtSearch', '');
        await p.type('#txtSearch', String(don.id));   // ô tìm kiếm lọc theo sự kiện onkeyup -> phải gõ phím
        await p.waitForTimeout(600);
        const soDong = await p.locator('#tbOrders tr').count();
        kq.dat(soDong === 1, 'Số dòng hiển thị: ' + soDong + ' (mong 1)');
        const chu = await t.chu('#tbOrders');
        kq.dat(chu && chu.includes('#' + don.id), 'Có mã đơn #' + don.id);
    });

    await t.tc({
        ma: 'TC-S08-07', trang: 'admin/orders.html', chucNang: 'Lọc theo trạng thái',
        tienDieuKien: 'Đăng nhập admin, có đơn Delivered', cacBuoc: '1. Chọn lọc "Đã giao" 2. Kiểm tra tất cả dòng đều Delivered',
        duLieu: 'Trạng thái Delivered', mongDoi: 'Chỉ hiện đơn Delivered', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/orders.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(800);
        // Đảm bảo có ít nhất 1 đơn Delivered
        let soDelivered = (await t.bang('orders')).filter(o => o.status === 'Delivered').length;
        if (soDelivered === 0) {
            await p.evaluate(() => {
                const os = getTable('orders');
                if (os.length > 0) {
                    os[0].status = 'Delivered';
                    os[0].paid_amount = os[0].total_amount;
                    os[0].amount_due = 0;
                    saveTable('orders', os);
                }
            });
            await p.reload();
            await p.waitForTimeout(800);
            soDelivered = (await t.bang('orders')).filter(o => o.status === 'Delivered').length;
        }
        kq.dat(soDelivered > 0, 'Số đơn Delivered trong dữ liệu: ' + soDelivered);
        // Chờ bảng render xong trước khi thao tác
        await p.waitForSelector('#tbOrders tr', { timeout: 10000 });
        // Reset phân trang về trang 1 trước khi lọc
        await p.evaluate(() => { orderPage = 1; });
        await p.selectOption('#cboStatus', 'Delivered');
        // Chờ render xong sau khi lọc: có ít nhất 1 dòng mang class status-Delivered
        await p.waitForSelector('#tbOrders tr .status-Delivered', { timeout: 10000 });
        await p.waitForTimeout(300);
        const soDong = await p.locator('#tbOrders tr').count();
        kq.dat(soDong > 0 && soDong <= 20, 'Số dòng hiển thị: ' + soDong);
        // Kiểm tra bằng class: mọi dòng hiển thị phải có badge .status-Delivered
        const tatCaDelivered = await p.evaluate(() => {
            const rows = document.querySelectorAll('#tbOrders tr');
            for (const tr of rows) {
                const badge = tr.querySelector('.status');
                if (!badge) return false;
                if (!badge.classList.contains('status-Delivered')) return false;
            }
            return rows.length > 0;
        });
        kq.dat(tatCaDelivered, 'Tất cả dòng hiển thị đều là trạng thái Delivered');
    });

    await t.tc({
        ma: 'TC-S08-08', trang: 'admin/orders.html', chucNang: 'Phân quyền - User thường mở trang quản lý đơn',
        tienDieuKien: 'Đăng nhập user@roomcraft.vn', cacBuoc: 'Gõ thẳng admin/orders.html',
        mongDoi: 'Bị chặn, chuyển khỏi trang admin', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/orders.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(1000);
        kq.dat(!/admin\/orders\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });

    await t.tc({
        ma: 'TC-S08-09', trang: 'admin/orders.html', chucNang: 'Mobile - hiển thị trang quản lý đơn hàng',
        tienDieuKien: 'Đăng nhập admin, màn hình mobile', cacBuoc: '1. Mở trang trên mobile 2. Kiểm tra không cuộn ngang',
        duLieu: 'Viewport mobile', mongDoi: 'Trang hiển thị, không cuộn ngang', mucDoNeuLoi: 'Nhẹ', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('admin/orders.html', { vaiTro: 'admin', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(1000);
        const cuon = await t.traNgang();
        kq.dat(cuon === 0, 'Cuộn ngang: ' + cuon + 'px');
        const chu = await t.chu();
        kq.dat(chu && chu.includes('Quản lý đơn hàng'), 'Có tiêu đề trang');
    });

    // ===================== DASHBOARD =====================

    await t.tc({
        ma: 'TC-S08-10', trang: 'admin/index.html', chucNang: 'Dashboard - doanh thu chỉ tăng khi đơn Đã giao',
        tienDieuKien: 'Đăng nhập admin, có đơn Shipping', cacBuoc: '1. Đọc doanh thu 2. Chuyển đơn Shipping sang Delivered 3. Đọc lại doanh thu',
        duLieu: 'Đơn Shipping', mongDoi: 'Doanh thu tăng đúng bằng total_amount của đơn vừa giao', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/index.html', { vaiTro: 'admin', moi: true });
        const orders = await t.bang('orders');
        const don = orders.find(o => o.status === 'Shipping');
        if (!don) { kq.dat(false, 'Không có đơn Shipping'); return; }
        await p.waitForTimeout(1000);
        // Đọc doanh thu trước
        const truoc = await p.evaluate(() => {
            const el = document.querySelector('[id*=evenue], [id*=DoanhThu], [id*=doanhthu]');
            return el ? el.textContent.trim() : null;
        });
        // Chuyển đơn sang Delivered qua hàm
        await p.evaluate((id) => { updateOrderStatus(id, 'Delivered'); }, don.id);
        await p.reload();
        await p.waitForTimeout(1000);
        const sau = await p.evaluate(() => {
            const el = document.querySelector('[id*=evenue], [id*=DoanhThu], [id*=doanhthu]');
            return el ? el.textContent.trim() : null;
        });
        kq.ghi('Doanh thu trước: ' + truoc + ' | sau: ' + sau);
        kq.dat(truoc != null && sau != null, 'Đọc được doanh thu');
        // So sánh số: parse số từ chuỗi
        const soTruoc = truoc ? Number(truoc.replace(/[^\d]/g, '')) : 0;
        const soSau = sau ? Number(sau.replace(/[^\d]/g, '')) : 0;
        kq.dat(soSau - soTruoc === don.total_amount, 'Chênh lệch: ' + (soSau - soTruoc) + ' mong đợi: ' + don.total_amount);
    });

    await t.tc({
        ma: 'TC-S08-11', trang: 'admin/index.html', chucNang: 'Dashboard - hủy đơn không đổi doanh thu',
        tienDieuKien: 'Đăng nhập admin, có đơn Confirmed', cacBuoc: '1. Đọc doanh thu 2. Hủy đơn Confirmed 3. Đọc lại doanh thu',
        duLieu: 'Đơn Confirmed', mongDoi: 'Doanh thu không đổi sau khi hủy đơn', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/index.html', { vaiTro: 'admin', moi: true });
        const orders = await t.bang('orders');
        const don = orders.find(o => o.status === 'Confirmed');
        if (!don) { kq.dat(false, 'Không có đơn Confirmed'); return; }
        await p.waitForTimeout(1000);
        const truoc = await p.evaluate(() => {
            const el = document.querySelector('[id*=evenue], [id*=DoanhThu], [id*=doanhthu]');
            return el ? el.textContent.trim() : null;
        });
        await p.evaluate((id) => { cancelOrder(id); }, don.id);
        await p.reload();
        await p.waitForTimeout(1000);
        const sau = await p.evaluate(() => {
            const el = document.querySelector('[id*=evenue], [id*=DoanhThu], [id*=doanhthu]');
            return el ? el.textContent.trim() : null;
        });
        kq.dat(truoc === sau, 'Doanh thu trước: ' + truoc + ' | sau: ' + sau);
    });

    await t.tc({
        ma: 'TC-S08-12', trang: 'admin/index.html', chucNang: 'Dashboard - hiển thị số liệu tổng quan',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Mở Dashboard 2. Kiểm tra các thẻ số liệu',
        mongDoi: 'Dashboard hiển thị các thẻ số liệu (đơn hàng, doanh thu, sản phẩm...)', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/index.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(1200);
        const chu = await t.chu();
        kq.dat(chu && chu.length > 50, 'Nội dung dashboard dài: ' + (chu ? chu.length : 0));
        const soThe = await p.locator('.stat-card, .stat-grid > div, [class*=stat]').count();
        kq.dat(soThe > 0, 'Số thẻ số liệu: ' + soThe);
    });

    await t.tc({
        ma: 'TC-S08-13', trang: 'admin/index.html', chucNang: 'Dashboard - sắp hết hàng',
        tienDieuKien: 'Đăng nhập admin, có sản phẩm tồn kho thấp', cacBuoc: '1. Đặt 1 sản phẩm tồn kho = 0 2. Mở Dashboard 3. Kiểm tra danh sách sắp hết hàng',
        duLieu: 'Sản phẩm tồn kho = 0', mongDoi: 'Sản phẩm tồn kho 0 xuất hiện trong danh sách sắp hết hàng', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/index.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(1000);
        // Chọn sản phẩm đang bán (is_active !== false) và đặt tồn kho = 0 (chắc chắn dưới mọi ngưỡng)
        const products = await t.bang('products');
        const sp = products.find(x => x.is_active !== false);
        if (!sp) { kq.dat(false, 'Không có sản phẩm đang bán'); return; }
        await p.evaluate((args) => {
            const ps = getTable('products');
            const x = ps.find(y => y.id === args.id);
            x.stock_quantity = 0;
            saveTable('products', ps);
        }, { id: sp.id });
        await p.reload();
        await p.waitForTimeout(1200);
        const chu = await t.chu();
        kq.dat(chu && chu.includes(sp.name), 'Dashboard có tên sản phẩm tồn kho 0: ' + sp.name);
    });

    await t.tc({
        ma: 'TC-S08-14', trang: 'admin/index.html', chucNang: 'Phân quyền - User thường mở Dashboard',
        tienDieuKien: 'Đăng nhập user@roomcraft.vn', cacBuoc: 'Gõ thẳng admin/index.html',
        mongDoi: 'Bị chặn, không thấy Dashboard', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/index.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(1000);
        kq.dat(!/admin\/index\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });

    await t.tc({
        ma: 'TC-S08-15', trang: 'admin/index.html', chucNang: 'Mobile - Dashboard hiển thị không cuộn ngang',
        tienDieuKien: 'Đăng nhập admin, màn hình mobile', cacBuoc: '1. Mở Dashboard trên mobile 2. Kiểm tra cuộn ngang',
        mongDoi: 'Không cuộn ngang', mucDoNeuLoi: 'Nhẹ', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('admin/index.html', { vaiTro: 'admin', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(1200);
        const cuon = await t.traNgang();
        kq.dat(cuon === 0, 'Cuộn ngang: ' + cuon + 'px');
    });

    // ===================== ADMIN NGƯỜI DÙNG =====================

    await t.tc({
        ma: 'TC-S08-16', trang: 'admin/users.html', chucNang: 'Khóa người dùng - không đăng nhập được',
        tienDieuKien: 'Đăng nhập admin, có user đang hoạt động', cacBuoc: '1. Khóa user 2. Đăng xuất 3. Thử đăng nhập user đó',
        duLieu: 'user@roomcraft.vn', mongDoi: 'User bị khóa không đăng nhập được, hiện thông báo tài khoản bị khóa', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/users.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(1000);
        // Khóa user id=2 qua UI
        const users = await t.bang('users');
        const u = users.find(x => x.email === TAI_KHOAN.user.email);
        if (!u) { kq.dat(false, 'Không có user demo'); return; }
        p.once('dialog', d => d.accept());
        await p.evaluate((id) => { toggleLockUser(id, false); }, u.id);
        await p.waitForTimeout(600);
        const sau = await t.bang('users');
        const u2 = sau.find(x => x.id === u.id);
        kq.dat(u2 && u2.is_active === false, 'is_active sau khóa: ' + (u2 ? u2.is_active : '?'));
        // Đăng xuất và thử đăng nhập
        await p.evaluate(() => { logout(); });
        await p.goto(p.url().replace('admin/users.html', 'login.html'));
        await p.waitForTimeout(500);
        await p.fill('#txtEmail', TAI_KHOAN.user.email);
        await p.fill('#txtPassword', TAI_KHOAN.user.matKhau);
        await p.click('form[name=frmLogin] [type=submit]');
        await p.waitForTimeout(800);
        const loi = await t.chu('#msgError');
        kq.dat(loi && loi.length > 0, 'Thông báo lỗi: "' + loi + '"');
        kq.dat(/login\.html/.test(p.url()), 'Vẫn ở trang đăng nhập');
    });

    await t.tc({
        ma: 'TC-S08-17', trang: 'admin/users.html', chucNang: 'Khóa người dùng - đang đăng nhập bị đẩy ra',
        tienDieuKien: 'User đang đăng nhập, admin khóa tài khoản', cacBuoc: '1. User đăng nhập 2. Admin khóa 3. User tải lại trang',
        duLieu: 'user@roomcraft.vn', mongDoi: 'User bị đẩy ra khỏi phiên đăng nhập', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/users.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(1000);
        const users = await t.bang('users');
        const u = users.find(x => x.email === TAI_KHOAN.user.email);
        if (!u) { kq.dat(false, 'Không có user demo'); return; }
        // Giả lập user đang đăng nhập: đặt session
        await p.evaluate((id) => {
            const us = getTable('users');
            const x = us.find(y => y.id === id);
            x.is_active = false;
            saveTable('users', us);
            // đặt session cho user
            saveObject('session', { user_id: id, logged_in_at: new Date().toISOString() });
        }, u.id);
        // Mở trang user (account) - phải bị đẩy ra
        await p.goto(p.url().replace('admin/users.html', 'account.html'));
        await p.waitForTimeout(1200);
        const session = await p.evaluate(() => getSession());
        const userHienTai = await p.evaluate(() => getCurrentUser());
        kq.dat(userHienTai == null, 'getCurrentUser sau khóa: ' + (userHienTai ? userHienTai.email : 'null'));
    });

    await t.tc({
        ma: 'TC-S08-18', trang: 'admin/users.html', chucNang: 'Mở khóa người dùng',
        tienDieuKien: 'Đăng nhập admin, có user bị khóa', cacBuoc: '1. Mở khóa user 2. Kiểm tra is_active',
        duLieu: 'User bị khóa', mongDoi: 'is_active = true sau khi mở khóa', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/users.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(1000);
        const users = await t.bang('users');
        const u = users.find(x => x.email === TAI_KHOAN.user.email);
        if (!u) { kq.dat(false, 'Không có user demo'); return; }
        // Khóa trước
        await p.evaluate((id) => {
            const us = getTable('users');
            const x = us.find(y => y.id === id);
            x.is_active = false;
            saveTable('users', us);
        }, u.id);
        await p.reload();
        await p.waitForTimeout(800);
        p.once('dialog', d => d.accept());
        await p.evaluate((id) => { toggleLockUser(id, true); }, u.id);
        await p.waitForTimeout(600);
        const sau = await t.bang('users');
        const u2 = sau.find(x => x.id === u.id);
        kq.dat(u2 && u2.is_active === true, 'is_active sau mở khóa: ' + (u2 ? u2.is_active : '?'));
    });

    await t.tc({
        ma: 'TC-S08-19', trang: 'admin/users.html', chucNang: 'Tìm kiếm người dùng theo email',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Nhập email vào ô tìm 2. Kiểm tra kết quả',
        duLieu: 'user@roomcraft.vn', mongDoi: 'Chỉ hiện user khớp email', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/users.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(1000);
        await p.fill('#txtSearchUser', TAI_KHOAN.user.email);
        await p.waitForTimeout(600);
        const chu = await t.chu('#tbUsers');
        kq.dat(chu && chu.includes(TAI_KHOAN.user.email), 'Có email user trong kết quả');
        const soDong = await p.locator('#tbUsers tr').count();
        kq.dat(soDong === 1, 'Số dòng: ' + soDong);
    });

    await t.tc({
        ma: 'TC-S08-20', trang: 'admin/users.html', chucNang: 'Lọc theo trạng thái bị khóa',
        tienDieuKien: 'Đăng nhập admin, có user bị khóa', cacBuoc: '1. Chọn lọc "Bị khóa" 2. Kiểm tra tất cả đều bị khóa',
        mongDoi: 'Chỉ hiện user is_active = false', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/users.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(1000);
        // Đảm bảo có ít nhất 1 user bị khóa, KHÔNG khóa chính admin đang đăng nhập
        const daKhoa = await p.evaluate((adminEmail) => {
            const us = getTable('users');
            const x = us.find(y => y.email === 'user@roomcraft.vn' && y.email !== adminEmail);
            if (x) { x.is_active = false; saveTable('users', us); return true; }
            return false;
        }, TAI_KHOAN.admin.email);
        kq.dat(daKhoa, 'Đã khóa user demo (không phải admin)');
        await p.reload();
        // Chờ bảng render xong sau reload
        await p.waitForSelector('#tbUsers tr', { timeout: 10000 });
        await p.waitForTimeout(500);
        // Kiểm tra vẫn còn ở trang admin (session admin còn hiệu lực)
        kq.dat(/admin\/users\.html/.test(p.url()), 'Vẫn ở trang admin/users.html: ' + p.url().split('/scripts/')[1]);
        await p.selectOption('#slFilterStatus', 'locked');
        // Chờ render xong sau khi lọc: có ít nhất 1 dòng mang badge .badge-out
        await p.waitForSelector('#tbUsers tr .badge-out', { timeout: 10000 });
        await p.waitForTimeout(300);
        // Kiểm tra bằng class: mọi dòng hiển thị đều có badge .badge-out (Bị khóa)
        const tatCaBiKhoa = await p.evaluate(() => {
            const rows = document.querySelectorAll('#tbUsers tr');
            for (const tr of rows) {
                const badge = tr.querySelector('.badge-out');
                if (!badge) return false;
            }
            return rows.length > 0;
        });
        kq.dat(tatCaBiKhoa, 'Tất cả dòng hiển thị đều có badge Bị khóa (.badge-out)');
    });

    await t.tc({
        ma: 'TC-S08-21', trang: 'admin/users.html', chucNang: 'Phân quyền - User thường mở trang quản lý người dùng',
        tienDieuKien: 'Đăng nhập user@roomcraft.vn', cacBuoc: 'Gõ thẳng admin/users.html',
        mongDoi: 'Bị chặn', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/users.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(1000);
        kq.dat(!/admin\/users\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });

    await t.tc({
        ma: 'TC-S08-22', trang: 'admin/users.html', chucNang: 'Mobile - trang quản lý người dùng',
        tienDieuKien: 'Đăng nhập admin, màn hình mobile', cacBuoc: '1. Mở trang trên mobile 2. Kiểm tra cuộn ngang',
        mongDoi: 'Không cuộn ngang', mucDoNeuLoi: 'Nhẹ', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('admin/users.html', { vaiTro: 'admin', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(1000);
        const cuon = await t.traNgang();
        kq.dat(cuon === 0, 'Cuộn ngang: ' + cuon + 'px');
    });

    // ===================== ADMIN ĐÁNH GIÁ =====================

    await t.tc({
        ma: 'TC-S08-23', trang: 'admin/reviews.html', chucNang: 'Ẩn đánh giá - khách không thấy',
        tienDieuKien: 'Đăng nhập admin, có đánh giá hiển thị', cacBuoc: '1. Bấm Ẩn đánh giá 2. Kiểm tra is_hidden',
        duLieu: 'Đánh giá đang hiển thị', mongDoi: 'is_hidden = true sau khi ẩn', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/reviews.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(1000);
        const reviews = await t.bang('reviews');
        const r = reviews.find(x => x.is_hidden !== true);
        if (!r) { kq.dat(false, 'Không có đánh giá hiển thị'); return; }
        await p.evaluate((id) => { toggleHideReview(id); }, r.id);
        await p.waitForTimeout(600);
        const sau = await t.bang('reviews');
        const r2 = sau.find(x => x.id === r.id);
        kq.dat(r2 && r2.is_hidden === true, 'is_hidden sau ẩn: ' + (r2 ? r2.is_hidden : '?'));
    });

    await t.tc({
        ma: 'TC-S08-24', trang: 'admin/reviews.html', chucNang: 'Hiện lại đánh giá đã ẩn',
        tienDieuKien: 'Đăng nhập admin, có đánh giá đã ẩn', cacBuoc: '1. Bấm Hiện đánh giá 2. Kiểm tra is_hidden',
        duLieu: 'Đánh giá đã ẩn', mongDoi: 'is_hidden = false sau khi hiện', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/reviews.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(1000);
        const reviews = await t.bang('reviews');
        const r = reviews.find(x => x.is_hidden === true);
        if (!r) { kq.dat(false, 'Không có đánh giá đã ẩn'); return; }
        await p.evaluate((id) => { toggleHideReview(id); }, r.id);
        await p.waitForTimeout(600);
        const sau = await t.bang('reviews');
        const r2 = sau.find(x => x.id === r.id);
        kq.dat(r2 && r2.is_hidden === false, 'is_hidden sau hiện: ' + (r2 ? r2.is_hidden : '?'));
    });

    await t.tc({
        ma: 'TC-S08-25', trang: 'admin/reviews.html', chucNang: 'Xóa đánh giá',
        tienDieuKien: 'Đăng nhập admin, có đánh giá', cacBuoc: '1. Bấm Xóa 2. Xác nhận 3. Kiểm tra bảng reviews',
        duLieu: 'Đánh giá đầu tiên', mongDoi: 'Đánh giá bị xóa khỏi localStorage', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/reviews.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(1000);
        const reviews = await t.bang('reviews');
        const r = reviews[0];
        if (!r) { kq.dat(false, 'Không có đánh giá'); return; }
        p.once('dialog', d => d.accept());
        await p.evaluate((id) => { deleteReview(id); }, r.id);
        await p.waitForTimeout(600);
        const sau = await t.bang('reviews');
        const con = sau.find(x => x.id === r.id);
        kq.dat(con == null, 'Đánh giá #' + r.id + ' còn tồn tại: ' + (con != null));
    });

    await t.tc({
        ma: 'TC-S08-26', trang: 'admin/reviews.html', chucNang: 'Lọc đánh giá theo số sao',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Chọn lọc 5 sao 2. Kiểm tra tất cả đều 5 sao',
        mongDoi: 'Chỉ hiện đánh giá 5 sao', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/reviews.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(1000);
        await p.selectOption('#slFilterRating', '5');
        await p.waitForTimeout(600);
        const chu = await t.chu('#tbReviews');
        kq.dat(chu && chu.includes('(5)'), 'Có đánh giá 5 sao');
        kq.dat(!chu || !chu.includes('(1)'), 'Không lẫn đánh giá 1 sao');
    });

    await t.tc({
        ma: 'TC-S08-27', trang: 'admin/reviews.html', chucNang: 'Thống kê đánh giá đúng số liệu',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Mở trang 2. So sánh thẻ thống kê với dữ liệu',
        mongDoi: 'Tổng đánh giá, số hiển thị, số ẩn khớp với bảng reviews', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/reviews.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(1000);
        const reviews = await t.bang('reviews');
        const tong = reviews.length;
        const an = reviews.filter(x => x.is_hidden === true).length;
        const hien = tong - an;
        const chuTong = await t.chu('#statTotalReviews');
        const chuAn = await t.chu('#statHiddenReviews');
        const chuHien = await t.chu('#statVisibleReviews');
        kq.dat(Number(chuTong) === tong, 'Tổng: ' + chuTong + ' mong ' + tong);
        kq.dat(Number(chuAn) === an, 'Ẩn: ' + chuAn + ' mong ' + an);
        kq.dat(Number(chuHien) === hien, 'Hiện: ' + chuHien + ' mong ' + hien);
    });

    await t.tc({
        ma: 'TC-S08-28', trang: 'admin/reviews.html', chucNang: 'Phân quyền - User thường mở trang quản lý đánh giá',
        tienDieuKien: 'Đăng nhập user@roomcraft.vn', cacBuoc: 'Gõ thẳng admin/reviews.html',
        mongDoi: 'Bị chặn', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/reviews.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(1000);
        kq.dat(!/admin\/reviews\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });

    await t.tc({
        ma: 'TC-S08-29', trang: 'admin/reviews.html', chucNang: 'Mobile - trang quản lý đánh giá',
        tienDieuKien: 'Đăng nhập admin, màn hình mobile', cacBuoc: '1. Mở trang trên mobile 2. Kiểm tra cuộn ngang',
        mongDoi: 'Không cuộn ngang', mucDoNeuLoi: 'Nhẹ', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('admin/reviews.html', { vaiTro: 'admin', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(1000);
        const cuon = await t.traNgang();
        kq.dat(cuon === 0, 'Cuộn ngang: ' + cuon + 'px');
    });

    await t.tc({
        ma: 'TC-S08-30', trang: 'admin/reviews.html', chucNang: 'Ẩn đánh giá - khách xem sản phẩm không thấy',
        tienDieuKien: 'Đăng nhập admin, có đánh giá hiển thị cho sản phẩm', cacBuoc: '1. Ẩn đánh giá 2. Mở trang sản phẩm của khách 3. Kiểm tra đánh giá không hiện',
        duLieu: 'Đánh giá đang hiển thị', mongDoi: 'Đánh giá đã ẩn không xuất hiện trên trang sản phẩm của khách', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/reviews.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(1000);
        const reviews = await t.bang('reviews');
        const r = reviews.find(x => x.is_hidden !== true);
        if (!r) { kq.dat(false, 'Không có đánh giá hiển thị'); return; }
        const noiDung = r.comment;
        await p.evaluate((id) => { toggleHideReview(id); }, r.id);
        await p.waitForTimeout(600);
        // Mở trang sản phẩm của khách
        await p.goto(p.url().replace('admin/reviews.html', 'product-detail.html?id=' + r.product_id));
        await p.waitForTimeout(1200);
        const chu = await t.chu();
        kq.dat(!chu || !chu.includes(noiDung), 'Đánh giá đã ẩn không hiện trên trang sản phẩm');
    });
});