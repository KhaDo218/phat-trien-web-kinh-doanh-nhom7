// Báo cáo tổng kết kiểm thử 4 phase (P0 thủ công 27/10 → P1 tự động 1 trình duyệt → P2 đa trình duyệt + E2E + audit → P3 xác nhận sau sửa).
// Script sinh mọi bảng số liệu; GLM viết phần học thuật (3 lượt), DeepSeek dự phòng. Ra: ket-qua/BAO-CAO-TONG-KET-KIEM-THU.md/.docx + tab "Tổng kết kiểm thử".
const fs = require('fs'), path = require('path');
const { spawnSync } = require('child_process');
const TEST = path.resolve(__dirname, '..'), KQ = path.join(TEST, 'ket-qua');
const { CAU_HINH_TD } = require('../lib/khung-test');
const J = f => JSON.parse(fs.readFileSync(path.join(KQ, f), 'utf8'));
const dem = (ds, f) => ds.reduce((m, x) => (m[f(x) || 'Không ghi nhận'] = (m[f(x) || 'Không ghi nhận'] || 0) + 1, m), {});
const md = b => b.map((r, i) => '| ' + r.map(x => String(x ?? '').replace(/\|/g, '/').replace(/\n/g, ' ')).join(' | ') + ' |' + (i === 0 ? '\n|' + '---|'.repeat(r.length) : '')).join('\n');
const bangDem = (tieu, o) => md([[tieu, 'Số lượng'], ...Object.entries(o).sort((a, b) => b[1] - a[1])]);

// ---- P0
const p0 = J('tong/p0-chuan-hoa.json').slice(1), viec = J('tong/viec-can-lam.json').slice(1);
// ---- P1
const p1 = fs.readdirSync(path.join(TEST, 'ket-qua-dot1')).filter(f => /^s\d+\.json$/.test(f)).sort().map(f => JSON.parse(fs.readFileSync(path.join(TEST, 'ket-qua-dot1', f), 'utf8')));
const p1Rows = p1.flatMap(p => p.rows), p1Dat = p1Rows.filter(r => r[9] === 'Đạt').length;
// ---- P2, P3
const CH = Object.keys(CAU_HINH_TD);
const docDot = d => { const r = []; for (const ch of CH) { const t = path.join(KQ, d, ch); if (fs.existsSync(t)) for (const f of fs.readdirSync(t).filter(f => /^s\d+\.json$/.test(f))) for (const x of JSON.parse(fs.readFileSync(path.join(t, f), 'utf8')).rows) r.push({ ch, ma: x[0], tt: x[9] }); } return r; };
const p2 = docDot('d2'), p3 = docDot('d3');
const CN = require('./chap-nhan'), CNT = 'Chấp nhận rủi ro';
for (const r of p3) if (CN[r.ma] && r.tt !== 'Đạt') r.tt = CNT;
const tl = (ds, ch) => { const x = ds.filter(r => r.ch === ch); const d = x.filter(r => r.tt === 'Đạt').length, na = x.filter(r => r.tt === CNT).length, m = x.length - na; return x.length ? d + '/' + m + ' (' + (100 * d / m).toFixed(1).replace('.', ',') + '%)' + (na ? ' + ' + na + ' chấp nhận rủi ro' : '') : '-'; };
const loiP2 = fs.readFileSync(path.join(KQ, 'd2', 'DUYET-LOI.md'), 'utf8').split('\n').filter(l => /^\|\s*BUG-/.test(l)).map(l => l.split('|').slice(1, -1).map(x => x.trim()));
const d3 = fs.existsSync(path.join(KQ, 'd3-tong-hop.json')) ? J('d3-tong-hop.json') : null;
const daSuaP3 = d3 ? d3.bangLoi.slice(1).filter(b => b[b.length - 1] === 'Đã sửa').length : 0;

