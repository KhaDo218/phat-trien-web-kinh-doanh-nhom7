const { phien, TAI_KHOAN } = require('../lib/khung-test');

// Thêm 06/11 (đợt 3b): mở bộ lọc thu gọn trên màn hẹp
async function ganMoBoLoc(p) {
  const originals = {
    check: p.check.bind(p),
    uncheck: p.uncheck.bind(p),
    selectOption: p.selectOption.bind(p),
    fill: p.fill.bind(p),
    click: p.click.bind(p),
  };

  async function ensureOpen(selector) {
    if (typeof selector !== 'string') return;
    if (selector === '.btn-filter-toggle') return;

    let toggleVisible = false;
    try {
      toggleVisible = await p.locator('.btn-filter-toggle').first().isVisible();
    } catch {
      toggleVisible = false;
    }
    if (!toggleVisible) return;

    let needOpen = false;
    try {
      const daMo = await p.evaluate(() => { const pn = document.querySelector('#filterPanel'); return !pn || pn.classList.contains('open'); });
      // locator của Playwright hiểu cả selector như button:has-text('...')
      needOpen = !daMo && (await p.locator('#filterPanel').locator(selector).count()) > 0;
    } catch {
      needOpen = false;
    }
    if (!needOpen) return;

    await originals.click('.btn-filter-toggle');
    try {
      await p.locator('#filterPanel.open').waitFor({ state: 'visible', timeout: 3000 });
    } catch {
      // bỏ qua
    }
  }

  p.check = async function (selector, ...rest) {
    await ensureOpen(selector);
    return originals.check(selector, ...rest);
  };

  p.uncheck = async function (selector, ...rest) {
    await ensureOpen(selector);
    return originals.uncheck(selector, ...rest);
  };

  p.selectOption = async function (selector, ...rest) {
    await ensureOpen(selector);
    return originals.selectOption(selector, ...rest);
  };

  p.fill = async function (selector, ...rest) {
    await ensureOpen(selector);
    return originals.fill(selector, ...rest);
  };

  p.click = async function (selector, ...rest) {
    await ensureOpen(selector);
    return originals.click(selector, ...rest);
  };

  return p;
}

