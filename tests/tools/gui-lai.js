// Gửi lại các tab/phiên mà lần gửi gần nhất trong nhat-ky.txt bị lỗi; thử tối đa 4 lần mỗi phiên
const fs = require('fs'), path = require('path');
const { guiSheet } = require('../lib/khung-test');
const url = require('../cau-hinh.json').sheetWebAppUrl;
const TAB = { 'Đ2-Edge': 'edge', 'Đ2-Chrome': 'chrome', 'Đ2-Firefox': 'firefox', 'Đ2-Safari (WebKit)': 'webkit', 'Đ2-iPhone': 'iphone', 'Đ2-Android': 'android', 'Đ2-iPad': 'ipad' };
const cuoi = {};
for (const l of fs.readFileSync('ket-qua/d2/nhat-ky.txt', 'utf8').split('\n')) { const m = l.match(/^(Đ2-[^:]+?) (s\d+): (.*)/); if (m) cuoi[m[1] + '|' + m[2]] = m[3]; }
(async () => {
  const loi = Object.entries(cuoi).filter(([, v]) => !/cập nhật/.test(v)).map(([k]) => k.split('|'));
  console.log('Cần gửi lại: ' + loi.length);
  for (const [tab, ma] of loi) for (let lan = 1; lan <= 4; lan++) {
    const ch = TAB[tab]; const j = JSON.parse(fs.readFileSync(path.join('ket-qua/d2', ch, ma + '.json'), 'utf8'));
    let ok = false; const goc = console.log; console.log = m => { ok = /cập nhật/.test(m); goc(tab + ' ' + ma + ' (lần ' + lan + '): ' + m); };
    await guiSheet(url, j.tieuDe, j.rows, ma, tab, path.join('anh/d2', ch)); console.log = goc;
    if (ok) break; await new Promise(r => setTimeout(r, 20000));
  }
})();