// ---- Bảng đối chiếu các phase (số liệu thật)
const doiChieu = [
    ['Tiêu chí', 'Phase 0 – Kiểm thử thủ công (27/10)', 'Phase 1 – Tự động hóa 1 trình duyệt (03/11)', 'Phase 2 – Hồi quy, tương thích, E2E, audit (04–05/11)', 'Phase 3 – Xác nhận sau sửa lỗi (06/11)'],
    ['Mục tiêu', 'Phát hiện nhanh lỗi hiển thị/chức năng trước khi tích hợp', 'Kiểm chứng có hệ thống toàn bộ chức năng theo test case', 'Kiểm hồi quy sau đổi giao diện, tương thích đa trình duyệt, nghiệp vụ đầu-cuối, chất lượng phi chức năng', 'Xác nhận lỗi đã sửa và không phát sinh lỗi mới'],
    ['Người/tác nhân', 'Thành viên nhóm (' + Object.keys(dem(p0, r => r[2])).filter(x => x !== 'Không ghi nhận').join(', ') + ')', 'Script Playwright (AI hỗ trợ viết) + người xác minh', 'Script + AI phân loại + người xác minh', 'Script + người xác minh'],
    ['Kiểu kiểm thử', 'Thăm dò (exploratory), hộp đen, thủ công', 'Hộp đen hệ thống, tự động', 'Hồi quy, tương thích, E2E, bảo mật/a11y/hiệu năng/SEO', 'Xác nhận (confirmation) + hồi quy'],
    ['Môi trường', 'Trình duyệt cá nhân của thành viên', 'Microsoft Edge 1440px & 390px', '7 cấu hình: Edge, Chrome, Firefox, Safari/WebKit, iPhone 14, Pixel 7, iPad', '7 cấu hình như Phase 2'],
    ['Số ca kiểm thử / phát hiện', p0.length + ' lỗi ghi nhận (không có test case viết trước)', p1Rows.length + ' test case', '394 test case × 7 cấu hình = ' + p2.length + ' lượt', p3.length + ' lượt'],
    ['Tỉ lệ đạt', 'Không áp dụng', p1Dat + '/' + p1Rows.length + ' (' + (100 * p1Dat / p1Rows.length).toFixed(1).replace('.', ',') + '%)', CH.map(ch => CAU_HINH_TD[ch].ten.split(' ')[0] + ' ' + tl(p2, ch)).join('; '), CH.map(ch => CAU_HINH_TD[ch].ten.split(' ')[0] + ' ' + tl(p3, ch)).join('; ')],
    ['Lỗi website xác nhận', p0.length + ' (gồm góp ý)', '5', String(loiP2.length), daSuaP3 + '/' + loiP2.length + ' đã sửa; 2 chấp nhận rủi ro (BUG-02 giới hạn kiến trúc, BUG-07 quyết định giữ chất lượng ảnh)'],
    ['Bằng chứng', 'Mô tả + bước tái hiện, một số ảnh', 'Ảnh có chú thích trong ô Sheet, Excel', 'Ảnh theo từng trình duyệt, ma trận, Checklist máy thật', 'So sánh từng test case với Phase 2'],
    ['Đầu ra', 'Tab Test (27/10), Việc cần làm (28-31/10)', 'Tab Đ1 - Test case, báo cáo đợt 1', 'Các tab Đ2-*, báo cáo đợt 2', 'Các tab Đ3-*, báo cáo đợt 3, nhánh fix/loi-dot2']
];
const soLieu = '### Phase 0 – thống kê nhật ký lỗi (đã chuẩn hóa theo ISO/IEC/IEEE 29119-3)\n'
    + bangDem('Trạng thái', dem(p0, r => r[13])) + '\n\n' + bangDem('Mức độ', dem(p0, r => r[10])) + '\n\n' + bangDem('Phân hệ', dem(p0, r => r[3])) + '\n\n' + bangDem('Loại lỗi', dem(p0, r => r[9]))
    + '\n\nTab Việc cần làm (28-31/10): ' + viec.length + ' việc; trạng thái: ' + JSON.stringify(dem(viec, v => v[6])) + '\n\n'
    + '### Phase 1 – theo phiên\n' + md([['Phiên', 'Đạt/Tổng'], ...p1.map(p => [p.ma + ' - ' + p.ten, p.rows.filter(r => r[9] === 'Đạt').length + '/' + p.rows.length])])
    + '\n\n### Phase 2 → Phase 3 – tỉ lệ đạt theo cấu hình\n' + md([['Cấu hình', 'Phase 2', 'Phase 3'], ...CH.map(ch => [CAU_HINH_TD[ch].ten, tl(p2, ch), tl(p3, ch)])])
    + '\n\n### Vòng đời lỗi Phase 2 → Phase 3\n' + (d3 ? md([['Mã lỗi', 'Mức độ', 'Kết luận Phase 3'], ...d3.bangLoi.slice(1).map(b => [b[0], b[1], b[b.length - 1]])]) : '(chưa có dữ liệu Phase 3)');
