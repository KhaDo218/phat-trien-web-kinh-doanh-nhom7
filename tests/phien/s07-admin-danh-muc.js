const { phien, TAI_KHOAN } = require('../lib/khung-test');

phien({ ma: 's07', ten: 'Admin sản phẩm, danh mục, phòng, đồ cũ' }, async (t) => {

    // ============ SẢN PHẨM ============

    await t.tc({
        ma: 'TC-S07-01', trang: 'admin/products.html', chucNang: 'Thêm sản phẩm - bỏ trống tên sản phẩm',
        tienDieuKien: 'Đăng nhập admin, mở form thêm sản phẩm', cacBuoc: '1. Mở admin/products.html 2. Bấm "Thêm sản phẩm" 3. Điền mã, để trống tên 4. Bấm Lưu',
        duLieu: 'Mã: sp-test-01, Tên: (trống)', mongDoi: 'Form không gửi (trình duyệt chặn do required), không có sản phẩm mới trong bảng products', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/products.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(800);
        const truoc = (await t.bang('products')).length;
        await p.click('button:has-text("Thêm sản phẩm")');
        await p.waitForTimeout(300);
        await p.fill('#txtProductId', 'sp-test-01');
        await p.fill('#txtProductName', '');
        await p.click('#frmProduct [type=submit]');
        await p.waitForTimeout(500);
        const sau = (await t.bang('products')).length;
        kq.dat(sau == truoc, 'Số sản phẩm trước=' + truoc + ', sau=' + sau);
        const hopLe = await p.evaluate(() => document.getElementById('txtProductName').validity.valid);
        kq.dat(hopLe == false, 'Ô tên hợp lệ (required): ' + hopLe);
    });

    await t.tc({
        ma: 'TC-S07-02', trang: 'admin/products.html', chucNang: 'Thêm sản phẩm - giá bán = 0',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Mở form thêm 2. Điền đủ trường bắt buộc 3. Giá bán = 0 4. Lưu',
        duLieu: 'Giá bán: 0', mongDoi: 'Báo "Giá bán phải lớn hơn 0!", không thêm sản phẩm', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = t.trang;
        const truoc = (await t.bang('products')).length;
        await p.evaluate(() => { document.getElementById('productFormPanel').classList.remove('hidden'); });
        await p.fill('#txtProductId', 'sp-test-02');
        await p.fill('#txtProductName', 'Sản phẩm test giá 0');
        await p.selectOption('#cboProductCategory', { index: 1 });
        await p.selectOption('#cboProductStyle', { index: 1 });
        await p.fill('#txtProductPrice', '0');
        await p.fill('#txtProductStock', '5');
        await p.selectOption('#cboProductMaterialGroup', { index: 1 });
        await p.selectOption('#cboProductColorGroup', { index: 1 });
        await p.fill('#txtProductImages', 'assets/products/test.jpg');
        t.xoaAlert();
        await p.evaluate(() => { document.getElementById('txtProductPrice').removeAttribute('min'); });
        await p.click('#frmProduct [type=submit]');
        await p.waitForTimeout(400);
        kq.dat(t.alertCuoi() == 'Giá bán phải lớn hơn 0!', 'Thông báo: "' + t.alertCuoi() + '"');
        const sau = (await t.bang('products')).length;
        kq.dat(sau == truoc, 'Số sản phẩm trước=' + truoc + ', sau=' + sau);
    });

    await t.tc({
        ma: 'TC-S07-03', trang: 'admin/products.html', chucNang: 'Thêm sản phẩm - giá bán = 1 (biên dưới hợp lệ)',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Mở form 2. Điền đủ trường 3. Giá bán = 1 4. Lưu',
        duLieu: 'Giá bán: 1', mongDoi: 'Lưu thành công, sản phẩm mới xuất hiện trong bảng products với price=1', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        await p.evaluate(() => { document.getElementById('productFormPanel').classList.add('hidden'); });
        await p.click('button:has-text("Thêm sản phẩm")');
        await p.waitForTimeout(300);
        await p.fill('#txtProductId', 'sp-test-03');
        await p.fill('#txtProductName', 'Sản phẩm test giá 1');
        await p.selectOption('#cboProductCategory', { index: 1 });
        await p.selectOption('#cboProductStyle', { index: 1 });
        await p.fill('#txtProductPrice', '1');
        await p.fill('#txtProductStock', '5');
        await p.selectOption('#cboProductMaterialGroup', { index: 1 });
        await p.selectOption('#cboProductColorGroup', { index: 1 });
        await p.fill('#txtProductImages', 'assets/products/test.jpg');
        t.xoaAlert();
        await p.click('#frmProduct [type=submit]');
        await p.waitForTimeout(500);
        kq.dat(t.alertCuoi() == 'Đã lưu sản phẩm.', 'Thông báo: "' + t.alertCuoi() + '"');
        const sp = await p.evaluate(() => findById('products', 'sp-test-03'));
        kq.dat(sp != null && sp.price == 1, 'Sản phẩm lưu: ' + JSON.stringify(sp && { id: sp.id, price: sp.price }));
    });

    await t.tc({
        ma: 'TC-S07-04', trang: 'admin/products.html', chucNang: 'Thêm sản phẩm - mã đã tồn tại',
        tienDieuKien: 'Đăng nhập admin, đã có sản phẩm sp-test-03', cacBuoc: '1. Mở form thêm 2. Nhập mã trùng sp-test-03 3. Lưu',
        duLieu: 'Mã: sp-test-03', mongDoi: 'Báo "Mã sản phẩm đã tồn tại.", không tạo bản ghi mới', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = t.trang;
        const truoc = (await t.bang('products')).length;
        await p.click('button:has-text("Thêm sản phẩm")');
        await p.waitForTimeout(300);
        await p.fill('#txtProductId', 'sp-test-03');
        await p.fill('#txtProductName', 'Trùng mã');
        await p.selectOption('#cboProductCategory', { index: 1 });
        await p.selectOption('#cboProductStyle', { index: 1 });
        await p.fill('#txtProductPrice', '100000');
        await p.fill('#txtProductStock', '5');
        await p.selectOption('#cboProductMaterialGroup', { index: 1 });
        await p.selectOption('#cboProductColorGroup', { index: 1 });
        await p.fill('#txtProductImages', 'assets/products/test.jpg');
        t.xoaAlert();
        await p.click('#frmProduct [type=submit]');
        await p.waitForTimeout(400);
        kq.dat(t.alertCuoi() == 'Mã sản phẩm đã tồn tại.', 'Thông báo: "' + t.alertCuoi() + '"');
        const sau = (await t.bang('products')).length;
        kq.dat(sau == truoc, 'Số sản phẩm trước=' + truoc + ', sau=' + sau);
    });

    await t.tc({
        ma: 'TC-S07-05', trang: 'admin/products.html', chucNang: 'Thêm sản phẩm - giá gốc ≤ giá bán',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Mở form 2. Giá bán 100000, giá gốc 100000 3. Lưu',
        duLieu: 'Giá bán: 100000, Giá gốc: 100000', mongDoi: 'Báo "Giá gốc phải lớn hơn giá bán (để trống nếu không giảm giá)!", không lưu', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const truoc = (await t.bang('products')).length;
        await p.click('button:has-text("Thêm sản phẩm")');
        await p.waitForTimeout(300);
        await p.fill('#txtProductId', 'sp-test-05');
        await p.fill('#txtProductName', 'Sản phẩm test giá gốc');
        await p.selectOption('#cboProductCategory', { index: 1 });
        await p.selectOption('#cboProductStyle', { index: 1 });
        await p.fill('#txtProductPrice', '100000');
        await p.fill('#txtProductOriginalPrice', '100000');
        await p.fill('#txtProductStock', '5');
        await p.selectOption('#cboProductMaterialGroup', { index: 1 });
        await p.selectOption('#cboProductColorGroup', { index: 1 });
        await p.fill('#txtProductImages', 'assets/products/test.jpg');
        t.xoaAlert();
        await p.click('#frmProduct [type=submit]');
        await p.waitForTimeout(400);
        kq.dat(t.alertCuoi() == 'Giá gốc phải lớn hơn giá bán (để trống nếu không giảm giá)!', 'Thông báo: "' + t.alertCuoi() + '"');
        const sau = (await t.bang('products')).length;
        kq.dat(sau == truoc, 'Số sản phẩm trước=' + truoc + ', sau=' + sau);
    });

    await t.tc({
        ma: 'TC-S07-06', trang: 'admin/products.html', chucNang: 'Thêm sản phẩm - không có ảnh',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Mở form 2. Để trống ô ảnh 3. Lưu',
        duLieu: 'Ảnh: (trống)', mongDoi: 'Báo "Vui lòng nhập ít nhất một đường dẫn ảnh.", không lưu', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const truoc = (await t.bang('products')).length;
        await p.click('button:has-text("Thêm sản phẩm")');
        await p.waitForTimeout(300);
        await p.fill('#txtProductId', 'sp-test-06');
        await p.fill('#txtProductName', 'Sản phẩm test không ảnh');
        await p.selectOption('#cboProductCategory', { index: 1 });
        await p.selectOption('#cboProductStyle', { index: 1 });
        await p.fill('#txtProductPrice', '100000');
        await p.fill('#txtProductStock', '5');
        await p.selectOption('#cboProductMaterialGroup', { index: 1 });
        await p.selectOption('#cboProductColorGroup', { index: 1 });
        await p.fill('#txtProductImages', '   ');
        t.xoaAlert();
        await p.evaluate(() => { document.getElementById('txtProductImages').removeAttribute('required'); });
        await p.click('#frmProduct [type=submit]');
        await p.waitForTimeout(400);
        kq.dat(t.alertCuoi() == 'Vui lòng nhập ít nhất một đường dẫn ảnh.', 'Thông báo: "' + t.alertCuoi() + '"');
        const sau = (await t.bang('products')).length;
        kq.dat(sau == truoc, 'Số sản phẩm trước=' + truoc + ', sau=' + sau);
    });

    await t.tc({
        ma: 'TC-S07-07', trang: 'admin/products.html', chucNang: 'Sửa sản phẩm - đổi giá và tồn kho',
        tienDieuKien: 'Đăng nhập admin, có sản phẩm sp-test-03', cacBuoc: '1. Bấm Sửa ở sản phẩm sp-test-03 2. Đổi giá 500000, tồn 20 3. Lưu',
        duLieu: 'Giá: 500000, Tồn: 20', mongDoi: 'Bảng products cập nhật price=500000, stock_quantity=20', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = t.trang;
        await p.evaluate(() => { document.getElementById('productFormPanel').classList.add('hidden'); });
        await p.fill('#txtProductSearch', 'sp-test-03');
        await p.waitForTimeout(400);
        await p.click('#tbProducts tr:first-child button:has-text("Sửa")');
        await p.waitForTimeout(300);
        const readOnly = await p.evaluate(() => document.getElementById('txtProductId').readOnly);
        kq.dat(readOnly == true, 'Ô mã sản phẩm readOnly khi sửa: ' + readOnly);
        await p.fill('#txtProductPrice', '500000');
        await p.fill('#txtProductStock', '20');
        t.xoaAlert();
        await p.click('#frmProduct [type=submit]');
        await p.waitForTimeout(500);
        kq.dat(t.alertCuoi() == 'Đã lưu sản phẩm.', 'Thông báo: "' + t.alertCuoi() + '"');
        const sp = await p.evaluate(() => findById('products', 'sp-test-03'));
        kq.dat(sp && sp.price == 500000 && sp.stock_quantity == 20, 'Sau sửa: ' + JSON.stringify(sp && { price: sp.price, stock: sp.stock_quantity }));
    });

    await t.tc({
        ma: 'TC-S07-08', trang: 'admin/products.html', chucNang: 'Ẩn sản phẩm - khách không thấy trên cửa hàng',
        tienDieuKien: 'Đăng nhập admin, có sản phẩm sp-test-03 đang hiển thị', cacBuoc: '1. Bấm "Ẩn" ở sản phẩm sp-test-03 2. Kiểm tra is_active trong bảng products',
        duLieu: 'Ẩn sp-test-03', mongDoi: 'is_active = false trong bảng products', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = t.trang;
        await p.fill('#txtProductSearch', 'sp-test-03');
        await p.waitForTimeout(400);
        await p.click('#tbProducts tr:first-child button:has-text("Ẩn")');
        await p.waitForTimeout(400);
        const sp = await p.evaluate(() => findById('products', 'sp-test-03'));
        kq.dat(sp && sp.is_active === false, 'is_active sau khi ẩn: ' + (sp && sp.is_active));
        const nhan = await t.chu('#tbProducts tr:first-child');
        kq.dat(/Đang ẩn/i.test(nhan || ''), 'Nhãn trạng thái: "' + (nhan || '').slice(0, 80) + '"');
    });

    await t.tc({
        ma: 'TC-S07-09', trang: 'admin/products.html', chucNang: 'Tìm kiếm sản phẩm theo tên',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Gõ từ khóa vào ô tìm kiếm 2. Đọc số kết quả',
        duLieu: 'Từ khóa: "bàn"', mongDoi: 'Số kết quả hiển thị khớp với số sản phẩm NEW có id/tên/thương hiệu chứa "bàn"', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        await p.fill('#txtProductSearch', 'bàn');
        await p.waitForTimeout(500);
        const sp = await t.bang('products');
        const kw = 'bàn';
        const mongDoi = sp.filter(x => x.product_type != 'USED' && ((x.id + ' ' + x.name + ' ' + (x.brand || '')).toLowerCase().indexOf(kw) >= 0)).length;
        const chu = await t.chu('#productResult');
        kq.dat(chu == mongDoi + ' sản phẩm', 'Hiển thị: "' + chu + '", mong đợi: ' + mongDoi + ' sản phẩm');
    });

    await t.tc({
        ma: 'TC-S07-10', trang: 'admin/products.html', chucNang: 'Lọc theo trạng thái "Đang ẩn"',
        tienDieuKien: 'Đăng nhập admin, có sản phẩm đã ẩn', cacBuoc: '1. Chọn trạng thái "Đang ẩn" 2. Đọc số kết quả',
        duLieu: 'Trạng thái: inactive', mongDoi: 'Số kết quả khớp số sản phẩm NEW có is_active=false', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        await p.fill('#txtProductSearch', '');
        await p.selectOption('#cboProductStatus', 'inactive');
        await p.waitForTimeout(500);
        const sp = await t.bang('products');
        const mongDoi = sp.filter(x => x.product_type != 'USED' && x.is_active == false).length;
        const chu = await t.chu('#productResult');
        kq.dat(chu == mongDoi + ' sản phẩm', 'Hiển thị: "' + chu + '", mong đợi: ' + mongDoi + ' sản phẩm');
    });

    await t.tc({
        ma: 'TC-S07-11', trang: 'admin/products.html', chucNang: 'Phân trang sản phẩm - trang 1 tối đa 20 dòng',
        tienDieuKien: 'Đăng nhập admin, có > 20 sản phẩm', cacBuoc: '1. Bỏ lọc 2. Đếm số dòng trang 1 3. Bấm trang 2',
        duLieu: 'Trang mặc định', mongDoi: 'Trang 1 có tối đa 20 dòng, có nút phân trang, bấm trang 2 đổi nội dung', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        await p.selectOption('#cboProductStatus', '');
        await p.waitForTimeout(500);
        const soDong = await p.evaluate(() => document.querySelectorAll('#tbProducts tr').length);
        kq.dat(soDong <= 20 && soDong > 0, 'Số dòng trang 1: ' + soDong);
        const coNut = await p.evaluate(() => document.querySelectorAll('#adminProductPagination .catalog-page-link').length);
        kq.dat(coNut >= 2, 'Số nút phân trang: ' + coNut);
        if (coNut >= 2) {
            const dongDau1 = await t.chu('#tbProducts tr:first-child');
            await p.click('#adminProductPagination .catalog-page-link:has-text("2")');
            await p.waitForTimeout(400);
            const dongDau2 = await t.chu('#tbProducts tr:first-child');
            kq.dat(dongDau1 != dongDau2, 'Dòng đầu trang 1 khác trang 2: ' + (dongDau1 != dongDau2));
        }
    });

    await t.tc({
        ma: 'TC-S07-12', trang: 'admin/products.html', chucNang: 'Xuất JSON sản phẩm',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Bấm "Xuất JSON" 2. Đọc nội dung textarea xuất',
        duLieu: 'Bảng products', mongDoi: 'Nội dung xuất là JSON hợp lệ chứa mảng sản phẩm', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/products.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(800);
        await p.click('button:has-text("Xuất JSON")');
        await p.waitForTimeout(800);
        const txt = await p.evaluate(() => {
            const ta = document.getElementById('txtExport') || document.querySelector('.modal textarea');
            return ta ? ta.value : '';
        });
        let ok = false;
        try { const o = JSON.parse(txt); ok = Array.isArray(o) || (o && typeof o === 'object'); } catch (e) { ok = false; }
        kq.dat(ok, 'Nội dung xuất parse được JSON: ' + ok + ' (độ dài ' + txt.length + ')');
    });

    await t.tc({
        ma: 'TC-S07-13', trang: 'admin/products.html', chucNang: 'Phân quyền - user thường mở admin/products.html',
        tienDieuKien: 'Đăng nhập user@roomcraft.vn', cacBuoc: '1. Gõ thẳng admin/products.html',
        mongDoi: 'Bị chặn, chuyển khỏi trang admin', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/products.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        kq.dat(!/admin\/products\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });

    await t.tc({
        ma: 'TC-S07-14', trang: 'admin/products.html', chucNang: 'Mobile - thêm sản phẩm trên màn hình di động',
        tienDieuKien: 'Đăng nhập admin, màn hình mobile', cacBuoc: '1. Mở admin/products.html mobile 2. Mở form 3. Điền và lưu',
        duLieu: 'Mã: sp-mobile-01, giá 200000', mongDoi: 'Lưu thành công, không cuộn ngang', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('admin/products.html', { vaiTro: 'admin', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(800);
        await p.click('button:has-text("Thêm sản phẩm")');
        await p.waitForTimeout(300);
        await p.fill('#txtProductId', 'sp-mobile-01');
        await p.fill('#txtProductName', 'Sản phẩm mobile test');
        await p.selectOption('#cboProductCategory', { index: 1 });
        await p.selectOption('#cboProductStyle', { index: 1 });
        await p.fill('#txtProductPrice', '200000');
        await p.fill('#txtProductStock', '3');
        await p.selectOption('#cboProductMaterialGroup', { index: 1 });
        await p.selectOption('#cboProductColorGroup', { index: 1 });
        await p.fill('#txtProductImages', 'assets/products/test.jpg');
        t.xoaAlert();
        await p.click('#frmProduct [type=submit]');
        await p.waitForTimeout(500);
        kq.dat(t.alertCuoi() == 'Đã lưu sản phẩm.', 'Thông báo: "' + t.alertCuoi() + '"');
        const sp = await p.evaluate(() => findById('products', 'sp-mobile-01'));
        kq.dat(sp != null && sp.price == 200000, 'Sản phẩm lưu: ' + JSON.stringify(sp && { id: sp.id, price: sp.price }));
        const ngang = await t.traNgang();
        kq.dat(ngang == 0, 'Cuộn ngang: ' + ngang + 'px');
    });

    // ============ DANH MỤC ============

    await t.tc({
        ma: 'TC-S07-15', trang: 'admin/categories.html', chucNang: 'Thêm danh mục - bỏ trống tên',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Mở admin/categories.html 2. Để trống tên 3. Bấm Lưu',
        duLieu: 'Tên: (trống)', mongDoi: 'Trình duyệt chặn do required, không thêm danh mục', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/categories.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(800);
        const truoc = (await t.bang('categories')).length;
        await p.fill('#txtCategoryName', '');
        await p.click('#frmCategory [type=submit]');
        await p.waitForTimeout(400);
        const sau = (await t.bang('categories')).length;
        kq.dat(sau == truoc, 'Số danh mục trước=' + truoc + ', sau=' + sau);
        const hopLe = await p.evaluate(() => document.getElementById('txtCategoryName').validity.valid);
        kq.dat(hopLe == false, 'Ô tên hợp lệ: ' + hopLe);
    });

    await t.tc({
        ma: 'TC-S07-16', trang: 'admin/categories.html', chucNang: 'Thêm danh mục mới hợp lệ',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Nhập tên danh mục mới 2. Bấm Lưu',
        duLieu: 'Tên: "Danh mục test s07"', mongDoi: 'Báo "Đã lưu danh mục.", bảng categories có bản ghi mới', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = t.trang;
        const truoc = (await t.bang('categories')).length;
        await p.fill('#txtCategoryName', 'Danh mục test s07');
        t.xoaAlert();
        await p.click('#frmCategory [type=submit]');
        await p.waitForTimeout(500);
        kq.dat(t.alertCuoi() == 'Đã lưu danh mục.', 'Thông báo: "' + t.alertCuoi() + '"');
        const sau = (await t.bang('categories')).length;
        kq.dat(sau == truoc + 1, 'Số danh mục trước=' + truoc + ', sau=' + sau);
        const moi = await p.evaluate(() => getTable('categories').filter(c => c.name == 'Danh mục test s07'));
        kq.dat(moi.length == 1, 'Số danh mục tên mới: ' + moi.length);
    });

    await t.tc({
        ma: 'TC-S07-17', trang: 'admin/categories.html', chucNang: 'Thêm danh mục - trùng tên cùng cấp',
        tienDieuKien: 'Đăng nhập admin, đã có "Danh mục test s07"', cacBuoc: '1. Nhập lại tên trùng 2. Bấm Lưu',
        duLieu: 'Tên: "Danh mục test s07"', mongDoi: 'Báo "Danh mục cùng cấp đã có tên này.", không thêm', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const truoc = (await t.bang('categories')).length;
        await p.fill('#txtCategoryName', 'Danh mục test s07');
        t.xoaAlert();
        await p.click('#frmCategory [type=submit]');
        await p.waitForTimeout(400);
        kq.dat(t.alertCuoi() == 'Danh mục cùng cấp đã có tên này.', 'Thông báo: "' + t.alertCuoi() + '"');
        const sau = (await t.bang('categories')).length;
        kq.dat(sau == truoc, 'Số danh mục trước=' + truoc + ', sau=' + sau);
    });

    await t.tc({
        ma: 'TC-S07-18', trang: 'admin/categories.html', chucNang: 'Xóa danh mục còn sản phẩm',
        tienDieuKien: 'Đăng nhập admin, danh mục có sản phẩm', cacBuoc: '1. Tìm danh mục có sản phẩm 2. Bấm Xóa',
        duLieu: 'Danh mục có sản phẩm', mongDoi: 'Báo "Danh mục còn sản phẩm, không thể xóa!", không xóa', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = t.trang;
        const cats = await t.bang('categories');
        const prods = await t.bang('products');
        const catCoSp = cats.find(c => prods.some(x => x.category_id == c.id));
        kq.dat(catCoSp != null, 'Tìm được danh mục có sản phẩm: ' + (catCoSp && catCoSp.id));
        if (catCoSp) {
            const truoc = cats.length;
            await p.evaluate((id) => { deleteCategory(id); }, catCoSp.id);
            await p.waitForTimeout(400);
            kq.dat(t.alertCuoi() == 'Danh mục còn sản phẩm, không thể xóa!', 'Thông báo: "' + t.alertCuoi() + '"');
            const sau = (await t.bang('categories')).length;
            kq.dat(sau == truoc, 'Số danh mục trước=' + truoc + ', sau=' + sau);
        }
    });

    await t.tc({
        ma: 'TC-S07-19', trang: 'admin/categories.html', chucNang: 'Xóa danh mục trống - xác nhận',
        tienDieuKien: 'Đăng nhập admin, có danh mục trống "Danh mục test s07"', cacBuoc: '1. Bấm Xóa danh mục trống 2. Xác nhận OK',
        duLieu: 'Danh mục trống', mongDoi: 'Danh mục bị xóa khỏi bảng categories', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const cats = await t.bang('categories');
        const prods = await t.bang('products');
        const catTrong = cats.find(c => c.name == 'Danh mục test s07' && !prods.some(x => x.category_id == c.id));
        kq.dat(catTrong != null, 'Tìm được danh mục trống: ' + (catTrong && catTrong.id));
        if (catTrong) {
            const truoc = cats.length;
            await p.evaluate((id) => { deleteCategory(id); }, catTrong.id);
            await p.waitForTimeout(400);
            const sau = (await t.bang('categories')).length;
            kq.dat(sau == truoc - 1, 'Số danh mục trước=' + truoc + ', sau=' + sau);
            const con = await p.evaluate((id) => findById('categories', id), catTrong.id);
            kq.dat(con == null, 'Danh mục còn tồn tại: ' + (con != null));
        }
    });

    await t.tc({
        ma: 'TC-S07-20', trang: 'admin/categories.html', chucNang: 'Sửa danh mục - đổi tên',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Bấm Sửa danh mục 2. Đổi tên 3. Lưu',
        duLieu: 'Tên mới: "Danh mục đã sửa s07"', mongDoi: 'Bảng categories cập nhật tên mới', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const cats = await t.bang('categories');
        const cat = cats.find(c => c.parent_id == null);
        kq.dat(cat != null, 'Có danh mục gốc để sửa: ' + (cat && cat.id));
        if (cat) {
            const tenCu = cat.name;
            await p.evaluate((id) => { editCategory(id); }, cat.id);
            await p.waitForTimeout(300);
            await p.fill('#txtCategoryName', 'Danh mục đã sửa s07');
            t.xoaAlert();
            await p.click('#frmCategory [type=submit]');
            await p.waitForTimeout(500);
            kq.dat(t.alertCuoi() == 'Đã lưu danh mục.', 'Thông báo: "' + t.alertCuoi() + '"');
            const sau = await p.evaluate((id) => findById('categories', id), cat.id);
            kq.dat(sau && sau.name == 'Danh mục đã sửa s07', 'Tên sau sửa: ' + (sau && sau.name) + ' (cũ: ' + tenCu + ')');
        }
    });

    await t.tc({
        ma: 'TC-S07-21', trang: 'admin/categories.html', chucNang: 'Mobile - danh sách danh mục không cuộn ngang',
        tienDieuKien: 'Đăng nhập admin, màn hình mobile', cacBuoc: '1. Mở admin/categories.html mobile 2. Đo cuộn ngang',
        duLieu: 'Màn hình mobile', mongDoi: 'Không cuộn ngang, danh sách danh mục hiển thị', mucDoNeuLoi: 'Nhẹ', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('admin/categories.html', { vaiTro: 'admin', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(800);
        const ngang = await t.traNgang();
        kq.dat(ngang == 0, 'Cuộn ngang: ' + ngang + 'px');
        const soDong = await p.evaluate(() => document.querySelectorAll('#tbCategories tr').length);
        kq.dat(soDong > 0, 'Số dòng danh mục: ' + soDong);
    });

    // ============ PHÒNG ============

    await t.tc({
        ma: 'TC-S07-22', trang: 'admin/rooms.html', chucNang: 'Thêm phòng - bỏ trống tên phòng',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Mở admin/rooms.html 2. Bấm "Thêm phòng" 3. Để trống tên 4. Lưu',
        duLieu: 'Tên: (trống)', mongDoi: 'Không lưu phòng mới (báo lỗi hoặc chặn)', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/rooms.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(800);
        const truoc = (await t.bang('rooms')).length;
        await p.click('button:has-text("Thêm phòng")');
        await p.waitForTimeout(300);
        await p.fill('#txtRoomName', '');
        t.xoaAlert();
        await p.click('#frmRoom [type=submit]');
        await p.waitForTimeout(500);
        const sau = (await t.bang('rooms')).length;
        kq.dat(sau == truoc, 'Số phòng trước=' + truoc + ', sau=' + sau);
    });

    await t.tc({
        ma: 'TC-S07-23', trang: 'admin/rooms.html', chucNang: 'Thêm phòng mới hợp lệ',
        tienDieuKien: 'Đăng nhập admin, có ảnh phòng hợp lệ trong assets/rooms/<phong-cách>/', cacBuoc: '1. Mở form thêm phòng 2. Nhập tên, chọn phong cách, nhập ảnh có thật 3. Lưu',
        duLieu: 'Tên: "Phòng test s07", ảnh: lấy từ rooms[0].image_url (ảnh có thật)', mongDoi: 'Bảng rooms có bản ghi mới với tên đúng', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/rooms.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(800);
        const rooms = await t.bang('rooms');
        const anhThat = rooms.length > 0 && rooms[0].image_url ? rooms[0].image_url : 'assets/rooms/glam/room-glam-4190768-01.jpg';
        kq.ghi('Ảnh dùng để test: ' + anhThat);
        const truoc = rooms.length;
        await p.click('button:has-text("Thêm phòng")');
        await p.waitForTimeout(400);
        const coForm = await p.evaluate(() => !document.getElementById('roomFormPanel').classList.contains('hidden'));
        kq.dat(coForm, 'Panel form phòng mở: ' + coForm);
        await p.fill('#txtRoomName', 'Phòng test s07');
        await p.selectOption('#cboRoomStyle', { index: 1 });
        await p.fill('#txtRoomImage', anhThat);
        t.xoaAlert();
        await p.click('#frmRoom [type=submit]');
        await p.waitForTimeout(1200);
        const sau = (await t.bang('rooms')).length;
        kq.dat(sau == truoc + 1, 'Số phòng trước=' + truoc + ', sau=' + sau + ' (alert: "' + t.alertCuoi() + '")');
        const moi = await p.evaluate(() => getTable('rooms').filter(r => r.name == 'Phòng test s07'));
        kq.dat(moi.length == 1, 'Số phòng tên mới: ' + moi.length);
        kq.dat(moi.length == 1 && moi[0].image_url == anhThat, 'Ảnh chính lưu đúng: ' + (moi[0] && moi[0].image_url));
    });

    await t.tc({
        ma: 'TC-S07-24', trang: 'admin/rooms.html', chucNang: 'Gắn hotspot vào phòng - lưu tọa độ',
        tienDieuKien: 'Đăng nhập admin, có phòng test với ảnh chính hợp lệ', cacBuoc: '1. Mở trình gắn hotspot cho phòng 2. Chọn sản phẩm, nhập X=50, Y=50 3. Lưu hotspot',
        duLieu: 'X=50, Y=50, ảnh phòng lấy từ rooms[0].image_url', mongDoi: 'Bảng room_hotspots có bản ghi mới với position_x=50, position_y=50 thuộc phòng test', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/rooms.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(800);
        // Tự chuẩn bị dữ liệu: tạo phòng test với ảnh có thật (đúng tên trường image_url/images)
        const phongId = await p.evaluate(() => {
            const rooms = getTable('rooms');
            const styles = getTable('styles');
            const anhThat = rooms.length > 0 && rooms[0].image_url ? rooms[0].image_url : 'assets/rooms/glam/room-glam-4190768-01.jpg';
            const id = 'room-test-s07';
            const moi = {
                id: id,
                name: 'Phòng test s07',
                style_id: styles.length > 0 ? styles[0].id : null,
                image_url: anhThat,
                images: [anhThat],
                description: 'Phòng test cho kiểm thử hotspot',
                product_ids: []
            };
            const conLai = rooms.filter(r => r.id != id);
            conLai.push(moi);
            saveTable('rooms', conLai);
            return id;
        });
        await p.reload();
        await p.waitForTimeout(800);
        const phong = await p.evaluate((id) => findById('rooms', id), phongId);
        kq.dat(phong != null, 'Tìm phòng test: ' + (phong && phong.id));
        if (phong) {
            const truoc = (await t.bang('room_hotspots')).length;
            await p.evaluate((id) => { openHotspotEditor(id); }, phong.id);
            await p.waitForTimeout(500);
            const coForm = await p.evaluate(() => !document.getElementById('hotspotPanel').classList.contains('hidden'));
            kq.dat(coForm, 'Panel hotspot mở: ' + coForm);
            await p.selectOption('#cboHotspotProduct', { index: 1 });
            await p.fill('#txtPosX', '50');
            await p.fill('#txtPosY', '50');
            t.xoaAlert();
            await p.click('.ar-hotspot-form [type=submit]');
            await p.waitForTimeout(600);
            const sau = (await t.bang('room_hotspots')).length;
            kq.dat(sau == truoc + 1, 'Số hotspot trước=' + truoc + ', sau=' + sau + ' (alert: "' + t.alertCuoi() + '")');
            const hs = await p.evaluate((rid) => getTable('room_hotspots').filter(h => h.room_id == rid), phong.id);
            kq.dat(hs.length >= 1 && hs.some(h => h.position_x == 50 && h.position_y == 50), 'Hotspot phòng: ' + JSON.stringify(hs.map(h => ({ x: h.position_x, y: h.position_y }))));
        }
    });

    await t.tc({
        ma: 'TC-S07-25', trang: 'admin/rooms.html', chucNang: 'Tìm kiếm phòng theo tên',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Gõ "test s07" vào ô tìm kiếm 2. Đọc kết quả',
        duLieu: 'Từ khóa: "test s07"', mongDoi: 'Chỉ hiện phòng có tên/mã chứa từ khóa', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/rooms.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(800);
        // Tự chuẩn bị dữ liệu: tạo phòng test qua saveTable (đúng tên trường image_url/images)
        await p.evaluate(() => {
            const rooms = getTable('rooms');
            const styles = getTable('styles');
            const anhThat = rooms.length > 0 && rooms[0].image_url ? rooms[0].image_url : 'assets/rooms/glam/room-glam-4190768-01.jpg';
            const id = 'room-test-s07';
            const moi = {
                id: id,
                name: 'Phòng test s07',
                style_id: styles.length > 0 ? styles[0].id : null,
                image_url: anhThat,
                images: [anhThat],
                description: 'Phòng test cho kiểm thử tìm kiếm',
                product_ids: []
            };
            const conLai = rooms.filter(r => r.id != id);
            conLai.push(moi);
            saveTable('rooms', conLai);
        });
        await p.reload();
        await p.waitForTimeout(800);
        await p.fill('#txtRoomSearch', 'test s07');
        await p.waitForTimeout(500);
        const rooms = await t.bang('rooms');
        const kw = 'test s07';
        const mongDoi = rooms.filter(r => ((r.name || '') + ' ' + (r.id || '')).toLowerCase().indexOf(kw) >= 0).length;
        const soDong = await p.evaluate(() => document.querySelectorAll('#tbRooms tr').length);
        kq.dat(soDong == mongDoi, 'Số dòng hiển thị: ' + soDong + ', mong đợi: ' + mongDoi);
        const chu = await t.chu('#roomResult');
        kq.dat(chu != null && chu.indexOf(String(mongDoi)) >= 0, 'Kết quả: "' + chu + '" (mong đợi chứa ' + mongDoi + ')');
    });

    // ============ ĐỒ CŨ ============

    await t.tc({
        ma: 'TC-S07-26', trang: 'admin/marketplace.html', chucNang: 'Đồ cũ - thêm mới thiếu ảnh',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Mở admin/marketplace.html 2. Bấm "Thêm món đồ cũ" 3. Điền đủ trường bắt buộc, để trống ảnh 4. Lưu',
        duLieu: 'Ảnh: (trống)', mongDoi: 'Báo "Vui lòng nhập ít nhất một đường dẫn ảnh!", không thêm', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('admin/marketplace.html', { vaiTro: 'admin', moi: true });
        await p.waitForTimeout(800);
        const truoc = (await t.bang('products')).length;
        await p.click('button:has-text("Thêm món đồ cũ")');
        await p.waitForTimeout(300);
        await p.fill('#txtName', 'Ghế cũ test s07');
        await p.selectOption('#slCategory', { index: 1 });
        await p.selectOption('#slStyle', { index: 1 });
        await p.fill('#txtPrice', '500000');
        await p.selectOption('#slMaterialGroup', { index: 1 });
        await p.selectOption('#slColorGroup', { index: 1 });
        await p.fill('#txtImages', '');
        t.xoaAlert();
        await p.click('#frmUsedProduct [type=submit]');
        await p.waitForTimeout(400);
        kq.dat(t.alertCuoi() == 'Vui lòng nhập ít nhất một đường dẫn ảnh!', 'Thông báo: "' + t.alertCuoi() + '"');
        const sau = (await t.bang('products')).length;
        kq.dat(sau == truoc, 'Số sản phẩm trước=' + truoc + ', sau=' + sau);
    });

    await t.tc({
        ma: 'TC-S07-27', trang: 'admin/marketplace.html', chucNang: 'Đồ cũ - giá bán = 0',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Mở form thêm đồ cũ 2. Giá bán = 0 3. Lưu',
        duLieu: 'Giá: 0', mongDoi: 'Báo "Giá bán phải lớn hơn 0!", không thêm', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = t.trang;
        const truoc = (await t.bang('products')).length;
        await p.evaluate(() => { document.getElementById('modalUsed').classList.remove('hidden'); });
        await p.fill('#txtName', 'Ghế cũ test giá 0');
        await p.selectOption('#slCategory', { index: 1 });
        await p.selectOption('#slStyle', { index: 1 });
        await p.fill('#txtPrice', '0');
        await p.selectOption('#slMaterialGroup', { index: 1 });
        await p.selectOption('#slColorGroup', { index: 1 });
        await p.fill('#txtImages', 'assets/marketplace/test.jpg');
        t.xoaAlert();
        await p.evaluate(() => { document.getElementById('txtPrice').removeAttribute('min'); });
        await p.click('#frmUsedProduct [type=submit]');
        await p.waitForTimeout(400);
        kq.dat(t.alertCuoi() == 'Giá bán phải lớn hơn 0!', 'Thông báo: "' + t.alertCuoi() + '"');
        const sau = (await t.bang('products')).length;
        kq.dat(sau == truoc, 'Số sản phẩm trước=' + truoc + ', sau=' + sau);
    });

    await t.tc({
        ma: 'TC-S07-28', trang: 'admin/marketplace.html', chucNang: 'Đồ cũ - thêm mới hợp lệ',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Mở form thêm 2. Điền đủ trường 3. Lưu',
        duLieu: 'Tên: "Ghế cũ test s07", giá 500000, ảnh hợp lệ', mongDoi: 'Báo "Đã thêm món đồ cũ mới với mã: used-xxx!", bảng products có bản ghi product_type=USED', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = t.trang;
        const truoc = (await t.bang('products')).length;
        await p.evaluate(() => { document.getElementById('modalUsed').classList.add('hidden'); });
        await p.click('button:has-text("Thêm món đồ cũ")');
        await p.waitForTimeout(300);
        await p.fill('#txtName', 'Ghế cũ test s07');
        await p.selectOption('#slCategory', { index: 1 });
        await p.selectOption('#slStyle', { index: 1 });
        await p.fill('#txtPrice', '500000');
        await p.selectOption('#slMaterialGroup', { index: 1 });
        await p.selectOption('#slColorGroup', { index: 1 });
        await p.fill('#txtImages', 'assets/marketplace/test.jpg');
        t.xoaAlert();
        await p.click('#frmUsedProduct [type=submit]');
        await p.waitForTimeout(600);
        kq.dat(/Đã thêm món đồ cũ mới với mã: used-/.test(t.alertCuoi() || ''), 'Thông báo: "' + t.alertCuoi() + '"');
        const sau = (await t.bang('products')).length;
        kq.dat(sau == truoc + 1, 'Số sản phẩm trước=' + truoc + ', sau=' + sau);
        const moi = await p.evaluate(() => getTable('products').filter(x => x.name == 'Ghế cũ test s07' && x.product_type == 'USED'));
        kq.dat(moi.length == 1 && moi[0].price == 500000, 'Bản ghi đồ cũ: ' + JSON.stringify(moi.map(x => ({ id: x.id, price: x.price, type: x.product_type }))));
    });

    await t.tc({
        ma: 'TC-S07-29', trang: 'admin/marketplace.html', chucNang: 'Đồ cũ - ẩn món đồ cũ',
        tienDieuKien: 'Đăng nhập admin, có món đồ cũ đang hiển thị', cacBuoc: '1. Bấm nút ẩn ở món đồ cũ 2. Kiểm tra is_active',
        duLieu: 'Món đồ cũ vừa thêm', mongDoi: 'is_active = false trong bảng products', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const used = await p.evaluate(() => getTable('products').filter(x => x.product_type == 'USED' && x.is_active !== false));
        kq.dat(used.length > 0, 'Có món đồ cũ đang hiển thị: ' + used.length);
        if (used.length > 0) {
            const id = used[0].id;
            await p.evaluate((i) => { toggleActive(i); }, id);
            await p.waitForTimeout(400);
            const sau = await p.evaluate((i) => findById('products', i), id);
            kq.dat(sau && sau.is_active === false, 'is_active sau khi ẩn: ' + (sau && sau.is_active));
        }
    });

    await t.tc({
        ma: 'TC-S07-30', trang: 'admin/marketplace.html', chucNang: 'Mobile - đồ cũ lọc theo tình trạng',
        tienDieuKien: 'Đăng nhập admin, màn hình mobile', cacBuoc: '1. Mở admin/marketplace.html mobile 2. Lọc tình trạng "Good" 3. Đếm dòng',
        duLieu: 'Tình trạng: Good', mongDoi: 'Số dòng khớp số đồ cũ có condition_grade="Good", không cuộn ngang', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('admin/marketplace.html', { vaiTro: 'admin', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(800);
        await p.selectOption('#slFilterGrade', 'Good');
        await p.waitForTimeout(500);
        const prods = await t.bang('products');
        const mongDoi = prods.filter(x => x.product_type === 'USED' && x.condition_grade === 'Good').length;
        const soDong = await p.evaluate(() => document.querySelectorAll('#tbUsedProducts tr').length);
        kq.dat(soDong == mongDoi, 'Số dòng hiển thị: ' + soDong + ', mong đợi: ' + mongDoi);
        const ngang = await t.traNgang();
        kq.dat(ngang == 0, 'Cuộn ngang: ' + ngang + 'px');
    });
});