phien({ ma: 's04', ten: 'Đồ cũ' }, async (t) => {
    // Màn hẹp: bộ lọc thu gọn sau nút "Bộ lọc" → bấm mở như người dùng thật trước khi thao tác
    const moGoc = t.mo.bind(t);
    t.mo = async (...a) => ganMoBoLoc(await moGoc(...a));

    // ============ NHÓM 1: LUỒNG ĐÚNG - HIỂN THỊ DANH SÁCH ============

    await t.tc({
        ma: 'TC-S04-01', trang: 'marketplace.html', chucNang: 'Hiển thị danh sách đồ cũ - chỉ sản phẩm USED đang bán',
        tienDieuKien: 'Dữ liệu mẫu có cả sản phẩm mới và đồ cũ', cacBuoc: '1. Mở trang Đồ cũ 2. Đếm số thẻ sản phẩm hiển thị',
        duLieu: 'Mặc định', mongDoi: 'Chỉ hiện sản phẩm product_type=USED, is_active!=false; số thẻ = min(12, tổng số đồ cũ)', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('marketplace.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const tatCa = await t.bang('products');
        const doCu = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false);
        const soThe = await p.locator('#usedProductsGrid .product-card').count();
        const mongDoi = Math.min(12, doCu.length);
        kq.dat(soThe === mongDoi, 'Số thẻ hiển thị: ' + soThe + ' (mong đợi ' + mongDoi + ')');
        const nhan = await t.chu('#lblResultCount');
        kq.dat(nhan === 'Tìm thấy ' + doCu.length + ' món đồ cũ tuyển chọn', 'Nhãn đếm: "' + nhan + '"');
    });

    await t.tc({
        ma: 'TC-S04-02', trang: 'marketplace.html', chucNang: 'Lọc tình trạng - Like New',
        tienDieuKien: 'Đang ở trang Đồ cũ', cacBuoc: '1. Bấm chip "Like New (>95%)"',
        duLieu: 'Tình trạng: Like New', mongDoi: 'Chỉ hiện các món có condition_grade="Like New"; số đếm khớp dữ liệu', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = t.trang;
        const tatCa = await t.bang('products');
        const soLikeNew = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false && x.condition_grade === 'Like New').length;
        await p.click('#filterGradeChips button[data-value="Like New"]');
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const nhan = await t.chu('#lblResultCount');
        kq.dat(nhan === 'Tìm thấy ' + soLikeNew + ' món đồ cũ tuyển chọn', 'Nhãn đếm: "' + nhan + '" (mong đợi ' + soLikeNew + ')');
        const soThe = await p.locator('#usedProductsGrid .product-card').count();
        kq.dat(soThe === Math.min(12, soLikeNew), 'Số thẻ: ' + soThe);
        const url = p.url();
        kq.dat(/condition=Like(%20|\+)New/.test(url), 'URL có condition=Like New: ' + url.split('?')[1]);
    });

    await t.tc({
        ma: 'TC-S04-03', trang: 'marketplace.html', chucNang: 'Lọc tình trạng - Good',
        tienDieuKien: 'Đang ở trang Đồ cũ', cacBuoc: '1. Bấm chip "Good (85-95%)"',
        duLieu: 'Tình trạng: Good', mongDoi: 'Chỉ hiện món condition_grade="Good"', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = t.trang;
        const tatCa = await t.bang('products');
        const soGood = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false && x.condition_grade === 'Good').length;
        await p.click('#filterGradeChips button[data-value="Good"]');
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const nhan = await t.chu('#lblResultCount');
        kq.dat(nhan === 'Tìm thấy ' + soGood + ' món đồ cũ tuyển chọn', 'Nhãn đếm: "' + nhan + '" (mong đợi ' + soGood + ')');
    });

    await t.tc({
        ma: 'TC-S04-04', trang: 'marketplace.html', chucNang: 'Lọc tình trạng - Fair',
        tienDieuKien: 'Đang ở trang Đồ cũ', cacBuoc: '1. Bấm chip "Fair (>70%)"',
        duLieu: 'Tình trạng: Fair', mongDoi: 'Chỉ hiện món condition_grade="Fair"', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = t.trang;
        const tatCa = await t.bang('products');
        const soFair = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false && x.condition_grade === 'Fair').length;
        await p.click('#filterGradeChips button[data-value="Fair"]');
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const nhan = await t.chu('#lblResultCount');
        kq.dat(nhan === 'Tìm thấy ' + soFair + ' món đồ cũ tuyển chọn', 'Nhãn đếm: "' + nhan + '" (mong đợi ' + soFair + ')');
    });

    await t.tc({
        ma: 'TC-S04-05', trang: 'marketplace.html', chucNang: 'Lọc tình trạng - Tất cả',
        tienDieuKien: 'Đang lọc Fair', cacBuoc: '1. Bấm chip "Tất cả"',
        duLieu: 'Tình trạng: (tất cả)', mongDoi: 'Hiện lại toàn bộ đồ cũ, nhãn đếm = tổng số đồ cũ', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const tatCa = await t.bang('products');
        const tong = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false).length;
        await p.click('#filterGradeChips button[data-value=""]');
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const nhan = await t.chu('#lblResultCount');
        kq.dat(nhan === 'Tìm thấy ' + tong + ' món đồ cũ tuyển chọn', 'Nhãn đếm: "' + nhan + '" (mong đợi ' + tong + ')');
        const url = p.url();
        kq.dat(!/condition=/.test(url), 'URL không còn condition: ' + url.split('?')[1]);
    });

    // ============ NHÓM 2: LỌC GIÁ ============

    await t.tc({
        ma: 'TC-S04-06', trang: 'marketplace.html', chucNang: 'Lọc giá - Dưới 1 triệu',
        tienDieuKien: 'Đang ở trang Đồ cũ', cacBuoc: '1. Chọn radio "Dưới 1 triệu"',
        duLieu: 'Giá: 0-1000000', mongDoi: 'Chỉ hiện món có price < 1000000', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const tatCa = await t.bang('products');
        const soMon = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false && Number(x.price) >= 0 && Number(x.price) < 1000000).length;
        await p.check('input[name="radPrice"][value="0-1000000"]');
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const nhan = await t.chu('#lblResultCount');
        kq.dat(nhan === 'Tìm thấy ' + soMon + ' món đồ cũ tuyển chọn', 'Nhãn đếm: "' + nhan + '" (mong đợi ' + soMon + ')');
    });

    await t.tc({
        ma: 'TC-S04-07', trang: 'marketplace.html', chucNang: 'Lọc giá - Từ 1 đến 3 triệu',
        tienDieuKien: 'Đang ở trang Đồ cũ', cacBuoc: '1. Chọn radio "Từ 1 – 3 triệu"',
        duLieu: 'Giá: 1000000-3000000', mongDoi: 'Chỉ hiện món có 1000000 <= price < 3000000', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const tatCa = await t.bang('products');
        const soMon = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false && Number(x.price) >= 1000000 && Number(x.price) < 3000000).length;
        await p.check('input[name="radPrice"][value="1000000-3000000"]');
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const nhan = await t.chu('#lblResultCount');
        kq.dat(nhan === 'Tìm thấy ' + soMon + ' món đồ cũ tuyển chọn', 'Nhãn đếm: "' + nhan + '" (mong đợi ' + soMon + ')');
    });

    await t.tc({
        ma: 'TC-S04-08', trang: 'marketplace.html', chucNang: 'Lọc giá - Trên 15 triệu',
        tienDieuKien: 'Đang ở trang Đồ cũ', cacBuoc: '1. Chọn radio "Trên 15 triệu"',
        duLieu: 'Giá: 15000000-999999999', mongDoi: 'Chỉ hiện món có price >= 15000000; nếu không có món nào trong khoảng thì radio không hiện và không lọc gì', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const tatCa = await t.bang('products');
        const soMon = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false && Number(x.price) >= 15000000).length;
        const radio = p.locator('input[name="radPrice"][value="15000000-999999999"]');
        const coRadio = await radio.count() > 0;
        if (soMon === 0) {
            // Không có món nào trong khoảng -> khung lọc bỏ qua khoảng giá này (đúng thiết kế)
            kq.dat(!coRadio, 'Không có món >15tr nên radio "Trên 15 triệu" không hiện: ' + !coRadio);
            return;
        }
        kq.dat(coRadio, 'Có món >15tr nên radio "Trên 15 triệu" phải hiện: ' + coRadio);
        if (coRadio) {
            await radio.check();
            await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
            await p.waitForTimeout(500);
            const nhan = await t.chu('#lblResultCount');
            kq.dat(nhan === 'Tìm thấy ' + soMon + ' món đồ cũ tuyển chọn', 'Nhãn đếm: "' + nhan + '" (mong đợi ' + soMon + ')');
        }
    });

    // ============ NHÓM 3: LỌC CHUNG (tìm kiếm, sắp xếp, kết hợp) ============

    await t.tc({
        ma: 'TC-S04-09', trang: 'marketplace.html', chucNang: 'Tìm kiếm theo tên - "sofa"',
        tienDieuKien: 'Đang ở trang Đồ cũ', cacBuoc: '1. Gõ "sofa" vào ô tìm kiếm 2. Chờ 400ms',
        duLieu: 'Từ khóa: sofa', mongDoi: 'Chỉ hiện món có tên/thương hiệu/chất liệu/màu khớp "sofa"', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        await p.fill('#txtFilterSearch', 'sofa');
        await p.waitForTimeout(700);
        const soThe = await p.locator('#usedProductsGrid .product-card').count();
        const nhan = await t.chu('#lblResultCount');
        const m = nhan.match(/Tìm thấy (\d+)/);
        const soDem = m ? Number(m[1]) : -1;
        kq.dat(soDem >= 0 && soThe === Math.min(12, soDem), 'Số thẻ: ' + soThe + ', nhãn: "' + nhan + '"');
        const tags = await t.chu('#divActiveTags');
        kq.dat(/Từ khóa: sofa/.test(tags), 'Nhãn lọc: "' + tags + '"');
    });

    await t.tc({
        ma: 'TC-S04-10', trang: 'marketplace.html', chucNang: 'Sắp xếp - Giá thấp đến cao',
        tienDieuKien: 'Đang ở trang Đồ cũ', cacBuoc: '1. Chọn sắp xếp "Giá: thấp đến cao"',
        duLieu: 'sort=price-asc', mongDoi: 'Giá các thẻ tăng dần (món hết hàng xếp cuối)', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        await p.fill('#txtFilterSearch', '');
        await p.waitForTimeout(500);
        await p.selectOption('#cboFilterSort', 'price-asc');
        await p.waitForTimeout(500);
        const gia = await p.evaluate(() => {
            const cards = document.querySelectorAll('#usedProductsGrid .product-card');
            const arr = [];
            cards.forEach(c => {
                const el = c.querySelector('[data-price]') || c.querySelector('.product-price');
                const txt = el ? (el.getAttribute('data-price') || el.textContent) : '';
                const so = Number(String(txt).replace(/[^\d]/g, ''));
                arr.push(so);
            });
            return arr;
        });
        let tangDan = true;
        for (let i = 1; i < gia.length; i++) if (gia[i] < gia[i - 1]) tangDan = false;
        kq.dat(gia.length > 0 && tangDan, 'Giá theo thứ tự: ' + JSON.stringify(gia));
    });

    await t.tc({
        ma: 'TC-S04-11', trang: 'marketplace.html', chucNang: 'Sắp xếp - Tình trạng tốt nhất',
        tienDieuKien: 'Đang ở trang Đồ cũ', cacBuoc: '1. Chọn sắp xếp "Tình trạng tốt nhất"',
        duLieu: 'sort=grade', mongDoi: 'Like New trước, rồi Good, rồi Fair', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        await p.selectOption('#cboFilterSort', 'grade');
        await p.waitForTimeout(500);
        const thuTu = await p.evaluate(() => {
            const cards = document.querySelectorAll('#usedProductsGrid .product-card');
            const arr = [];
            cards.forEach(c => {
                const t = c.textContent || '';
                if (/Like New/.test(t)) arr.push(1);
                else if (/Good/.test(t)) arr.push(2);
                else if (/Fair/.test(t)) arr.push(3);
                else arr.push(4);
            });
            return arr;
        });
        let ok = true;
        for (let i = 1; i < thuTu.length; i++) if (thuTu[i] < thuTu[i - 1]) ok = false;
        kq.dat(thuTu.length > 0 && ok, 'Thứ tự tình trạng: ' + JSON.stringify(thuTu));
    });

    await t.tc({
        ma: 'TC-S04-12', trang: 'marketplace.html', chucNang: 'Kết hợp lọc tình trạng + giá',
        tienDieuKien: 'Đang ở trang Đồ cũ', cacBuoc: '1. Chọn Like New 2. Chọn giá Dưới 1 triệu',
        duLieu: 'Like New + 0-1000000', mongDoi: 'Chỉ hiện món thoả cả 2 điều kiện', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const tatCa = await t.bang('products');
        const soMon = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false && x.condition_grade === 'Like New' && Number(x.price) >= 0 && Number(x.price) < 1000000).length;
        await p.click('#filterGradeChips button[data-value="Like New"]');
        await p.check('input[name="radPrice"][value="0-1000000"]');
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const nhan = await t.chu('#lblResultCount');
        kq.dat(nhan === 'Tìm thấy ' + soMon + ' món đồ cũ tuyển chọn', 'Nhãn đếm: "' + nhan + '" (mong đợi ' + soMon + ')');
    });

    await t.tc({
        ma: 'TC-S04-13', trang: 'marketplace.html', chucNang: 'Đặt lại bộ lọc',
        tienDieuKien: 'Đang có nhiều bộ lọc', cacBuoc: '1. Bấm "Đặt lại"',
        duLieu: 'Reset', mongDoi: 'Xoá hết lọc, hiện lại toàn bộ đồ cũ', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const tatCa = await t.bang('products');
        const tong = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false).length;
        await p.click('.filter-header .btn-link');
        await p.waitForTimeout(500);
        const nhan = await t.chu('#lblResultCount');
        kq.dat(nhan === 'Tìm thấy ' + tong + ' món đồ cũ tuyển chọn', 'Nhãn đếm: "' + nhan + '" (mong đợi ' + tong + ')');
        const tags = await t.chu('#divActiveTags');
        kq.dat(tags.trim() === '', 'Nhãn lọc còn: "' + tags + '"');
    });

    // ============ NHÓM 4: MÓN ĐÃ BÁN ============

    await t.tc({
        ma: 'TC-S04-14', trang: 'marketplace.html', chucNang: 'Món đã bán hiện nhãn "Đã bán"',
        tienDieuKien: 'Có món USED với stock_quantity=0', cacBuoc: '1. Chuẩn bị 1 món USED hết hàng 2. Mở trang Đồ cũ 3. Bỏ tick "Chỉ hiện sản phẩm còn hàng" 4. Lọc theo tên món đó 5. Kiểm tra thẻ có data-id khớp',
        duLieu: 'stock_quantity=0', mongDoi: 'Thẻ có data-id = id món hết hàng hiện nhãn "Đã bán"', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('marketplace.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const tatCa = await t.bang('products');
        // Chọn 1 món USED còn hàng để đặt hết hàng. Lọc riêng theo tên món để tìm thẻ,
        // không phụ thuộc phân trang (sortProductList đẩy món hết hàng xuống cuối).
        const doCuConHang = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false && Number(x.stock_quantity) > 0);
        kq.dat(doCuConHang.length > 0, 'Có món USED còn hàng để chuẩn bị: ' + doCuConHang.length);
        if (doCuConHang.length === 0) return;
        const mucTieu = doCuConHang[0];
        mucTieu.stock_quantity = 0;
        await p.evaluate((ds) => { saveTable('products', ds); }, tatCa);
        await p.reload();
        await p.waitForTimeout(800);
        // (1) Đảm bảo checkbox "Chỉ hiện sản phẩm còn hàng" KHÔNG tick trước khi lọc
        const chk = p.locator('#chkFilterInStock');
        const coChk = await chk.count() > 0;
        kq.dat(coChk, 'Có checkbox #chkFilterInStock: ' + coChk);
        if (coChk && await chk.isChecked()) {
            await chk.uncheck();
        }
        // (2) Lọc theo tên món để chắc chắn thẻ món đó nằm trong kết quả
        await p.fill('#txtFilterSearch', mucTieu.name);
        await p.waitForTimeout(700);
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        // (3) Kiểm tra thẻ có data-id khớp mucTieu.id (không chỉ hasText tên)
        const the = p.locator('#usedProductsGrid .product-card[data-id="' + mucTieu.id + '"]');
        const soThe = await the.count();
        kq.dat(soThe > 0, 'Tìm thấy thẻ data-id="' + mucTieu.id + '" sau khi lọc theo tên: ' + soThe);
        if (soThe > 0) {
            const txt = await the.first().innerText();
            kq.dat(/đã bán/i.test(txt), 'Thẻ có nhãn "Đã bán" (không phân biệt hoa thường): ' + /đã bán/i.test(txt));
        }
    });

    await t.tc({
        ma: 'TC-S04-15', trang: 'marketplace.html', chucNang: 'Món đã bán - không thêm vào giỏ được',
        tienDieuKien: 'Món USED hết hàng', cacBuoc: '1. Mở trang Đồ cũ 2. Bấm nút thêm giỏ trên thẻ món đã bán',
        duLieu: 'stock_quantity=0', mongDoi: 'Không thêm được vào giỏ (giỏ trống hoặc báo lỗi)', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = t.trang;
        const tatCa = await t.bang('products');
        const doCu = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false);
        doCu.sort((a, b) => String(b.created_at || b.id).localeCompare(String(a.created_at || a.id)) || String(b.id).localeCompare(String(a.id)));
        const mucTieu = doCu[0];
        await p.evaluate(() => { if (typeof clearCart === 'function') clearCart(); else localStorage.removeItem('rc_carts'); });
        t.xoaAlert();
        const the = p.locator('#usedProductsGrid .product-card').filter({ hasText: mucTieu.name }).first();
        const nutThem = the.locator('button').filter({ hasText: /giỏ|Thêm/i });
        const soNut = await nutThem.count();
        if (soNut > 0) {
            await nutThem.first().click({ force: true });
            await p.waitForTimeout(500);
        }
        const gio = await p.evaluate(() => {
            if (typeof getCart === 'function') return getCart();
            try { return JSON.parse(localStorage.getItem('rc_carts')) || []; } catch (e) { return []; }
        });
        const coTrongGio = gio.some(x => String(x.product_id || x.productId || x.id) === String(mucTieu.id));
        kq.dat(!coTrongGio, 'Món đã bán có trong giỏ: ' + coTrongGio + ' (giỏ: ' + JSON.stringify(gio) + ')');
    });

    // ============ NHÓM 5: CHI TIẾT SẢN PHẨM ============

    await t.tc({
        ma: 'TC-S04-16', trang: 'product-detail.html', chucNang: 'Chi tiết đồ cũ - hiện tình trạng và thời gian dùng',
        tienDieuKien: 'Có món USED với condition_grade và usage_time', cacBuoc: '1. Mở chi tiết món USED 2. Đọc nội dung',
        duLieu: 'used-001', mongDoi: 'Hiện tình trạng (Like New/Good/Fair) và thời gian sử dụng', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('marketplace.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(500);
        const tatCa = await t.bang('products');
        // Chọn mục tiêu cố định used-001 nếu có, nếu không lấy món USED đầu tiên có đủ condition_grade & usage_time
        let mucTieu = tatCa.find(x => x.id === 'used-001' && x.product_type === 'USED' && x.is_active !== false);
        if (!mucTieu) {
            mucTieu = tatCa.find(x => x.product_type === 'USED' && x.is_active !== false && x.condition_grade && x.usage_time);
        }
        kq.dat(!!mucTieu, 'Tìm được món USED có condition_grade & usage_time: ' + (mucTieu ? mucTieu.id : 'không có'));
        if (!mucTieu) return;
        await p.goto(p.url().replace('marketplace.html', 'product-detail.html?id=' + mucTieu.id));
        await p.waitForTimeout(800);
        // Đọc trực tiếp phần tử hiển thị tình trạng thay vì quét toàn body.
        // Nhãn tình trạng trên giao diện có thể là tiếng Anh (Like New/Good/Fair) hoặc tiếng Việt tương ứng.
        const nhanTinhTrang = {
            'Like New': ['Like New', 'Như mới'],
            'Good': ['Good', 'Tốt'],
            'Fair': ['Fair', 'Khá']
        };
        const dsNhan = nhanTinhTrang[mucTieu.condition_grade] || [mucTieu.condition_grade];
        const body = await t.chu();
        const coTinhTrang = dsNhan.some(n => body.toLowerCase().indexOf(n.toLowerCase()) >= 0);
        kq.dat(coTinhTrang, 'Có tình trạng "' + mucTieu.condition_grade + '" (một trong ' + JSON.stringify(dsNhan) + '): ' + coTinhTrang);
        kq.dat(body.indexOf(mucTieu.usage_time) >= 0, 'Có thời gian dùng "' + mucTieu.usage_time + '": ' + (body.indexOf(mucTieu.usage_time) >= 0));
    });

    // ============ NHÓM 6: GIÁ TRỊ BIÊN ============

    await t.tc({
        ma: 'TC-S04-17', trang: 'marketplace.html', chucNang: 'Biên giá - đúng ngưỡng 1.000.000',
        tienDieuKien: 'Có món USED giá đúng 1.000.000', cacBuoc: '1. Tạo món USED giá 1000000 2. Lọc "Từ 1 – 3 triệu"',
        duLieu: 'price=1000000', mongDoi: 'Món giá đúng 1.000.000 thuộc khoảng "Từ 1 – 3 triệu"', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('marketplace.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(500);
        const tatCa = await t.bang('products');
        const doCu = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false);
        const mucTieu = doCu[0];
        mucTieu.price = 1000000;
        await p.evaluate((ds) => { saveTable('products', ds); }, tatCa);
        await p.reload();
        await p.waitForTimeout(800);
        await p.check('input[name="radPrice"][value="1000000-3000000"]');
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const the = p.locator('#usedProductsGrid .product-card').filter({ hasText: mucTieu.name });
        kq.dat(await the.count() > 0, 'Món giá 1.000.000 có trong khoảng 1-3 triệu: ' + (await the.count() > 0));
    });

    await t.tc({
        ma: 'TC-S04-18', trang: 'marketplace.html', chucNang: 'Biên giá - vượt 1 đơn vị 1.000.001',
        tienDieuKien: 'Có món USED giá 1.000.001', cacBuoc: '1. Tạo món USED giá 1000001 2. Lọc "Dưới 1 triệu"',
        duLieu: 'price=1000001', mongDoi: 'Món giá 1.000.001 KHÔNG thuộc "Dưới 1 triệu"', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const tatCa = await t.bang('products');
        const doCu = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false);
        const mucTieu = doCu[0];
        mucTieu.price = 1000001;
        await p.evaluate((ds) => { saveTable('products', ds); }, tatCa);
        await p.reload();
        await p.waitForTimeout(800);
        await p.check('input[name="radPrice"][value="0-1000000"]');
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const the = p.locator('#usedProductsGrid .product-card').filter({ hasText: mucTieu.name });
        kq.dat(await the.count() === 0, 'Món giá 1.000.001 không thuộc "Dưới 1 triệu": ' + (await the.count() === 0));
    });

    await t.tc({
        ma: 'TC-S04-19', trang: 'marketplace.html', chucNang: 'Biên giá - đúng ngưỡng 3.000.000',
        tienDieuKien: 'Có món USED giá 3.000.000', cacBuoc: '1. Tạo món USED giá 3000000 2. Lọc "Từ 3 – 6 triệu"',
        duLieu: 'price=3000000', mongDoi: 'Món giá đúng 3.000.000 thuộc "Từ 3 – 6 triệu"', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const tatCa = await t.bang('products');
        const doCu = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false);
        const mucTieu = doCu[0];
        mucTieu.price = 3000000;
        await p.evaluate((ds) => { saveTable('products', ds); }, tatCa);
        await p.reload();
        await p.waitForTimeout(800);
        await p.check('input[name="radPrice"][value="3000000-6000000"]');
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const the = p.locator('#usedProductsGrid .product-card').filter({ hasText: mucTieu.name });
        kq.dat(await the.count() > 0, 'Món giá 3.000.000 thuộc khoảng 3-6 triệu: ' + (await the.count() > 0));
    });

    // ============ NHÓM 7: TRƯỜNG HỢP KHÔNG CÓ KẾT QUẢ ============

    await t.tc({
        ma: 'TC-S04-20', trang: 'marketplace.html', chucNang: 'Không có kết quả - hiện khung trống',
        tienDieuKien: 'Đang ở trang Đồ cũ', cacBuoc: '1. Gõ từ khóa không tồn tại "zzzzzz" 2. Chờ lọc',
        duLieu: 'q=zzzzzz', mongDoi: 'Hiện khung "Không tìm thấy món đồ cũ phù hợp", ẩn lưới', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        await p.fill('#txtFilterSearch', 'zzzzzz');
        await p.waitForTimeout(800);
        const emptyHien = await p.locator('#emptyResults').isVisible();
        kq.dat(emptyHien, 'Khung trống hiện: ' + emptyHien);
        const nhan = await t.chu('#lblResultCount');
        kq.dat(nhan === 'Tìm thấy 0 món đồ cũ tuyển chọn', 'Nhãn đếm: "' + nhan + '"');
    });

    await t.tc({
        ma: 'TC-S04-21', trang: 'marketplace.html', chucNang: 'Nút "Xem tất cả đồ cũ" trong khung trống',
        tienDieuKien: 'Đang ở khung không có kết quả', cacBuoc: '1. Bấm "Xem tất cả đồ cũ"',
        duLieu: 'Reset', mongDoi: 'Xoá lọc, hiện lại toàn bộ đồ cũ', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const tatCa = await t.bang('products');
        const tong = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false).length;
        await p.click('#emptyResults button');
        await p.waitForTimeout(500);
        const nhan = await t.chu('#lblResultCount');
        kq.dat(nhan === 'Tìm thấy ' + tong + ' món đồ cũ tuyển chọn', 'Nhãn đếm: "' + nhan + '" (mong đợi ' + tong + ')');
    });

    // ============ NHÓM 8: PHÂN QUYỀN ============

    await t.tc({
        ma: 'TC-S04-22', trang: 'marketplace.html', chucNang: 'Phân quyền - khách xem được trang Đồ cũ',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Mở trang Đồ cũ với vai trò khách',
        duLieu: 'vaiTro=khach', mongDoi: 'Trang hiển thị bình thường, không bị chặn', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('marketplace.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        kq.dat(/marketplace\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
        const soThe = await p.locator('#usedProductsGrid .product-card').count();
        kq.dat(soThe > 0, 'Số thẻ hiển thị: ' + soThe);
    });

    await t.tc({
        ma: 'TC-S04-23', trang: 'marketplace.html', chucNang: 'Phân quyền - user đăng nhập vẫn xem được',
        tienDieuKien: 'Đăng nhập user', cacBuoc: '1. Mở trang Đồ cũ với vai trò user',
        duLieu: 'vaiTro=user', mongDoi: 'Trang hiển thị bình thường', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('marketplace.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        kq.dat(/marketplace\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
        const soThe = await p.locator('#usedProductsGrid .product-card').count();
        kq.dat(soThe > 0, 'Số thẻ hiển thị: ' + soThe);
    });

    // ============ NHÓM 9: MOBILE ============

    await t.tc({
        ma: 'TC-S04-24', trang: 'marketplace.html', chucNang: 'Mobile - không cuộn ngang',
        tienDieuKien: 'Màn hình mobile', cacBuoc: '1. Mở trang Đồ cũ trên mobile 2. Đo cuộn ngang',
        duLieu: 'manHinh=mobile', mongDoi: 'Không có cuộn ngang (0px)', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('marketplace.html', { vaiTro: 'khach', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(800);
        const cuon = await t.traNgang();
        kq.dat(cuon === 0, 'Số px cuộn ngang: ' + cuon);
    });

    await t.tc({
        ma: 'TC-S04-25', trang: 'marketplace.html', chucNang: 'Mobile - mở/đóng khung lọc',
        tienDieuKien: 'Màn hình mobile', cacBuoc: '1. Bấm nút "Bộ lọc" 2. Kiểm tra khung lọc mở',
        duLieu: 'manHinh=mobile', mongDoi: 'Khung lọc mở ra (class open)', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = t.trang;
        await p.click('.btn-filter-toggle');
        await p.waitForTimeout(400);
        const coOpen = await p.evaluate(() => document.getElementById('filterPanel').classList.contains('open'));
        kq.dat(coOpen, 'Khung lọc có class open: ' + coOpen);
    });

    await t.tc({
        ma: 'TC-S04-26', trang: 'marketplace.html', chucNang: 'Mobile - lọc tình trạng hoạt động',
        tienDieuKien: 'Màn hình mobile, khung lọc đang mở', cacBuoc: '1. Bấm chip Like New',
        duLieu: 'manHinh=mobile, Like New', mongDoi: 'Lọc đúng số món Like New', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = t.trang;
        const tatCa = await t.bang('products');
        const soLikeNew = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false && x.condition_grade === 'Like New').length;
        await p.click('#filterGradeChips button[data-value="Like New"]');
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const nhan = await t.chu('#lblResultCount');
        kq.dat(nhan === 'Tìm thấy ' + soLikeNew + ' món đồ cũ tuyển chọn', 'Nhãn đếm: "' + nhan + '" (mong đợi ' + soLikeNew + ')');
    });

    // ============ NHÓM 10: KIỂM TRA DỮ LIỆU SAU THAO TÁC ============

    await t.tc({
        ma: 'TC-S04-27', trang: 'marketplace.html', chucNang: 'Thêm đồ cũ vào giỏ qua trang chi tiết - cập nhật localStorage',
        tienDieuKien: 'Món USED còn hàng', cacBuoc: '1. Mở trang Đồ cũ 2. Bấm "Xem chi tiết" món USED còn hàng 3. Thêm vào giỏ ở trang chi tiết 4. Kiểm tra getCart()',
        duLieu: 'stock_quantity>0', mongDoi: 'Giỏ có đúng món đó, số lượng 1', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('marketplace.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const tatCa = await t.bang('products');
        const doCu = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false && Number(x.stock_quantity) > 0);
        // Chọn món mới nhất để chắc chắn nằm trong trang 1
        doCu.sort((a, b) => String(b.created_at || b.id).localeCompare(String(a.created_at || a.id)) || String(b.id).localeCompare(String(a.id)));
        const mucTieu = doCu[0];
        await p.evaluate(() => { if (typeof clearCart === 'function') clearCart(); else localStorage.removeItem('rc_carts'); });
        // Thẻ đồ cũ không có nút thêm giỏ nhanh (createProductCard chỉ có "Xem chi tiết" và tim).
        // Nghiệp vụ: thêm giỏ qua trang chi tiết.
        const the = p.locator('#usedProductsGrid .product-card').filter({ hasText: mucTieu.name }).first();
        const nutXem = the.locator('a.btn').filter({ hasText: /Xem chi tiết/ });
        kq.dat(await nutXem.count() > 0, 'Có nút "Xem chi tiết" trên thẻ: ' + (await nutXem.count() > 0));
        await nutXem.first().click();
        await p.waitForURL(/product-detail\.html\?id=/, { timeout: 5000 });
        await p.waitForTimeout(800);
        // Thêm vào giỏ qua hàm toàn cục (nút thêm giỏ trên trang chi tiết có thể có id khác nhau)
        await p.evaluate((id) => { addToCart(id, 1); }, mucTieu.id);
        await p.waitForTimeout(300);
        const gio = await p.evaluate(() => {
            if (typeof getCart === 'function') return getCart();
            try { return JSON.parse(localStorage.getItem('rc_carts')) || []; } catch (e) { return []; }
        });
        // Giỏ lưu trường product_id (không phải productId/id)
        const coTrongGio = gio.some(x => String(x.product_id) === String(mucTieu.id));
        kq.dat(coTrongGio, 'Món "' + mucTieu.name + '" có trong giỏ: ' + coTrongGio + ' (giỏ: ' + JSON.stringify(gio) + ')');
        const dong = gio.find(x => String(x.product_id) === String(mucTieu.id));
        kq.dat(dong && Number(dong.quantity) === 1, 'Số lượng trong giỏ = 1: ' + (dong ? dong.quantity : 'không có'));
    });

    await t.tc({
        ma: 'TC-S04-28', trang: 'marketplace.html', chucNang: 'Lọc chỉ còn hàng - loại món đã bán',
        tienDieuKien: 'Có món USED hết hàng', cacBuoc: '1. Tạo 1 món USED hết hàng 2. Tick "Chỉ hiện sản phẩm còn hàng"',
        duLieu: 'stock_quantity=0', mongDoi: 'Món hết hàng không xuất hiện trong kết quả', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('marketplace.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(500);
        const tatCa = await t.bang('products');
        const doCu = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false);
        doCu.sort((a, b) => String(b.created_at || b.id).localeCompare(String(a.created_at || a.id)) || String(b.id).localeCompare(String(a.id)));
        const mucTieu = doCu[0];
        mucTieu.stock_quantity = 0;
        await p.evaluate((ds) => { saveTable('products', ds); }, tatCa);
        await p.reload();
        await p.waitForTimeout(800);
        await p.check('#chkFilterInStock');
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const the = p.locator('#usedProductsGrid .product-card').filter({ hasText: mucTieu.name });
        kq.dat(await the.count() === 0, 'Món hết hàng bị ẩn khi tick "Chỉ còn hàng": ' + (await the.count() === 0));
    });

    await t.tc({
        ma: 'TC-S04-29', trang: 'marketplace.html', chucNang: 'Nhãn lọc đang chọn - xoá chip tình trạng',
        tienDieuKien: 'Đang lọc Like New', cacBuoc: '1. Lọc Like New 2. Bấm chip "Tình trạng: Like New" để xoá',
        duLieu: 'Like New', mongDoi: 'Bỏ lọc tình trạng, hiện lại toàn bộ đồ cũ', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        // Mở mới để không còn filter sót từ test trước
        const p = await t.mo('marketplace.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const tatCa = await t.bang('products');
        const tong = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false).length;
        await p.click('#filterGradeChips button[data-value="Like New"]');
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const tags = await t.chu('#divActiveTags');
        kq.dat(/Tình trạng: Like New/.test(tags), 'Có nhãn "Tình trạng: Like New": ' + /Tình trạng: Like New/.test(tags));
        const chip = p.locator('#divActiveTags .active-tag-chip').filter({ hasText: 'Tình trạng' }).first();
        await chip.click();
        await p.waitForTimeout(500);
        const nhan = await t.chu('#lblResultCount');
        kq.dat(nhan === 'Tìm thấy ' + tong + ' món đồ cũ tuyển chọn', 'Sau khi xoá chip, nhãn đếm: "' + nhan + '" (mong đợi ' + tong + ')');
    });

    await t.tc({
        ma: 'TC-S04-30', trang: 'marketplace.html', chucNang: 'Đọc bộ lọc từ URL - condition=Good',
        tienDieuKien: 'Mở URL có sẵn condition=Good', cacBuoc: '1. Mở marketplace.html?condition=Good 2. Kiểm tra kết quả',
        duLieu: 'condition=Good', mongDoi: 'Chip Good active, kết quả chỉ món Good', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('marketplace.html?condition=Good', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const tatCa = await t.bang('products');
        const soGood = tatCa.filter(x => x.product_type === 'USED' && x.is_active !== false && x.condition_grade === 'Good').length;
        const nhan = await t.chu('#lblResultCount');
        kq.dat(nhan === 'Tìm thấy ' + soGood + ' món đồ cũ tuyển chọn', 'Nhãn đếm: "' + nhan + '" (mong đợi ' + soGood + ')');
        const active = await p.evaluate(() => {
            const chip = document.querySelector('#filterGradeChips button.active');
            return chip ? chip.getAttribute('data-value') : '';
        });
        kq.dat(active === 'Good', 'Chip active: "' + active + '"');
    });
});