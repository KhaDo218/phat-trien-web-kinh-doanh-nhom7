// PHIÊN 01 - TÀI KHOẢN
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

    await t.tc({
        ma: 'TC-S01-05', trang: 'login.html', chucNang: 'Đăng nhập - bỏ trống mật khẩu',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Mở trang Đăng nhập 2. Nhập email đúng 3. Để trống mật khẩu 4. Bấm Đăng nhập',
        duLieu: TAI_KHOAN.user.email + ' / (trống)', mongDoi: 'Báo "Mật khẩu không được bỏ trống!", con trỏ về ô Mật khẩu', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true });
        t.xoaAlert();
        await p.fill('#txtEmail', TAI_KHOAN.user.email);
        await p.click('form[name=frmLogin] [type=submit]');
        await p.waitForTimeout(300);
        kq.dat(t.alertCuoi() == 'Mật khẩu không được bỏ trống!', 'Thông báo: "' + t.alertCuoi() + '"');
        const oDangChon = await p.evaluate(() => document.activeElement && document.activeElement.id);
        kq.dat(oDangChon == 'txtPassword', 'Con trỏ ở ô ' + oDangChon);
    });

    await t.tc({
        ma: 'TC-S01-06', trang: 'login.html', chucNang: 'Đăng nhập - email sai định dạng',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Nhập email sai định dạng 2. Nhập mật khẩu 3. Bấm Đăng nhập',
        duLieu: 'abcgmail.com / User@123', mongDoi: 'Báo "Email không hợp lệ!", không đăng nhập', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true });
        t.xoaAlert();
        await p.fill('#txtEmail', 'abcgmail.com');
        await p.fill('#txtPassword', 'User@123');
        await p.click('form[name=frmLogin] [type=submit]');
        await p.waitForTimeout(300);
        kq.dat(t.alertCuoi() == 'Email không hợp lệ!', 'Thông báo: "' + t.alertCuoi() + '"');
        kq.dat(/login\.html/.test(p.url()), 'Vẫn ở ' + p.url().split('/scripts/')[1]);
    });

    await t.tc({
        ma: 'TC-S01-07', trang: 'login.html', chucNang: 'Đăng nhập - email chưa đăng ký',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Nhập email không tồn tại 2. Nhập mật khẩu 3. Bấm Đăng nhập',
        duLieu: 'khongtontai@roomcraft.vn / User@123', mongDoi: 'Hiện "Email chưa được đăng ký!"', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true });
        await p.fill('#txtEmail', 'khongtontai@roomcraft.vn');
        await p.fill('#txtPassword', 'User@123');
        await p.click('form[name=frmLogin] [type=submit]');
        await p.waitForTimeout(400);
        const loi = await t.chu('#msgError');
        kq.dat(loi == 'Email chưa được đăng ký!', 'Thông báo: "' + loi + '"');
    });

    await t.tc({
        ma: 'TC-S01-08', trang: 'login.html', chucNang: 'Đăng nhập - tài khoản bị khóa',
        tienDieuKien: 'Tài khoản user bị khóa (is_active=false)', cacBuoc: '1. Khóa tài khoản user trong dữ liệu 2. Đăng nhập bằng tài khoản đó',
        duLieu: TAI_KHOAN.user.email + ' / ' + TAI_KHOAN.user.matKhau, mongDoi: 'Hiện "Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên!", không tạo phiên', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true });
        await p.evaluate((email) => {
            var users = getTable('users');
            for (var i = 0; i < users.length; i++)
                if (users[i].email == email) users[i].is_active = false;
            saveTable('users', users);
        }, TAI_KHOAN.user.email);
        await p.reload();
        await p.waitForTimeout(500);
        await p.fill('#txtEmail', TAI_KHOAN.user.email);
        await p.fill('#txtPassword', TAI_KHOAN.user.matKhau);
        await p.click('form[name=frmLogin] [type=submit]');
        await p.waitForTimeout(400);
        const loi = await t.chu('#msgError');
        kq.dat(loi == 'Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên!', 'Thông báo: "' + loi + '"');
        const phien = await p.evaluate(() => getSession());
        kq.dat(phien == null, 'Phiên đăng nhập: ' + JSON.stringify(phien));
    });

    await t.tc({
        ma: 'TC-S01-09', trang: 'login.html', chucNang: 'Đăng nhập - user thường vào trang chủ',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Nhập tài khoản user 2. Bấm Đăng nhập',
        duLieu: TAI_KHOAN.user.email + ' / ' + TAI_KHOAN.user.matKhau, mongDoi: 'Chuyển về index.html và tạo phiên role User', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true });
        await p.fill('#txtEmail', TAI_KHOAN.user.email);
        await p.fill('#txtPassword', TAI_KHOAN.user.matKhau);
        await p.click('form[name=frmLogin] [type=submit]');
        await p.waitForTimeout(1500);
        kq.dat(/scripts\/index\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
        const phien = await p.evaluate(() => getSession());
        kq.dat(phien != null && phien.role == 'User', 'Phiên: ' + JSON.stringify(phien));
    });

    await t.tc({
        ma: 'TC-S01-10', trang: 'login.html', chucNang: 'Đăng nhập - tham số ?redirect=',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Mở login.html?redirect=cart.html 2. Đăng nhập user 3. Kiểm tra URL',
        duLieu: TAI_KHOAN.user.email + ' / ' + TAI_KHOAN.user.matKhau, mongDoi: 'Sau đăng nhập chuyển tới cart.html', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('login.html?redirect=cart.html', { vaiTro: 'khach', moi: true });
        await p.fill('#txtEmail', TAI_KHOAN.user.email);
        await p.fill('#txtPassword', TAI_KHOAN.user.matKhau);
        await p.click('form[name=frmLogin] [type=submit]');
        await p.waitForTimeout(1500);
        kq.dat(/cart\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
    });

    await t.tc({
        ma: 'TC-S01-11', trang: 'register.html', chucNang: 'Đăng ký - bỏ trống họ tên',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Mở trang Đăng ký 2. Để trống họ tên 3. Bấm Tiếp tục',
        duLieu: 'Họ tên: (trống)', mongDoi: 'Báo "Họ và tên không được bỏ trống!", con trỏ về ô Họ tên', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('register.html', { vaiTro: 'khach', moi: true });
        t.xoaAlert();
        await p.click('form[name=frmRegister] [type=submit]');
        await p.waitForTimeout(300);
        kq.dat(t.alertCuoi() == 'Họ và tên không được bỏ trống!', 'Thông báo: "' + t.alertCuoi() + '"');
        const oDangChon = await p.evaluate(() => document.activeElement && document.activeElement.id);
        kq.dat(oDangChon == 'txtFullName', 'Con trỏ ở ô ' + oDangChon);
    });

    await t.tc({
        ma: 'TC-S01-12', trang: 'register.html', chucNang: 'Đăng ký - email sai định dạng',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Nhập họ tên 2. Nhập email sai định dạng 3. Bấm Tiếp tục',
        duLieu: 'Nguyễn Văn Test / email-sai', mongDoi: 'Báo "Email không hợp lệ!", con trỏ về ô Email', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('register.html', { vaiTro: 'khach', moi: true });
        t.xoaAlert();
        await p.fill('#txtFullName', 'Nguyễn Văn Test');
        await p.fill('#txtEmail', 'email-sai');
        await p.click('form[name=frmRegister] [type=submit]');
        await p.waitForTimeout(300);
        kq.dat(t.alertCuoi() == 'Email không hợp lệ!', 'Thông báo: "' + t.alertCuoi() + '"');
        const oDangChon = await p.evaluate(() => document.activeElement && document.activeElement.id);
        kq.dat(oDangChon == 'txtEmail', 'Con trỏ ở ô ' + oDangChon);
    });

    await t.tc({
        ma: 'TC-S01-13', trang: 'register.html', chucNang: 'Đăng ký - email đã tồn tại',
        tienDieuKien: 'Email user@roomcraft.vn đã có trong hệ thống', cacBuoc: '1. Nhập họ tên 2. Nhập email đã đăng ký 3. Bấm Tiếp tục',
        duLieu: 'Nguyễn Văn Test / ' + TAI_KHOAN.user.email, mongDoi: 'Báo "Email này đã được đăng ký, vui lòng đăng nhập!"', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('register.html', { vaiTro: 'khach', moi: true });
        t.xoaAlert();
        await p.fill('#txtFullName', 'Nguyễn Văn Test');
        await p.fill('#txtEmail', TAI_KHOAN.user.email);
        await p.click('form[name=frmRegister] [type=submit]');
        await p.waitForTimeout(300);
        kq.dat(t.alertCuoi() == 'Email này đã được đăng ký, vui lòng đăng nhập!', 'Thông báo: "' + t.alertCuoi() + '"');
    });

    await t.tc({
        ma: 'TC-S01-14', trang: 'register.html', chucNang: 'Đăng ký - SĐT sai định dạng (9 số)',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Nhập họ tên, email mới 2. Nhập SĐT 9 số 3. Bấm Tiếp tục',
        duLieu: 'Nguyễn Văn Test / test9so@roomcraft.vn / 090123456', mongDoi: 'Báo "Số điện thoại phải gồm 10 số và bắt đầu bằng số 0!"', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('register.html', { vaiTro: 'khach', moi: true });
        t.xoaAlert();
        await p.fill('#txtFullName', 'Nguyễn Văn Test');
        await p.fill('#txtEmail', 'test9so@roomcraft.vn');
        await p.fill('#txtPhone', '090123456');
        await p.click('form[name=frmRegister] [type=submit]');
        await p.waitForTimeout(300);
        kq.dat(t.alertCuoi() == 'Số điện thoại phải gồm 10 số và bắt đầu bằng số 0!', 'Thông báo: "' + t.alertCuoi() + '"');
    });

    await t.tc({
        ma: 'TC-S01-15', trang: 'register.html', chucNang: 'Đăng ký - SĐT đã được sử dụng',
        tienDieuKien: 'SĐT của user@roomcraft.vn đã tồn tại', cacBuoc: '1. Nhập họ tên, email mới 2. Nhập SĐT đã dùng 3. Bấm Tiếp tục',
        duLieu: 'Nguyễn Văn Test / testtrung@roomcraft.vn / 0900000000', mongDoi: 'Báo "Số điện thoại này đã được sử dụng!"', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('register.html', { vaiTro: 'khach', moi: true });
        t.xoaAlert();
        await p.fill('#txtFullName', 'Nguyễn Văn Test');
        await p.fill('#txtEmail', 'testtrung@roomcraft.vn');
        await p.fill('#txtPhone', '0900000000');
        await p.click('form[name=frmRegister] [type=submit]');
        await p.waitForTimeout(300);
        kq.dat(t.alertCuoi() == 'Số điện thoại này đã được sử dụng!', 'Thông báo: "' + t.alertCuoi() + '"');
    });

    await t.tc({
        ma: 'TC-S01-16', trang: 'register.html', chucNang: 'Đăng ký - mật khẩu không đủ quy tắc',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Nhập đủ họ tên, email, SĐT 2. Nhập mật khẩu yếu "abc" 3. Bấm Tiếp tục',
        duLieu: 'Nguyễn Văn Test / testyeu@roomcraft.vn / 0912345678 / abc', mongDoi: 'Báo lỗi quy tắc mật khẩu, không sang bước OTP', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('register.html', { vaiTro: 'khach', moi: true });
        t.xoaAlert();
        await p.fill('#txtFullName', 'Nguyễn Văn Test');
        await p.fill('#txtEmail', 'testyeu@roomcraft.vn');
        await p.fill('#txtPhone', '0912345678');
        await p.fill('#txtPassword', 'abc');
        await p.fill('#txtConfirm', 'abc');
        await p.click('form[name=frmRegister] [type=submit]');
        await p.waitForTimeout(300);
        const tb = t.alertCuoi();
        kq.dat(tb != null && tb != '', 'Có thông báo lỗi: "' + tb + '"');
        const step2An = await p.evaluate(() => document.getElementById('step2').className.indexOf('hidden') >= 0);
        kq.dat(step2An, 'Bước 2 (OTP) bị ẩn: ' + step2An);
    });

    await t.tc({
        ma: 'TC-S01-17', trang: 'register.html', chucNang: 'Đăng ký - nhập lại mật khẩu không khớp',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Nhập đủ thông tin 2. Mật khẩu mạnh nhưng nhập lại khác 3. Bấm Tiếp tục',
        duLieu: 'Nguyễn Văn Test / testkhac@roomcraft.vn / 0912345678 / Abc@1234 / Abc@9999', mongDoi: 'Báo "Mật khẩu nhập lại không khớp!"', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('register.html', { vaiTro: 'khach', moi: true });
        t.xoaAlert();
        await p.fill('#txtFullName', 'Nguyễn Văn Test');
        await p.fill('#txtEmail', 'testkhac@roomcraft.vn');
        await p.fill('#txtPhone', '0901234567');
        await p.fill('#txtPassword', 'Abc@1234');
        await p.fill('#txtConfirm', 'Abc@9999');
        await p.click('form[name=frmRegister] [type=submit]');
        await p.waitForTimeout(300);
        kq.dat(t.alertCuoi() == 'Mật khẩu nhập lại không khớp!', 'Thông báo: "' + t.alertCuoi() + '"');
    });

    await t.tc({
        ma: 'TC-S01-18', trang: 'register.html', chucNang: 'Đăng ký - chưa đồng ý điều khoản',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Nhập đủ thông tin hợp lệ 2. Không tick đồng ý điều khoản 3. Bấm Tiếp tục',
        duLieu: 'Nguyễn Văn Test / testdk@roomcraft.vn / 0912345678 / Abc@1234', mongDoi: 'Báo "Bạn cần đồng ý với Điều khoản dịch vụ!"', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('register.html', { vaiTro: 'khach', moi: true });
        t.xoaAlert();
        await p.fill('#txtFullName', 'Nguyễn Văn Test');
        await p.fill('#txtEmail', 'testdk@roomcraft.vn');
        await p.fill('#txtPhone', '0901234567');
        await p.fill('#txtPassword', 'Abc@1234');
        await p.fill('#txtConfirm', 'Abc@1234');
        await p.click('form[name=frmRegister] [type=submit]');
        await p.waitForTimeout(300);
        kq.dat(t.alertCuoi() == 'Bạn cần đồng ý với Điều khoản dịch vụ!', 'Thông báo: "' + t.alertCuoi() + '"');
    });

    await t.tc({
        ma: 'TC-S01-19', trang: 'register.html', chucNang: 'Đăng ký - OTP sai',
        tienDieuKien: 'Đã qua bước 1 hợp lệ', cacBuoc: '1. Nhập đủ thông tin hợp lệ, tick điều khoản 2. Bấm Tiếp tục 3. Nhập OTP sai 4. Bấm Xác minh',
        duLieu: 'OTP: 000000 (khác mã thật)', mongDoi: 'Hiện "Mã xác minh không đúng!", chưa tạo tài khoản', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('register.html', { vaiTro: 'khach', moi: true });
        await p.fill('#txtFullName', 'Nguyễn Văn Test');
        await p.fill('#txtEmail', 'testsaiotp@roomcraft.vn');
        await p.fill('#txtPhone', '0901234567');
        await p.fill('#txtPassword', 'Abc@1234');
        await p.fill('#txtConfirm', 'Abc@1234');
        await p.check('#chkAgree');
        await p.click('form[name=frmRegister] [type=submit]');
        await p.waitForTimeout(400);
        const maThat = await t.chu('#lblOtp');
        const maSai = maThat == '000000' ? '111111' : '000000';
        await p.fill('#txtOtp', maSai);
        await p.click('form[name=frmOtp] [type=submit]');
        await p.waitForTimeout(400);
        const loi = await t.chu('#msgOtpError');
        kq.dat(loi == 'Mã xác minh không đúng!', 'Thông báo: "' + loi + '"');
        const coUser = await p.evaluate(() => findUserByEmail('testsaiotp@roomcraft.vn') != null);
        kq.dat(coUser == false, 'Tài khoản đã tạo: ' + coUser);
    });

    await t.tc({
        ma: 'TC-S01-20', trang: 'register.html', chucNang: 'Đăng ký - OTP đúng tạo tài khoản và tự đăng nhập',
        tienDieuKien: 'Đã qua bước 1 hợp lệ', cacBuoc: '1. Nhập đủ thông tin hợp lệ, tick điều khoản 2. Bấm Tiếp tục 3. Nhập đúng OTP 4. Bấm Xác minh',
        duLieu: 'Email mới testotp@roomcraft.vn / Abc@1234', mongDoi: 'Tạo user mới trong rc_users, tự đăng nhập, chuyển về index.html', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('register.html', { vaiTro: 'khach', moi: true });
        await p.fill('#txtFullName', 'Nguyễn Văn Test');
        await p.fill('#txtEmail', 'testotp@roomcraft.vn');
        await p.fill('#txtPhone', '0901234567');
        await p.fill('#txtPassword', 'Abc@1234');
        await p.fill('#txtConfirm', 'Abc@1234');
        await p.check('#chkAgree');
        await p.click('form[name=frmRegister] [type=submit]');
        await p.waitForTimeout(400);
        const maThat = await t.chu('#lblOtp');
        await p.fill('#txtOtp', maThat);
        await p.click('form[name=frmOtp] [type=submit]');
        await p.waitForTimeout(1500);
        kq.dat(/scripts\/index\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
        const users = await t.bang('users');
        const moi = users.filter(u => u.email == 'testotp@roomcraft.vn');
        kq.dat(moi.length == 1, 'Số user mới: ' + moi.length);
        kq.dat(moi.length == 1 && moi[0].is_verified == true, 'is_verified: ' + (moi[0] && moi[0].is_verified));
        const phien = await p.evaluate(() => getSession());
        kq.dat(phien != null && moi.length == 1 && phien.user_id == moi[0].id, 'Phiên: ' + JSON.stringify(phien));
    });

    await t.tc({
        ma: 'TC-S01-21', trang: 'forgot-password.html', chucNang: 'Quên mật khẩu - email chưa đăng ký',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Mở trang Quên mật khẩu 2. Nhập email không tồn tại 3. Bấm Gửi mã xác minh',
        duLieu: 'khongtontai@roomcraft.vn', mongDoi: 'Hiện "Không tìm thấy tài khoản với email này!", không sang bước 2', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('forgot-password.html', { vaiTro: 'khach', moi: true });
        await p.fill('#txtEmail', 'khongtontai@roomcraft.vn');
        await p.click('form[name=frmEmail] [type=submit]');
        await p.waitForTimeout(400);
        const loi = await t.chu('#msgError');
        kq.dat(loi == 'Không tìm thấy tài khoản với email này!', 'Thông báo: "' + loi + '"');
        const step2An = await p.evaluate(() => document.getElementById('step2').className.indexOf('hidden') >= 0);
        kq.dat(step2An, 'Bước 2 bị ẩn: ' + step2An);
    });

    await t.tc({
        ma: 'TC-S01-22', trang: 'forgot-password.html', chucNang: 'Quên mật khẩu - OTP sai',
        tienDieuKien: 'Email user@roomcraft.vn tồn tại', cacBuoc: '1. Nhập email user 2. Bấm Gửi mã 3. Nhập OTP sai 4. Bấm Xác minh',
        duLieu: 'OTP sai', mongDoi: 'Hiện "Mã xác minh không đúng!", không sang bước 3', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('forgot-password.html', { vaiTro: 'khach', moi: true });
        await p.fill('#txtEmail', TAI_KHOAN.user.email);
        await p.click('form[name=frmEmail] [type=submit]');
        await p.waitForTimeout(400);
        const maThat = await t.chu('#lblOtp');
        const maSai = maThat == '000000' ? '111111' : '000000';
        await p.fill('#txtOtp', maSai);
        await p.click('form[name=frmOtp] [type=submit]');
        await p.waitForTimeout(400);
        const loi = await t.chu('#msgOtpError');
        kq.dat(loi == 'Mã xác minh không đúng!', 'Thông báo: "' + loi + '"');
        const step3An = await p.evaluate(() => document.getElementById('step3').className.indexOf('hidden') >= 0);
        kq.dat(step3An, 'Bước 3 bị ẩn: ' + step3An);
    });

    await t.tc({
        ma: 'TC-S01-23', trang: 'forgot-password.html', chucNang: 'Quên mật khẩu - đặt lại thành công, đăng nhập bằng mật khẩu mới',
        tienDieuKien: 'Email user@roomcraft.vn tồn tại', cacBuoc: '1. Nhập email user 2. Nhập đúng OTP 3. Nhập mật khẩu mới 4. Lưu 5. Đăng nhập bằng mật khẩu mới',
        duLieu: 'Mật khẩu mới: MoiMatKhau@1', mongDoi: 'Đặt lại thành công, đăng nhập bằng mật khẩu mới được, password_hash trong rc_users đổi', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('forgot-password.html', { vaiTro: 'khach', moi: true });
        const hashCu = await p.evaluate((email) => findUserByEmail(email).password_hash, TAI_KHOAN.user.email);
        await p.fill('#txtEmail', TAI_KHOAN.user.email);
        await p.click('form[name=frmEmail] [type=submit]');
        await p.waitForTimeout(400);
        const maThat = await t.chu('#lblOtp');
        await p.fill('#txtOtp', maThat);
        await p.click('form[name=frmOtp] [type=submit]');
        await p.waitForTimeout(400);
        await p.fill('#txtNewPassword', 'MoiMatKhau@1');
        await p.fill('#txtConfirm', 'MoiMatKhau@1');
        await p.click('form[name=frmReset] [type=submit]');
        await p.waitForTimeout(1500);
        kq.dat(/login\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
        const hashMoi = await p.evaluate((email) => findUserByEmail(email).password_hash, TAI_KHOAN.user.email);
        kq.dat(hashMoi != hashCu, 'password_hash đã đổi: ' + (hashMoi != hashCu));
        const loiDn = await p.evaluate(([email, mk]) => login(email, mk), [TAI_KHOAN.user.email, 'MoiMatKhau@1']);
        kq.dat(loiDn == '', 'Đăng nhập mật khẩu mới: "' + loiDn + '"');
    });

    await t.tc({
        ma: 'TC-S01-24', trang: 'login.html', chucNang: 'Quên mật khẩu - mật khẩu cũ bị từ chối sau khi đặt lại',
        tienDieuKien: 'Đã đặt lại mật khẩu user thành MoiMatKhau@1', cacBuoc: '1. Đặt lại mật khẩu qua forgot-password 2. Đăng nhập bằng mật khẩu cũ User@123',
        duLieu: 'Mật khẩu cũ: ' + TAI_KHOAN.user.matKhau, mongDoi: 'Hiện "Mật khẩu không đúng!", không tạo phiên', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('forgot-password.html', { vaiTro: 'khach', moi: true });
        await p.fill('#txtEmail', TAI_KHOAN.user.email);
        await p.click('form[name=frmEmail] [type=submit]');
        await p.waitForTimeout(400);
        const maThat = await t.chu('#lblOtp');
        await p.fill('#txtOtp', maThat);
        await p.click('form[name=frmOtp] [type=submit]');
        await p.waitForTimeout(400);
        await p.fill('#txtNewPassword', 'MoiMatKhau@1');
        await p.fill('#txtConfirm', 'MoiMatKhau@1');
        await p.click('form[name=frmReset] [type=submit]');
        await p.waitForTimeout(1500);
        await p.fill('#txtEmail', TAI_KHOAN.user.email);
        await p.fill('#txtPassword', TAI_KHOAN.user.matKhau);
        await p.click('form[name=frmLogin] [type=submit]');
        await p.waitForTimeout(400);
        const loi = await t.chu('#msgError');
        kq.dat(loi == 'Mật khẩu không đúng!', 'Thông báo: "' + loi + '"');
        const phien = await p.evaluate(() => getSession());
        kq.dat(phien == null, 'Phiên: ' + JSON.stringify(phien));
    });

    await t.tc({
        ma: 'TC-S01-25', trang: 'account.html', chucNang: 'Tài khoản - sửa hồ sơ thành công',
        tienDieuKien: 'Đăng nhập user@roomcraft.vn', cacBuoc: '1. Mở trang Tài khoản 2. Sửa họ tên và SĐT hợp lệ (không trùng tài khoản khác) 3. Bấm Lưu thay đổi',
        duLieu: 'Họ tên: Trần Thị Mới / SĐT: chọn số chưa dùng trong rc_users', mongDoi: 'Hiện "Đã lưu thông tin.", rc_users cập nhật đúng', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('account.html', { vaiTro: 'user', moi: true });
        // Chờ form hồ sơ được nạp xong (initPage await loadWardsData rồi mới showAccount)
        await p.waitForFunction(() => {
            var o = document.getElementById('txtFullName');
            return o != null && o.value != '';
        }, null, { timeout: 10000 });
        // Chọn SĐT hợp lệ chưa bị user khác dùng
        const users = await t.bang('users');
        const daDung = users.map(u => u.phone).filter(x => x != null);
        let sdtMoi = '';
        for (let i = 0; i < 100; i++) {
            const so = '09' + String(10000000 + i).slice(0, 8);
            if (daDung.indexOf(so) < 0) { sdtMoi = so; break; }
        }
        kq.ghi('SĐT chọn: ' + sdtMoi);
        await p.fill('#txtFullName', 'Trần Thị Mới');
        await p.fill('#txtPhone', sdtMoi);
        await p.click('form[name=frmProfile] [type=submit]');
        await p.waitForSelector('#msgProfile', { timeout: 5000 });
        await p.waitForFunction(() => document.getElementById('msgProfile').innerHTML.trim() != '', null, { timeout: 5000 });
        const msg = await t.chu('#msgProfile');
        kq.dat(msg == 'Đã lưu thông tin.', 'Thông báo: "' + msg + '"');
        const usersSau = await t.bang('users');
        const u = usersSau.filter(x => x.email == TAI_KHOAN.user.email)[0];
        kq.dat(u && u.full_name == 'Trần Thị Mới', 'full_name: ' + (u && u.full_name));
        kq.dat(u && u.phone == sdtMoi, 'phone: ' + (u && u.phone));
    });

    await t.tc({
        ma: 'TC-S01-26', trang: 'account.html', chucNang: 'Tài khoản - họ tên không hợp lệ (1 chữ)',
        tienDieuKien: 'Đăng nhập user@roomcraft.vn', cacBuoc: '1. Mở trang Tài khoản 2. Nhập họ tên 1 chữ 3. Bấm Lưu thay đổi',
        duLieu: 'Họ tên: An', mongDoi: 'Báo "Họ tên chỉ gồm chữ cái và có ít nhất 2 chữ!", không lưu', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('account.html', { vaiTro: 'user', moi: true });
        await p.waitForFunction(() => {
            var o = document.getElementById('txtFullName');
            return o != null && o.value != '';
        }, null, { timeout: 10000 });
        t.xoaAlert();
        const tenCu = await p.evaluate((email) => findUserByEmail(email).full_name, TAI_KHOAN.user.email);
        await p.fill('#txtFullName', 'An');
        await p.click('form[name=frmProfile] [type=submit]');
        await p.waitForTimeout(400);
        kq.dat(t.alertCuoi() == 'Họ tên chỉ gồm chữ cái và có ít nhất 2 chữ!', 'Thông báo: "' + t.alertCuoi() + '"');
        const tenMoi = await p.evaluate((email) => findUserByEmail(email).full_name, TAI_KHOAN.user.email);
        kq.dat(tenMoi == tenCu, 'Họ tên trong dữ liệu: ' + tenMoi);
    });

    await t.tc({
        ma: 'TC-S01-27', trang: 'account.html', chucNang: 'Tài khoản - đổi mật khẩu sai mật khẩu cũ',
        tienDieuKien: 'Đăng nhập user@roomcraft.vn', cacBuoc: '1. Mở trang Tài khoản 2. Nhập sai mật khẩu hiện tại 3. Nhập mật khẩu mới hợp lệ 4. Bấm Cập nhật',
        duLieu: 'Mật khẩu cũ sai: SaiCu@123 / Mới: MoiMatKhau@1', mongDoi: 'Hiện "Mật khẩu hiện tại không đúng!", password_hash không đổi', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('account.html', { vaiTro: 'user', moi: true });
        await p.waitForFunction(() => {
            var o = document.getElementById('txtFullName');
            return o != null && o.value != '';
        }, null, { timeout: 10000 });
        const hashCu = await p.evaluate((email) => findUserByEmail(email).password_hash, TAI_KHOAN.user.email);
        await p.fill('#txtOldPassword', 'SaiCu@123');
        await p.fill('#txtNewPassword', 'MoiMatKhau@1');
        await p.fill('#txtConfirm', 'MoiMatKhau@1');
        await p.click('#frmPassword [type=submit]');
        await p.waitForTimeout(400);
        const loi = await t.chu('#msgPassword');
        kq.dat(loi == 'Mật khẩu hiện tại không đúng!', 'Thông báo: "' + loi + '"');
        const hashMoi = await p.evaluate((email) => findUserByEmail(email).password_hash, TAI_KHOAN.user.email);
        kq.dat(hashMoi == hashCu, 'password_hash không đổi: ' + (hashMoi == hashCu));
    });

    await t.tc({
        ma: 'TC-S01-28', trang: 'account.html', chucNang: 'Tài khoản - đổi mật khẩu thành công',
        tienDieuKien: 'Đăng nhập user@roomcraft.vn', cacBuoc: '1. Nhập đúng mật khẩu hiện tại 2. Nhập mật khẩu mới hợp lệ 3. Bấm Cập nhật',
        duLieu: TAI_KHOAN.user.matKhau + ' / MoiMatKhau@1', mongDoi: 'Báo "Cập nhật mật khẩu thành công!", password_hash đổi', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('account.html', { vaiTro: 'user', moi: true });
        await p.waitForFunction(() => {
            var o = document.getElementById('txtFullName');
            return o != null && o.value != '';
        }, null, { timeout: 10000 });
        t.xoaAlert();
        const hashCu = await p.evaluate((email) => findUserByEmail(email).password_hash, TAI_KHOAN.user.email);
        await p.fill('#txtOldPassword', TAI_KHOAN.user.matKhau);
        await p.fill('#txtNewPassword', 'MoiMatKhau@1');
        await p.fill('#txtConfirm', 'MoiMatKhau@1');
        await p.click('#frmPassword [type=submit]');
        await p.waitForTimeout(500);
        kq.dat(t.alertCuoi() == 'Cập nhật mật khẩu thành công!', 'Thông báo: "' + t.alertCuoi() + '"');
        const hashMoi = await p.evaluate((email) => findUserByEmail(email).password_hash, TAI_KHOAN.user.email);
        kq.dat(hashMoi != hashCu, 'password_hash đã đổi: ' + (hashMoi != hashCu));
    });

    await t.tc({
        ma: 'TC-S01-29', trang: 'account.html', chucNang: 'Tài khoản - lưu địa chỉ mặc định',
        tienDieuKien: 'Đăng nhập user@roomcraft.vn', cacBuoc: '1. Chọn Tỉnh/Thành, Phường/Xã 2. Nhập số nhà 3. Bấm Lưu thay đổi',
        duLieu: 'Tỉnh: TP. Hồ Chí Minh / Phường: Phường Bến Nghé / Số nhà: 25 Lê Lợi', mongDoi: 'Lưu default_province, default_ward, default_street, default_address trong rc_users', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('account.html', { vaiTro: 'user', moi: true });
        await p.waitForFunction(() => {
            var o = document.getElementById('txtFullName');
            return o != null && o.value != '';
        }, null, { timeout: 10000 });
        const tinh = await p.evaluate(() => {
            var sel = document.getElementById('cboProvince');
            for (var i = 0; i < sel.options.length; i++)
                if (sel.options[i].value == 'TP. Hồ Chí Minh') return sel.options[i].value;
            return sel.options.length > 1 ? sel.options[1].value : '';
        });
        await p.selectOption('#cboProvince', tinh);
        await p.waitForTimeout(500);
        const phuong = await p.evaluate(() => {
            var sel = document.getElementById('txtWard');
            for (var i = 0; i < sel.options.length; i++)
                if (sel.options[i].value != '') return sel.options[i].value;
            return '';
        });
        await p.selectOption('#txtWard', phuong);
        await p.fill('#txtStreet', '25 Lê Lợi');
        await p.click('form[name=frmProfile] [type=submit]');
        await p.waitForSelector('#msgProfile', { timeout: 5000 });
        await p.waitForFunction(() => document.getElementById('msgProfile').innerHTML.trim() != '', null, { timeout: 5000 });
        const msg = await t.chu('#msgProfile');
        kq.dat(msg == 'Đã lưu thông tin.', 'Thông báo: "' + msg + '"');
        const users = await t.bang('users');
        const u = users.filter(x => x.email == TAI_KHOAN.user.email)[0];
        kq.dat(u && u.default_province == tinh, 'default_province: ' + (u && u.default_province));
        kq.dat(u && u.default_ward == phuong, 'default_ward: ' + (u && u.default_ward));
        kq.dat(u && u.default_street == '25 Lê Lợi', 'default_street: ' + (u && u.default_street));
        kq.dat(u && u.default_address != null && u.default_address.indexOf('25 Lê Lợi') >= 0, 'default_address: ' + (u && u.default_address));
    });

    await t.tc({
        ma: 'TC-S01-30', trang: 'account.html', chucNang: 'Tài khoản - đăng xuất',
        tienDieuKien: 'Đăng nhập user@roomcraft.vn', cacBuoc: '1. Mở trang Tài khoản 2. Bấm Đăng xuất 3. Xác nhận',
        duLieu: 'Xác nhận OK', mongDoi: 'Xóa rc_session, chuyển về index.html', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('account.html', { vaiTro: 'user', moi: true });
        await p.waitForFunction(() => {
            var o = document.getElementById('txtFullName');
            return o != null && o.value != '';
        }, null, { timeout: 10000 });
        p.on('dialog', async (d) => { try { await d.accept(); } catch (e) {} });
        await p.click('a[href="javascript:doLogout()"]');
        await p.waitForTimeout(1500);
        kq.dat(/scripts\/index\.html/.test(p.url()), 'Đang ở ' + p.url().split('/scripts/')[1]);
        const phien = await p.evaluate(() => getSession());
        kq.dat(phien == null, 'Phiên sau đăng xuất: ' + JSON.stringify(phien));
    });

    await t.tc({
        ma: 'TC-S01-31', trang: 'login.html', chucNang: 'Đăng nhập - giao diện mobile không cuộn ngang',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Mở trang Đăng nhập trên mobile 2. Kiểm tra cuộn ngang',
        duLieu: 'Màn hình 375x812', mongDoi: 'Không cuộn ngang (0px)', mucDoNeuLoi: 'Nhẹ', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('login.html', { vaiTro: 'khach', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(500);
        const ngang = await t.traNgang();
        kq.dat(ngang == 0, 'Cuộn ngang: ' + ngang + 'px');
    });

    await t.tc({
        ma: 'TC-S01-32', trang: 'register.html', chucNang: 'Đăng ký - mobile: bỏ trống họ tên',
        tienDieuKien: 'Chưa đăng nhập, mobile', cacBuoc: '1. Mở trang Đăng ký trên mobile 2. Bấm Tiếp tục khi trống',
        duLieu: 'Họ tên: (trống)', mongDoi: 'Báo "Họ và tên không được bỏ trống!", không cuộn ngang', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('register.html', { vaiTro: 'khach', moi: true, manHinh: 'mobile' });
        await p.waitForTimeout(500);
        t.xoaAlert();
        await p.click('form[name=frmRegister] [type=submit]');
        await p.waitForTimeout(300);
        kq.dat(t.alertCuoi() == 'Họ và tên không được bỏ trống!', 'Thông báo: "' + t.alertCuoi() + '"');
        const ngang = await t.traNgang();
        kq.dat(ngang == 0, 'Cuộn ngang: ' + ngang + 'px');
    });
});