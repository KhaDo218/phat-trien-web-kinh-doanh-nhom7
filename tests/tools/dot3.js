// Đợt 3 (kiểm thử xác nhận sau sửa lỗi): so d3 với d2, trạng thái 9 lỗi theo cấu hình, gửi tab Đ3, báo cáo đợt 3.
const fs = require('fs'), path = require('path');
const { spawnSync } = require('child_process');
const TEST = path.resolve(__dirname, '..'), KQ = path.join(TEST, 'ket-qua');
const { CAU_HINH_TD } = require('../lib/khung-test');
const CH = Object.keys(CAU_HINH_TD);
const doc = d => { const r = {}; for (const ch of CH) { const t = path.join(KQ, d, ch); if (fs.existsSync(t)) for (const f of fs.readdirSync(t).filter(f => /^s\d+\.json$/.test(f))) { const j = JSON.parse(fs.readFileSync(path.join(t, f), 'utf8')); for (const x of j.rows) r[ch + '|' + x[0]] = { tt: x[9], cn: x[3], tht: x[8], ph: j.ma + ' - ' + j.ten }; } } return r; };
const d2 = doc('d2'), d3 = doc('d3');
const CN = require('./chap-nhan'), CNT = 'Chấp nhận rủi ro';
for (const [k, v] of Object.entries(d3)) { const ma = k.split('|')[1]; if (CN[ma] && v.tt !== 'Đạt') { v.tt = CNT; v.tht = '[' + CN[ma].loi + ' – ' + CNT + '] ' + CN[ma].ly + ' Kết quả đo: ' + v.tht; } }
const tenCH = ch => CAU_HINH_TD[ch].ten;

// 1. Tổng quan theo phiên x cấu hình (đợt 2 -> đợt 3)
const phien = [...new Set(Object.values(d3).map(v => v.ph))].sort();
const tq = [['Phiên', ...CH.map(tenCH)]];
const tyLe = (r, ch, ph) => { const k = Object.keys(r).filter(x => x.startsWith(ch + '|') && (!ph || r[x].ph === ph)); const d = k.filter(x => r[x].tt === 'Đạt').length, na = k.filter(x => r[x].tt === CNT).length; return [d, k.length - na, na]; };
for (const ph of phien) tq.push([ph, ...CH.map(ch => { const a = tyLe(d2, ch, ph), b = tyLe(d3, ch, ph); return a[0] + '/' + a[1] + ' → ' + b[0] + '/' + b[1] + (b[2] ? ' (+' + b[2] + ' chấp nhận rủi ro)' : ''); })]);
tq.push(['TỔNG (đợt 2 → đợt 3, trên số test áp dụng)', ...CH.map(ch => { const a = tyLe(d2, ch), b = tyLe(d3, ch); return (100 * a[0] / a[1]).toFixed(1) + '% → ' + (100 * b[0] / b[1]).toFixed(1) + '%'; })]);

