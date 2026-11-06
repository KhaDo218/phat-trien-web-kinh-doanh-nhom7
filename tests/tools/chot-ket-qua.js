// Chốt kết quả: áp mức độ + ghi chú đã xác minh (ket-qua/DUYET-LOI.md) vào ket-qua/sXX.json,
// xuất lại TONG-HOP.xlsx, rồi (nếu có --gui) gửi toàn bộ kèm ảnh lên Google Sheet.
// Dùng: node tools/chot-ket-qua.js [--gui]
const fs = require('fs');
const path = require('path');
const TEST = path.resolve(__dirname, '..');
const KQ = path.join(TEST, 'ket-qua');

// Đọc bảng duyệt: | Mã TC (có thể nhiều mã) | Kết luận | Mức độ | Ghi chú |
const duyet = {};
for (const dong of fs.readFileSync(path.join(KQ, 'DUYET-LOI.md'), 'utf8').split('\n')) {
    if (!/^\|\s*TC-/.test(dong)) continue;
    const cot = dong.split('|').map(s => s.trim());
    for (const ma of cot[1].split(',').map(s => s.trim())) duyet[ma] = { ketLuan: cot[2], mucDo: cot[3], ghiChu: cot[4] };
}

const cacPhien = fs.readdirSync(KQ).filter(f => /^s\d+\.json$/.test(f)).sort();
let tong = 0, dat = 0, chuaDuyet = [];
for (const f of cacPhien) {
    const j = JSON.parse(fs.readFileSync(path.join(KQ, f), 'utf8'));
    for (const d of j.rows) {
        tong++;
        if (d[9] === 'Đạt') { dat++; continue; }
        const dv = duyet[d[0]];
        if (!dv) { chuaDuyet.push(d[0]); continue; }
        d[10] = dv.mucDo;
        d[14] = ('Đã xác minh: ' + dv.ketLuan + '. ' + dv.ghiChu.replace(/`/g, '')).slice(0, 900);
    }
    fs.writeFileSync(path.join(KQ, f), JSON.stringify(j, null, 1), 'utf8');
}
console.log('Tổng ' + tong + ' TC, đạt ' + dat + ', không đạt ' + (tong - dat) + (chuaDuyet.length ? '; CHƯA DUYỆT: ' + chuaDuyet.join(', ') : '; tất cả lỗi đã duyệt'));

(async () => {
    const file = await require('../lib/xuat-excel').xuatExcel();
    console.log('Excel: ' + path.relative(TEST, file));
    if (!process.argv.includes('--gui')) return;
    const { guiSheet } = require('../lib/khung-test');
    const url = JSON.parse(fs.readFileSync(path.join(TEST, 'cau-hinh.json'), 'utf8')).sheetWebAppUrl;
    for (const f of cacPhien) {
        const j = JSON.parse(fs.readFileSync(path.join(KQ, f), 'utf8'));
        process.stdout.write(j.ma + ': ');
        await guiSheet(url, j.tieuDe, j.rows, j.ma);
    }
})();
