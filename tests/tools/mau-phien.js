// PHIÊN 01 - TÀI KHOẢN (MẪU): đăng nhập. Cline viết tiếp các test case còn lại của phiên theo đúng mẫu này.
const { phien, TAI_KHOAN } = require('../lib/khung-test');

phien({ ma: 's01', ten: 'Tài khoản' }, async (t) => {

    await t.tc({
        ma: 'TC-S01-01', trang: 'login.html', chucNang: 'Đăng nhập - bỏ trống email',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Mở trang Đăng nhập 2. Để trống email 3. Bấm Đăng nhập',
        duLieu: 'Email: (trống)', mongDoi: 'Báo "Email không được bỏ trống!", con trỏ về ô Email', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true });
        t.xoaAlert();
        await p.click('form[name=frmLogin] [type=submit]');
        await p.waitForTimeout(300);
        kq.dat(t.alertCuoi() == 'Email không được bỏ trống!', 'Thông báo: "' + t.alertCuoi() + '"');
        const oDangChon = await p.evaluate(() => document.activeElement && document.activeElement.id);
        kq.dat(oDangChon == 'txtEmail', 'Con trỏ ở ô ' + oDangChon);
    });

    await t.tc({
        ma: 'TC-S01-02', trang: 'login.html', chucNang: 'Đăng nhập - sai mật khẩu',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Nhập email đúng 2. Nhập sai mật khẩu 3. Bấm Đăng nhập',
        duLieu: TAI_KHOAN.user.email + ' / SaiMatKhau1', mongDoi: 'Hiện "Mật khẩu không đúng!", vẫn ở trang đăng nhập'
    }, async (kq) => {
        const p = t.trang;
        await p.fill('#txtEmail', TAI_KHOAN.user.email);
        await p.fill('#txtPassword', 'SaiMatKhau1');
        await p.click('form[name=frmLogin] [type=submit]');
        await p.waitForTimeout(400);
        const loi = await t.chu('#msgError');
        kq.dat(loi == 'Mật khẩu không đúng!', 'Thông báo: "' + loi + '"');
        kq.dat(/login\.html/.test(p.url()), 'Vẫn ở ' + p.url().split('/scripts/')[1]);
    });

    await t.tc({
        ma: 'TC-S01-03', trang: 'login.html', chucNang: 'Đăng nhập - đúng tài khoản Admin',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Nhập tài khoản admin 2. Bấm Đăng nhập',
        duLieu: TAI_KHOAN.admin.email + ' / ' + TAI_KHOAN.admin.matKhau, mongDoi: 'Chuyển vào trang quản trị (admin/index.html)', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = t.trang;
        await p.fill('#txtEmail', TAI_KHOAN.admin.email);
        await p.fill('#txtPassword', TAI_KHOAN.admin.matKhau);
        await p.click('form[name=frmLogin] [type=submit]');
        await p.waitForTimeout(1500);
        kq.dat(/admin\/index\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });

    await t.tc({
        ma: 'TC-S01-04', trang: 'admin/index.html', chucNang: 'Phân quyền - User thường mở trang admin',
        tienDieuKien: 'Đăng nhập user@roomcraft.vn', cacBuoc: 'Gõ thẳng địa chỉ admin/index.html',
        mongDoi: 'Bị chặn, chuyển về trang khách (không thấy Dashboard)', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('admin/index.html', { vaiTro: 'user', moi: true });
        await p.waitForTimeout(800);
        kq.dat(!/admin\//.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });
});
