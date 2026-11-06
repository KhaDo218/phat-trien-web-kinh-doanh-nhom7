// Dán vào Google Sheet: Tiện ích mở rộng -> Apps Script, rồi Triển khai -> Ứng dụng web.
// Nhận kết quả từ khung test, ghi vào tab "Test case":
//  - Mã TC đã có dòng -> chỉ cập nhật cột I..O (kết quả, trạng thái, minh chứng...), giữ nguyên phần Kha viết
//  - Mã TC chưa có -> thêm dòng mới đầy đủ
//  - Ảnh: ảnh gốc lưu vào thư mục Drive "RoomCraft - Minh chung kiem thu", ảnh nhỏ chèn vào ô cột L,
//    cột P là link mở ảnh gốc.
//  - Đợt 2: duLieu.tab = tên tab (chưa có thì tự tạo). duLieu.cheDo = 'bang' -> ghi đè cả tab bằng bảng
//    duLieu.bang (mảng 2 chiều, dòng đầu là tiêu đề), dùng cho tab Tổng quan / Lỗi / Checklist.
var TEN_TAB = 'Test case';
var TEN_THU_MUC = 'RoomCraft - Minh chung kiem thu';
var COT_ANH = 12, COT_LINK = 16;

function doPost(e) {
  var khoa = LockService.getScriptLock();
  khoa.waitLock(30000);
  try {
    var duLieu = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActive();
    var tenTab = duLieu.tab || TEN_TAB;
    if (duLieu.cheDo === 'doc' && !ss.getSheetByName(tenTab)) return traVe({ ok: false, loi: 'Không có tab ' + tenTab });
    var sh = ss.getSheetByName(tenTab) || ss.insertSheet(tenTab);
    if (duLieu.cheDo === 'bang') return traVe(ghiBang(sh, duLieu.bang, duLieu.doRong));
    // Đọc nguyên một tab (giá trị hiển thị) để công cụ kiểm thử tổng hợp báo cáo; không sửa gì
    if (duLieu.cheDo === 'doc') return traVe({ ok: true, tab: tenTab, giaTri: sh.getDataRange().getDisplayValues() });
    if (sh.getLastRow() === 0 && duLieu.tieuDe) {
      sh.appendRow(duLieu.tieuDe);
      sh.getRange(1, 1, 1, duLieu.tieuDe.length).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
    if (sh.getRange(1, COT_LINK).getValue() === '') sh.getRange(1, COT_LINK).setValue('Ảnh gốc');
    sh.setColumnWidth(COT_ANH, 260);

    var giaTri = sh.getDataRange().getValues();
    var viTri = {};
    for (var i = 1; i < giaTri.length; i++) viTri[String(giaTri[i][0])] = i + 1;

    var thuMuc = layThuMuc(duLieu.tab);
    var capNhat = 0, themMoi = 0, loiAnh = [];
    for (var r = 0; r < duLieu.rows.length; r++) {
      var muc = duLieu.rows[r];
      var dong = muc.dong || muc;           // vẫn nhận kiểu cũ (mảng 15 cột)
      var hang = viTri[String(dong[0])];
      if (hang) {
        sh.getRange(hang, 9, 1, 7).setValues([dong.slice(8, 15)]);
        capNhat++;
      } else {
        sh.appendRow(dong.slice(0, 15));
        hang = sh.getLastRow();
        viTri[String(dong[0])] = hang;
        themMoi++;
      }
      var mauTT = dong[9] === 'Đạt' ? '#d1fae5' : '#ffe4e6';
      sh.getRange(hang, 10).setBackground(mauTT).setFontWeight('bold');
      if (muc.anh) {
        try { ganAnh(sh, hang, thuMuc, muc.anh); } catch (loi) { loiAnh.push(dong[0] + ': ' + loi.message); }
      }
    }
    return traVe({ ok: true, capNhat: capNhat, themMoi: themMoi, loiAnh: loiAnh });
  } catch (loi) {
    return traVe({ ok: false, loi: loi.message });
  } finally {
    khoa.releaseLock();
  }
}

function ganAnh(sh, hang, thuMuc, anh) {
  // Bỏ ảnh cũ cùng mã TC (lần chạy trước, kể cả bản _loi)
  var maTC = anh.ten.replace(/(_loi)?\.jpg$/, '');
  [maTC + '.jpg', maTC + '_loi.jpg'].forEach(function (ten) {
    var cu = thuMuc.getFilesByName(ten);
    while (cu.hasNext()) cu.next().setTrashed(true);
  });
  var file = thuMuc.createFile(Utilities.newBlob(Utilities.base64Decode(anh.goc), 'image/jpeg', anh.ten));

  var o = sh.getRange(hang, COT_ANH);
  try {
    var img = SpreadsheetApp.newCellImage()
      .setSourceUrl('data:image/jpeg;base64,' + anh.nho)
      .setAltTextTitle(anh.ten).build();
    o.setValue(img);
  } catch (loi) {
    // Dự phòng: dùng hàm IMAGE với ảnh thu nhỏ của Drive (cần chia sẻ "ai có link")
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    o.setFormula('=IMAGE("https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w480")');
  }
  sh.getRange(hang, COT_LINK).setRichTextValue(
    SpreadsheetApp.newRichTextValue().setText('Xem ảnh gốc').setLinkUrl(file.getUrl()).build());
  sh.setRowHeight(hang, 160);
}

function layThuMuc(tab) {
  var ds = DriveApp.getFoldersByName(TEN_THU_MUC);
  var goc = ds.hasNext() ? ds.next() : DriveApp.createFolder(TEN_THU_MUC);
  if (!tab) return goc;
  var con = goc.getFoldersByName(tab);
  return con.hasNext() ? con.next() : goc.createFolder(tab);
}

// Ghi đè cả tab bằng một bảng giá trị (không ảnh)
function ghiBang(sh, bang, doRong) {
  sh.clear();
  if (!bang || !bang.length) return { ok: true, dong: 0 };
  var soCot = 0;
  bang.forEach(function (d) { if (d.length > soCot) soCot = d.length; });
  var duLieu = bang.map(function (d) { while (d.length < soCot) d.push(''); return d; });
  sh.getRange(1, 1, duLieu.length, soCot).setValues(duLieu).setWrap(true).setVerticalAlignment('top');
  sh.getRange(1, 1, 1, soCot).setFontWeight('bold').setBackground('#1f2937').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  if (doRong) doRong.forEach(function (w, i) { if (w) sh.setColumnWidth(i + 1, w); });
  // Tô màu ô kết quả
  var gt = sh.getRange(1, 1, duLieu.length, soCot).getValues();
  for (var r = 1; r < gt.length; r++) for (var c = 0; c < soCot; c++) {
    var v = String(gt[r][c]);
    if (v === 'Đạt' || v === 'Đã sửa') sh.getRange(r + 1, c + 1).setBackground('#d1fae5');
    else if (v === 'Không đạt' || v === 'Vẫn còn' || v === 'Lỗi mới') sh.getRange(r + 1, c + 1).setBackground('#ffe4e6');
  }
  return { ok: true, dong: duLieu.length };
}

function traVe(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
