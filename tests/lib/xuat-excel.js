/* Gộp kết quả mọi phiên (ket-qua/sXX.json) thành ket-qua/TONG-HOP.xlsx, có ảnh minh chứng trong ô.
   Chạy riêng: node lib/xuat-excel.js   (khung test tự gọi sau mỗi phiên) */
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const THU_MUC_TEST = path.resolve(__dirname, '..');
const HAU_TO = path.join(process.env.QA_DOT || '', process.env.QA_CAU_HINH || '');
const THU_MUC_KQ = path.join(THU_MUC_TEST, 'ket-qua', HAU_TO);
const THU_MUC_ANH = path.join(THU_MUC_TEST, 'anh', HAU_TO);
const COT_ANH = 12;          // cột L
const MAU = { dat: 'FFD1FAE5', khong: 'FFFFE4E6', dau: 'FF1F2937' };
const DO_RONG = [13, 16, 18, 26, 18, 34, 22, 34, 40, 11, 12, 36, 14, 11, 20, 12];

function docPhien() {
    if (!fs.existsSync(THU_MUC_KQ)) return [];
    return fs.readdirSync(THU_MUC_KQ).filter(f => /^s\d+\.json$/.test(f)).sort()
        .map(f => JSON.parse(fs.readFileSync(path.join(THU_MUC_KQ, f), 'utf8')));
}

function kichThuocJpeg(buf) {
    for (let i = 2; i < buf.length;) {
        if (buf[i] !== 0xFF) { i++; continue; }
        const loai = buf[i + 1], dai = buf.readUInt16BE(i + 2);
        if (loai >= 0xC0 && loai <= 0xC3) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
        i += 2 + dai;
    }
    return { w: 480, h: 300 };
}

function kieuTieuDe(ws) {
    const hang = ws.getRow(1);
    hang.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    hang.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MAU.dau } };
    hang.alignment = { vertical: 'middle', wrapText: true };
    hang.height = 30;
    ws.views = [{ state: 'frozen', ySplit: 1 }];
}

function themBangTestCase(wb, ten, tieuDe, dongs) {
    const ws = wb.addWorksheet(ten);
    ws.addRow(tieuDe);
    kieuTieuDe(ws);
    DO_RONG.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
    for (const d of dongs) {
        const hang = ws.addRow(d.slice(0, 15));
        const so = hang.number;
        hang.alignment = { vertical: 'top', wrapText: true };
        const dat = d[9] === 'Đạt';
        hang.getCell(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dat ? MAU.dat : MAU.khong } };
        hang.getCell(10).font = { bold: true, color: { argb: dat ? 'FF065F46' : 'FF9F1239' } };
        const tenAnh = d[11];
        const fileNho = tenAnh && path.join(THU_MUC_ANH, 'nho', tenAnh);
        if (fileNho && fs.existsSync(fileNho)) {
            const buf = fs.readFileSync(fileNho);
            const kt = kichThuocJpeg(buf);
            const s = Math.min(250 / kt.w, 160 / kt.h, 1);
            const w = Math.round(kt.w * s), h = Math.round(kt.h * s);
            hang.getCell(COT_ANH).value = '';
            ws.addImage(wb.addImage({ buffer: buf, extension: 'jpeg' }),
                { tl: { col: COT_ANH - 1 + 0.03, row: so - 1 + 0.05 }, ext: { width: w, height: h }, editAs: 'oneCell' });
            hang.height = Math.max(h * 0.75 + 8, 40);
            hang.getCell(16).value = { text: 'Xem ảnh gốc', hyperlink: path.relative(THU_MUC_KQ, path.join(THU_MUC_ANH, tenAnh)).split(path.sep).join('/') };
            hang.getCell(16).font = { color: { argb: 'FF2563EB' }, underline: true };
        }
    }
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: tieuDe.length } };
    return ws;
}

async function xuatExcel() {
    const cacPhien = docPhien();
    if (!cacPhien.length) throw new Error('Chưa có kết quả phiên nào trong ket-qua/');
    const tieuDe = cacPhien[0].tieuDe;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Nhóm 7 - RoomCraft';

    // Tab tổng quan
    const tq = wb.addWorksheet('Tổng quan');
    tq.addRow(['Phiên', 'Tên phiên', 'Ngày chạy', 'Tổng TC', 'Đạt', 'Không đạt', 'Tỉ lệ đạt', 'Lỗi Nghiêm trọng', 'Lỗi Trung bình', 'Lỗi Nhẹ']);
    kieuTieuDe(tq);
    [8, 34, 12, 9, 8, 10, 10, 15, 14, 9].forEach((w, i) => { tq.getColumn(i + 1).width = w; });
    const tong = [0, 0, 0, 0, 0, 0];
    for (const ph of cacPhien) {
        const dat = ph.rows.filter(d => d[9] === 'Đạt').length;
        const muc = m => ph.rows.filter(d => d[9] !== 'Đạt' && d[10] === m).length;
        const so = [ph.rows.length, dat, ph.rows.length - dat, muc('Nghiêm trọng'), muc('Trung bình'), muc('Nhẹ')];
        so.forEach((v, i) => { tong[i] += v; });
        tq.addRow([ph.ma, ph.ten, ph.ngay, so[0], so[1], so[2], so[0] ? so[1] / so[0] : 0, so[3], so[4], so[5]]);
    }
    const hangTong = tq.addRow(['', 'TỔNG CỘNG', '', tong[0], tong[1], tong[2], tong[0] ? tong[1] / tong[0] : 0, tong[3], tong[4], tong[5]]);
    hangTong.font = { bold: true };
    tq.getColumn(7).numFmt = '0.0%';

    const tatCa = cacPhien.flatMap(ph => ph.rows);
    themBangTestCase(wb, 'Test case', tieuDe, tatCa);
    themBangTestCase(wb, 'Lỗi phát hiện', tieuDe, tatCa.filter(d => d[9] !== 'Đạt'));

    // Lỗi Console và file 404 theo phiên
    const kt = wb.addWorksheet('Console & 404');
    kt.addRow(['Phiên', 'Loại', 'Nội dung']);
    kieuTieuDe(kt);
    kt.getColumn(1).width = 8; kt.getColumn(2).width = 14; kt.getColumn(3).width = 120;
    for (const ph of cacPhien) {
        for (const l of ph.loiConsole || []) kt.addRow([ph.ma, 'Lỗi Console', l]);
        for (const l of ph.mangLoi || []) kt.addRow([ph.ma, 'File 404', l]);
    }

    const file = path.join(THU_MUC_KQ, 'TONG-HOP.xlsx');
    await wb.xlsx.writeFile(file);
    return file;
}

module.exports = { xuatExcel };
if (require.main === module) xuatExcel().then(f => console.log('Đã ghi ' + f)).catch(e => { console.error(e.message); process.exit(1); });
