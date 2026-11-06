/* =====================================================================
   KHUNG KIỂM THỬ TỰ ĐỘNG ROOMCRAFT (dùng chung cho mọi phiên test)
   Chạy:  node phien/s01-tai-khoan.js        (tại thư mục _tai-lieu-ca-nhan/test)
   - Tự mở web bằng máy chủ tĩnh riêng (không cần Live Server), trình duyệt ẩn Chromium.
   - Mỗi test case: chạy các bước, so với kết quả mong đợi, chụp ảnh, ghi Đạt / Không đạt.
   - Tự bắt: lỗi JavaScript, lỗi Console, thông báo alert, trang bị cuộn ngang.
   - Kết quả: ket-qua/<phiên>.tsv (dán vào tab "Test case"), ket-qua/<phiên>.md (tóm tắt),
     anh/<Mã TC>.png (minh chứng). Có cau-hinh.json -> gửi thẳng lên Google Sheet.
   ===================================================================== */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium, firefox, webkit, devices } = require('playwright');

const GOC_REPO = (function timGoc(d){ const fs_=require('fs'), p_=require('path'); while(!(fs_.existsSync(p_.join(d,'scripts')) && fs_.existsSync(p_.join(d,'data')))){ const c=p_.dirname(d); if(c===d) throw new Error('Không tìm thấy thư mục gốc repo'); d=c; } return d; })(__dirname);   // gốc repo: thư mục có scripts/ và data/
const THU_MUC_TEST = path.resolve(__dirname, '..');
// Đợt + cấu hình trình duyệt: QA_DOT=d2 QA_CAU_HINH=firefox -> ket-qua/d2/firefox, anh/d2/firefox
const CAU_HINH_TD = {
    edge: { loai: chromium, channel: 'msedge', ten: 'Microsoft Edge' },
    chrome: { loai: chromium, channel: 'chrome', ten: 'Google Chrome' },
    // Firefox của Playwright không mở được trong thư mục có dấu cách (Windows báo thiếu mozglue) -> chép ra D:/pw-firefox
    firefox: { loai: firefox, ten: 'Firefox', exe: process.env.QA_FIREFOX_EXE || (fs.existsSync('D:/pw-firefox/firefox.exe') ? 'D:/pw-firefox/firefox.exe' : undefined) },
    webkit: { loai: webkit, ten: 'Safari (WebKit)' },
    iphone: { loai: webkit, thietBi: 'iPhone 14', ten: 'iPhone 14 - Safari (giả lập)' },
    android: { loai: chromium, channel: 'msedge', thietBi: 'Pixel 7', ten: 'Pixel 7 - Chrome Android (giả lập)' },
    ipad: { loai: webkit, thietBi: 'iPad (gen 7)', ten: 'iPad - Safari (giả lập)' }
};
const CAU_HINH = process.env.QA_CAU_HINH || '';
const TD = CAU_HINH_TD[CAU_HINH] || null;
if (CAU_HINH && !TD) throw new Error('QA_CAU_HINH không hợp lệ: ' + CAU_HINH + ' (chọn: ' + Object.keys(CAU_HINH_TD).join(', ') + ')');
const HAU_TO = path.join(process.env.QA_DOT || '', CAU_HINH);
const THU_MUC_ANH = path.join(THU_MUC_TEST, 'anh', HAU_TO);
const THU_MUC_KQ = path.join(THU_MUC_TEST, 'ket-qua', HAU_TO);
const CONG = Number(process.env.QA_CONG) || 5599;   // chạy nhiều phiên song song thì mỗi phiên 1 cổng
const MAN_HINH = {
    pc: { width: 1440, height: 900, ten: 'Máy tính 1440px' },
    mobile: { width: 390, height: 844, ten: 'Điện thoại 390px' }
};
// Tài khoản mẫu có sẵn trong data/json/users.json
const TAI_KHOAN = {
    admin: { email: 'admin@roomcraft.vn', matKhau: 'Admin@123' },
    user: { email: 'user@roomcraft.vn', matKhau: 'User@123' }
};
const LOAI_FILE = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.webp': 'image/webp', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.mp4': 'video/mp4'
};

