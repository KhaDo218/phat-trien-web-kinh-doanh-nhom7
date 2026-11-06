// Chạy toàn bộ phiên (phien/s*.js) cho 1 cấu hình trình duyệt của đợt 2, song song có giới hạn.
// Dùng: node tools/chay-cau-hinh.js firefox [--song-song 3] [--phien s01,s05]
// Kết quả: ket-qua/d2/<cấu hình>/sXX.json + TONG-HOP.xlsx, ảnh: anh/d2/<cấu hình>/
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { CAU_HINH_TD } = require('../lib/khung-test');

const TEST = path.resolve(__dirname, '..');
const cauHinh = process.argv[2];
if (!CAU_HINH_TD[cauHinh]) throw new Error('Cấu hình: ' + Object.keys(CAU_HINH_TD).join(', '));
const tuyChon = (ten, md) => { const i = process.argv.indexOf('--' + ten); return i > 0 ? process.argv[i + 1] : md; };
const songSong = Number(tuyChon('song-song', 3));
const chiPhien = tuyChon('phien', '');
const congGoc = 5700 + Object.keys(CAU_HINH_TD).indexOf(cauHinh) * 40;

let dsFile = fs.readdirSync(path.join(TEST, 'phien')).filter(f => /^s\d+-.*\.js$/.test(f)).sort();
if (chiPhien) dsFile = dsFile.filter(f => chiPhien.split(',').includes(f.slice(0, 3)));

function chay(file) {
    return new Promise(ok => {
        const ma = file.slice(0, 3);
        const env = { ...process.env, QA_DOT: process.env.QA_DOT || 'd2', QA_CAU_HINH: cauHinh, QA_KHONG_GUI: '1', QA_CONG: String(congGoc + Number(ma.slice(1))) };
        const p = spawn(process.execPath, [path.join('phien', file)], { cwd: TEST, env });
        let out = '';
        p.stdout.on('data', d => out += d); p.stderr.on('data', d => out += d);
        const hen = setTimeout(() => p.kill(), 40 * 60 * 1000);
        p.on('close', () => {
            clearTimeout(hen);
            const dong = out.split('\n').find(l => /: Đạt \d+\/\d+/.test(l));
            console.log('[' + cauHinh + '] ' + (dong ? dong.split(' -> ')[0] : ma + ': DỪNG GIỮA CHỪNG ' + out.split('\n').filter(Boolean).slice(-2).join(' | ').slice(0, 200)));
            ok();
        });
    });
}

(async () => {
    const hang = [...dsFile];
    await Promise.all(Array.from({ length: songSong }, async () => { while (hang.length) await chay(hang.shift()); }));
    // Excel tổng của cấu hình này (chạy song song nên xuất lại 1 lần cuối)
    process.env.QA_DOT = process.env.QA_DOT || 'd2'; process.env.QA_CAU_HINH = cauHinh;
    delete require.cache[require.resolve('../lib/xuat-excel')];
    try { console.log('[' + cauHinh + '] Excel: ' + path.relative(TEST, await require('../lib/xuat-excel').xuatExcel())); }
    catch (e) { console.log('[' + cauHinh + '] Không xuất được Excel: ' + e.message); }
})();
