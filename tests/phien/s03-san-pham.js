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

phien({ ma: 's03', ten: 'Sản phẩm, Chi tiết sản phẩm, Yêu thích' }, async (t) => {
    // Màn hẹp: bộ lọc thu gọn sau nút "Bộ lọc" → bấm mở như người dùng thật trước khi thao tác
    const moGoc = t.mo.bind(t);
    t.mo = async (...a) => ganMoBoLoc(await moGoc(...a));

    // Hàm phụ: đếm sản phẩm mới (không USED, is_active) theo điều kiện
    async function demMoi(p, dieuKien) {
        return await p.evaluate((dk) => {
            var ds = getNewProducts();
            var kq = 0;
            for (var i = 0; i < ds.length; i++) {
                var s = ds[i];
                if (dk.price) {
                    var phan = dk.price.split('-');
                    if (!(Number(s.price) >= Number(phan[0]) && Number(s.price) < Number(phan[1]))) continue;
                }
                if (dk.category) {
                    var ids = getCategoryWithChildren(dk.category);
                    if (ids.indexOf(String(s.category_id)) < 0) continue;
                }
                if (dk.material && getCatalogMaterialGroup(s) != dk.material) continue;
                if (dk.color && getCatalogColorGroup(s) != dk.color) continue;
                if (dk.brand && s.brand != dk.brand) continue;
                if (dk.inStock && !(Number(s.stock_quantity) > 0)) continue;
                kq++;
            }
            return kq;
        }, dieuKien);
    }

    // TC-S03-01: Lọc theo mức giá "Dưới 1 triệu"
    await t.tc({
        ma: 'TC-S03-01', trang: 'products.html', chucNang: 'Bộ lọc - Mức giá Dưới 1 triệu',
        tienDieuKien: 'Mở trang Sản phẩm, chưa lọc gì', cacBuoc: '1. Mở products.html 2. Chọn radio "Dưới 1 triệu"',
        duLieu: 'price=0-1000000', mongDoi: 'Số sản phẩm hiển thị bằng số sản phẩm mới có giá < 1.000.000', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const mong = await demMoi(p, { price: '0-1000000' });
        await p.check("input[name='radPrice'][value='0-1000000']");
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const chu = await t.chu('#productCount');
        kq.dat(chu == 'Tìm thấy ' + mong + ' sản phẩm', 'Hiển thị: "' + chu + '", mong đợi ' + mong);
        const soThe = await p.locator('#productGrid .product-card').count();
        kq.dat(soThe == Math.min(mong, 12), 'Số thẻ hiển thị: ' + soThe);
    });

    // TC-S03-02: Lọc theo mức giá "Trên 15 triệu"
    await t.tc({
        ma: 'TC-S03-02', trang: 'products.html', chucNang: 'Bộ lọc - Mức giá Trên 15 triệu',
        tienDieuKien: 'Mở trang Sản phẩm', cacBuoc: '1. Mở products.html 2. Chọn radio "Trên 15 triệu"',
        duLieu: 'price=15000000-999999999', mongDoi: 'Số sản phẩm khớp số sản phẩm mới có giá >= 15.000.000', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const mong = await demMoi(p, { price: '15000000-999999999' });
        await p.check("input[name='radPrice'][value='15000000-999999999']");
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const chu = await t.chu('#productCount');
        kq.dat(chu == 'Tìm thấy ' + mong + ' sản phẩm', 'Hiển thị: "' + chu + '", mong đợi ' + mong);
    });

    // TC-S03-03: Lọc theo danh mục cha (bao gồm danh mục con)
    await t.tc({
        ma: 'TC-S03-03', trang: 'products.html', chucNang: 'Bộ lọc - Danh mục cha gồm cả danh mục con',
        tienDieuKien: 'Mở trang Sản phẩm', cacBuoc: '1. Mở products.html 2. Chọn danh mục cha đầu tiên',
        duLieu: 'category=<id danh mục cha>', mongDoi: 'Số sản phẩm bằng tổng sản phẩm thuộc danh mục cha + các danh mục con', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const catId = await p.evaluate(() => {
            var cats = getTable('categories');
            for (var i = 0; i < cats.length; i++) if (!cats[i].parent_id) return String(cats[i].id);
            return '';
        });
        const mong = await demMoi(p, { category: catId });
        await p.selectOption('#cboFilterCategory', catId);
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const chu = await t.chu('#productCount');
        kq.dat(chu == 'Tìm thấy ' + mong + ' sản phẩm', 'Hiển thị: "' + chu + '", mong đợi ' + mong + ' (danh mục ' + catId + ')');
    });

    // TC-S03-04: Lọc theo danh mục con
    await t.tc({
        ma: 'TC-S03-04', trang: 'products.html', chucNang: 'Bộ lọc - Danh mục con',
        tienDieuKien: 'Mở trang Sản phẩm', cacBuoc: '1. Mở products.html 2. Chọn một danh mục con',
        duLieu: 'category=<id danh mục con>', mongDoi: 'Số sản phẩm bằng số sản phẩm mới thuộc đúng danh mục con đó', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const catId = await p.evaluate(() => {
            var cats = getTable('categories');
            for (var i = 0; i < cats.length; i++) if (cats[i].parent_id) return String(cats[i].id);
            return '';
        });
        const mong = await demMoi(p, { category: catId });
        await p.selectOption('#cboFilterCategory', catId);
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const chu = await t.chu('#productCount');
        kq.dat(chu == 'Tìm thấy ' + mong + ' sản phẩm', 'Hiển thị: "' + chu + '", mong đợi ' + mong);
    });

    // TC-S03-05: Lọc theo chất liệu
    await t.tc({
        ma: 'TC-S03-05', trang: 'products.html', chucNang: 'Bộ lọc - Chất liệu',
        tienDieuKien: 'Mở trang Sản phẩm', cacBuoc: '1. Mở products.html 2. Tick chất liệu "Gỗ"',
        duLieu: 'material=Gỗ', mongDoi: 'Số sản phẩm bằng số sản phẩm mới có nhóm chất liệu Gỗ', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const mong = await demMoi(p, { material: 'Gỗ' });
        await p.check("#divFilterMaterial input[value='Gỗ']");
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const chu = await t.chu('#productCount');
        kq.dat(chu == 'Tìm thấy ' + mong + ' sản phẩm', 'Hiển thị: "' + chu + '", mong đợi ' + mong);
    });

    // TC-S03-06: Lọc theo màu sắc
    await t.tc({
        ma: 'TC-S03-06', trang: 'products.html', chucNang: 'Bộ lọc - Màu sắc',
        tienDieuKien: 'Mở trang Sản phẩm', cacBuoc: '1. Mở products.html 2. Tick màu "Đen"',
        duLieu: 'color=Đen', mongDoi: 'Số sản phẩm bằng số sản phẩm mới có nhóm màu Đen', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const mong = await demMoi(p, { color: 'Đen' });
        await p.check("#divFilterColor input[value='Đen']");
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const chu = await t.chu('#productCount');
        kq.dat(chu == 'Tìm thấy ' + mong + ' sản phẩm', 'Hiển thị: "' + chu + '", mong đợi ' + mong);
    });

    // TC-S03-07: Lọc theo thương hiệu
    await t.tc({
        ma: 'TC-S03-07', trang: 'products.html', chucNang: 'Bộ lọc - Thương hiệu',
        tienDieuKien: 'Mở trang Sản phẩm', cacBuoc: '1. Mở products.html 2. Chọn thương hiệu đầu tiên trong dropdown',
        duLieu: 'brand=<thương hiệu>', mongDoi: 'Số sản phẩm bằng số sản phẩm mới của đúng thương hiệu đó', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const brand = await p.evaluate(() => {
            var sel = document.getElementById('cboFilterBrand');
            for (var i = 0; i < sel.options.length; i++) if (sel.options[i].value) return sel.options[i].value;
            return '';
        });
        const mong = await demMoi(p, { brand: brand });
        await p.selectOption('#cboFilterBrand', brand);
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const chu = await t.chu('#productCount');
        kq.dat(chu == 'Tìm thấy ' + mong + ' sản phẩm', 'Hiển thị: "' + chu + '", mong đợi ' + mong + ' (brand ' + brand + ')');
    });

    // TC-S03-08: Chỉ còn hàng
    await t.tc({
        ma: 'TC-S03-08', trang: 'products.html', chucNang: 'Bộ lọc - Chỉ hiện sản phẩm còn hàng',
        tienDieuKien: 'Mở trang Sản phẩm', cacBuoc: '1. Mở products.html 2. Tick "Chỉ hiện sản phẩm còn hàng"',
        duLieu: 'stock=1', mongDoi: 'Số sản phẩm bằng số sản phẩm mới có stock_quantity > 0', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const mong = await demMoi(p, { inStock: true });
        await p.check('#chkFilterInStock');
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const chu = await t.chu('#productCount');
        kq.dat(chu == 'Tìm thấy ' + mong + ' sản phẩm', 'Hiển thị: "' + chu + '", mong đợi ' + mong);
    });

    // TC-S03-09: Kết hợp nhiều bộ lọc
    await t.tc({
        ma: 'TC-S03-09', trang: 'products.html', chucNang: 'Bộ lọc - Kết hợp danh mục + chất liệu + còn hàng',
        tienDieuKien: 'Mở trang Sản phẩm', cacBuoc: '1. Chọn danh mục cha 2. Tick chất liệu Gỗ 3. Tick còn hàng',
        duLieu: 'category + material=Gỗ + stock=1', mongDoi: 'Số sản phẩm khớp giao của cả 3 điều kiện', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const catId = await p.evaluate(() => {
            var cats = getTable('categories');
            for (var i = 0; i < cats.length; i++) if (!cats[i].parent_id) return String(cats[i].id);
            return '';
        });
        const mong = await demMoi(p, { category: catId, material: 'Gỗ', inStock: true });
        await p.selectOption('#cboFilterCategory', catId);
        await p.check("#divFilterMaterial input[value='Gỗ']");
        await p.check('#chkFilterInStock');
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        const chu = await t.chu('#productCount');
        kq.dat(chu == 'Tìm thấy ' + mong + ' sản phẩm', 'Hiển thị: "' + chu + '", mong đợi ' + mong);
    });

    // TC-S03-10: Tìm không dấu "ghe" ra ghế
    await t.tc({
        ma: 'TC-S03-10', trang: 'products.html', chucNang: 'Tìm kiếm - Không dấu "ghe"',
        tienDieuKien: 'Mở trang Sản phẩm', cacBuoc: '1. Gõ "ghe" vào ô tìm kiếm 2. Chờ 500ms',
        duLieu: 'q=ghe', mongDoi: 'Kết quả > 0 và mọi sản phẩm hiển thị đều có tên/thương hiệu/chất liệu/màu chứa "ghế" (không dấu)', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        await p.fill('#txtFilterSearch', 'ghe');
        await p.waitForTimeout(700);
        const chu = await t.chu('#productCount');
        const m = chu.match(/Tìm thấy (\d+) sản phẩm/);
        const soKQ = m ? Number(m[1]) : -1;
        kq.dat(soKQ > 0, 'Số kết quả: ' + soKQ);
        const tenDau = await p.evaluate(() => {
            var cards = document.querySelectorAll('#productGrid .product-card');
            var arr = [];
            for (var i = 0; i < cards.length; i++) {
                var el = cards[i].querySelector('.product-card-title, h3, .product-name');
                arr.push(el ? el.textContent : '');
            }
            return arr;
        });
        const boDau = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
        const tatCaKhop = tenDau.every(n => boDau(n).indexOf('ghe') >= 0);
        kq.dat(tatCaKhop, 'Tên các thẻ đầu: ' + JSON.stringify(tenDau.slice(0, 3)));
    });

    // TC-S03-11: Sắp xếp giá tăng dần
    await t.tc({
        ma: 'TC-S03-11', trang: 'products.html', chucNang: 'Sắp xếp - Giá thấp đến cao',
        tienDieuKien: 'Mở trang Sản phẩm', cacBuoc: '1. Chọn sắp xếp "Giá: thấp đến cao"',
        duLieu: 'sort=price-asc', mongDoi: 'Giá các sản phẩm còn hàng trên trang tăng dần (món hết hàng xếp cuối)', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        await p.selectOption('#cboFilterSort', 'price-asc');
        await p.waitForTimeout(500);
        const gia = await p.evaluate(() => {
            var cards = document.querySelectorAll('#productGrid .product-card');
            var arr = [];
            for (var i = 0; i < cards.length; i++) {
                var el = cards[i].querySelector('.product-card-price, .price, .product-price');
                if (el) arr.push(el.textContent);
            }
            return arr;
        });
        const soGia = gia.map(s => Number(String(s).replace(/[^0-9]/g, '')));
        let tangDan = true;
        for (let i = 1; i < soGia.length; i++) if (soGia[i] < soGia[i - 1]) tangDan = false;
        kq.dat(soGia.length > 0 && tangDan, 'Giá: ' + JSON.stringify(soGia.slice(0, 5)));
    });

    // TC-S03-12: Sắp xếp giá giảm dần
    await t.tc({
        ma: 'TC-S03-12', trang: 'products.html', chucNang: 'Sắp xếp - Giá cao đến thấp',
        tienDieuKien: 'Mở trang Sản phẩm', cacBuoc: '1. Chọn sắp xếp "Giá: cao đến thấp"',
        duLieu: 'sort=price-desc', mongDoi: 'Giá các sản phẩm còn hàng trên trang giảm dần', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        await p.selectOption('#cboFilterSort', 'price-desc');
        await p.waitForTimeout(500);
        const gia = await p.evaluate(() => {
            var cards = document.querySelectorAll('#productGrid .product-card');
            var arr = [];
            for (var i = 0; i < cards.length; i++) {
                var el = cards[i].querySelector('.product-card-price, .price, .product-price');
                if (el) arr.push(el.textContent);
            }
            return arr;
        });
        const soGia = gia.map(s => Number(String(s).replace(/[^0-9]/g, '')));
        let giamDan = true;
        for (let i = 1; i < soGia.length; i++) if (soGia[i] > soGia[i - 1]) giamDan = false;
        kq.dat(soGia.length > 0 && giamDan, 'Giá: ' + JSON.stringify(soGia.slice(0, 5)));
    });

    // TC-S03-13: Phân trang
    await t.tc({
        ma: 'TC-S03-13', trang: 'products.html', chucNang: 'Phân trang - Chuyển trang 2',
        tienDieuKien: 'Mở trang Sản phẩm, tổng > 12 sản phẩm', cacBuoc: '1. Mở products.html 2. Bấm nút "Tiếp" ở phân trang',
        duLieu: 'page=2', mongDoi: 'URL có page=2, thẻ đầu trang 2 khác thẻ đầu trang 1', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const theDau1 = await p.evaluate(() => {
            var c = document.querySelector('#productGrid .product-card');
            return c ? c.textContent.slice(0, 60) : '';
        });
        const coNut = await p.locator("#catalogPagination button:has-text('Tiếp')").count();
        kq.dat(coNut > 0, 'Có nút Tiếp: ' + coNut);
        if (coNut > 0) {
            await p.click("#catalogPagination button:has-text('Tiếp')");
            await p.waitForTimeout(500);
            kq.dat(/page=2/.test(p.url()), 'URL: ' + p.url());
            const theDau2 = await p.evaluate(() => {
                var c = document.querySelector('#productGrid .product-card');
                return c ? c.textContent.slice(0, 60) : '';
            });
            kq.dat(theDau1 != theDau2, 'Thẻ đầu trang 1: "' + theDau1 + '" / trang 2: "' + theDau2 + '"');
        }
    });

    // TC-S03-14: Tải lại trang giữ bộ lọc qua URL
    await t.tc({
        ma: 'TC-S03-14', trang: 'products.html', chucNang: 'Bộ lọc - Tải lại trang giữ bộ lọc',
        tienDieuKien: 'Đã lọc theo chất liệu Gỗ', cacBuoc: '1. Lọc Gỗ 2. Reload trang',
        duLieu: 'material=Gỗ', mongDoi: 'Sau reload, checkbox Gỗ vẫn tick và số kết quả giữ nguyên', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const mong = await demMoi(p, { material: 'Gỗ' });
        await p.check("#divFilterMaterial input[value='Gỗ']");
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        kq.dat(/material=/.test(p.url()), 'URL sau lọc: ' + p.url());
        await p.reload();
        await p.waitForTimeout(800);
        const daTick = await p.isChecked("#divFilterMaterial input[value='Gỗ']");
        kq.dat(daTick, 'Checkbox Gỗ sau reload: ' + daTick);
        const chu = await t.chu('#productCount');
        kq.dat(chu == 'Tìm thấy ' + mong + ' sản phẩm', 'Hiển thị: "' + chu + '", mong đợi ' + mong);
    });

    // TC-S03-15: Không có kết quả → gợi ý
    await t.tc({
        ma: 'TC-S03-15', trang: 'products.html', chucNang: 'Bộ lọc - Không kết quả hiện gợi ý',
        tienDieuKien: 'Mở trang Sản phẩm', cacBuoc: '1. Gõ từ khóa không tồn tại "zzzzqqq" 2. Chờ',
        duLieu: 'q=zzzzqqq', mongDoi: 'Hiện khối #emptySuggestions, có nút "Xem tất cả sản phẩm"', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        await p.fill('#txtFilterSearch', 'zzzzqqq');
        await p.waitForTimeout(700);
        const hien = await p.evaluate(() => !document.getElementById('emptySuggestions').classList.contains('hidden'));
        kq.dat(hien, 'Khối gợi ý hiện: ' + hien);
        const soNut = await p.locator('#emptySuggestions button.btn-link', { hasText: 'Xem tất cả sản phẩm' }).count();
        kq.dat(soNut > 0, 'Số nút "Xem tất cả sản phẩm": ' + soNut);
        const chuNut = await t.chu('#emptySuggestions button.btn-link');
        kq.dat((chuNut || '').toLowerCase().indexOf('xem tất cả sản phẩm') >= 0, 'Nội dung nút: "' + chuNut + '"');
    });

    // TC-S03-16: Chi tiết - hết hàng khóa nút
    await t.tc({
        ma: 'TC-S03-16', trang: 'product-detail.html', chucNang: 'Chi tiết - Sản phẩm hết hàng khóa nút mua',
        tienDieuKien: 'Có sản phẩm stock_quantity = 0', cacBuoc: '1. Sửa 1 sản phẩm về tồn kho 0 2. Mở chi tiết sản phẩm đó',
        duLieu: 'stock_quantity=0', mongDoi: 'Nút #btnAddToCart bị disabled, nhãn "Hết hàng", ô số lượng bị khóa', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const pid = await p.evaluate(() => {
            var ds = getTable('products');
            var sp = null;
            for (var i = 0; i < ds.length; i++) {
                if (ds[i].is_active != false && ds[i].product_type != 'USED') { sp = ds[i]; break; }
            }
            if (!sp) return null;
            sp.stock_quantity = 0;
            saveTable('products', ds);
            return sp.id;
        });
        kq.dat(pid != null, 'Chọn được sản phẩm mới để đặt tồn kho 0: ' + pid);
        if (pid != null) {
            await p.reload();
            await p.waitForTimeout(500);
            await p.goto(p.url().replace(/products\.html.*/, 'product-detail.html?id=' + pid));
            await p.waitForTimeout(1000);
            const disabled = await p.isDisabled('#btnAddToCart');
            kq.dat(disabled, 'Nút thêm vào giỏ disabled: ' + disabled);
            const chuNut = await t.chu('#btnAddToCart');
            kq.dat((chuNut || '').toLowerCase().includes('hết hàng'), 'Nhãn nút: "' + chuNut + '"');
            const qtyDisabled = await p.isDisabled('#txtQuantity');
            kq.dat(qtyDisabled, 'Ô số lượng disabled: ' + qtyDisabled);
        }
    });

    // TC-S03-17: Chi tiết - số lượng không vượt tồn kho
    await t.tc({
        ma: 'TC-S03-17', trang: 'product-detail.html', chucNang: 'Chi tiết - Số lượng không vượt tồn kho',
        tienDieuKien: 'Sản phẩm còn hàng', cacBuoc: '1. Mở chi tiết sản phẩm còn hàng 2. Nhập số lượng lớn hơn tồn kho 3. Bấm Thêm vào giỏ',
        duLieu: 'qty = stock + 1', mongDoi: 'Có alert báo lỗi vượt tồn kho, giỏ hàng không tăng', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const info = await p.evaluate(() => {
            var ds = getNewProducts();
            for (var i = 0; i < ds.length; i++) if (Number(ds[i].stock_quantity) > 1) return { id: ds[i].id, stock: Number(ds[i].stock_quantity) };
            return null;
        });
        await p.goto(p.url().replace(/products\.html.*/, 'product-detail.html?id=' + info.id));
        await p.waitForTimeout(1000);
        t.xoaAlert();
        await p.fill('#txtQuantity', String(info.stock + 1));
        await p.click('#btnAddToCart');
        await p.waitForTimeout(500);
        const al = t.alertCuoi();
        kq.dat(al && al.length > 0, 'Alert: "' + al + '"');
        const gio = await p.evaluate(() => getCart());
        const soMon = gio.reduce((s, it) => s + Number(it.quantity), 0);
        kq.dat(soMon == 0, 'Số món trong giỏ: ' + soMon);
    });

    // TC-S03-18: Chi tiết - hiển thị 3D khi có model
    await t.tc({
        ma: 'TC-S03-18', trang: 'product-detail.html', chucNang: 'Chi tiết - Nút xem 3D hiện khi có model',
        tienDieuKien: 'Có sản phẩm có model_3d_url', cacBuoc: '1. Mở chi tiết sản phẩm có model 3D 2. Kiểm tra nút #btnShow3D',
        duLieu: 'model_3d_url != null', mongDoi: 'Nút #btnShow3D hiển thị, khung #divMediaSwitcher không ẩn', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const pid = await p.evaluate(() => {
            var ds = getNewProducts();
            for (var i = 0; i < ds.length; i++) if (ds[i].model_3d_url) return ds[i].id;
            return null;
        });
        kq.dat(pid != null, 'Tìm được sản phẩm có model 3D: ' + pid);
        if (pid) {
            await p.goto(p.url().replace(/products\.html.*/, 'product-detail.html?id=' + pid));
            await p.waitForTimeout(1200);
            const anNut3D = await p.evaluate(() => document.getElementById('btnShow3D').classList.contains('hidden'));
            kq.dat(!anNut3D, 'Nút 3D bị ẩn: ' + anNut3D);
            const anSwitcher = await p.evaluate(() => document.getElementById('divMediaSwitcher').classList.contains('hidden'));
            kq.dat(!anSwitcher, 'Khung chuyển đổi bị ẩn: ' + anSwitcher);
        }
    });

    // TC-S03-19: Chi tiết - gợi ý không có món hết hàng
    await t.tc({
        ma: 'TC-S03-19', trang: 'product-detail.html', chucNang: 'Chi tiết - Gợi ý không chứa món hết hàng',
        tienDieuKien: 'Mở chi tiết 1 sản phẩm còn hàng', cacBuoc: '1. Mở chi tiết sản phẩm 2. Đọc danh sách gợi ý',
        duLieu: 'id sản phẩm còn hàng', mongDoi: 'Mọi sản phẩm trong #completeRoomProducts và #similarProducts đều có stock_quantity > 0', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const pid = await p.evaluate(() => {
            var ds = getNewProducts();
            for (var i = 0; i < ds.length; i++) if (Number(ds[i].stock_quantity) > 0) return ds[i].id;
            return null;
        });
        await p.goto(p.url().replace(/products\.html.*/, 'product-detail.html?id=' + pid));
        await p.waitForTimeout(1200);
        const hetHang = await p.evaluate(() => {
            var ids = [];
            var cards = document.querySelectorAll('#completeRoomProducts .product-card, #similarProducts .product-card');
            for (var i = 0; i < cards.length; i++) {
                var a = cards[i].querySelector('a[href*="product-detail.html?id="]');
                if (a) {
                    var m = a.getAttribute('href').match(/id=([^&]+)/);
                    if (m) ids.push(decodeURIComponent(m[1]));
                }
            }
            var sp = getTable('products');
            var het = [];
            for (var j = 0; j < ids.length; j++) {
                for (var k = 0; k < sp.length; k++) {
                    if (sp[k].id == ids[j] && Number(sp[k].stock_quantity) <= 0) het.push(ids[j]);
                }
            }
            return het;
        });
        kq.dat(hetHang.length == 0, 'Số món hết hàng trong gợi ý: ' + hetHang.length + ' ' + JSON.stringify(hetHang.slice(0, 3)));
    });

    // TC-S03-20: Yêu thích - thêm sản phẩm (đã đăng nhập)
    await t.tc({
        ma: 'TC-S03-20', trang: 'product-detail.html', chucNang: 'Yêu thích - Thêm sản phẩm vào danh sách',
        tienDieuKien: 'Đăng nhập user', cacBuoc: '1. Mở chi tiết sản phẩm 2. Bấm nút tim',
        duLieu: 'user@roomcraft.vn', mongDoi: 'wishlists[user.id] chứa id sản phẩm, icon tim đổi màu', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const pid = await p.evaluate(() => getNewProducts()[0].id);
        await p.goto(p.url().replace(/products\.html.*/, 'product-detail.html?id=' + pid));
        await p.waitForTimeout(1000);
        await p.click('#btnAddToWishlist');
        await p.waitForTimeout(500);
        const coTrong = await p.evaluate((id) => {
            var u = getCurrentUser();
            var w = getObject('wishlists') || {};
            return (w[u.id] || []).indexOf(id) >= 0;
        }, pid);
        kq.dat(coTrong, 'Sản phẩm ' + pid + ' có trong wishlist: ' + coTrong);
        const mau = await p.evaluate(() => document.getElementById('iconWishlistDetail').style.color);
        kq.dat(mau != '', 'Màu icon tim: "' + mau + '"');
    });

    // TC-S03-21: Yêu thích - bỏ sản phẩm
    await t.tc({
        ma: 'TC-S03-21', trang: 'product-detail.html', chucNang: 'Yêu thích - Bỏ sản phẩm khỏi danh sách',
        tienDieuKien: 'Đã thêm sản phẩm vào yêu thích', cacBuoc: '1. Mở chi tiết sản phẩm đã thích 2. Bấm nút tim lần 2',
        duLieu: 'user@roomcraft.vn', mongDoi: 'wishlists[user.id] không còn id sản phẩm', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const pid = await p.evaluate(() => {
            var id = getNewProducts()[0].id;
            var u = getCurrentUser();
            var w = getObject('wishlists') || {};
            w[u.id] = [id];
            saveObject('wishlists', w);
            return id;
        });
        await p.goto(p.url().replace(/products\.html.*/, 'product-detail.html?id=' + pid));
        await p.waitForTimeout(1000);
        await p.click('#btnAddToWishlist');
        await p.waitForTimeout(500);
        const conLai = await p.evaluate((id) => {
            var u = getCurrentUser();
            var w = getObject('wishlists') || {};
            return (w[u.id] || []).indexOf(id) >= 0;
        }, pid);
        kq.dat(!conLai, 'Sản phẩm còn trong wishlist: ' + conLai);
    });

    // TC-S03-22: Yêu thích - số trên header
    await t.tc({
        ma: 'TC-S03-22', trang: 'wishlist.html', chucNang: 'Yêu thích - Số lượng trên header',
        tienDieuKien: 'Đăng nhập user, có 2 sản phẩm yêu thích', cacBuoc: '1. Chuẩn bị 2 sản phẩm yêu thích 2. Mở trang Yêu thích',
        duLieu: '2 sản phẩm', mongDoi: 'Header hiển thị số 2, trang hiện "2 sản phẩm đã lưu"', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        await p.evaluate(() => {
            var ds = getNewProducts();
            var u = getCurrentUser();
            var w = getObject('wishlists') || {};
            w[u.id] = [ds[0].id, ds[1].id];
            saveObject('wishlists', w);
        });
        await p.goto(p.url().replace(/products\.html.*/, 'wishlist.html'));
        await p.waitForTimeout(1000);
        const chu = await t.chu('#wishlistCount');
        kq.dat(chu == '2 sản phẩm đã lưu', 'Chuỗi đếm: "' + chu + '"');
        const soThe = await p.locator('#wishlistGrid .product-card').count();
        kq.dat(soThe == 2, 'Số thẻ: ' + soThe);
    });

    // TC-S03-23: Yêu thích - khách chưa đăng nhập
    await t.tc({
        ma: 'TC-S03-23', trang: 'wishlist.html', chucNang: 'Yêu thích - Khách chưa đăng nhập',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Mở wishlist.html',
        duLieu: 'khách', mongDoi: 'Bị chuyển sang trang đăng nhập (không xem được danh sách)', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('wishlist.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1000);
        kq.dat(/login\.html/.test(p.url()), 'URL: ' + p.url());
    });

    // TC-S03-24: Mobile - mở/đóng bộ lọc
    await t.tc({
        ma: 'TC-S03-24', trang: 'products.html', chucNang: 'Mobile - Mở/đóng khung bộ lọc',
        tienDieuKien: 'Màn hình mobile', cacBuoc: '1. Mở products.html trên mobile 2. Bấm nút Bộ lọc 3. Bấm lại',
        duLieu: 'viewport mobile', mongDoi: 'Panel #filterPanel có class open sau lần 1, mất open sau lần 2', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('products.html', { manHinh: 'mobile', vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        await p.click('button.btn-filter-toggle');
        await p.waitForTimeout(300);
        const mo = await p.evaluate(() => document.getElementById('filterPanel').classList.contains('open'));
        kq.dat(mo, 'Panel mở: ' + mo);
        await p.click('button.btn-filter-toggle');
        await p.waitForTimeout(300);
        const dong = await p.evaluate(() => document.getElementById('filterPanel').classList.contains('open'));
        kq.dat(!dong, 'Panel đóng: ' + !dong);
    });

    // TC-S03-25: Mobile - không cuộn ngang
    await t.tc({
        ma: 'TC-S03-25', trang: 'products.html', chucNang: 'Mobile - Không cuộn ngang',
        tienDieuKien: 'Màn hình mobile', cacBuoc: '1. Mở products.html trên mobile',
        duLieu: 'viewport mobile', mongDoi: 'Số px cuộn ngang = 0', mucDoNeuLoi: 'Nhẹ', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('products.html', { manHinh: 'mobile', vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const ngang = await t.traNgang();
        kq.dat(ngang == 0, 'Cuộn ngang: ' + ngang + 'px');
    });

    // TC-S03-26: Chi tiết - sản phẩm không tồn tại
    await t.tc({
        ma: 'TC-S03-26', trang: 'product-detail.html', chucNang: 'Chi tiết - Sản phẩm không tồn tại',
        tienDieuKien: 'Mở chi tiết với id không có', cacBuoc: '1. Mở product-detail.html?id=khong-ton-tai',
        duLieu: 'id=khong-ton-tai', mongDoi: 'Hiện khối #productNotFound, ẩn #productDetailContainer', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('product-detail.html?id=khong-ton-tai-xyz', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(1000);
        const hienNotFound = await p.evaluate(() => !document.getElementById('productNotFound').classList.contains('hidden'));
        kq.dat(hienNotFound, 'Khối không tìm thấy hiện: ' + hienNotFound);
        const anDetail = await p.evaluate(() => document.getElementById('productDetailContainer').classList.contains('hidden'));
        kq.dat(anDetail, 'Khung chi tiết ẩn: ' + anDetail);
    });

    // TC-S03-27: Chi tiết - sản phẩm bị ẩn (is_active=false)
    await t.tc({
        ma: 'TC-S03-27', trang: 'product-detail.html', chucNang: 'Chi tiết - Sản phẩm bị ẩn không xem được',
        tienDieuKien: 'Có sản phẩm is_active=false', cacBuoc: '1. Đặt is_active=false cho 1 sản phẩm 2. Mở chi tiết',
        duLieu: 'is_active=false', mongDoi: 'Hiện khối #productNotFound', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const pid = await p.evaluate(() => {
            var ds = getTable('products');
            var sp = ds[0];
            sp.is_active = false;
            saveTable('products', ds);
            return sp.id;
        });
        await p.goto(p.url().replace(/products\.html.*/, 'product-detail.html?id=' + pid));
        await p.waitForTimeout(1000);
        const hienNotFound = await p.evaluate(() => !document.getElementById('productNotFound').classList.contains('hidden'));
        kq.dat(hienNotFound, 'Khối không tìm thấy hiện: ' + hienNotFound);
    });

    // TC-S03-28: Bộ lọc - Đặt lại
    await t.tc({
        ma: 'TC-S03-28', trang: 'products.html', chucNang: 'Bộ lọc - Nút Đặt lại xóa toàn bộ lọc',
        tienDieuKien: 'Đã áp dụng lọc Gỗ + còn hàng', cacBuoc: '1. Lọc Gỗ + còn hàng 2. Bấm Đặt lại',
        duLieu: 'reset', mongDoi: 'Checkbox bỏ tick, số kết quả bằng tổng sản phẩm mới', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const tong = await p.evaluate(() => getNewProducts().length);
        await p.check("#divFilterMaterial input[value='Gỗ']");
        await p.check('#chkFilterInStock');
        await p.waitForTimeout(400); // lọc ngay khi đổi tiêu chí
        await p.waitForTimeout(500);
        await p.click("button:has-text('Đặt lại')");
        await p.waitForTimeout(500);
        const tick = await p.isChecked("#divFilterMaterial input[value='Gỗ']");
        kq.dat(!tick, 'Checkbox Gỗ còn tick: ' + tick);
        const chu = await t.chu('#productCount');
        kq.dat(chu == 'Tìm thấy ' + tong + ' sản phẩm', 'Hiển thị: "' + chu + '", mong đợi ' + tong);
    });

    // TC-S03-29: Yêu thích - thêm vào giỏ từ wishlist
    await t.tc({
        ma: 'TC-S03-29', trang: 'wishlist.html', chucNang: 'Yêu thích - Thêm vào giỏ từ danh sách',
        tienDieuKien: 'Đăng nhập user, có 1 sản phẩm còn hàng trong yêu thích', cacBuoc: '1. Mở wishlist 2. Bấm "Thêm vào giỏ" trên thẻ',
        duLieu: 'user@roomcraft.vn', mongDoi: 'Giỏ hàng có sản phẩm đó với số lượng 1', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        const pid = await p.evaluate(() => {
            var ds = getNewProducts();
            var sp = null;
            for (var i = 0; i < ds.length; i++) if (Number(ds[i].stock_quantity) > 0) { sp = ds[i]; break; }
            var u = getCurrentUser();
            var w = getObject('wishlists') || {};
            w[u.id] = [sp.id];
            saveObject('wishlists', w);
            if (typeof clearCart === 'function') clearCart();
            else saveTable('carts', []);
            return sp.id;
        });
        await p.goto(p.url().replace(/products\.html.*/, 'wishlist.html'));
        await p.waitForTimeout(1000);
        await p.click("#wishlistGrid button:has-text('Thêm vào giỏ')");
        await p.waitForTimeout(500);
        const gio = await p.evaluate(() => getCart());
        const co = gio.some(it => it.product_id == pid || it.id == pid);
        kq.dat(co, 'Giỏ có sản phẩm ' + pid + ': ' + co);
    });

    // TC-S03-30: Chi tiết - thêm vào giỏ thành công
    await t.tc({
        ma: 'TC-S03-30', trang: 'product-detail.html', chucNang: 'Chi tiết - Thêm vào giỏ thành công',
        tienDieuKien: 'Sản phẩm còn hàng', cacBuoc: '1. Mở chi tiết 2. Nhập số lượng 2 3. Bấm Thêm vào giỏ',
        duLieu: 'qty=2', mongDoi: 'Giỏ có sản phẩm với số lượng 2, hiện thông báo "Đã thêm 2 sản phẩm vào giỏ hàng!"', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('products.html', { vaiTro: 'khach', moi: true });
        await p.waitForTimeout(800);
        const pid = await p.evaluate(() => {
            var ds = getNewProducts();
            for (var i = 0; i < ds.length; i++) if (Number(ds[i].stock_quantity) >= 2) return ds[i].id;
            return null;
        });
        await p.goto(p.url().replace(/products\.html.*/, 'product-detail.html?id=' + pid));
        await p.waitForTimeout(1000);
        await p.fill('#txtQuantity', '2');
        await p.click('#btnAddToCart');
        await p.waitForTimeout(500);
        const gio = await p.evaluate(() => getCart());
        const mon = gio.find(it => it.product_id == pid || it.id == pid);
        kq.dat(mon && Number(mon.quantity) == 2, 'Số lượng trong giỏ: ' + (mon ? mon.quantity : 'không có'));
        const thongBao = await t.chu('#msgCartNotice');
        kq.dat(/Đã thêm 2 sản phẩm vào giỏ hàng/.test(thongBao || ''), 'Thông báo: "' + thongBao + '"');
    });
});