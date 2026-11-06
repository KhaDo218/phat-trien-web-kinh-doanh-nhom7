// DeepSeek sửa lỗi đợt 2: mỗi lỗi gửi đúng vùng mã liên quan, nhận JSON [{file, old, new}],
// áp dụng khi old khớp đúng 1 lần, kiểm tra cú pháp JS. Dùng: node tools/sua-loi.mjs [BUG-01,BUG-04]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TOOLS, '../..');
const TAM = path.join(TOOLS, 'tam'); fs.mkdirSync(TAM, { recursive: true });
const S = f => path.join(ROOT, 'scripts', f);

// Lấy vùng mã quanh các dòng khớp regex (có số dòng để DeepSeek định vị)
function vung(f, re, truoc = 25, sau = 60) {
    const dong = fs.readFileSync(S(f), 'utf8').replace(/\r\n/g, '\n').split('\n');
    const giu = new Set();
    dong.forEach((l, i) => { if (re.test(l)) for (let k = Math.max(0, i - truoc); k < Math.min(dong.length, i + sau); k++) giu.add(k); });
    let out = '', truocDo = -2;
    for (const k of [...giu].sort((a, b) => a - b)) { if (k !== truocDo + 1) out += '\n/* ... */\n'; out += dong[k] + '\n'; truocDo = k; }
    return '=== scripts/' + f + ' (trích) ===\n' + out;
}
const ca = f => '=== scripts/' + f + ' ===\n' + fs.readFileSync(S(f), 'utf8');

const CHUNG = 'Ràng buộc chung: chỉ dùng HTML/CSS/JS thuần (ES5 như mã hiện có, không thư viện mới), chạy đúng trên Chrome, Edge, Firefox, Safari macOS/iOS, Chrome Android, iPad. '
    + 'KHÔNG giảm chất lượng ảnh/video, không đổi đường dẫn ảnh/video, không xóa hiệu ứng giao diện. Sửa tối thiểu, đúng nguyên nhân, giữ phong cách đặt tên tiếng Việt và chú thích ngắn tiếng Việt.';
