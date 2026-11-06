// PHIÊN 00 - KHỞI ĐỘNG: mọi trang mở được, không lỗi JS, không file 404, không cuộn ngang (máy tính + điện thoại)
// Chạy phiên này đầu tiên sau mỗi lần pull code mới.
const { phien } = require('../lib/khung-test');

const TRANG_KHACH = ['index.html', 'rooms.html', 'products.html', 'marketplace.html', 'login.html',
                     'register.html', 'forgot-password.html', 'cart.html'];
const TRANG_USER = ['account.html', 'wishlist.html', 'orders.html', 'checkout.html'];
const TRANG_ADMIN = ['admin/index.html', 'admin/products.html', 'admin/categories.html', 'admin/rooms.html',
                     'admin/marketplace.html', 'admin/orders.html', 'admin/users.html', 'admin/reviews.html'];

phien({ ma: 's00', ten: 'Khởi động - mở toàn bộ trang' }, async (t) => {
    let so = 1;
    for (const manHinh of ['pc', 'mobile']) {
        for (const nhom of [[TRANG_KHACH, 'khach'], [TRANG_USER, 'user'], [TRANG_ADMIN, 'admin']]) {
            for (const trang of nhom[0]) {
                const ma = 'TC-S00-' + String(so++).padStart(2, '0');
                await t.tc({
                    ma, trang, manHinh, chucNang: 'Mở trang ' + trang,
                    tienDieuKien: nhom[1] == 'khach' ? 'Chưa đăng nhập' : 'Đăng nhập ' + nhom[1],
                    cacBuoc: 'Mở trang, chờ dữ liệu tải xong',
                    mongDoi: 'Trang hiện nội dung, không lỗi JavaScript, không cuộn ngang',
                    mucDoNeuLoi: 'Nghiêm trọng'
                }, async (kq) => {
                    const p = await t.mo(trang, { manHinh, vaiTro: nhom[1] });
                    const chu = await t.chu();
                    kq.dat(chu && chu.length > 100, 'Trang có ' + (chu ? chu.length : 0) + ' ký tự nội dung');
                    kq.dat(!/login\.html/.test(p.url()) || trang == 'login.html', 'Ở đúng trang (' + p.url().split('/scripts/')[1] + ')');
                    const tran = await t.traNgang(p);
                    kq.dat(tran <= 1, tran <= 1 ? 'Không cuộn ngang' : 'Bị cuộn ngang ' + tran + 'px');
                });
            }
        }
    }
});
