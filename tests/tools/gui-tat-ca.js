// Gửi TOÀN BỘ kết quả đợt 2 lên Sheet bằng 1 tiến trình duy nhất (tuần tự), mỗi phiên thử lại tới 5 lần.
// Chạy riêng một mình: 2 tiến trình gửi cùng lúc sẽ tranh khóa Apps Script (quá 30s -> "Không thành công").
const fs = require('fs'), path = require('path');
const { guiSheet } = require('../lib/khung-test');
const url = require('../cau-hinh.json').sheetWebAppUrl;
const TAB = { edge: 'Đ2-Edge', chrome: 'Đ2-Chrome', firefox: 'Đ2-Firefox', webkit: 'Đ2-Safari (WebKit)', iphone: 'Đ2-iPhone', android: 'Đ2-Android', ipad: 'Đ2-iPad' };
const nk = m => { console.log(m); fs.appendFileSync('ket-qua/d2/nhat-ky.txt', new Date().toLocaleTimeString('vi-VN') + ' [gui-tat-ca] ' + m + '\n'); };
(async () => {
  const loi = [];
  for (const ch of Object.keys(TAB)) {
    const d = path.join('ket-qua/d2', ch);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter(f => /^s\d+\.json$/.test(f)).sort()) {
      const j = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
      let ok = false;
      for (let lan = 1; lan <= 5 && !ok; lan++) {
        const goc = console.log; let tb = '';
        console.log = m => { tb = String(m); };
        await guiSheet(url, j.tieuDe, j.rows, j.ma, TAB[ch], path.join('anh/d2', ch));
        console.log = goc;
        ok = /cập nhật/.test(tb);
        nk(TAB[ch] + ' ' + j.ma + ' lần ' + lan + ': ' + tb.slice(0, 90));
        if (!ok) await new Promise(r => setTimeout(r, 30000));
      }
      if (!ok) loi.push(TAB[ch] + ' ' + j.ma);
    }
  }
  nk('KẾT THÚC GỬI. Phiên còn lỗi: ' + (loi.length ? loi.join(', ') : 'không có'));
})();
