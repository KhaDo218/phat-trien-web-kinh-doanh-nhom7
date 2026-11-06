#!/usr/bin/env node
// Giao 1 phiên test cho DeepSeek: viết file phiên -> chạy -> gửi lỗi script lại để sửa (tối đa N vòng)
// -> nhờ DeepSeek phân loại các test KHÔNG ĐẠT (lỗi website hay test sai) -> in tóm tắt ngắn.
// Dùng: node tools/giao-phien.mjs s05 [--vong 3] [--chi-chay] [--gui]
//   --chi-chay : không viết mới, chỉ chạy + sửa lỗi script
//   --gui      : lần chạy cuối gửi kết quả + ảnh lên Google Sheet
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const TEST = path.resolve(TOOLS, '..');
const ROOT = (d => { while (!(fs.existsSync(path.join(d, 'scripts')) && fs.existsSync(path.join(d, 'data')))) { const c = path.dirname(d); if (c === d) throw new Error('Không tìm thấy gốc repo'); d = c; } return d; })(path.dirname(fileURLToPath(import.meta.url)));
const TAM = path.join(TOOLS, 'tam');
fs.mkdirSync(TAM, { recursive: true });

const ma = process.argv[2];
const co = n => process.argv.includes('--' + n);
const soVong = Number(process.argv[process.argv.indexOf('--vong') + 1]) || 3;
const PV = JSON.parse(fs.readFileSync(path.join(TOOLS, 'pham-vi.json'), 'utf8'))[ma];
if (!PV) throw new Error('Không có phiên ' + ma + ' trong pham-vi.json');
const fileJs = path.join(TEST, 'phien', PV.file + '.js');
const MA_TC = 'TC-' + ma.toUpperCase();

const doc = f => fs.readFileSync(f, 'utf8');
const keHoach = doc(path.join(TEST, 'KE-HOACH-TEST.md')).split('\n').find(l => l.startsWith('| ' + ma + ' ')) || '';
const heThong = 'Bạn là kỹ sư kiểm thử phần mềm, viết script kiểm thử tự động bằng Node.js + Playwright theo khung có sẵn. '
    + 'Trả lời CHỈ bằng một khối mã JavaScript hoàn chỉnh, không giải thích.\n\n'
    + doc(path.join(TOOLS, 'api-khung.md'));

function nguon() {
    return PV.nguon.map(f => {
        let s = doc(path.join(ROOT, 'scripts', f));
        const cat = PV.cat || 40000;
        if (s.length > cat) s = s.slice(0, cat) + '\n/* ...cắt bớt... */';
        return '=== scripts/' + f + ' ===\n' + s;
    }).join('\n\n');
}
function mauDuLieu() {
    return (PV.mau || []).map(b => {
        const j = JSON.parse(doc(path.join(ROOT, 'data/json', b + '.json')));
        const ds = Array.isArray(j) ? j : (Object.values(j).find(Array.isArray) || [j]);
        return '=== ' + b + ' (' + ds.length + ' bản ghi, 2 bản ghi đầu) ===\n' + JSON.stringify(ds.slice(0, 2)).slice(0, 2500);
    }).join('\n');
}

const heThongBang = 'Bạn là kỹ sư kiểm thử phần mềm, đang phân tích kết quả kiểm thử. Trả lời CHỈ bằng một bảng Markdown đúng các cột được yêu cầu, mỗi test case 1 dòng bắt đầu bằng "| TC-". Không viết code.';

