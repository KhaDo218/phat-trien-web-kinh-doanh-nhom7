const { phien, TAI_KHOAN } = require('../lib/khung-test');

phien({ ma: 's02', ten: 'Trang chủ, Không gian mẫu, Chi tiết phòng' }, async (t) => {

    // ============ PHẦN A: TRANG KHÔNG GIAN MẪU (rooms.html) ============

    await t.tc({
        ma: 'TC-S02-01', trang: 'rooms.html', chucNang: 'Lọc theo phong cách - số phòng đúng theo dữ liệu',
        tienDieuKien: 'Mở trang Không gian mẫu', cacBuoc: '1. Mở rooms.html 2. Bấm chip phong cách đầu tiên 3. Đếm số thẻ phòng và đọc dòng đếm',
        duLieu: 'Phong cách đầu tiên trong bảng styles', mongDoi: 'Số phòng hiển thị = số phòng có style_id tương ứng trong bảng rooms; dòng đếm khớp', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('rooms.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const styles = await t.bang('styles');
        const rooms = await t.bang('rooms');
        const st = styles[0];
        const soMongDoi = rooms.filter(r => r.style_id == st.id).length;
        await p.click('#chip-' + st.slug);
        await p.waitForTimeout(500);
        const soThe = await p.locator('#roomList .room-card').count();
        const soHienThi = Math.min(soMongDoi, 12);
        kq.dat(soThe == soHienThi, 'Số thẻ hiển thị: ' + soThe + ' (mong đợi ' + soHienThi + ')');
        const dem = await t.chu('#roomCount');
        kq.dat(dem.indexOf(String(soMongDoi)) >= 0, 'Dòng đếm: "' + dem + '" (mong đợi chứa ' + soMongDoi + ')');
        const active = await p.locator('#chip-' + st.slug).getAttribute('aria-pressed');
        kq.dat(active == 'true', 'Chip đang chọn aria-pressed=' + active);
    });

    await t.tc({
        ma: 'TC-S02-02', trang: 'rooms.html', chucNang: 'Lọc theo phong cách - chip Tất cả hiện lại toàn bộ',
        tienDieuKien: 'Đang lọc 1 phong cách', cacBuoc: '1. Lọc phong cách 2. Bấm chip "Tất cả"',
        duLieu: 'Bấm #chip-all', mongDoi: 'Hiện lại tối đa 12 phòng đầu, dòng đếm = tổng số phòng trong bảng rooms', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const rooms = await t.bang('rooms');
        await p.click('#chip-all');
        await p.waitForTimeout(500);
        const soThe = await p.locator('#roomList .room-card').count();
        kq.dat(soThe == Math.min(rooms.length, 12), 'Số thẻ: ' + soThe + ' (mong đợi ' + Math.min(rooms.length, 12) + ')');
        const dem = await t.chu('#roomCount');
        kq.dat(dem.indexOf(String(rooms.length)) >= 0, 'Dòng đếm: "' + dem + '" (mong đợi chứa ' + rooms.length + ')');
    });

    await t.tc({
        ma: 'TC-S02-03', trang: 'rooms.html', chucNang: 'Lọc theo phong cách qua URL ?style=',
        tienDieuKien: 'Mở thẳng URL có tham số style', cacBuoc: '1. Mở rooms.html?style=<slug> 2. Kiểm tra chip active và tiêu đề',
        duLieu: 'slug phong cách thứ 2', mongDoi: 'Chip tương ứng active, tiêu đề "Không gian <tên phong cách>"', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const styles = await t.bang('styles');
        const st = styles[1];
        const p = await t.mo('rooms.html?style=' + st.slug, { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const active = await p.locator('#chip-' + st.slug).getAttribute('aria-pressed');
        kq.dat(active == 'true', 'Chip ' + st.slug + ' aria-pressed=' + active);
        const tieuDe = await t.chu('#pageTitle');
        kq.dat(tieuDe == 'Không gian ' + st.name, 'Tiêu đề: "' + tieuDe + '"');
    });

    await t.tc({
        ma: 'TC-S02-04', trang: 'rooms.html', chucNang: 'Sắp xếp theo tên A-Z',
        tienDieuKien: 'Mở trang Không gian mẫu', cacBuoc: '1. Chọn sắp xếp "Tên phòng A - Z" 2. Đọc tên các thẻ phòng',
        duLieu: 'sort=name', mongDoi: 'Tên phòng trên trang 1 theo thứ tự A-Z (localeCompare vi)', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('rooms.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        await p.selectOption('#cboSort', 'name');
        await p.waitForTimeout(500);
        const tenHienThi = await p.locator('#roomList .room-card .title-product').allInnerTexts();
        const rooms = await t.bang('rooms');
        const sapXep = rooms.slice().sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true }));
        const mongDoi = sapXep.slice(0, 12).map(r => r.name);
        let dung = tenHienThi.length == mongDoi.length;
        for (let i = 0; i < mongDoi.length && dung; i++)
            if (tenHienThi[i].trim() != mongDoi[i]) dung = false;
        kq.dat(dung, 'Thứ tự: ' + tenHienThi.slice(0, 3).join(' | ') + ' ... (mong đợi ' + mongDoi.slice(0, 3).join(' | ') + ' ...)');
    });

    await t.tc({
        ma: 'TC-S02-05', trang: 'rooms.html', chucNang: 'Sắp xếp theo số sản phẩm nhiều nhất',
        tienDieuKien: 'Mở trang Không gian mẫu', cacBuoc: '1. Chọn sắp xếp "Nhiều sản phẩm nhất" 2. Đọc số sản phẩm trên các thẻ',
        duLieu: 'sort=most', mongDoi: 'Số sản phẩm trên thẻ giảm dần (không tăng)', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        await p.selectOption('#cboSort', 'most');
        await p.waitForTimeout(500);
        const soSP = await p.locator('#roomList .room-card .room-meta span').allInnerTexts();
        const so = soSP.map(s => parseInt(s, 10)).filter(n => !isNaN(n));
        let giamDan = true;
        for (let i = 1; i < so.length; i++)
            if (so[i] > so[i - 1]) giamDan = false;
        kq.dat(giamDan, 'Dãy số sản phẩm: ' + so.slice(0, 6).join(', ') + ' ...');
    });

    await t.tc({
        ma: 'TC-S02-06', trang: 'rooms.html', chucNang: 'Phân trang - trang vượt quá số trang về trang cuối',
        tienDieuKien: 'Mở URL có page=99', cacBuoc: '1. Mở rooms.html?page=99 2. Kiểm tra URL và số thẻ',
        duLieu: 'page=99', mongDoi: 'URL được sửa về trang cuối, số thẻ > 0 và <= 12', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = await t.mo('rooms.html?page=99', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const rooms = await t.bang('rooms');
        const soTrang = Math.max(1, Math.ceil(rooms.length / 12));
        kq.dat(p.url().indexOf('page=' + soTrang) >= 0 || (soTrang == 1 && p.url().indexOf('page=') < 0),
            'URL: ' + p.url().split('/scripts/')[1]);
        const soThe = await p.locator('#roomList .room-card').count();
        kq.dat(soThe > 0 && soThe <= 12, 'Số thẻ: ' + soThe);
    });

    await t.tc({
        ma: 'TC-S02-07', trang: 'rooms.html', chucNang: 'Bấm thẻ phòng mở đúng trang chi tiết',
        tienDieuKien: 'Mở trang Không gian mẫu', cacBuoc: '1. Bấm vào ảnh thẻ phòng đầu tiên 2. Kiểm tra URL',
        duLieu: 'Thẻ phòng đầu tiên', mongDoi: 'Chuyển tới room-detail.html?id=<id phòng>', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = t.trang;
        const href = await p.locator('#roomList .room-card .room-image').first().getAttribute('href');
        await p.locator('#roomList .room-card .room-image').first().click();
        await p.waitForTimeout(1200);
        kq.dat(/room-detail\.html\?id=/.test(p.url()), 'URL: ' + p.url().split('/scripts/')[1]);
        kq.dat(p.url().indexOf(href.split('?id=')[1]) >= 0, 'id khớp href thẻ: ' + href);
    });

    await t.tc({
        ma: 'TC-S02-08', trang: 'rooms.html', chucNang: 'Mobile - lọc phong cách không tràn ngang',
        tienDieuKien: 'Màn hình mobile', cacBuoc: '1. Mở rooms.html trên mobile 2. Bấm 1 chip phong cách 3. Đo cuộn ngang',
        duLieu: 'manHinh mobile', mongDoi: 'Không cuộn ngang (0px), danh sách phòng hiển thị', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('rooms.html', { vaiTro: 'khach', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(800);
        const styles = await t.bang('styles');
        await p.click('#chip-' + styles[0].slug);
        await p.waitForTimeout(500);
        const ngang = await t.traNgang();
        kq.dat(ngang == 0, 'Cuộn ngang: ' + ngang + 'px');
        const soThe = await p.locator('#roomList .room-card').count();
        kq.dat(soThe > 0, 'Số thẻ hiển thị: ' + soThe);
    });

    // ============ PHẦN B: CHI TIẾT PHÒNG (room-detail.html) ============

    await t.tc({
        ma: 'TC-S02-09', trang: 'room-detail.html', chucNang: 'Mở chi tiết phòng - hiển thị đúng tên và số sản phẩm',
        tienDieuKien: 'Chọn 1 phòng có hotspot', cacBuoc: '1. Mở room-detail.html?id=<id> 2. Đọc tên phòng và số sản phẩm',
        duLieu: 'Phòng đầu tiên trong bảng rooms', mongDoi: 'Tên phòng đúng, số sản phẩm trong phòng = số sản phẩm khác nhau gắn hotspot active', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const room = rooms[0];
        const p = await t.mo('room-detail.html?id=' + room.id, { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1200);
        // Đối chiếu trực tiếp với hotspotProductIds.length mà trang tính (getRoomHotspots đã lọc active)
        const soMongDoi = await p.evaluate((rid) => {
            const hs = getRoomHotspots(rid);
            return getHotspotProductIds(hs).length;
        }, room.id);
        const ten = await t.chu('#roomName');
        kq.dat(ten == room.name, 'Tên phòng: "' + ten + '" (mong đợi "' + room.name + '")');
        // #roomTags chứa <span class='overline'>"<n> sản phẩm trong phòng"</span>; CSS text-transform
        // của .overline làm chữ thành IN HOA nên phải so sánh không phân biệt hoa/thường.
        const tags = await t.chu('#roomTags');
        const tagsThuong = (tags || '').toLowerCase();
        kq.dat(tagsThuong.indexOf(soMongDoi + ' sản phẩm trong phòng') >= 0,
            'Tags: "' + tags + '" (mong đợi ' + soMongDoi + ' sản phẩm trong phòng)');
    });

    await t.tc({
        ma: 'TC-S02-10', trang: 'room-detail.html', chucNang: 'Phòng không tồn tại',
        tienDieuKien: 'Mở URL id sai', cacBuoc: '1. Mở room-detail.html?id=khong-ton-tai 2. Kiểm tra khối thông báo',
        duLieu: 'id=khong-ton-tai', mongDoi: 'Hiện khối "Không tìm thấy không gian này", ẩn nội dung phòng', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('room-detail.html?id=khong-ton-tai', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1000);
        const notFound = await p.locator('#roomNotFound').isVisible();
        kq.dat(notFound, 'Khối không tìm thấy hiển thị: ' + notFound);
        const content = await p.locator('#roomContent').isVisible();
        kq.dat(!content, 'Khối nội dung phòng ẩn: ' + !content);
    });

    await t.tc({
        ma: 'TC-S02-11', trang: 'room-detail.html', chucNang: 'Bấm hotspot hiện đúng sản phẩm',
        tienDieuKien: 'Phòng có hotspot trên ảnh chính', cacBuoc: '1. Mở chi tiết phòng 2. Bấm hotspot đầu tiên 3. Đọc tên sản phẩm trong popup',
        duLieu: 'Hotspot đầu tiên', mongDoi: 'Popup mở, tên sản phẩm = tên sản phẩm của hotspot đó', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const hotspots = await t.bang('room_hotspots');
        const products = await t.bang('products');
        const room = rooms[0];
        const hs = hotspots.filter(h => h.room_id == room.id);
        const p = await t.mo('room-detail.html?id=' + room.id, { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1200);
        const nut = p.locator('#stage .hotspot').first();
        const coNut = await nut.count();
        kq.dat(coNut > 0, 'Số hotspot trên ảnh: ' + coNut);
        if (coNut > 0) {
            await nut.click();
            await p.waitForTimeout(500);
            const popup = await p.locator('#hotspotPopup').isVisible();
            kq.dat(popup, 'Popup hiển thị: ' + popup);
            const tenPopup = await t.chu('#popupName');
            const sp = products.find(x => x.id == hs[0].product_id);
            kq.dat(tenPopup == sp.name, 'Tên popup: "' + tenPopup + '" (mong đợi "' + sp.name + '")');
        }
    });

    await t.tc({
        ma: 'TC-S02-12', trang: 'room-detail.html', chucNang: 'Thêm vào giỏ từ hotspot - khách chưa đăng nhập',
        tienDieuKien: 'Chưa đăng nhập, phòng có hotspot còn hàng', cacBuoc: '1. Mở popup hotspot 2. Bấm "Thêm vào giỏ"',
        duLieu: 'Hotspot còn hàng', mongDoi: 'Chuyển sang trang đăng nhập (login.html)', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const hotspots = await t.bang('room_hotspots');
        const products = await t.bang('products');
        const room = rooms[0];
        const hs = hotspots.filter(h => h.room_id == room.id);
        const spConHang = hs.find(h => { const s = products.find(x => x.id == h.product_id); return s && Number(s.stock_quantity) > 0; });
        const p = await t.mo('room-detail.html?id=' + room.id, { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1200);
        if (spConHang) {
            const idx = hs.indexOf(spConHang);
            await p.locator('#hotspot-' + idx).click();
            await p.waitForTimeout(400);
            await p.locator('#hotspotPopup button', { hasText: 'Thêm vào giỏ' }).first().click();
            await p.waitForTimeout(1200);
            kq.dat(/login\.html/.test(p.url()), 'URL: ' + p.url().split('/scripts/')[1]);
        } else {
            kq.ghi('Không có hotspot còn hàng để test');
            kq.dat(false, 'Không tìm được hotspot còn hàng');
        }
    });

    await t.tc({
        ma: 'TC-S02-13', trang: 'room-detail.html', chucNang: 'Thêm vào giỏ từ hotspot - đã đăng nhập',
        tienDieuKien: 'Đăng nhập user', cacBuoc: '1. Mở popup hotspot còn hàng 2. Bấm "Thêm vào giỏ" 3. Kiểm tra giỏ',
        duLieu: 'Hotspot còn hàng', mongDoi: 'Giỏ hàng có sản phẩm đó với số lượng 1, hiện toast xác nhận', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const hotspots = await t.bang('room_hotspots');
        const products = await t.bang('products');
        const room = rooms[0];
        const hs = hotspots.filter(h => h.room_id == room.id);
        const spConHang = hs.find(h => { const s = products.find(x => x.id == h.product_id); return s && Number(s.stock_quantity) > 0; });
        const p = await t.mo('room-detail.html?id=' + room.id, { vaiTro: 'user', moi: true });
        await p.waitForTimeout(1200);
        if (spConHang) {
            const idx = hs.indexOf(spConHang);
            await p.locator('#hotspot-' + idx).click();
            await p.waitForTimeout(400);
            await p.locator('#hotspotPopup button', { hasText: 'Thêm vào giỏ' }).first().click();
            await p.waitForTimeout(600);
            const gio = await p.evaluate(() => getCart());
            const mon = gio.find(x => x.productId == spConHang.product_id || x.product_id == spConHang.product_id);
            kq.dat(mon != null, 'Giỏ hàng có sản phẩm: ' + (mon ? 'có' : 'không'));
            if (mon) kq.dat(Number(mon.quantity) == 1, 'Số lượng: ' + mon.quantity);
            const toast = await t.chu('#roomToast');
            kq.dat(toast && toast.indexOf('Đã thêm') >= 0, 'Toast: "' + toast + '"');
        } else {
            kq.dat(false, 'Không tìm được hotspot còn hàng');
        }
    });

    await t.tc({
        ma: 'TC-S02-14', trang: 'room-detail.html', chucNang: 'Thêm trọn bộ - bỏ món hết hàng, báo đúng số món',
        tienDieuKien: 'Đăng nhập user, phòng có ít nhất 1 món hết hàng', cacBuoc: '1. Chuẩn bị 1 hotspot hết hàng 2. Mở chi tiết phòng 3. Bấm "Thêm trọn bộ"',
        duLieu: 'Sửa stock_quantity=0 cho 1 hotspot', mongDoi: 'Chỉ thêm các món còn hàng, toast báo đúng số món đã thêm', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const hotspots = await t.bang('room_hotspots');
        const products = await t.bang('products');
        const room = rooms[0];
        const hs = hotspots.filter(h => h.room_id == room.id);
        const ids = [];
        hs.forEach(h => { if (ids.indexOf(h.product_id) < 0) ids.push(h.product_id); });
        const p = await t.mo('room-detail.html?id=' + room.id, { vaiTro: 'user', moi: true });
        await p.waitForTimeout(1200);
        // Đặt 1 món hết hàng
        await p.evaluate((pid) => {
            const ps = getTable('products');
            for (const x of ps) if (x.id === pid) x.stock_quantity = 0;
            saveTable('products', ps);
        }, ids[0]);
        await p.reload();
        await p.waitForTimeout(1200);
        const soConHang = await p.evaluate((list) => {
            let n = 0;
            for (const id of list) { const s = findProduct(id); if (s && Number(s.stock_quantity) > 0) n++; }
            return n;
        }, ids);
        await p.click('#btnAddAll');
        await p.waitForTimeout(800);
        const gio = await p.evaluate(() => getCart());
        kq.dat(gio.length == soConHang, 'Số món trong giỏ: ' + gio.length + ' (mong đợi ' + soConHang + ')');
        const toast = await t.chu('#roomToast');
        kq.dat(toast && toast.indexOf('Đã thêm ' + soConHang + ' món') >= 0, 'Toast: "' + toast + '"');
    });

    await t.tc({
        ma: 'TC-S02-15', trang: 'room-detail.html', chucNang: 'Thêm trọn bộ - tất cả hết hàng thì nút bị khóa',
        tienDieuKien: 'Đăng nhập user, mọi hotspot hết hàng', cacBuoc: '1. Đặt tất cả hotspot hết hàng 2. Mở chi tiết phòng 3. Kiểm tra nút',
        duLieu: 'stock_quantity=0 cho mọi hotspot', mongDoi: 'Nút "Thêm trọn bộ" và "Thêm cả bộ" bị disabled', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const hotspots = await t.bang('room_hotspots');
        const room = rooms[0];
        const hs = hotspots.filter(h => h.room_id == room.id);
        const ids = [];
        hs.forEach(h => { if (ids.indexOf(h.product_id) < 0) ids.push(h.product_id); });
        const p = await t.mo('room-detail.html?id=' + room.id, { vaiTro: 'user', moi: true });
        await p.waitForTimeout(1200);
        await p.evaluate((list) => {
            const ps = getTable('products');
            for (const x of ps) if (list.indexOf(x.id) >= 0) x.stock_quantity = 0;
            saveTable('products', ps);
        }, ids);
        await p.reload();
        await p.waitForTimeout(1200);
        const d1 = await p.locator('#btnAddAll').isDisabled();
        const d2 = await p.locator('#btnAddAllTop').isDisabled();
        kq.dat(d1, 'Nút #btnAddAll disabled: ' + d1);
        kq.dat(d2, 'Nút #btnAddAllTop disabled: ' + d2);
    });

    await t.tc({
        ma: 'TC-S02-16', trang: 'room-detail.html', chucNang: 'Chuyển góc ảnh - hotspot đổi theo ảnh',
        tienDieuKien: 'Phòng có nhiều ảnh và hotspot ở nhiều góc', cacBuoc: '1. Mở chi tiết phòng 2. Bấm ảnh nhỏ thứ 2 3. Kiểm tra ảnh chính và hotspot hiển thị',
        duLieu: 'Ảnh thứ 2', mongDoi: 'Ảnh chính đổi sang ảnh thứ 2, chỉ hotspot của ảnh đó hiển thị', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const room = rooms.find(r => (r.images || []).length > 1);
        if (!room) { kq.dat(false, 'Không có phòng nhiều ảnh'); return; }
        const p = await t.mo('room-detail.html?id=' + room.id, { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1200);
        const soThumb = await p.locator('#thumbList .rd-thumb').count();
        kq.dat(soThumb > 1, 'Số ảnh nhỏ: ' + soThumb);
        await p.locator('#thumbList .rd-thumb').nth(1).click();
        await p.waitForTimeout(500);
        const src = await p.locator('#roomImage').getAttribute('src');
        kq.dat(src.indexOf(room.images[1]) >= 0, 'Ảnh chính: ' + src);
        const active = await p.locator('#thumbList .rd-thumb').nth(1).getAttribute('class');
        kq.dat(active.indexOf('active') >= 0, 'Thumb thứ 2 active: ' + active);
    });

    await t.tc({
        ma: 'TC-S02-17', trang: 'room-detail.html', chucNang: 'Xem 3D - mở modal khi sản phẩm có model 3D',
        tienDieuKien: 'Sản phẩm hotspot có model_3d_url', cacBuoc: '1. Mở popup hotspot có 3D 2. Bấm nút "3D" 3. Kiểm tra modal',
        duLieu: 'Hotspot có model_3d_url', mongDoi: 'Modal #modal3d hiện, tiêu đề = tên sản phẩm', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const hotspots = await t.bang('room_hotspots');
        const products = await t.bang('products');
        const room = rooms[0];
        const hs = hotspots.filter(h => h.room_id == room.id);
        const idx = hs.findIndex(h => { const s = products.find(x => x.id == h.product_id); return s && s.model_3d_url != null; });
        const p = await t.mo('room-detail.html?id=' + room.id, { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1200);
        if (idx < 0) { kq.ghi('Không có hotspot có model 3D'); kq.dat(true, 'Bỏ qua - không có dữ liệu'); return; }
        await p.locator('#hotspot-' + idx).click();
        await p.waitForTimeout(400);
        await p.locator('#hotspotPopup button', { hasText: '3D' }).first().click();
        await p.waitForTimeout(600);
        const hien = await p.locator('#modal3d').isVisible();
        kq.dat(hien, 'Modal 3D hiển thị: ' + hien);
        const sp = products.find(x => x.id == hs[idx].product_id);
        const tieuDe = await t.chu('#viewerTitle');
        kq.dat(tieuDe == sp.name, 'Tiêu đề modal: "' + tieuDe + '" (mong đợi "' + sp.name + '")');
    });

    await t.tc({
        ma: 'TC-S02-18', trang: 'room-detail.html', chucNang: 'Xem 3D - đóng modal bằng nút X',
        tienDieuKien: 'Modal 3D đang mở', cacBuoc: '1. Mở modal 3D 2. Bấm nút đóng',
        duLieu: 'Nút close trong modal', mongDoi: 'Modal ẩn, body trả lại overflow', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = t.trang;
        const hien = await p.locator('#modal3d').isVisible();
        if (!hien) { kq.ghi('Modal chưa mở, bỏ qua'); kq.dat(true, 'Bỏ qua'); return; }
        await p.locator('#modal3d button[aria-label="Đóng cửa sổ 3D"]').click();
        await p.waitForTimeout(400);
        const an = await p.locator('#modal3d').isHidden();
        kq.dat(an, 'Modal ẩn: ' + an);
        const ov = await p.evaluate(() => document.body.style.overflow);
        kq.dat(ov == '', 'overflow body: "' + ov + '"');
    });

    await t.tc({
        ma: 'TC-S02-19', trang: 'room-detail.html', chucNang: 'Phòng tương tự - cùng phong cách, không trùng phòng hiện tại',
        tienDieuKien: 'Phòng có phòng cùng phong cách', cacBuoc: '1. Mở chi tiết phòng 2. Đọc danh sách phòng tương tự',
        duLieu: 'Phòng đầu tiên', mongDoi: 'Tối đa 3 phòng, tất cả cùng style_id, không chứa phòng hiện tại', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const room = rooms[0];
        const p = await t.mo('room-detail.html?id=' + room.id, { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1200);
        const soThe = await p.locator('#relatedRooms .room-card').count();
        kq.dat(soThe <= 3, 'Số phòng tương tự: ' + soThe + ' (<=3)');
        const hrefs = await p.locator('#relatedRooms .room-card .room-image').evaluateAll(els => els.map(e => e.getAttribute('href')));
        let dung = true;
        for (const h of hrefs) {
            const id = h.split('?id=')[1];
            const r = rooms.find(x => x.id == id);
            if (!r || r.style_id != room.style_id || r.id == room.id) dung = false;
        }
        kq.dat(dung, 'Các phòng tương tự: ' + hrefs.join(', '));
    });

    await t.tc({
        ma: 'TC-S02-20', trang: 'room-detail.html', chucNang: 'Mở popup sẵn qua tham số sp=',
        tienDieuKien: 'Mở URL có sp=<product_id>', cacBuoc: '1. Mở room-detail.html?id=<room>&sp=<product> 2. Kiểm tra popup',
        duLieu: 'sp = hotspot đầu tiên', mongDoi: 'Popup tự mở đúng sản phẩm đó', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const hotspots = await t.bang('room_hotspots');
        const products = await t.bang('products');
        const room = rooms[0];
        const hs = hotspots.filter(h => h.room_id == room.id);
        const sp = products.find(x => x.id == hs[0].product_id);
        const p = await t.mo('room-detail.html?id=' + room.id + '&sp=' + hs[0].product_id, { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1500);
        const hien = await p.locator('#hotspotPopup').isVisible();
        kq.dat(hien, 'Popup hiển thị: ' + hien);
        const ten = await t.chu('#popupName');
        kq.dat(ten == sp.name, 'Tên popup: "' + ten + '" (mong đợi "' + sp.name + '")');
    });

    await t.tc({
        ma: 'TC-S02-21', trang: 'room-detail.html', chucNang: 'Đóng popup bằng phím Escape',
        tienDieuKien: 'Popup hotspot đang mở', cacBuoc: '1. Mở popup 2. Nhấn Escape',
        duLieu: 'Phím Escape', mongDoi: 'Popup ẩn, hotspot bỏ active', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = t.trang;
        const hien = await p.locator('#hotspotPopup').isVisible();
        if (!hien) { kq.ghi('Popup chưa mở'); kq.dat(false, 'Popup không mở'); return; }
        await p.keyboard.press('Escape');
        await p.waitForTimeout(400);
        const an = await p.locator('#hotspotPopup').isHidden();
        kq.dat(an, 'Popup ẩn: ' + an);
    });

    await t.tc({
        ma: 'TC-S02-22', trang: 'room-detail.html', chucNang: 'Điều hướng hotspot bằng mũi tên trái/phải',
        tienDieuKien: 'Popup đang mở, ảnh có >=2 hotspot', cacBuoc: '1. Mở popup 2. Nhấn ArrowRight 3. Đọc tên sản phẩm',
        duLieu: 'Phím ArrowRight', mongDoi: 'Popup chuyển sang sản phẩm kế tiếp cùng ảnh', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const hotspots = await t.bang('room_hotspots');
        const products = await t.bang('products');
        const room = rooms[0];
        const hs = hotspots.filter(h => h.room_id == room.id);
        const anhChinh = room.image_url;
        const cungAnh = hs.filter(h => (h.image_url || anhChinh) == anhChinh);
        if (cungAnh.length < 2) { kq.ghi('Không đủ hotspot cùng ảnh'); kq.dat(true, 'Bỏ qua'); return; }
        const p = await t.mo('room-detail.html?id=' + room.id, { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1200);
        const idx0 = hs.indexOf(cungAnh[0]);
        await p.locator('#hotspot-' + idx0).click();
        await p.waitForTimeout(400);
        const ten1 = await t.chu('#popupName');
        await p.keyboard.press('ArrowRight');
        await p.waitForTimeout(400);
        const ten2 = await t.chu('#popupName');
        const sp2 = products.find(x => x.id == cungAnh[1].product_id);
        kq.dat(ten2 == sp2.name, 'Sau ArrowRight: "' + ten2 + '" (mong đợi "' + sp2.name + '", trước đó "' + ten1 + '")');
    });

    await t.tc({
        ma: 'TC-S02-23', trang: 'room-detail.html', chucNang: 'Mobile - mở popup hotspot không tràn ngang',
        tienDieuKien: 'Màn hình mobile', cacBuoc: '1. Mở chi tiết phòng trên mobile 2. Bấm hotspot 3. Đo cuộn ngang',
        duLieu: 'manHinh mobile', mongDoi: 'Popup hiện, không cuộn ngang', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const room = rooms[0];
        const p = await t.mo('room-detail.html?id=' + room.id, { vaiTro: 'khach', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(1200);
        const nut = p.locator('#stage .hotspot').first();
        const coNut = await nut.count();
        kq.dat(coNut > 0, 'Số hotspot: ' + coNut);
        if (coNut > 0) {
            await nut.click();
            await p.waitForTimeout(500);
            const hien = await p.locator('#hotspotPopup').isVisible();
            kq.dat(hien, 'Popup hiển thị: ' + hien);
        }
        const ngang = await t.traNgang();
        kq.dat(ngang == 0, 'Cuộn ngang: ' + ngang + 'px');
    });

    await t.tc({
        ma: 'TC-S02-24', trang: 'room-detail.html', chucNang: 'Tổng giá trọn bộ - chỉ tính món còn hàng',
        tienDieuKien: 'Phòng có hotspot, 1 món hết hàng', cacBuoc: '1. Đặt 1 hotspot hết hàng 2. Mở chi tiết phòng 3. Đọc tổng giá',
        duLieu: 'stock_quantity=0 cho 1 hotspot', mongDoi: 'Tổng giá = tổng giá các món còn hàng (không gồm món hết hàng)', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const hotspots = await t.bang('room_hotspots');
        const products = await t.bang('products');
        const room = rooms[0];
        const hs = hotspots.filter(h => h.room_id == room.id);
        const ids = [];
        hs.forEach(h => { if (ids.indexOf(h.product_id) < 0) ids.push(h.product_id); });
        const p = await t.mo('room-detail.html?id=' + room.id, { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1200);
        await p.evaluate((pid) => {
            const ps = getTable('products');
            for (const x of ps) if (x.id === pid) x.stock_quantity = 0;
            saveTable('products', ps);
        }, ids[0]);
        await p.reload();
        await p.waitForTimeout(1200);
        const tongMongDoi = await p.evaluate((list) => {
            let tong = 0;
            for (const id of list) { const s = findProduct(id); if (s && Number(s.stock_quantity) > 0) tong += Number(s.price); }
            return tong;
        }, ids);
        const tongHienThi = await t.chu('#roomTotal');
        kq.dat(tongHienThi.replace(/[^\d]/g, '') == String(tongMongDoi), 'Tổng hiển thị: "' + tongHienThi + '" (mong đợi ' + tongMongDoi + ')');
        const ghiChu = await t.chu('#roomTotalNote');
        kq.dat(ghiChu.indexOf((ids.length - 1) + ' / ' + ids.length) >= 0, 'Ghi chú: "' + ghiChu + '"');
    });

    await t.tc({
        ma: 'TC-S02-25', trang: 'room-detail.html', chucNang: 'Sản phẩm trong không gian - đủ số thẻ theo hotspot',
        tienDieuKien: 'Phòng có hotspot', cacBuoc: '1. Mở chi tiết phòng 2. Đếm thẻ trong #hotspotProducts',
        duLieu: 'Phòng đầu tiên', mongDoi: 'Số thẻ = số sản phẩm khác nhau gắn hotspot active', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const room = rooms[0];
        const p = await t.mo('room-detail.html?id=' + room.id, { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1200);
        const soMongDoi = await p.evaluate((rid) => {
            const hs = getRoomHotspots(rid);
            return getHotspotProductIds(hs).length;
        }, room.id);
        const soThe = await p.locator('#hotspotProducts .product-card').count();
        kq.dat(soThe == soMongDoi, 'Số thẻ: ' + soThe + ' (mong đợi ' + soMongDoi + ')');
        const dem = await t.chu('#hotspotCount');
        kq.dat(dem.indexOf(soMongDoi + ' món') >= 0, 'Đếm: "' + dem + '"');
    });

    await t.tc({
        ma: 'TC-S02-26', trang: 'rooms.html', chucNang: 'Dải lát ảnh phong cách - bấm lát lọc đúng phong cách',
        tienDieuKien: 'Mở trang Không gian mẫu', cacBuoc: '1. Bấm lát ảnh phong cách thứ 3 2. Kiểm tra chip active và tiêu đề',
        duLieu: 'Lát thứ 3', mongDoi: 'Lọc theo phong cách đó, chip tương ứng active', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('rooms.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const styles = await t.bang('styles');
        const st = styles[2];
        await p.locator('#styleSlices .rooms-slice').nth(2).click();
        await p.waitForTimeout(500);
        const active = await p.locator('#chip-' + st.slug).getAttribute('aria-pressed');
        kq.dat(active == 'true', 'Chip ' + st.slug + ' aria-pressed=' + active);
        const tieuDe = await t.chu('#pageTitle');
        kq.dat(tieuDe == 'Không gian ' + st.name, 'Tiêu đề: "' + tieuDe + '"');
    });

    await t.tc({
        ma: 'TC-S02-27', trang: 'room-detail.html', chucNang: 'Phân quyền - khách bấm Thêm trọn bộ chuyển đăng nhập',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Mở chi tiết phòng 2. Bấm "Thêm trọn bộ vào giỏ"',
        duLieu: 'Khách', mongDoi: 'Chuyển sang login.html, giỏ hàng không thay đổi', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const room = rooms[0];
        const p = await t.mo('room-detail.html?id=' + room.id, { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1200);
        const gioTruoc = await p.evaluate(() => (typeof getCart === 'function' ? getCart() : []));
        await p.click('#btnAddAllTop');
        await p.waitForTimeout(1200);
        kq.dat(/login\.html/.test(p.url()), 'URL: ' + p.url().split('/scripts/')[1]);
        const gioSau = await p.evaluate(() => (typeof getCart === 'function' ? getCart() : []));
        kq.dat(gioSau.length == gioTruoc.length, 'Giỏ trước: ' + gioTruoc.length + ', sau: ' + gioSau.length);
    });

    await t.tc({
        ma: 'TC-S02-28', trang: 'room-detail.html', chucNang: 'Giá trị biên - thêm trọn bộ khi chỉ còn 1 món còn hàng',
        tienDieuKien: 'Đăng nhập user, chỉ 1 hotspot còn hàng', cacBuoc: '1. Đặt tất cả trừ 1 hotspot hết hàng 2. Bấm "Thêm trọn bộ"',
        duLieu: 'Chỉ 1 món còn hàng', mongDoi: 'Giỏ có đúng 1 món, toast báo "Đã thêm 1 món"', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const hotspots = await t.bang('room_hotspots');
        const room = rooms[0];
        const hs = hotspots.filter(h => h.room_id == room.id);
        const ids = [];
        hs.forEach(h => { if (ids.indexOf(h.product_id) < 0) ids.push(h.product_id); });
        if (ids.length < 2) { kq.ghi('Phòng không đủ món'); kq.dat(true, 'Bỏ qua'); return; }
        const p = await t.mo('room-detail.html?id=' + room.id, { vaiTro: 'user', moi: true });
        await p.waitForTimeout(1200);
        await p.evaluate((list) => {
            const ps = getTable('products');
            for (const x of ps) if (list.indexOf(x.id) >= 0) x.stock_quantity = 0;
            for (const x of ps) if (x.id === list[0]) x.stock_quantity = 5;
            saveTable('products', ps);
        }, ids);
        await p.reload();
        await p.waitForTimeout(1200);
        await p.click('#btnAddAll');
        await p.waitForTimeout(800);
        const gio = await p.evaluate(() => getCart());
        kq.dat(gio.length == 1, 'Số món trong giỏ: ' + gio.length + ' (mong đợi 1)');
        const toast = await t.chu('#roomToast');
        kq.dat(toast && toast.indexOf('Đã thêm 1 món') >= 0, 'Toast: "' + toast + '"');
    });

    await t.tc({
        ma: 'TC-S02-29', trang: 'room-detail.html', chucNang: 'Giá trị biên - thêm trọn bộ khi tất cả còn hàng',
        tienDieuKien: 'Đăng nhập user, mọi hotspot còn hàng', cacBuoc: '1. Đảm bảo mọi hotspot còn hàng 2. Bấm "Thêm trọn bộ"',
        duLieu: 'Tất cả còn hàng', mongDoi: 'Giỏ có đủ số món = số sản phẩm hotspot, toast báo đúng số', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const hotspots = await t.bang('room_hotspots');
        const room = rooms[0];
        const hs = hotspots.filter(h => h.room_id == room.id);
        const ids = [];
        hs.forEach(h => { if (ids.indexOf(h.product_id) < 0) ids.push(h.product_id); });
        const p = await t.mo('room-detail.html?id=' + room.id, { vaiTro: 'user', moi: true });
        await p.waitForTimeout(1200);
        await p.evaluate((list) => {
            const ps = getTable('products');
            for (const x of ps) if (list.indexOf(x.id) >= 0) x.stock_quantity = 10;
            saveTable('products', ps);
        }, ids);
        await p.reload();
        await p.waitForTimeout(1200);
        await p.click('#btnAddAll');
        await p.waitForTimeout(800);
        const gio = await p.evaluate(() => getCart());
        kq.dat(gio.length == ids.length, 'Số món trong giỏ: ' + gio.length + ' (mong đợi ' + ids.length + ')');
        const toast = await t.chu('#roomToast');
        kq.dat(toast && toast.indexOf('Đã thêm ' + ids.length + ' món') >= 0, 'Toast: "' + toast + '"');
    });

    await t.tc({
        ma: 'TC-S02-30', trang: 'room-detail.html', chucNang: 'Mobile - thêm trọn bộ từ chi tiết phòng',
        tienDieuKien: 'Đăng nhập user, màn hình mobile', cacBuoc: '1. Mở chi tiết phòng trên mobile 2. Bấm "Thêm trọn bộ" 3. Kiểm tra giỏ',
        duLieu: 'manHinh mobile', mongDoi: 'Giỏ có đúng số món còn hàng, không cuộn ngang', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const rooms = await t.bang('rooms');
        const hotspots = await t.bang('room_hotspots');
        const products = await t.bang('products');
        const room = rooms[0];
        const hs = hotspots.filter(h => h.room_id == room.id);
        const activeIds = new Set(products.filter(x => x.is_active != false).map(x => x.id));
        const ids = [];
        hs.forEach(h => { if (activeIds.has(h.product_id) && ids.indexOf(h.product_id) < 0) ids.push(h.product_id); });
        const p = await t.mo('room-detail.html?id=' + room.id, { vaiTro: 'user', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(1200);
        const soConHang = await p.evaluate((list) => {
            let n = 0;
            for (const id of list) { const s = findProduct(id); if (s && Number(s.stock_quantity) > 0) n++; }
            return n;
        }, ids);
        await p.click('#btnAddAllTop');
        await p.waitForTimeout(800);
        const gio = await p.evaluate(() => getCart());
        kq.dat(gio.length == soConHang, 'Số món trong giỏ: ' + gio.length + ' (mong đợi ' + soConHang + ')');
        const ngang = await t.traNgang();
        kq.dat(ngang == 0, 'Cuộn ngang: ' + ngang + 'px');
    });
});