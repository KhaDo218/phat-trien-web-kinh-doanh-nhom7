// Chuẩn hóa tab "Test (27/10)" của nhóm theo mẫu báo cáo sự cố ISO/IEC/IEEE 29119-3 -> tab mới "Đ0-Nhật ký lỗi (chuẩn hóa)".
// Tab gốc KHÔNG bị sửa. DeepSeek viết lại từng dòng (không bịa thông tin), script tự nối với tab "Việc cần làm".
const fs = require('fs'), path = require('path');
const { spawnSync } = require('child_process');
const TEST = path.resolve(__dirname, '..'), KQ = path.join(TEST, 'ket-qua', 'tong');
const test = JSON.parse(fs.readFileSync(path.join(KQ, 'test-2710.json'), 'utf8'));
const viec = JSON.parse(fs.readFileSync(path.join(KQ, 'viec-can-lam.json'), 'utf8'));

// Việc cần làm -> các STT dòng lỗi liên quan (cột "Dòng lỗi (tab Test)")
const lienKet = {};
for (const v of viec.slice(1)) for (const so of String(v[4] || '').match(/\d+/g) || [])
    (lienKet[so] = lienKet[so] || []).push('Việc ' + v[0] + ' (' + v[1] + ', ' + v[2] + ', ' + v[6] + ')');

const COT = ['Mã lỗi', 'Ngày phát hiện', 'Người phát hiện', 'Phân hệ', 'Trang / màn hình', 'Tiêu đề lỗi', 'Các bước tái hiện', 'Kết quả mong đợi', 'Kết quả thực tế',
    'Loại lỗi', 'Mức độ (Severity)', 'Ưu tiên (Priority)', 'Người xử lý', 'Trạng thái', 'Nguyên nhân / cách khắc phục', 'Việc cần làm liên quan', 'Bằng chứng', 'STT gốc'];
const HUONG = 'Chuẩn hóa nhật ký lỗi kiểm thử thủ công của nhóm sinh viên (website bán nội thất RoomCraft, kiểm thử ngày 27/10/2026) theo mẫu báo cáo sự cố ISO/IEC/IEEE 29119-3. '
    + 'Với MỖI dòng đầu vào trả về một đối tượng JSON có đúng các khóa: stt, phanHe, trang, tieuDe, cacBuoc, mongDoi, thucTe, loaiLoi, mucDo, uuTien, trangThai, nguyenNhan. Quy tắc:\n'
    + '- KHÔNG bịa thông tin không có trong dòng gốc; suy luận hợp lý được phép cho mongDoi/thucTe từ mô tả lỗi; thiếu hẳn thì ghi "Không ghi nhận".\n'
    + '- phanHe: một trong Khách hàng / Quản trị / Chatbot / Dữ liệu / Giao diện chung / Hiệu năng.\n'
    + '- tieuDe: ≤ 12 từ, dạng "<Đối tượng> + <hiện tượng>". cacBuoc: các bước đánh số "1. ... 2. ...", có tiền điều kiện (vd. đăng nhập admin) nếu dòng gốc có.\n'
    + '- loaiLoi: Chức năng / Giao diện / Dữ liệu / Hiệu năng / Bảo mật / Nội dung / Góp ý cải tiến.\n'
    + '- mucDo: Nghiêm trọng (chặn chức năng chính, sai tiền/dữ liệu, lộ quyền) / Cao / Trung bình / Thấp. uuTien: P1 / P2 / P3 (dựa vào mức độ và cột Việc cần làm nếu có "Phải làm").\n'
    + '- trangThai chuẩn: Mới / Đang xử lý / Đã sửa – chờ kiểm chứng / Đã đóng / Từ chối / Hoãn / Ghi nhận góp ý. ("Đã sửa" trong gốc -> "Đã sửa – chờ kiểm chứng"; "Chờ xử lý" -> "Mới"; "Bỏ qua" -> "Từ chối"; "Góp ý"/"Ghi nhận" -> "Ghi nhận góp ý").\n'
    + '- nguyenNhan: tóm tắt nguyên nhân/cách sửa/commit từ cột Ghi chú gốc, giữ nguyên mã commit.\n'
    + 'Chỉ trả về mảng JSON, không giải thích.';
fs.writeFileSync(path.join(KQ, 'he-p0.md'), 'Bạn là kỹ sư QA chuẩn hóa báo cáo lỗi. Chỉ trả về JSON hợp lệ.');

const ketQua = [];
const dong = test.slice(1);
for (let i = 0; i < dong.length; i += 20) {
    const lo = dong.slice(i, i + 20);
    const vao = HUONG + '\n\nCột gốc: ' + JSON.stringify(test[0]) + '\nDữ liệu (mỗi phần tử là 1 dòng):\n' + JSON.stringify(lo);
    const fIn = path.join(KQ, 'p0-' + i + '.md'), fOut = path.join(KQ, 'p0-' + i + '.json');
    fs.writeFileSync(fIn, vao);
    let ds = null;
    for (let lan = 0; lan < 3 && !ds; lan++) {
        spawnSync(process.execPath, [path.join(__dirname, 'llm.mjs'), '--model', 'ds', '--in', fIn, '--system', path.join(KQ, 'he-p0.md'), '--out', fOut, '--max', '9000', '--code'], { encoding: 'utf8' });
        try { ds = JSON.parse(fs.readFileSync(fOut, 'utf8')); if (ds.length !== lo.length) ds = null; } catch (e) { ds = null; }
    }
    if (!ds) { console.log('Lô ' + i + ': DeepSeek trả lỗi, giữ dữ liệu gốc'); ds = lo.map(g => ({ stt: g[0], phanHe: '', trang: g[2], tieuDe: g[3], cacBuoc: g[4], mongDoi: '', thucTe: g[3], loaiLoi: '', mucDo: '', uuTien: '', trangThai: g[7], nguyenNhan: g[8] })); }
    ds.forEach((d, k) => {
        const g = lo[k];
        ketQua.push(['P0-' + String(g[0]).padStart(3, '0'), '27/10/2026', g[1] || 'Không ghi nhận', d.phanHe, d.trang || g[2], d.tieuDe, d.cacBuoc, d.mongDoi, d.thucTe,
            d.loaiLoi, d.mucDo, d.uuTien, g[6] || 'Không ghi nhận', d.trangThai, d.nguyenNhan, (lienKet[String(g[0])] || []).join('; '), g[5] || '', String(g[0])]);
    });
    console.log('Lô ' + i + ': ' + ds.length + ' dòng');
}
fs.writeFileSync(path.join(KQ, 'p0-chuan-hoa.json'), JSON.stringify([COT, ...ketQua]));

(async () => {
    const url = JSON.parse(fs.readFileSync(path.join(TEST, 'cau-hinh.json'), 'utf8')).sheetWebAppUrl;
    const r = await fetch(url, { method: 'POST', body: JSON.stringify({ tab: 'Đ0-Nhật ký lỗi (chuẩn hóa)', cheDo: 'bang', bang: [COT, ...ketQua], doRong: [80, 95, 95, 110, 150, 220, 300, 220, 220, 110, 110, 90, 100, 150, 260, 220, 120, 60] }) });
    console.log('Tab Đ0: ' + (await r.text()).slice(0, 80));
})();