function goiDeepSeek(tenTep, noiDung, max = 24000, bang = false) {
    const fIn = path.join(TAM, tenTep + '.md'), fSys = path.join(TAM, (bang ? 'he-thong-bang-' : 'he-thong-') + ma + '.md'), fOut = path.join(TAM, tenTep + '.out');
    fs.writeFileSync(fIn, noiDung); fs.writeFileSync(fSys, bang ? heThongBang : heThong);
    const r = spawnSync(process.execPath, [path.join(TOOLS, 'llm.mjs'), '--model', 'ds', '--in', fIn, '--system', fSys,
        '--out', fOut, '--max', String(max), ...(bang ? [] : ['--code'])], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error('Gọi DeepSeek lỗi: ' + (r.stderr || '').slice(-600));
    if (/bị cắt/.test(r.stderr)) console.log('  ! DeepSeek trả lời bị cắt (hết token)');
    return doc(fOut);
}

function kiemCuPhap() {
    const r = spawnSync(process.execPath, ['--check', fileJs], { encoding: 'utf8' });
    return r.status === 0 ? '' : (r.stderr || '').split('\n').slice(0, 6).join('\n');
}

function chay(gui) {
    const fJson = path.join(TEST, 'ket-qua', process.env.QA_DOT || '', process.env.QA_CAU_HINH || '', ma + '.json');
    if (fs.existsSync(fJson)) fs.unlinkSync(fJson);
    const env = { ...process.env, QA_CONG: String(5650 + Number(ma.slice(1))) };
    if (!gui) env.QA_KHONG_GUI = '1';
    const r = spawnSync(process.execPath, [fileJs], { cwd: TEST, encoding: 'utf8', env, timeout: 20 * 60 * 1000 });
    const out = (r.stdout || '') + (r.stderr || '');
    const kq = fs.existsSync(fJson) ? JSON.parse(doc(fJson)) : null;
    return { out, kq };
}

// 1. Viết file phiên
if (!co('chi-chay')) {
    const daCo = fs.existsSync(fileJs) ? doc(fileJs) : '';
    const mau = doc(path.join(TOOLS, 'mau-phien.js'));
    let yeuCau = '# Nhiệm vụ: viết file phiên ' + ma + ' (' + PV.ten + ')\n\n'
        + 'Phạm vi và các trường hợp BẮT BUỘC có (kế hoạch):\n' + keHoach + '\n' + (PV.them ? '\nGhi chú: ' + PV.them + '\n' : '')
        + '\nYêu cầu: 20–30 test case, mã ' + MA_TC + '-01, -02…; đủ 5 loại trường hợp; ít nhất 2 test mobile; '
        + "require('../lib/khung-test'); phien({ ma: '" + ma + "', ten: '" + PV.ten + "' }, ...).\n\n"
        + '## File mẫu (đúng phong cách cần viết)\n```js\n' + mau + '\n```\n';
    if (daCo && daCo !== mau) yeuCau += '\n## File phiên hiện có – GIỮ NGUYÊN các test case này, viết thêm cho đủ\n```js\n' + daCo + '\n```\n';
    else if (daCo) yeuCau += '\n(File hiện có chính là file mẫu: giữ nguyên các test case TC-S01-01..04 của nó và viết thêm.)\n';
    yeuCau += '\n## Mã nguồn các trang trong phạm vi\n' + nguon() + '\n\n## Mẫu dữ liệu\n' + mauDuLieu() + '\n\nTrả về TOÀN BỘ file JavaScript.';
    console.log('DeepSeek đang viết ' + path.relative(TEST, fileJs) + ' ...');
    fs.writeFileSync(fileJs, goiDeepSeek(ma + '-viet', yeuCau));
}

// 2. Chạy + sửa lỗi script
let lan = { out: '', kq: null };
for (let v = 0; v <= soVong; v++) {
    const loiCuPhap = kiemCuPhap();
    let loi = '';
    if (!loiCuPhap) {
        lan = chay(false);
        const dong = lan.kq ? lan.kq.rows : [];
        const loiScript = dong.filter(d => /\[LỖI KHI CHẠY\]/.test(d[8]));
        const dat = dong.filter(d => d[9] === 'Đạt').length;
        console.log('Vòng ' + v + ': Đạt ' + dat + '/' + dong.length + ', lỗi script ' + loiScript.length + (lan.kq ? '' : ' (phiên dừng giữa chừng)'));
        if (!lan.kq || /\[DỪNG PHIÊN\]/.test(lan.out)) loi += 'Phiên bị dừng/crash. Đầu ra:\n' + lan.out.slice(-2500) + '\n';
        for (const d of loiScript) loi += '- ' + d[0] + ': ' + d[8].slice(0, 400) + '\n';
    } else {
        console.log('Vòng ' + v + ': lỗi cú pháp');
        loi = 'Lỗi cú pháp JavaScript:\n' + loiCuPhap;
    }
    if (!loi || v === soVong) break;
    const yeuCau = '# Sửa file phiên ' + ma + '\nCác test case dưới đây lỗi DO SCRIPT (sai selector, chờ chưa đủ, gọi sai API, lỗi cú pháp):\n' + loi
        + '\nChỉ sửa phần gây lỗi của các test case đó. KHÔNG đổi mongDoi hay điều kiện kq.dat để ép đạt; test nào đang chạy được giữ nguyên. '
        + 'Đối chiếu id/selector với mã nguồn bên dưới.\n\n## File hiện tại\n```js\n' + doc(fileJs) + '\n```\n\n## Mã nguồn\n' + nguon()
        + '\n\nTrả về TOÀN BỘ file JavaScript đã sửa.';
    console.log('DeepSeek đang sửa (vòng ' + (v + 1) + ') ...');
    fs.writeFileSync(fileJs, goiDeepSeek(ma + '-sua' + (v + 1), yeuCau));
}

// 4. Phân loại các test KHÔNG ĐẠT; test viết sai (TEST SAI / CHƯA RÕ do test) thì sửa theo gợi ý rồi chạy lại (tối đa 2 lần)
const fPL = path.join(TEST, 'ket-qua', process.env.QA_DOT || '', process.env.QA_CAU_HINH || '', ma + '-phan-loai.md');
let khong = [], sai = [];
for (let lanPL = 0; lanPL <= 2; lanPL++) {
    khong = (lan.kq ? lan.kq.rows : []).filter(d => d[9] !== 'Đạt');
    sai = khong.filter(d => !/\[LỖI KHI CHẠY\]/.test(d[8]));
    if (!sai.length) { if (fs.existsSync(fPL)) fs.unlinkSync(fPL); break; }
    const yeuCau = '# Phân loại test KHÔNG ĐẠT của phiên ' + ma + '\nVới mỗi test case dưới đây, đối chiếu mã nguồn VÀ đoạn code test, trả về bảng Markdown (KHÔNG phải code) cột: '
        + 'Mã TC | Kết luận (LỖI WEBSITE / TEST SAI) | Giải thích ngắn (thực tế vs mong đợi) | File + hàm nghi gây lỗi | Gợi ý sửa.\n'
        + 'LỖI WEBSITE = website làm sai so với nghiệp vụ hợp lý (kể cả khi code "cố ý" làm vậy nhưng trái lẽ thường). '
        + 'TEST SAI = test chuẩn bị dữ liệu sai, selector sai, hoặc mong đợi không đúng yêu cầu/giao diện thật. Chỉ chọn 1 trong 2.\n\n'
        + sai.map(d => '- ' + d[0] + ' | ' + d[3] + ' | Mong đợi: ' + d[7] + ' | Thực tế: ' + d[8].slice(0, 400)).join('\n')
        + '\n\n## File test\n```js\n' + doc(fileJs) + '\n```\n\n## Mã nguồn website\n' + nguon();
    console.log('DeepSeek đang phân loại ' + sai.length + ' test KHÔNG ĐẠT ...');
    const bang = goiDeepSeek(ma + '-phan-loai' + lanPL, yeuCau, 6000, true);
    fs.writeFileSync(fPL, bang);
    const testSai = bang.split('\n').filter(l => /^\|\s*TC-/.test(l) && /TEST SAI/.test(l));
    if (!testSai.length || lanPL === 2) break;
    const yeuCauSua = '# Sửa các test case viết sai của phiên ' + ma + '\nCác test dưới đây được xác định là TEST SAI, sửa theo gợi ý (chuẩn bị dữ liệu đúng, selector đúng, mong đợi đúng nghiệp vụ). '
        + 'Không sửa test khác, không nới điều kiện để ép đạt.\n' + testSai.join('\n')
        + '\n\n## File hiện tại\n```js\n' + doc(fileJs) + '\n```\n\n## Mã nguồn\n' + nguon() + '\n\nTrả về TOÀN BỘ file JavaScript đã sửa.';
    console.log('DeepSeek đang sửa ' + testSai.length + ' test viết sai ...');
    const cu = doc(fileJs);
    fs.writeFileSync(fileJs, goiDeepSeek(ma + '-sua-pl' + lanPL, yeuCauSua));
    if (kiemCuPhap()) { fs.writeFileSync(fileJs, cu); console.log('  ! Bản sửa lỗi cú pháp, giữ bản cũ'); break; }
    lan = chay(false);
    if (!lan.kq) { console.log('  ! Bản sửa làm phiên dừng, giữ bản cũ'); fs.writeFileSync(fileJs, cu); lan = chay(false); break; }
    console.log('Sau sửa: Đạt ' + lan.kq.rows.filter(d => d[9] === 'Đạt').length + '/' + lan.kq.rows.length);
}

// Lần chạy cuối có gửi Sheet (nếu yêu cầu)
if (co('gui') && lan.kq) lan = chay(true);

// 5. Tóm tắt (đây là phần Claude đọc)
const tong = lan.kq ? lan.kq.rows.length : 0;
console.log('\n===== ' + ma + ' - ' + PV.ten + ': Đạt ' + (tong - khong.length) + '/' + tong + ' =====');
for (const d of khong) console.log(d[0] + ' | ' + d[3] + ' | ' + d[8].replace(/\s+/g, ' ').slice(0, 220));
if (sai.length) console.log('Phân loại: ' + path.relative(TEST, fPL));