const rtm = md([['Nhóm chức năng', 'P0 (số lỗi)', 'P1 (phiên)', 'P2 (phiên, 7 cấu hình)', 'P3'],
    ['Tài khoản, đăng nhập, phân quyền', String(p0.filter(r => /đăng nhập|tài khoản|mật khẩu|đăng ký/i.test(r[4] + r[5])).length), 's01, s10', 's01, s10, s12 (leo quyền)', 'Hồi quy đủ'],
    ['Sản phẩm, lọc, yêu thích', String(p0.filter(r => /sản phẩm|lọc|yêu thích/i.test(r[4] + r[5])).length), 's03', 's03', 'Hồi quy đủ'],
    ['Không gian mẫu, Shop the Room, 3D', String(p0.filter(r => /phòng|3D|hotspot|không gian/i.test(r[4] + r[5])).length), 's02', 's02, s11', 'Hồi quy đủ'],
    ['Đồ cũ (Marketplace)', String(p0.filter(r => /đồ cũ/i.test(r[4] + r[5])).length), 's04', 's04, s11', 'Hồi quy đủ'],
    ['Giỏ hàng, thanh toán, đơn hàng, đánh giá', String(p0.filter(r => /giỏ|thanh toán|đơn|đánh giá/i.test(r[4] + r[5])).length), 's05, s06', 's05, s06, s11', 'Hồi quy đủ'],
    ['Quản trị, Dashboard', String(p0.filter(r => /admin|quản trị|dashboard/i.test(r[4] + r[5])).length), 's07, s08', 's07, s08', 'Hồi quy đủ'],
    ['Chatbot', String(p0.filter(r => /chat/i.test(r[4] + r[5])).length), 's09', 's09', 'Hồi quy đủ'],
    ['Phi chức năng (bố cục, mất mạng, hiệu năng, SEO, a11y)', String(p0.filter(r => /Hiệu năng|Giao diện/.test(r[9])).length), 's00, s10', 's00, s10, s12', 'Hồi quy đủ']]);
fs.writeFileSync(path.join(KQ, 'tong', 'so-lieu-tong.md'), '## Bảng đối chiếu 4 phase\n' + md(doiChieu) + '\n\n## Ma trận truy vết chức năng × phase\n' + rtm + '\n\n' + soLieu);

// ---- Phần chữ: GLM (3 lượt), DeepSeek dự phòng
const nen = '# Bối cảnh\nĐồ án nhóm 7 môn Phát triển Web Kinh doanh: website RoomCraft bán nội thất theo không gian phòng (Shop the Room, 3D, Đồ cũ, chatbot, quản trị), web tĩnh HTML/CSS/JS, dữ liệu localStorage, không backend. '
    + 'Quá trình kiểm thử gồm 4 phase như bảng đối chiếu. Phase 0 do thành viên nhóm tự kiểm thử thủ công và ghi nhật ký lỗi; Phase 1–3 tự động hóa bằng Node.js + Playwright, script do mô hình AI (DeepSeek) hỗ trợ viết theo khung chung, mọi kết quả không đạt được người xác minh lại bằng đọc mã nguồn và tái hiện; '
    + 'Phase 2 dùng thêm axe-core (khả năng tiếp cận), giả lập thiết bị Playwright; Phase 3 sửa 9 lỗi trên nhánh riêng, không giảm chất lượng ảnh/video, rồi hồi quy đủ 7 cấu hình. Bài học Phase 3: một bản sửa do AI đề xuất đã đảo ngược quyền admin, chính kiểm thử hồi quy phát hiện và lỗi được sửa lại. Trong Phase 3 nhóm cũng rà lại các kết quả không đạt bất thường: ở Phase 2 và lượt hồi quy đầu, trên 3 cấu hình di động, phần lớn lượt không đạt ở s03/s04 là do script không bấm nút "Bộ lọc" (bộ lọc được thiết kế thu gọn trên màn hẹp), tức lỗi của script chứ không phải của website; script được bổ sung bước bấm nút như người dùng thật, không nới điều kiện kiểm tra, và chạy lại s03/s04 trên 7 cấu hình (đều đạt 30/30). Cuối Phase 3, theo ISTQB, nhóm phân loại lại hai kết quả không có bản sửa trong phạm vi dự án: BUG-02 (TC-S12-01, giả user_id admin) là GIỚI HẠN KIẾN TRÚC ĐÃ BIẾT vì web tĩnh không có máy chủ, mọi kiểm quyền chạy trên trình duyệt nên không thể chặn triệt để (đã chặn người dùng thường và việc sửa role trong phiên; hướng khắc phục: backend với token có chữ ký, kiểm quyền ở máy chủ); BUG-07 (TC-S12-16/17, ảnh/video nặng) là RỦI RO ĐƯỢC CHẤP NHẬN theo quyết định giữ nguyên chất lượng hình ảnh, đã giảm tác động bằng tải lười (hướng tiếp: WebP/AVIF + srcset). Dữ liệu gốc giữ nguyên; tỉ lệ đạt Phase 3 tính trên số test áp dụng (không tính các lượt chấp nhận rủi ro vào mẫu số), Phase 2 giữ cách tính cũ. Kết luận: 7 lỗi đã sửa, 2 chấp nhận rủi ro, 0 lỗi còn mở, 0 test mới hỏng. Trong Phase 3 nhóm cũng rà lại các kết quả không đạt bất thường: ở Phase 2, trên 3 cấu hình di động, phần lớn lượt không đạt ở s03/s04 là do script không bấm nút "Bộ lọc" (bộ lọc được thiết kế thu gọn trên màn hẹp), tức lỗi của script chứ không phải của website; script được bổ sung bước bấm nút như người dùng thật, không nới điều kiện kiểm tra, và chạy lại trên 7 cấu hình.\n\n# Số liệu (dùng đúng, không bịa)\n'
    + fs.readFileSync(path.join(KQ, 'tong', 'so-lieu-tong.md'), 'utf8');