// 2. Trạng thái 9 lỗi
const loi = fs.readFileSync(path.join(KQ, 'd2', 'DUYET-LOI.md'), 'utf8').split('\n').filter(l => /^\|\s*BUG-/.test(l)).map(l => l.split('|').slice(1, -1).map(x => x.trim()));
const bangLoi = [['Mã lỗi', 'Mức độ', 'Mô tả (đợt 2)', 'Test case kiểm chứng', ...CH.map(tenCH), 'Kết luận đợt 3']];
for (const L of loi) {
    const tcs = (L[1].match(/TC-S\d+-\d+/g) || []);
    const theoCH = CH.map(ch => { const co = tcs.filter(t => d3[ch + '|' + t]); if (!co.length) return '-'; const hong = co.filter(t => d3[ch + '|' + t].tt !== 'Đạt'); if (!hong.length) return 'Đã sửa'; return hong.every(t => d3[ch + '|' + t].tt === CNT) ? CNT + ' (' + hong.join(', ') + ')' : 'Vẫn còn (' + hong.join(', ') + ')'; });
    const ket = theoCH.every(x => x === 'Đã sửa' || x === '-') ? 'Đã sửa' : theoCH.every(x => x === 'Đã sửa' || x === '-' || x.startsWith(CNT)) ? (L[0] === 'BUG-02' ? 'Giới hạn đã biết – chấp nhận rủi ro' : 'Chấp nhận rủi ro (quyết định nhóm)') : 'Vẫn còn';
    bangLoi.push([L[0], L[3], L[6].replace(/`/g, '').slice(0, 300), tcs.join(', '), ...theoCH, ket]);
}

// 3. Các test thay đổi kết quả
const doi = [['Cấu hình', 'Mã TC', 'Phiên', 'Chức năng', 'Đợt 2', 'Đợt 3', 'Thay đổi', 'Kết quả thực tế đợt 3']];
for (const [k, v] of Object.entries(d3)) { const c = d2[k]; if (c && c.tt !== v.tt) { const [ch, ma] = k.split('|'); doi.push([tenCH(ch), ma, v.ph, v.cn, c.tt, v.tt, v.tt === 'Đạt' ? 'Chuyển sang đạt' : v.tt === CNT ? 'Phân loại lại' : 'Mới hỏng', v.tht.slice(0, 300)]); } }
fs.writeFileSync(path.join(KQ, 'd3-tong-hop.json'), JSON.stringify({ tq, bangLoi, doi }));
console.log('Thay đổi: ' + (doi.length - 1) + ' (mới hỏng: ' + doi.filter(d => d[6] === 'Mới hỏng').length + ')');
console.log(bangLoi.slice(1).map(b => b[0] + ': ' + b[b.length - 1]).join(' | '));

(async () => {
    if (!process.argv.includes('--bo-gui')) {
        const url = JSON.parse(fs.readFileSync(path.join(TEST, 'cau-hinh.json'), 'utf8')).sheetWebAppUrl;
        for (const [tab, bang, w] of [['Đ3-Tổng quan', tq, [300, ...CH.map(() => 140)]], ['Đ3-Lỗi', bangLoi, [80, 95, 380, 200, ...CH.map(() => 130), 110]], ['Đ3-Thay đổi', doi, [150, 95, 220, 260, 90, 90, 120, 480]]]) {
            const r = await fetch(url, { method: 'POST', body: JSON.stringify({ tab, cheDo: 'bang', bang, doRong: w }) });
            console.log(tab + ': ' + (await r.text()).slice(0, 60));
        }
    }
    // 4. Báo cáo đợt 3 (DeepSeek viết, số liệu do script cung cấp)
    const md = b => b.map((r, i) => '| ' + r.map(x => String(x).replace(/\|/g, '/')).join(' | ') + ' |' + (i === 0 ? '\n|' + '---|'.repeat(r.length) : '')).join('\n');
    const soLieu = '## Tỉ lệ đạt theo phiên × cấu hình (đợt 2 → đợt 3)\n' + md(tq) + '\n\n## Trạng thái 9 lỗi sau khi sửa\n' + md(bangLoi.map(r => [r[0], r[1], r[3], r[r.length - 1]]))
        + '\n\n## Thống kê thay đổi\n- Chuyển sang đạt: ' + doi.filter(d => d[6] === 'Chuyển sang đạt').length + '\n- Mới hỏng: ' + doi.filter(d => d[6] === 'Mới hỏng').length + '\n'
        + doi.filter(d => d[6] === 'Mới hỏng').slice(0, 40).map(d => '  - ' + d[0] + ' ' + d[1] + ' ' + d[3] + ': ' + d[7].slice(0, 160)).join('\n');
    const nen = fs.readFileSync(path.join(KQ, 'sua-loi-ghi-chu.md'), 'utf8');
    const yc = 'Viết BÁO CÁO KIỂM THỬ ĐỢT 3 – KIỂM THỬ XÁC NHẬN VÀ HỒI QUY SAU SỬA LỖI (Markdown, tiếng Việt, văn phong học thuật, không bịa số, khác báo cáo đợt 1–2). Bắt đầu bằng "# BÁO CÁO KIỂM THỬ ĐỢT 3 – XÁC NHẬN SỬA LỖI VÀ HỒI QUY ĐA TRÌNH DUYỆT". '
        + 'Mục: 1. Tóm tắt điều hành; 2. Mục tiêu đợt 3 (kiểm thử xác nhận – confirmation testing và hồi quy – regression testing theo ISTQB); 3. Danh sách thay đổi mã nguồn đã kiểm (bảng: lỗi – file – cách sửa – nguyên tắc an toàn đa trình duyệt, không giảm chất lượng ảnh/video); '
        + '4. Phương pháp (chạy lại đủ 13 phiên × 7 cấu hình, so sánh từng test case với đợt 2, phân loại chuyển đạt/mới hỏng); 5. Kết quả tổng hợp (dùng bảng số liệu); 6. Trạng thái từng lỗi sau sửa; '
        + '7. Phân tích các test mới hỏng (nếu có: nguyên nhân, đã xử lý thế nào; nêu rõ bài học: bản sửa tự động của AI từng đảo ngược quyền admin và đã được hồi quy phát hiện, sửa lại trước khi hoàn tất); 8. Đánh giá rủi ro còn lại; 9. Kết luận và khuyến nghị (gộp nhánh fix/loi-dot2 sau khi nhóm duyệt).\n\n# Ghi chú sửa lỗi\n' + nen + '\n\n# Số liệu\n' + soLieu;
    fs.writeFileSync(path.join(KQ, 'd3-yc.md'), yc);
    fs.writeFileSync(path.join(KQ, 'he-d3.md'), 'Bạn là trưởng nhóm kiểm thử viết báo cáo học thuật. Trả lời bằng Markdown thuần, không bọc khối code.');
    spawnSync(process.execPath, [path.join(__dirname, 'llm.mjs'), '--model', 'ds', '--in', path.join(KQ, 'd3-yc.md'), '--system', path.join(KQ, 'he-d3.md'), '--out', path.join(KQ, 'BAO-CAO-KIEM-THU-DOT3.md'), '--max', '14000'], { encoding: 'utf8' });
    const f = path.join(KQ, 'BAO-CAO-KIEM-THU-DOT3.md');
    fs.appendFileSync(f, '\n\n## Phụ lục. Số liệu chi tiết\n\n' + soLieu + '\n');
    const w = spawnSync('python', [path.join(__dirname, 'md-sang-docx.py'), f, f.replace(/\.md$/, '.docx')], { encoding: 'utf8' });
    console.log((w.stdout || w.stderr || '').trim());
})();