function moMayChu() {
    const server = http.createServer((req, res) => {
        let duongDan = decodeURIComponent(req.url.split('?')[0]);
        if (duongDan === '/') duongDan = '/index.html';
        const file = path.join(GOC_REPO, duongDan);
        if (!file.startsWith(GOC_REPO)) { res.writeHead(403); return res.end(); }
        fs.stat(file, (loi, st) => {
            if (loi || !st.isFile()) { res.writeHead(404); return res.end('404'); }
            res.writeHead(200, { 'Content-Type': LOAI_FILE[path.extname(file).toLowerCase()] || 'application/octet-stream' });
            fs.createReadStream(file).pipe(res);
        });
    });
    return new Promise(ok => server.listen(CONG, () => ok(server)));
}

function oTsv(gt) {
    return String(gt == null ? '' : gt).replace(/\t/g, ' ').replace(/\r?\n/g, ' | ').trim();
}

/* Tạo một phiên test.
   thongTin = { ma: 's05', ten: 'Giỏ hàng & Thanh toán' }
   hamChay(t) chứa các t.tc(...) */
async function phien(thongTin, hamChay) {
    fs.mkdirSync(THU_MUC_ANH, { recursive: true });
    fs.mkdirSync(THU_MUC_KQ, { recursive: true });
    const server = await moMayChu();
    // Ưu tiên Chromium của Playwright; chưa tải được thì dùng Edge có sẵn trên Windows (cùng nhân Chromium)
    let trinhDuyet;
        if (TD && TD.channel === 'msedge') trinhDuyet = await moEdge();
    else if (TD) trinhDuyet = await TD.loai.launch(TD.channel ? { channel: TD.channel } : (TD.exe ? { executablePath: TD.exe } : {}));
    else {
        try { trinhDuyet = await chromium.launch(); }
        catch (e) { trinhDuyet = await chromium.launch({ channel: 'msedge' }); console.log('(Dùng Microsoft Edge vì chưa có Chromium của Playwright)'); }
    }
    const ketQua = [];
    const ngay = new Date().toLocaleDateString('vi-VN');
    const tenPhien = thongTin.ma + ' - ' + thongTin.ten;
    let ngCanh = null;          // context hiện tại (giữ localStorage giữa các bước)
    let manHinhHienTai = 'pc';
    const nhatKy = { loiJs: [], loiConsole: [], alert: [], mangLoi: [], huyConfirm: 0 };
    // Lỗi bất đồng bộ lọt ra ngoài (vd. script test tự xử lý dialog) không được làm dừng cả phiên
    process.on('unhandledRejection', e => console.log('[LỖI NGẦM] ' + String(e && e.message || e).split(/\r?\n/)[0]));

    async function taoNguCanh(manHinh) {
        if (ngCanh) await ngCanh.close();
        manHinhHienTai = manHinh || 'pc';
        const mh = MAN_HINH[manHinhHienTai];
        // Cấu hình thiết bị (iPhone/Android/iPad): mọi test chạy trên đúng thiết bị đó (màn hình, cảm ứng, user-agent)
        ngCanh = await trinhDuyet.newContext(TD && TD.thietBi ? { ...devices[TD.thietBi] } : { viewport: { width: mh.width, height: mh.height } });
        // Không gọi ra Internet (CDN, Google, AI) để kết quả ổn định; cần thì đặt choMang: true
        if (!thongTin.choMang)
            await ngCanh.route(u => !u.href.startsWith('http://localhost:' + CONG), r => r.abort());
        return ngCanh;
    }

    const t = {
        TAI_KHOAN,
        /* Mở trang. tuyChon: { manHinh: 'pc'|'mobile', vaiTro: 'khach'|'user'|'admin', moi: true (xóa dữ liệu, bắt đầu sạch) } */
        async mo(trang, tuyChon) {
            tuyChon = tuyChon || {};
            if (!ngCanh || tuyChon.moi || (tuyChon.manHinh && tuyChon.manHinh !== manHinhHienTai))
                await taoNguCanh(tuyChon.manHinh);
            // Đóng trang của bước trước (ảnh minh chứng đã chụp xong) để không mở chồng nhiều tab
            if (t.trang && !t.trang.isClosed()) await t.trang.close();
            const p = await ngCanh.newPage();
            // Nhớ phần tử vừa thao tác để khoanh đỏ trong ảnh minh chứng
            for (const ham of ['click', 'fill', 'check', 'uncheck', 'selectOption', 'type', 'press', 'hover', 'setInputFiles']) {
                const goc = p[ham].bind(p);
                p[ham] = (sel, ...conLai) => { if (typeof sel === 'string') t._oCuoi = sel; return goc(sel, ...conLai); };
            }
            // goto/reload trong script test cũng tự chờ trang nạp xong dữ liệu
            for (const ham of ['goto', 'reload']) {
                const goc = p[ham].bind(p);
                p[ham] = async (...ts) => { const r = await goc(...ts); await choNapXong(p); return r; };
            }
            p.on('pageerror', e => nhatKy.loiJs.push(trang + ': ' + e.message));
            p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::|Failed to load resource/.test(m.text())) nhatKy.loiConsole.push(trang + ': ' + m.text()); });
            p.on('dialog', d => {
                nhatKy.alert.push(d.message());
                if (p.listenerCount('dialog') > 1) return;   // script test tự xử lý hộp thoại này
                const huy = d.type() === 'confirm' && nhatKy.huyConfirm > 0;
                if (huy) nhatKy.huyConfirm--;
                (huy ? d.dismiss() : d.accept()).catch(() => {});
            });
            p.on('requestfailed', r => { if (r.url().startsWith('http://localhost:' + CONG)) nhatKy.mangLoi.push(r.url()); });
            p.on('response', r => { if (r.status() === 404 && r.url().startsWith('http://localhost:' + CONG)) nhatKy.mangLoi.push('404 ' + r.url().replace('http://localhost:' + CONG, '')); });
            p.setDefaultNavigationTimeout(60000);
            await p.goto('http://localhost:' + CONG + '/scripts/' + trang);
            if (tuyChon.vaiTro && tuyChon.vaiTro !== 'khach') {
                const tk = TAI_KHOAN[tuyChon.vaiTro];
                const loi = await p.evaluate(([e, m]) => { localStorage.removeItem('rc_session'); return login(e, m); }, [tk.email, tk.matKhau]);
                if (loi) throw new Error('Không đăng nhập được ' + tk.email + ': ' + loi);
                // Trang cần đăng nhập có thể đã chuyển sang login.html -> mở lại đúng trang cần test
                await p.goto('http://localhost:' + CONG + '/scripts/' + trang);
            }
            if (tuyChon.vaiTro === 'khach') {
                await p.evaluate(() => localStorage.removeItem('rc_session'));
                await p.reload();
                await p.waitForTimeout(1000);
            }
            t.trang = p;
            return p;
        },
        /* Thông báo alert gần nhất (nguyên văn) */
        alertCuoi() { return nhatKy.alert.length ? nhatKy.alert[nhatKy.alert.length - 1] : ''; },
        xoaAlert() { nhatKy.alert.length = 0; },
        /* Hộp confirm kế tiếp sẽ bấm Hủy (mặc định khung bấm OK) */
        huyConfirm(soLan) { nhatKy.huyConfirm = soLan || 1; },
        /* Đọc bảng dữ liệu trong localStorage (vd. 'orders', 'products') */
        async bang(ten) { return t.trang.evaluate(n => getTable(n), ten); },
        /* Trang có bị cuộn ngang không: trả về số px tràn (0 = không tràn) */
        async traNgang(p) {
            p = p || t.trang;
            return p.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
        },
        /* Chữ đang hiện trên trang (để so với kết quả mong đợi) */
        async chu(selector) {
            return t.trang.evaluate(s => { const e = s ? document.querySelector(s) : document.body; return e ? e.innerText.replace(/\s+/g, ' ').trim() : null; }, selector || null);
        },
        /* Một test case. tc = { ma, trang, chucNang, tienDieuKien, cacBuoc, duLieu, mongDoi, mucDoNeuLoi, manHinh, ghiChu }
           hamKiem(kq) chạy các bước; gọi kq.dat(dk, 'mô tả thực tế') cho từng điều kiện cần đúng. */
        async tc(tc, hamKiem) {
            const dong = { tc, thucTe: [], dat: true, ghiChu: tc.ghiChu || '' };
            const soLoiJsTruoc = nhatKy.loiJs.length;
            const soAlertTruoc = nhatKy.alert.length;
            t._oCuoi = null;
            let oDanhDau;               // undefined = tự lấy phần tử thao tác cuối
            const kq = {
                /* Khoanh đỏ phần tử này trong ảnh (null = không khoanh) */
                danhDau(selector) { oDanhDau = selector; },
                dat(dieuKien, moTaThucTe) {
                    dong.thucTe.push((dieuKien ? '' : '[SAI] ') + moTaThucTe);
                    if (!dieuKien) dong.dat = false;
                },
                ghi(moTa) { dong.thucTe.push(moTa); }
            };
            try {
                await hamKiem(kq);
            } catch (e) {
                dong.dat = false;
                dong.thucTe.push('[LỖI KHI CHẠY] ' + String(e.message).split('\n')[0]);
            }
            const loiJsMoi = nhatKy.loiJs.slice(soLoiJsTruoc);
            if (loiJsMoi.length) { dong.dat = false; dong.thucTe.push('[LỖI JS] ' + loiJsMoi.join(' ; ')); }
            let tenAnh = '';
            if (t.trang && !t.trang.isClosed()) {
                tenAnh = tc.ma + (dong.dat ? '' : '_loi') + '.jpg';
                try {
                    await chupMinhChung(t.trang, {
                        ma: tc.ma, ten: tc.chucNang || '', dat: dong.dat, mongDoi: tc.mongDoi || '',
                        thucTe: dong.thucTe.join(' ; ').slice(0, 400),
                        alerts: nhatKy.alert.slice(soAlertTruoc),
                        sel: oDanhDau === undefined ? t._oCuoi : oDanhDau
                    }, path.join(THU_MUC_ANH, tenAnh), !!tc.toanTrang);
                } catch (e) { tenAnh = ''; }
            }
            ketQua.push([
                tc.ma, tenPhien, tc.trang || '', tc.chucNang || '', tc.tienDieuKien || '', tc.cacBuoc || '', tc.duLieu || '', tc.mongDoi || '',
                dong.thucTe.join(' ; '), dong.dat ? 'Đạt' : 'Không đạt', dong.dat ? '' : (tc.mucDoNeuLoi || 'Trung bình'),
                tenAnh, TD ? (TD.thietBi ? TD.ten : TD.ten + ' · ' + MAN_HINH[tc.manHinh || manHinhHienTai].ten) : MAN_HINH[tc.manHinh || manHinhHienTai].ten, ngay, dong.ghiChu
            ].map(oTsv));
            console.log((dong.dat ? 'ĐẠT       ' : 'KHÔNG ĐẠT ') + tc.ma + '  ' + (tc.chucNang || '') + (dong.dat ? '' : '\n          -> ' + dong.thucTe.join(' ; ')));
        }
    };

    try {
        await hamChay(t);
    } catch (e) {
        console.log('[DỪNG PHIÊN] ' + e.message);
    }
    if (ngCanh) await ngCanh.close();
    // Ảnh thu nhỏ (anh/nho/) để chèn vào Excel và Google Sheet
    const tenCacAnh = ketQua.map(d => d[11]).filter(Boolean);
    try { await taoAnhNho(trinhDuyet, tenCacAnh); } catch (e) { console.log('Không tạo được ảnh thu nhỏ: ' + e.message); }
    await trinhDuyet.close();
    server.close();

    // Ghi kết quả
    const tieuDe = ['Mã TC', 'Phiên test', 'Trang / Phân hệ', 'Chức năng', 'Tiền điều kiện', 'Các bước', 'Dữ liệu nhập',
                    'Kết quả mong đợi', 'Kết quả thực tế', 'Trạng thái', 'Mức độ lỗi', 'Ảnh minh chứng', 'Màn hình', 'Ngày test', 'Ghi chú', 'Ảnh gốc'];
    fs.writeFileSync(path.join(THU_MUC_KQ, thongTin.ma + '.tsv'), ketQua.map(d => d.join('\t')).join('\n') + '\n', 'utf8');
    const soDat = ketQua.filter(d => d[9] === 'Đạt').length;
    let md = '# ' + tenPhien + ' (' + ngay + ')\n\nĐạt ' + soDat + '/' + ketQua.length + '\n\n';
    md += '| Mã TC | Chức năng | Trạng thái | Kết quả thực tế |\n|---|---|---|---|\n';
    for (const d of ketQua) md += '| ' + d[0] + ' | ' + d[3] + ' | ' + d[9] + ' | ' + d[8].replace(/\|/g, '/') + ' |\n';
    md += '\nLỗi Console (cả phiên): ' + (nhatKy.loiConsole.length ? '\n- ' + nhatKy.loiConsole.join('\n- ') : 'không có') + '\n';
    md += '\nFile không tải được (404): ' + (nhatKy.mangLoi.length ? '\n- ' + [...new Set(nhatKy.mangLoi)].join('\n- ') : 'không có') + '\n';
    fs.writeFileSync(path.join(THU_MUC_KQ, thongTin.ma + '.md'), md, 'utf8');
    fs.writeFileSync(path.join(THU_MUC_KQ, thongTin.ma + '.json'), JSON.stringify({
        ma: thongTin.ma, ten: thongTin.ten, ngay, tieuDe, rows: ketQua,
        loiConsole: nhatKy.loiConsole, mangLoi: [...new Set(nhatKy.mangLoi)]
    }, null, 1), 'utf8');
    console.log('\n' + tenPhien + ': Đạt ' + soDat + '/' + ketQua.length + ' -> ket-qua/' + thongTin.ma + '.tsv, .md; ảnh trong anh/');

    // Excel tổng hợp mọi phiên đã chạy, có ảnh minh chứng
    try {
        const fileXlsx = await require('./xuat-excel').xuatExcel();
        console.log('Excel: ' + path.relative(THU_MUC_TEST, fileXlsx));
    } catch (e) { console.log('Không xuất được Excel: ' + e.message); }

    // Gửi lên Google Sheet nếu đã cấu hình (xem HUONG-DAN.md)
    const fileCauHinh = path.join(THU_MUC_TEST, 'cau-hinh.json');
    if (process.env.QA_KHONG_GUI) console.log('(Bỏ qua gửi Google Sheet: đang chạy thử)');
    else if (fs.existsSync(fileCauHinh)) {
        const cauHinh = JSON.parse(fs.readFileSync(fileCauHinh, 'utf8'));
        if (cauHinh.sheetWebAppUrl) await guiSheet(cauHinh.sheetWebAppUrl, tieuDe, ketQua, thongTin.ma, process.env.QA_TAB);
    }
}

