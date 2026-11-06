// Đợt 2 tự động: chạy mọi cấu hình -> ma trận -> DeepSeek phân loại lỗi tương thích -> gửi các tab Google Sheet.
// Dùng (trong thư mục tests/): node tools/dot2-tu-dong.js [--bo-chay] [--bo-gui]
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const TEST = path.resolve(__dirname, '..');
const KQ = path.join(TEST, 'ket-qua', 'd2');
const CO = n => process.argv.includes('--' + n);
const { CAU_HINH_TD, guiSheet } = require('../lib/khung-test');
const TAB = { edge: 'Đ2-Edge', chrome: 'Đ2-Chrome', firefox: 'Đ2-Firefox', webkit: 'Đ2-Safari (WebKit)', iphone: 'Đ2-iPhone', android: 'Đ2-Android', ipad: 'Đ2-iPad' };
const nhatKy = m => { const d = new Date().toLocaleTimeString('vi-VN') + ' ' + m; console.log(d); fs.appendFileSync(path.join(KQ, 'nhat-ky.txt'), d + '\n'); };
fs.mkdirSync(KQ, { recursive: true });

function coNhan(loai) {
    const b = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
    return fs.existsSync(b) && fs.readdirSync(b).some(d => d.startsWith(loai + '-') && fs.existsSync(path.join(b, d, 'INSTALLATION_COMPLETE')));
}
const docPhien = ch => { const d = path.join(KQ, ch); return fs.existsSync(d) ? fs.readdirSync(d).filter(f => /^s\d+\.json$/.test(f)).sort().map(f => JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'))) : []; };

(async () => {
    // 1. Chạy từng cấu hình (lần lượt để máy không quá tải)
    const cauHinh = Object.keys(CAU_HINH_TD).filter(ch => {
        if (['firefox'].includes(ch)) return coNhan('firefox');
        if (['webkit', 'iphone', 'ipad'].includes(ch)) return coNhan('webkit');
        return true;
    });
    nhatKy('Cấu hình sẽ chạy: ' + cauHinh.join(', ') + (cauHinh.length < 7 ? ' (thiếu nhân trình duyệt cho phần còn lại)' : ''));
    if (!CO('bo-chay')) for (const ch of cauHinh) {
        nhatKy('Bắt đầu ' + ch);
        const r = spawnSync(process.execPath, [path.join(__dirname, 'chay-cau-hinh.js'), ch, '--song-song', '3'], { cwd: TEST, encoding: 'utf8', timeout: 4 * 3600 * 1000 });
        nhatKy((r.stdout || '').trim().split('\n').join(' | '));
    }

    // 2. Ma trận Mã TC x cấu hình
    const daChay = cauHinh.filter(ch => docPhien(ch).length);
    const tc = {};   // ma -> { chucNang, phien, kq: {ch: [trangThai, thucTe]} }
    for (const ch of daChay) for (const ph of docPhien(ch)) for (const r of ph.rows) {
        tc[r[0]] = tc[r[0]] || { chucNang: r[3], phien: ph.ma + ' - ' + ph.ten, kq: {} };
        tc[r[0]].kq[ch] = [r[9], r[8]];
    }
    const ds = Object.entries(tc).sort((a, b) => a[0].localeCompare(b[0], 'en', { numeric: true }));
    const nhom = ([, v]) => {
        const tt = daChay.map(ch => (v.kq[ch] || ['Chưa chạy'])[0]);
        if (tt.every(x => x === 'Đạt')) return 'Đạt mọi cấu hình';
        if (tt.every(x => x !== 'Đạt')) return 'Không đạt mọi cấu hình';
        return 'Chỉ lỗi ở: ' + daChay.filter(ch => v.kq[ch] && v.kq[ch][0] !== 'Đạt').join(', ');
    };
    const bangMaTran = [['Mã TC', 'Phiên', 'Chức năng', ...daChay.map(ch => CAU_HINH_TD[ch].ten), 'Nhận định']];
    for (const e of ds) bangMaTran.push([e[0], e[1].phien, e[1].chucNang, ...daChay.map(ch => (e[1].kq[ch] || ['Chưa chạy'])[0]), nhom(e)]);
    fs.writeFileSync(path.join(KQ, 'ma-tran.json'), JSON.stringify(bangMaTran));
    nhatKy('Ma trận: ' + ds.length + ' TC x ' + daChay.length + ' cấu hình');

    // 3. DeepSeek phân loại các TC chỉ lỗi ở một số cấu hình (nghi lỗi tương thích)
    const nghi = ds.filter(e => nhom(e).startsWith('Chỉ lỗi'));
    if (nghi.length) {
        let yc = 'Phân loại các test case dưới đây: chúng ĐẠT ở một số trình duyệt nhưng KHÔNG ĐẠT ở trình duyệt khác. Với mỗi test trả về 1 dòng bảng Markdown: '
            + '| Mã TC | Kết luận (LỖI TƯƠNG THÍCH / DO SCRIPT-MÔI TRƯỜNG / CHƯA RÕ) | Trình duyệt bị ảnh hưởng | Giải thích ngắn |. '
            + 'DO SCRIPT-MÔI TRƯỜNG = quá thời gian chờ, trang chưa nạp, API Playwright khác nhau giữa nhân, giả lập thiết bị dùng bố cục điện thoại cho test viết cho máy tính. '
            + 'LỖI TƯƠNG THÍCH = website hiển thị/hoạt động sai thật trên trình duyệt đó (CSS không hỗ trợ, sự kiện cảm ứng, định dạng ngày/số, tràn bố cục...).\n\n';
        for (const e of nghi) yc += '- ' + e[0] + ' (' + e[1].chucNang + '): ' + daChay.filter(ch => e[1].kq[ch] && e[1].kq[ch][0] !== 'Đạt').map(ch => ch + ' => ' + e[1].kq[ch][1].slice(0, 260)).join(' || ') + '\n';
        fs.writeFileSync(path.join(KQ, 'tuong-thich-yc.md'), yc);
        fs.writeFileSync(path.join(KQ, 'he.md'), 'Bạn là kỹ sư QA kiểm thử tương thích trình duyệt. Chỉ trả về bảng Markdown.');
        spawnSync(process.execPath, [path.join(__dirname, 'llm.mjs'), '--model', 'ds', '--in', path.join(KQ, 'tuong-thich-yc.md'), '--system', path.join(KQ, 'he.md'), '--out', path.join(KQ, 'TUONG-THICH.md'), '--max', '12000'], { encoding: 'utf8' });
        nhatKy('DeepSeek phân loại ' + nghi.length + ' TC nghi tương thích -> TUONG-THICH.md');
    }

    if (CO('bo-gui')) return nhatKy('Bỏ qua gửi Sheet');
    const url = JSON.parse(fs.readFileSync(path.join(TEST, 'cau-hinh.json'), 'utf8')).sheetWebAppUrl;
    const guiBang = async (tab, bang, doRong) => {
        const r = await fetch(url, { method: 'POST', body: JSON.stringify({ tab, cheDo: 'bang', bang, doRong }) });
        nhatKy('Tab ' + tab + ': ' + (await r.text()).slice(0, 80));
    };

    // 4. Tab Tổng quan (theo phiên x cấu hình) + ma trận
    const tq = [['Phiên', ...daChay.map(ch => CAU_HINH_TD[ch].ten)]];
    const tenPhien = [...new Set(ds.map(e => e[1].phien))];
    for (const ph of tenPhien) tq.push([ph, ...daChay.map(ch => { const r = ds.filter(e => e[1].phien === ph && e[1].kq[ch]); const d = r.filter(e => e[1].kq[ch][0] === 'Đạt').length; return r.length ? d + '/' + r.length + ' (' + Math.round(100 * d / r.length) + '%)' : '-'; })]);
    tq.push(['TỔNG', ...daChay.map(ch => { const r = ds.filter(e => e[1].kq[ch]); const d = r.filter(e => e[1].kq[ch][0] === 'Đạt').length; return d + '/' + r.length + ' (' + (100 * d / r.length).toFixed(1) + '%)'; })]);
    await guiBang('Đ2-Tổng quan', tq, [300, ...daChay.map(() => 150)]);
    await guiBang('Đ2-Ma trận', bangMaTran, [95, 200, 260, ...daChay.map(() => 95), 220]);

    // 5. Tab Hồi quy (Edge đợt 2 so với đợt 1)
    const d1 = {};
    const thuMucD1 = path.join(TEST, 'ket-qua-dot1');
    if (fs.existsSync(thuMucD1)) for (const f of fs.readdirSync(thuMucD1).filter(f => /^s\d+\.json$/.test(f))) for (const r of JSON.parse(fs.readFileSync(path.join(thuMucD1, f), 'utf8')).rows) d1[r[0]] = r[9];
    const hq = [['Mã TC', 'Chức năng', 'Đợt 1 (Edge)', 'Đợt 2 (Edge)', 'Thay đổi', 'Kết quả thực tế đợt 2']];
    for (const ph of docPhien('edge')) for (const r of ph.rows) {
        const cu = d1[r[0]] || 'Mới';
        const td = cu === 'Mới' ? 'Test mới' : cu === r[9] ? (r[9] === 'Đạt' ? 'Giữ nguyên đạt' : 'Vẫn còn') : (r[9] === 'Đạt' ? 'Đã sửa' : 'Lỗi mới');
        hq.push([r[0], r[3], cu, r[9], td, r[8].slice(0, 400)]);
    }
    await guiBang('Đ2-Hồi quy', hq, [95, 260, 90, 90, 110, 500]);

    // 6. Tab checklist máy thật
    const fCl = path.join(TEST, 'tools', 'checklist-may-that.md');
    if (fs.existsSync(fCl)) {
        const cl = [['Mã', 'Hạng mục', 'Thao tác', 'Kết quả mong đợi', 'iPhone (Safari) - Đạt/Không đạt', 'Android (Chrome) - Đạt/Không đạt', 'Ghi chú / ảnh']];
        for (const l of fs.readFileSync(fCl, 'utf8').split('\n')) if (/^\|\s*CL-/.test(l)) cl.push(l.split('|').slice(1, 5).map(x => x.trim()));
        await guiBang('Đ2-Checklist máy thật', cl, [60, 160, 320, 320, 150, 150, 220]);
    }

    if (CO('chi-tong-hop')) return nhatKy('Đã gửi các tab tổng hợp (bỏ qua tab chi tiết)');
    // 7. Tab chi tiết từng cấu hình (kèm ảnh)
    for (const ch of daChay) for (const ph of docPhien(ch)) {
        process.stdout.write(TAB[ch] + ' ' + ph.ma + ': ');
        await guiSheet(url, ph.tieuDe, ph.rows, ph.ma, TAB[ch], path.join(TEST, 'anh', 'd2', ch));
    }
    nhatKy('XONG đợt 2 tự động');
})();
