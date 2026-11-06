// Báo cáo đợt 2: tab Đ2-Lỗi + bảng số liệu (script sinh) + phần chữ (DeepSeek) -> ket-qua/d2/BAO-CAO-KIEM-THU-DOT2.md/.docx
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const TEST = path.resolve(__dirname, '..');
const KQ = path.join(TEST, 'ket-qua', 'd2');
const { CAU_HINH_TD } = require('../lib/khung-test');
const docBangMd = (f, loc) => fs.readFileSync(f, 'utf8').split('\n').filter(l => loc.test(l)).map(l => l.split('|').slice(1, -1).map(x => x.trim()));

(async () => {
    const duyet = fs.readFileSync(path.join(KQ, 'DUYET-LOI.md'), 'utf8');
    const loi = docBangMd(path.join(KQ, 'DUYET-LOI.md'), /^\|\s*BUG-/);
    const khongLoi = docBangMd(path.join(KQ, 'DUYET-LOI.md'), /^\|\s*(TC-|\d+ TC|Firefox)/);

    // 1. Tab Đ2-Lỗi
    const url = JSON.parse(fs.readFileSync(path.join(TEST, 'cau-hinh.json'), 'utf8')).sheetWebAppUrl;
    const bangLoi = [['Mã lỗi', 'Test case liên quan', 'Kết luận', 'Mức độ', 'Trình duyệt', 'So với đợt 1', 'Mô tả / nguyên nhân / gợi ý sửa'], ...loi.map(r => r.map(x => x.replace(/`/g, '')))];
    bangLoi.push([], ['KHÔNG PHẢI LỖI WEBSITE', 'Kết luận', 'Lý do'], ...khongLoi);
    const r = await fetch(url, { method: 'POST', body: JSON.stringify({ tab: 'Đ2-Lỗi', cheDo: 'bang', bang: bangLoi, doRong: [80, 220, 140, 95, 140, 150, 560] }) });
    console.log('Tab Đ2-Lỗi: ' + (await r.text()).slice(0, 60));

    // 2. Bảng số liệu
    const mt = JSON.parse(fs.readFileSync(path.join(KQ, 'ma-tran.json'), 'utf8'));
    const tieuDe = mt[0], cot = tieuDe.slice(3, -1), dong = mt.slice(1);
    const phienDs = [...new Set(dong.map(d => d[1]))];
    let s = '| Phiên | ' + cot.join(' | ') + ' |\n|' + '---|'.repeat(cot.length + 1) + '\n';
    for (const ph of phienDs) s += '| ' + ph + ' | ' + cot.map((c, i) => { const x = dong.filter(d => d[1] === ph && d[3 + i] !== 'Chưa chạy'); const dd = x.filter(d => d[3 + i] === 'Đạt').length; return x.length ? dd + '/' + x.length : '-'; }).join(' | ') + ' |\n';
    s += '| **Tổng** | ' + cot.map((c, i) => { const x = dong.filter(d => d[3 + i] !== 'Chưa chạy'); const dd = x.filter(d => d[3 + i] === 'Đạt').length; return '**' + dd + '/' + x.length + ' (' + (100 * dd / x.length).toFixed(1).replace('.', ',') + '%)**'; }).join(' | ') + ' |\n';
    const nhom = {}; for (const d of dong) { const k = d[d.length - 1].startsWith('Chỉ lỗi') ? 'Chỉ lỗi ở một số cấu hình' : d[d.length - 1]; nhom[k] = (nhom[k] || 0) + 1; }
    const d1 = {}; for (const f of fs.readdirSync(path.join(TEST, 'ket-qua-dot1')).filter(f => /^s\d+\.json$/.test(f))) for (const x of JSON.parse(fs.readFileSync(path.join(TEST, 'ket-qua-dot1', f), 'utf8')).rows) d1[x[0]] = x[9];
    const iEdge = cot.indexOf(CAU_HINH_TD.edge.ten); const hq = {};
    for (const d of dong) { const cu = d1[d[0]]; const moi = d[3 + iEdge]; const k = !cu ? 'Test mới (s11, s12)' : cu === moi ? (moi === 'Đạt' ? 'Giữ nguyên đạt' : 'Vẫn không đạt') : (moi === 'Đạt' ? 'Chuyển sang đạt' : 'Chuyển sang không đạt'); hq[k] = (hq[k] || 0) + 1; }
    const soLieu = '## Bảng tỉ lệ đạt theo phiên × cấu hình\n' + s + '\n## Phân nhóm ' + dong.length + ' test case theo ma trận\n' + Object.entries(nhom).map(([k, v]) => '- ' + k + ': ' + v).join('\n')
        + '\n\n## Hồi quy trên Edge so với đợt 1\n' + Object.entries(hq).map(([k, v]) => '- ' + k + ': ' + v).join('\n');
    fs.writeFileSync(path.join(KQ, 'so-lieu-bc.md'), soLieu);

    // 3. DeepSeek viết phần chữ (2 lượt)
    const nen = '# Bối cảnh\nWebsite RoomCraft (Nhóm 7, môn Phát triển Web Kinh doanh): bán nội thất theo không gian phòng, web tĩnh HTML/CSS/JS, dữ liệu localStorage, không backend. '
        + 'Đợt 1 (03/11/2026): 342 test case trên Edge, 97,1% đạt, 5 lỗi. Đợt 2 (04–05/11/2026) sau khi nhóm cập nhật giao diện (header trong suốt, Pointlight, Tham quan 360°, banner, đánh giá bằng sao): '
        + 'kiểm thử hồi quy + tương thích 7 cấu hình (Edge, Chrome thật trên máy; Firefox 131, Safari/WebKit, iPhone 14, iPad, Pixel 7 Android bằng giả lập Playwright; Firefox 131 của Playwright chạy từ D:/pw-firefox vì thư mục người dùng có dấu cách làm Windows không nạp được thành phần mozglue) '
        + '+ 22 kịch bản nghiệp vụ đầu-cuối (s11) + 30 hạng mục audit bảo mật/khả năng tiếp cận/hiệu năng/SEO/toàn vẹn dữ liệu (s12, axe-core). Script do DeepSeek hỗ trợ viết; mọi lỗi được xác minh thủ công. '
        + 'Kết quả ghi Google Sheet: tab Đ2-Tổng quan, Đ2-Ma trận, Đ2-Hồi quy, Đ2-Lỗi, Đ2-Checklist máy thật, Đ2-<trình duyệt> (ảnh minh chứng trong ô).\n\n# Số liệu\n' + soLieu + '\n\n# Kết luận duyệt lỗi\n' + duyet;
    const phan = [
        ['bc1', 'Viết PHẦN ĐẦU báo cáo kiểm thử ĐỢT 2 (Markdown, tiếng Việt, học thuật, KHÁC báo cáo đợt 1: trọng tâm là thay đổi so với đợt 1, tương thích và nghiệp vụ). Bắt đầu bằng "# BÁO CÁO KIỂM THỬ ĐỢT 2 – HỒI QUY, TƯƠNG THÍCH ĐA TRÌNH DUYỆT VÀ NGHIỆP VỤ" rồi bảng thông tin chung. Gồm: ## 1. Tóm tắt điều hành (5–7 gạch đầu dòng, có con số); ## 2. Bối cảnh và mục tiêu đợt 2 (thay đổi mã nguồn, vì sao cần hồi quy + tương thích); ## 3. Phạm vi (bảng trong/ngoài phạm vi); ## 4. Ma trận cấu hình kiểm thử (bảng: cấu hình, nhân trình duyệt, kích thước màn hình, cách chạy, ghi chú độ tin cậy giả lập); ## 5. Phương pháp (hồi quy tự động, tương thích, kịch bản nghiệp vụ E2E, audit, phân loại lỗi tương thích 2 bước: ma trận tự động → AI đề xuất → người xác minh). Chỉ dùng số liệu được cho.'],
        ['bc2', 'Viết PHẦN CUỐI báo cáo kiểm thử ĐỢT 2 (Markdown, tiếng Việt). Bắt đầu bằng "## 7. Kết quả hồi quy so với đợt 1". Gồm: ## 7 (bảng trạng thái 5 lỗi đợt 1: Đã sửa/Vẫn còn/Giảm một phần + nhận xét về các test chuyển trạng thái); ## 8. Kết quả tương thích trình duyệt (nhận xét theo từng cấu hình, nêu vì sao Android/iPad thấp hơn, lỗi tương thích thật vs do môi trường); ## 9. Kết quả nghiệp vụ thực tế (E2E) (những ràng buộc nghiệp vụ đã được chứng minh đúng: bán món cuối/2 người mua đồ cũ, hoàn tiền cọc, ngưỡng COD..., và các kịch bản chưa tự động hóa được); ## 10. Kết quả audit (bảo mật, khả năng tiếp cận, hiệu năng, SEO, toàn vẹn dữ liệu); ## 11. Danh sách lỗi đợt 2 (mỗi BUG một mục ### BUG-0x kèm bảng: Mức độ, Test case, Trình duyệt, So với đợt 1, Bước tái hiện, Mong đợi, Thực tế, Nguyên nhân, Đề xuất sửa); ## 12. Đánh giá rủi ro (bảng: rủi ro – khả năng – ảnh hưởng – biện pháp); ## 13. Hạn chế đợt 2; ## 14. Kết luận mức sẵn sàng phát hành và thứ tự ưu tiên sửa; ## 15. Hướng dẫn kiểm thử tay trên máy thật (giới thiệu tab Đ2-Checklist máy thật, cách mở web qua WiFi nội bộ).']
    ];
    fs.writeFileSync(path.join(KQ, 'he-bc.md'), 'Bạn là trưởng nhóm kiểm thử viết báo cáo cho giảng viên và doanh nghiệp. Trả lời bằng Markdown thuần, không bọc khối code, không bịa số.');
    for (const [ten, yc] of phan) {
        fs.writeFileSync(path.join(KQ, ten + '-yc.md'), yc + '\n\n' + nen);
        const k = spawnSync(process.execPath, [path.join(__dirname, 'llm.mjs'), '--model', 'ds', '--in', path.join(KQ, ten + '-yc.md'), '--system', path.join(KQ, 'he-bc.md'), '--out', path.join(KQ, ten + '.md'), '--max', '14000'], { encoding: 'utf8' });
        console.log(ten + ': ' + (k.stderr || '').trim().split('\n').pop());
    }
    const bc = fs.readFileSync(path.join(KQ, 'bc1.md'), 'utf8').trim() + '\n\n## 6. Kết quả tổng hợp\n\n' + soLieu.replace(/^## /gm, '### ') + '\n\nChi tiết từng test case theo cấu hình: Google Sheet tab Đ2-Ma trận và các tab Đ2-<trình duyệt>.\n\n' + fs.readFileSync(path.join(KQ, 'bc2.md'), 'utf8').trim() + '\n';
    const fMd = path.join(KQ, 'BAO-CAO-KIEM-THU-DOT2.md');
    fs.writeFileSync(fMd, bc);
    const w = spawnSync('python', [path.join(__dirname, 'md-sang-docx.py'), fMd, fMd.replace(/\.md$/, '.docx')], { encoding: 'utf8' });
    console.log((w.stdout || w.stderr || '').trim());
})();