/* Chờ trang nạp xong dữ liệu (hàm dùng chung đã có, localStorage đã nạp đủ bảng) thay vì chờ cố định;
   máy bận (nhiều phiên song song, trình duyệt chậm như WebKit) vẫn ổn định */
async function choNapXong(p) {
    try {
        await p.waitForLoadState('load', { timeout: 60000 });
        await p.waitForFunction(() => typeof getTable === 'function' && typeof login === 'function'
            && localStorage.getItem('rc_version') && localStorage.getItem('rc_users') && localStorage.getItem('rc_products'), null, { timeout: 45000 });
    } catch (e) { /* trang không dùng store (hiếm) -> vẫn chờ tối thiểu bên dưới */ }
    // Hàm dịch vụ mà trang không nạp (vd. addToCart trên orders.html) -> nạp bổ sung để script test chuẩn bị dữ liệu.
    // Chỉ nạp file còn thiếu, không ghi đè hàm trang đã có.
    try {
        const thieu = await p.evaluate(() => typeof getTable !== 'function' ? [] : [
            ['addToCart', 'js/services/products.js'], ['addToCart', 'js/services/cart.js'],
            ['calcShippingFee', 'js/services/shipping.js'], ['createOrder', 'js/services/orders.js']
        ].filter(([ham, f], i, ds) => typeof window[ham] !== 'function' && !(i === 0 && typeof getActiveProducts === 'function')).map(x => x[1]));
        for (const f of [...new Set(thieu)]) await p.addScriptTag({ url: new URL(f, p.url().replace(/scripts\/.*$/, 'scripts/')).href }).catch(() => {});
    } catch (e) { /* trang đang chuyển hướng */ }
    await p.waitForTimeout(800);       // vẽ trang
}