const LOI = {
    'BUG-01': { mo: 'Trang chủ bị cuộn ngang: 390px tràn 622px, 768px tràn 1.284px, 1440px tràn 2.460px; trên Android Chrome làm vùng hiển thị nới thành 1.073px (cả trang bị thu nhỏ). Đã khoanh vùng: ẩn khối slider "Sản phẩm nổi bật" (.featured-track trong .featured-carousel) thì hết tràn. .featured-track là grid grid-auto-flow: column + overflow-x: auto; nghi khung chứa (container/section/featured-carousel) bị giãn theo nội dung (min-width: auto của grid/flex item). Sửa bằng CSS: cho khung chứa slider co đúng bề rộng (min-width: 0; max-width: 100%) và chặn tràn của section (overflow-x: clip, có dự phòng overflow-x: hidden cho Safari cũ) MÀ vẫn giữ slider cuộn ngang bên trong được. Kiểm tra cả các khối khác trong file có cùng mẫu dải chạy ngang (brand-marquee) cũng phải được chặn tràn.',
        nguon: () => vung('css/pages/index.css', /featured|brand-marquee|^\.section|\.container\s*\{|overflow/, 6, 22) },
    'BUG-02': { mo: 'Leo quyền phía trình duyệt: isAdmin() tin trường role trong localStorage rc_session; sửa role thành "Admin" là vào được trang quản trị. Sửa: quyền phải lấy từ bản ghi người dùng thật trong bảng users (getCurrentUser(): role_id 1 = Admin theo data/json/roles.json; nếu bản ghi có trường role thì dùng song song) — không tin session.role. Giữ nguyên chữ ký hàm và hành vi đăng nhập/đăng xuất.',
        nguon: () => vung('js/core/auth.js', /function (isAdmin|getCurrentUser|saveSession|login|isLoggedIn)|role/, 4, 22) + '\n=== data/json/roles.json ===\n' + fs.readFileSync(path.join(ROOT, 'data/json/roles.json'), 'utf8') },
    'BUG-03': { mo: 'Dashboard showLowStock() chỉ lấy tồn kho > 0 và ≤ 3 nên sản phẩm đã hết hẳn (0) không được cảnh báo. Sửa: lấy cả tồn kho 0 (sản phẩm đang bán), sắp hết hàng trước theo mức nghiêm trọng (0 trước), nhãn "Hết hàng" cho 0 và "Còn N" cho 1–3; dòng tiêu đề ghi rõ số hết hàng và số sắp hết.',
        nguon: () => vung('js/pages/admin-index.js', /function showLowStock/, 2, 30) },
    'BUG-04': { mo: 'Lịch sử chat được lưu nhưng tải lại trang rồi mở chat chỉ còn lời chào: chatVeLaiLuu() thoát khi container.children.length > 1, mà khung ban đầu đã có 2 phần tử (lời chào + #rcQuickTopics). Sửa: chỉ coi là "đã có hội thoại" khi có tin ngoài lời chào ban đầu (đếm .rc-msg > 1) hoặc dùng cờ đã vẽ lại; vẽ lại lịch sử ngay sau lời chào/gợi ý; không vẽ trùng khi đóng mở nhiều lần.',
        nguon: () => vung('components/chatbot.js', /function (chatVeLaiLuu|chatDocLuu|chatGhiLuu|chatXoaLuu|toggleChatbot|appendMessage)/, 2, 40) },
    'BUG-05': { mo: 'Chatbot không hiểu ngân sách viết bằng số đầy đủ: "sofa dưới 10.000.001", "sofa dưới 10000001 đồng", "dưới 10,000,000đ", "duoi 9.500.000 vnd" → bỏ qua ngân sách. Dạng "10 triệu", "10tr", "500k" đang đúng và phải giữ nguyên. Sửa chatParseBudget(qn) để nhận thêm số có dấu chấm/phẩy ngăn nghìn hoặc số trơn ≥ 1000 kèm/không kèm đ/đồng/vnd, chỉ khi đi sau từ chỉ ngân sách (dưới, tầm, khoảng, ngân sách, giá, tối đa, không quá...) để không nhầm kích thước (cm) hay số lượng.',
        nguon: () => vung('components/chatbot.js', /function chatParseBudget/, 2, 70) },
    'BUG-06': { mo: 'Trang admin/orders.html tràn ngang 226px trên iPad (810px): bảng đơn hàng nhiều cột. Sửa: bọc bảng trong khung có overflow-x: auto (-webkit-overflow-scrolling: touch) để chỉ bảng cuộn, trang không tràn; nếu trong css/admin.css đã có lớp dùng chung cho khung bảng thì dùng lại và áp cho mọi trang admin có bảng.',
        nguon: () => vung('admin/orders.html', /<table|<\/table>|class="card|<main/, 3, 6) + '\n' + vung('css/admin.css', /table|\.card\s*\{|overflow/, 3, 10) },
    'BUG-07': { mo: 'Hiệu năng trang chủ: tổng dung lượng tải > 5MB, 5 ảnh phòng > 500KB tải ngay khi mở trang. TUYỆT ĐỐI KHÔNG giảm chất lượng/đổi file ảnh hay video. Chỉ tối ưu cách tải: ảnh không nằm trong màn hình đầu thì loading="lazy" + decoding="async"; ảnh đầu tiên của khối đầu trang giữ tải ngay (có thể fetchpriority="high"); thẻ ảnh tạo bằng JS trong product-card/room-card thêm loading lazy + decoding async; video trang chủ GIỮ NGUYÊN chất lượng, chỉ được thêm preload="metadata" cho video không nằm ở màn hình đầu (video nền đầu trang giữ autoplay như cũ).',
        nguon: () => vung('js/pages/index.js', /createElement\("img"\)|<img |<video|\.src\s*=/, 4, 8) + '\n' + vung('components/product-card.js', /createElement\("img"\)/, 2, 10) + '\n' + vung('components/room-card.js', /createElement\("img"\)/, 2, 10) + '\n' + vung('index.html', /<video|<img /, 2, 3) },
    'BUG-08': { mo: 'SEO: trang chủ (và các trang khách chính) thiếu thẻ meta description. Thêm <meta name="description" content="..."> tiếng Việt 140–160 ký tự, đúng nội dung từng trang, ngay sau thẻ meta viewport cho: index.html, products.html, rooms.html, marketplace.html.',
        nguon: () => ['index.html', 'products.html', 'rooms.html', 'marketplace.html'].map(f => vung(f, /<title>|<meta name="viewport"/, 1, 2)).join('\n') },
    'BUG-09': { mo: 'cancelOrder(orderId) không kiểm tra đơn có thuộc người đang đăng nhập; giao diện đã chặn nhưng hàm vẫn hủy được đơn người khác khi gọi trực tiếp. Sửa: chỉ chủ đơn hoặc Admin (isAdmin()) được hủy; người khác trả về "Bạn không có quyền hủy đơn hàng này!". Không làm hỏng việc admin hủy đơn ở trang quản trị.',
        nguon: () => vung('js/services/orders.js', /function cancelOrder/, 2, 32) }
};

const chon = (process.argv[2] || Object.keys(LOI).join(',')).split(',');
const bao = [];
for (const ma of chon) {
    const L = LOI[ma];
    const yc = '# Sửa ' + ma + '\n' + L.mo + '\n\n' + CHUNG + '\n\nTrả về DUY NHẤT một mảng JSON (không giải thích, không ```), mỗi phần tử {"file": "scripts/...", "old": "<đoạn mã CŨ chép nguyên văn từ mã nguồn, đủ dài để chỉ xuất hiện 1 lần, KHÔNG chứa số dòng hay /* ... */>", "new": "<đoạn mã MỚI>"}. Sửa ít dòng nhất có thể.\n\n' + L.nguon();
    const fIn = path.join(TAM, ma + '.md'), fOut = path.join(TAM, ma + '.json'), fSys = path.join(TAM, 'he-sua.md');
    fs.writeFileSync(fIn, yc); fs.writeFileSync(fSys, 'Bạn là lập trình viên web cấp cao, sửa lỗi an toàn đa trình duyệt. Chỉ trả về JSON hợp lệ.');
    let ketQua = '';
    for (let lan = 1; lan <= 3 && !ketQua.startsWith('OK'); lan++) {
        const r = spawnSync(process.execPath, [path.join(TOOLS, 'llm.mjs'), '--model', 'ds', '--in', fIn, '--system', fSys, '--out', fOut, '--max', '6000', '--code'], { encoding: 'utf8' });
        if (r.status !== 0) { ketQua = 'Lỗi gọi API'; continue; }
        let ds; try { ds = JSON.parse(fs.readFileSync(fOut, 'utf8')); } catch (e) { ketQua = 'JSON hỏng'; continue; }
        const banSao = {}; let loi = '';
        for (const e of ds) {
            const f = path.join(ROOT, e.file.replace(/^\/?/, ''));
            if (!fs.existsSync(f)) { loi = 'không có file ' + e.file; break; }
            // So khớp không phụ thuộc kiểu xuống dòng (file Windows dùng CRLF)
            const s = banSao[f] ?? fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
            const cu = e.old.replace(/\r\n/g, '\n'), moi = e.new.replace(/\r\n/g, '\n');
            const n = s.split(cu).length - 1;
            if (n !== 1) { loi = e.file + ': đoạn cũ khớp ' + n + ' lần'; break; }
            banSao[f] = s.replace(cu, () => moi);
        }
        if (!loi) for (const [f, s] of Object.entries(banSao)) if (f.endsWith('.js')) {
            fs.writeFileSync(f + '.kiem.js', s);
            const k = spawnSync(process.execPath, ['--check', f + '.kiem.js'], { encoding: 'utf8' }); fs.unlinkSync(f + '.kiem.js');
            if (k.status !== 0) { loi = path.basename(f) + ': lỗi cú pháp'; break; }
        }
        if (loi) { ketQua = 'Lần ' + lan + ' hỏng: ' + loi; fs.appendFileSync(fIn, '\n\nLẦN TRƯỚC HỎNG: ' + loi + '. Chép "old" NGUYÊN VĂN từ mã nguồn.'); continue; }
        for (const [f, s] of Object.entries(banSao)) fs.writeFileSync(f, fs.readFileSync(f, 'utf8').includes('\r\n') ? s.replace(/\n/g, '\r\n') : s);
        ketQua = 'OK (' + ds.length + ' chỗ sửa: ' + [...new Set(ds.map(e => e.file))].join(', ') + ')';
    }
    bao.push(ma + ': ' + ketQua); console.log(ma + ': ' + ketQua);
}
fs.writeFileSync(path.join(ROOT, 'tests', 'ket-qua', 'd2', 'sua-loi.log'), bao.join('\n') + '\n');