const phan = [
    ['tong1', 'Viết PHẦN 1 của BÁO CÁO TỔNG KẾT KIỂM THỬ PHẦN MỀM (Markdown, tiếng Việt, văn phong học thuật chuẩn mực như báo cáo đồ án đại học, câu văn chặt chẽ, không sáo rỗng, không bịa số). Bắt đầu bằng "# BÁO CÁO TỔNG KẾT KIỂM THỬ WEBSITE ROOMCRAFT" và bảng thông tin tài liệu (phiên bản, ngày 06/11/2026, nhóm 7). Gồm: ## Tóm tắt (1 đoạn + 5 gạch đầu dòng có số liệu); ## 1. Giới thiệu (bối cảnh, mục tiêu tài liệu, phạm vi, đối tượng đọc, thuật ngữ viết tắt – bảng); ## 2. Cơ sở phương pháp luận (mức kiểm thử và loại kiểm thử theo ISTQB; quy trình và tài liệu kiểm thử theo ISO/IEC/IEEE 29119; kiểm thử hộp đen và các kỹ thuật thiết kế: phân vùng tương đương, giá trị biên, bảng quyết định, chuyển trạng thái, kiểm thử dựa trên kinh nghiệm/thăm dò; kiểm thử xác nhận và hồi quy; giải thích vì sao áp dụng cho dự án này); ## 3. Tiến trình kiểm thử tổng thể (mô tả chuỗi 4 phase như một quy trình lặp: phát hiện → sửa → kiểm chứng; bảng mốc thời gian).'],
    ['tong2', 'Viết PHẦN 2: "## 4. Chi tiết từng phase". Mỗi phase là một mục ### (4.1 Phase 0 … 4.4 Phase 3), mỗi mục có đủ các tiểu mục in đậm: Mục tiêu; Phạm vi và đối tượng; Cách thực hiện (quy trình từng bước); Kỹ thuật thiết kế và công cụ; Tiêu chí đạt/dừng; Kết quả chính (trích số liệu); Hạn chế của phase; Đóng góp cho phase sau. Phase 0 phải nhận xét khách quan cả ưu điểm (nhanh, phát hiện lỗi trực quan, gắn người phụ trách và commit) lẫn hạn chế (không có test case viết trước, thiếu kết quả mong đợi, mức độ chưa phân loại, khó tái lập) và giải thích việc chuẩn hóa nhật ký lỗi theo ISO/IEC/IEEE 29119-3 (tab "Đ0-Nhật ký lỗi (chuẩn hóa)", tab gốc giữ nguyên).'],
    ['tong3', 'Viết PHẦN 3: ## 5. So sánh giữa các phase (phân tích khác biệt về mục tiêu, phạm vi, kỹ thuật, môi trường, mức tự động hóa, chất lượng bằng chứng, chi phí/thời gian, khả năng tái lập; mỗi khác biệt nêu "vì sao thay đổi" và "tác dụng"); ## 6. Chỉ số chất lượng và vòng đời lỗi (diễn giải các bảng số liệu: tỉ lệ đạt theo phase/cấu hình, phân bố mức độ, tỉ lệ lỗi đã sửa được kiểm chứng, lỗi tái phát/lỗi do sửa); ## 7. Đánh giá phương pháp (thủ công vs tự động; vai trò và rủi ro của AI trong viết script và sửa lỗi; nguyên tắc người xác minh cuối cùng); ## 8. Rủi ro còn lại và giới hạn (không backend nên kiểm quyền phía trình duyệt; giả lập thiết bị khác máy thật; chatbot AI chưa kiểm qua API; hiệu năng đo trên máy phát triển); ## 9. Kết luận; ## 10. Kiến nghị và hướng phát triển (đề xuất cụ thể: kiểm thử trên máy chủ thật, CI chạy hồi quy tự động mỗi lần đẩy mã, kiểm thử tải, kiểm thử tay theo checklist máy thật, quy ước báo cáo lỗi chuẩn cho nhóm); ## Tài liệu tham khảo (ISTQB CTFL Syllabus v4.0; ISO/IEC/IEEE 29119-1/-2/-3; IEEE 829-2008; tài liệu Playwright; WCAG 2.1 / axe-core).']
];
fs.writeFileSync(path.join(KQ, 'tong', 'he.md'), 'Bạn là giảng viên hướng dẫn kiểm thử phần mềm, viết báo cáo học thuật tiếng Việt chuẩn mực. Trả lời bằng Markdown thuần, không bọc khối code, không bịa số liệu.');
let toan = '';
for (const [ten, yc] of phan) {
    const fIn = path.join(KQ, 'tong', ten + '-yc.md'), fOut = path.join(KQ, 'tong', ten + '.md');
    fs.writeFileSync(fIn, yc + '\n\n' + nen);
    let r = spawnSync(process.execPath, [path.join(__dirname, 'llm.mjs'), '--model', 'glm', '--in', fIn, '--system', path.join(KQ, 'tong', 'he.md'), '--out', fOut, '--max', '16000'], { encoding: 'utf8' });
    const hong = r.status !== 0 || !fs.existsSync(fOut) || fs.readFileSync(fOut, 'utf8').length < 3000 || /bị cắt/.test(r.stderr || '');
    if (hong) {
        console.log(ten + ': GLM ' + (r.status !== 0 ? 'lỗi' : 'thiếu/bị cắt') + ' -> DeepSeek');
        r = spawnSync(process.execPath, [path.join(__dirname, 'llm.mjs'), '--model', 'ds', '--in', fIn, '--system', path.join(KQ, 'tong', 'he.md'), '--out', fOut, '--max', '14000'], { encoding: 'utf8' });
    }
    console.log(ten + ': ' + (r.stderr || '').trim().split('\n').pop());
    toan += fs.readFileSync(fOut, 'utf8').trim() + '\n\n';
    if (ten === 'tong2') toan += '## Bảng đối chiếu 4 phase\n\n' + md(doiChieu) + '\n\n## Ma trận truy vết chức năng × phase\n\n' + rtm + '\n\n## Số liệu chi tiết theo phase\n\n' + soLieu + '\n\n';
}
const fMd = path.join(KQ, 'BAO-CAO-TONG-KET-KIEM-THU.md');
fs.writeFileSync(fMd, toan);
const w = spawnSync('python', [path.join(__dirname, 'md-sang-docx.py'), fMd, fMd.replace(/\.md$/, '.docx')], { encoding: 'utf8' });
console.log((w.stdout || w.stderr || '').trim());

(async () => {
    const url = JSON.parse(fs.readFileSync(path.join(TEST, 'cau-hinh.json'), 'utf8')).sheetWebAppUrl;
    const r = await fetch(url, { method: 'POST', body: JSON.stringify({ tab: 'Tổng kết kiểm thử', cheDo: 'bang', bang: doiChieu, doRong: [170, 260, 260, 300, 260] }) });
    console.log('Tab Tổng kết kiểm thử: ' + (await r.text()).slice(0, 60));
})();