/* Chèn chú thích + khung đỏ + alert lên trang rồi chụp JPEG */
async function chupMinhChung(p, tt, fileAnh, toanTrang) {
    await p.evaluate((tt) => {
        const goc = document.createElement('div');
        goc.id = '__qa_chu_thich';
        goc.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647;font:13px/1.45 Arial,sans-serif';
        if (tt.sel) {
            try {
                const e = document.querySelector(tt.sel);
                if (e && e.getClientRects().length) {
                    e.scrollIntoView({ block: 'center' });
                    const r = e.getBoundingClientRect();
                    const k = document.createElement('div');
                    k.style.cssText = 'position:fixed;border:3px solid #e11d48;border-radius:6px;box-shadow:0 0 0 4px rgba(225,29,72,.25);'
                        + 'left:' + (r.left - 5) + 'px;top:' + (r.top - 5) + 'px;width:' + (r.width + 4) + 'px;height:' + (r.height + 4) + 'px';
                    goc.appendChild(k);
                }
            } catch (e) { /* selector không hợp lệ với querySelector -> bỏ qua */ }
        }
        if (tt.alerts.length) {
            const a = document.createElement('div');
            a.style.cssText = 'position:fixed;top:14px;left:50%;transform:translateX(-50%);width:max-content;max-width:min(480px,92vw);'
                + 'background:#fff;color:#111;border:1px solid #999;border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.35);padding:10px 14px';
            const tieuDe = document.createElement('div');
            tieuDe.style.cssText = 'font-weight:bold;margin-bottom:4px';
            tieuDe.textContent = 'Hộp thoại (alert) trang đã hiện:';
            a.appendChild(tieuDe);
            for (const m of tt.alerts.slice(-3)) { const d = document.createElement('div'); d.textContent = '“' + m + '”'; a.appendChild(d); }
            goc.appendChild(a);
        }
        const b = document.createElement('div');
        b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;color:#fff;padding:7px 12px;background:' + (tt.dat ? 'rgba(6,95,70,.94)' : 'rgba(159,18,57,.94)');
        const d1 = document.createElement('div');
        d1.style.fontWeight = 'bold';
        d1.textContent = tt.ma + '  ·  ' + (tt.dat ? 'ĐẠT' : 'KHÔNG ĐẠT') + '  ·  ' + tt.ten;
        const d2 = document.createElement('div'); d2.textContent = 'Mong đợi: ' + tt.mongDoi;
        const d3 = document.createElement('div'); d3.textContent = 'Thực tế: ' + tt.thucTe;
        b.append(d1, d2, d3);
        goc.appendChild(b);
        document.body.appendChild(goc);
    }, tt);
    await p.screenshot({ path: fileAnh, type: 'jpeg', quality: 72, fullPage: toanTrang });
    await p.evaluate(() => { const e = document.getElementById('__qa_chu_thich'); if (e) e.remove(); }).catch(() => {});
}

/* Thu nhỏ ảnh (tối đa 480x300) bằng canvas của Chromium, lưu anh/nho/ */
// Edge 156 không còn mở được bằng launch() của Playwright 1.48 (đóng ngay khi khởi động).
// Cách thay: tự chạy msedge.exe ở chế độ ẩn với cổng gỡ lỗi riêng rồi kết nối qua CDP; đóng thì tắt luôn tiến trình.
async function moEdge() {
    const { spawn } = require('child_process'), os = require('os'), net = require('net');
    const cong = await new Promise(r => { const sv = net.createServer().listen(0, () => { const c = sv.address().port; sv.close(() => r(c)); }); });
    const thuMuc = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-edge-'));
    const exe = process.env.QA_EDGE_EXE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
    const tt = spawn(exe, ['--headless=new', '--remote-debugging-port=' + cong, '--user-data-dir=' + thuMuc, '--no-first-run', '--no-default-browser-check',
        '--disable-extensions', '--disable-background-networking', '--disable-component-update', '--mute-audio', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
    let td, loi;
    for (let i = 0; i < 60 && !td; i++) { await new Promise(r => setTimeout(r, 500)); try { td = await chromium.connectOverCDP('http://127.0.0.1:' + cong); } catch (e) { loi = e; } }
    if (!td) { tt.kill(); throw loi; }
    const dong = td.close.bind(td);
    td.close = async () => { try { await dong(); } catch (e) {} try { tt.kill(); } catch (e) {} setTimeout(() => { try { fs.rmSync(thuMuc, { recursive: true, force: true }); } catch (e) {} }, 1500); };
    return td;
}

async function taoAnhNho(trinhDuyet, tenCacAnh) {
    if (!tenCacAnh.length) return;
    const thuMucNho = path.join(THU_MUC_ANH, 'nho');
    fs.mkdirSync(thuMucNho, { recursive: true });
    const p = await trinhDuyet.newPage();
    for (const ten of tenCacAnh) {
        const goc = fs.readFileSync(path.join(THU_MUC_ANH, ten)).toString('base64');
        const nho = await p.evaluate(async (b64) => {
            const img = new Image();
            img.src = 'data:image/jpeg;base64,' + b64;
            await img.decode();
            const s = Math.min(480 / img.width, 300 / img.height, 1);
            const c = document.createElement('canvas');
            c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            return c.toDataURL('image/jpeg', 0.75).split(',')[1];
        }, goc);
        fs.writeFileSync(path.join(thuMucNho, ten), Buffer.from(nho, 'base64'));
    }
    await p.close();
}

/* Gửi kết quả + ảnh lên Apps Script, mỗi lần 8 dòng cho nhẹ */
async function guiSheet(url, tieuDe, ketQua, maPhien, tab, thuMucAnh) {
    const ANH = thuMucAnh || THU_MUC_ANH;
    let capNhat = 0, themMoi = 0;
    try {
        for (let i = 0; i < ketQua.length; i += 8) {
            const rows = ketQua.slice(i, i + 8).map(d => {
                const ten = d[11];
                const anh = ten && fs.existsSync(path.join(ANH, 'nho', ten)) ? {
                    ten: (tab ? tab.replace(/[^\w-]+/g, '_') + '_' : '') + ten,
                    goc: fs.readFileSync(path.join(ANH, ten)).toString('base64'),
                    nho: fs.readFileSync(path.join(ANH, 'nho', ten)).toString('base64')
                } : null;
                return { dong: d, anh };
            });
            const r = await fetch(url, { method: 'POST', body: JSON.stringify({ tab, tieuDe, rows }) });
            const kq = JSON.parse(await r.text());
            if (!kq.ok) throw new Error(kq.loi || 'Apps Script báo lỗi');
            capNhat += kq.capNhat; themMoi += kq.themMoi;
            if (kq.loiAnh && kq.loiAnh.length) console.log('  Ảnh lỗi: ' + kq.loiAnh.join(' ; '));
        }
        console.log('Google Sheet: cập nhật ' + capNhat + ', thêm mới ' + themMoi + ' dòng (kèm ảnh)');
    } catch (e) {
        console.log('Không gửi được lên Google Sheet (' + e.message + '). Dán thủ công file ket-qua/' + maPhien + '.tsv');
    }
}

module.exports = { phien, TAI_KHOAN, MAN_HINH, guiSheet, CAU_HINH_TD };
